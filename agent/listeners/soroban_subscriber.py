import re
import time
from datetime import datetime, timezone
import httpx
from stellar_sdk.soroban_server import SorobanServer
from stellar_sdk import scval
from core import settings, supabase
from engine.risk_scorer import calculate_composite_risk
from dispatch.relayer import ChallengeRelayer, AutonomousSettler

relayer = ChallengeRelayer()
settler = AutonomousSettler()

PROJECT_EPOCH_OFFSET = 1704067200  # Jan 1, 2024 00:00:00 UTC[cite: 21]

RPC_ENDPOINTS = [
    settings.STELLAR_RPC_URL,
    "https://soroban-testnet.stellar.org",
    "https://rpc-testnet.stellar.org",
]


class SorobanSubscriber:
    def __init__(self):
        self.endpoint_idx = 0
        self.server = SorobanServer(RPC_ENDPOINTS[self.endpoint_idx])
        self.last_ledger: int = 0
        self.processed_intents: set[int] = set()
        self.terminal_intents: set[int] = set()
        self._consecutive_errors = 0

    def _switch_endpoint(self):
        self.endpoint_idx = (self.endpoint_idx + 1) % len(RPC_ENDPOINTS)
        new_url = RPC_ENDPOINTS[self.endpoint_idx]
        self.server = SorobanServer(new_url)

    def sync_latest_ledger(self):
        for _ in range(len(RPC_ENDPOINTS)):
            try:
                latest = self.server.get_latest_ledger()
                self.last_ledger = max(latest.sequence - 50, 1)
                self._consecutive_errors = 0
                return
            except Exception:
                self._switch_endpoint()
        self.last_ledger = 1

    def decode_onchain_id(self, raw_id: int) -> int:
        if raw_id < 100000:
            return raw_id
        return raw_id % 100000

    def decode_timestamp(self, raw_id: int) -> int:
        if raw_id < 100000:
            return int(time.time())
        delta_t = raw_id // 100000
        return delta_t + PROJECT_EPOCH_OFFSET

    def poll_events(self):
        try:
            pending = supabase.table("transactions_testnet") \
                .select("*") \
                .eq("status", "observing") \
                .is_("note", "null") \
                .limit(10) \
                .execute()

            if not pending.data:
                pending = supabase.table("transactions_testnet") \
                    .select("*") \
                    .eq("status", "observing") \
                    .not_.ilike("note", "%ML Risk Score%") \
                    .limit(10) \
                    .execute()

            for item in (pending.data or []):
                intent_id = item.get("intent_id")
                if intent_id and intent_id not in self.processed_intents:
                    self.processed_intents.add(intent_id)
                    self.evaluate_and_guard(intent_id)
        except Exception:
            pass

        # Check and settle/refund matured intents (including quarantined and >1hr frames)[cite: 21]
        self.check_and_settle_matured_intents()

        if self.last_ledger == 0:
            self.sync_latest_ledger()

        try:
            response = self.server.get_events(
                start_ledger=self.last_ledger,
                filters=[{"contractIds": [settings.CONTRACT_ID]}],
                limit=50
            )
            self._consecutive_errors = 0

            for event in response.events:
                self.last_ledger = max(self.last_ledger, event.ledger + 1)
                self._process_event(event)
        except Exception:
            self._consecutive_errors += 1
            if self._consecutive_errors % 5 == 1:
                self._switch_endpoint()

    def _extract_delay_seconds(self, item: dict) -> int:
        desc = item.get("description") or ""
        note = item.get("note") or ""
        combined = f"{desc} {note}"
        match = re.search(r"\[DELAY:(\d+)\]", combined)
        return int(match.group(1)) if match else 180

    def check_and_settle_matured_intents(self):
        """
        Settles intents that have:
        1. Passed their specific observation timelock (now >= created_epoch + delay_seconds)
        2. Reached or exceeded 1 Hour (3,600s) from registration.
        Includes QUARANTINED intents so they automatically trigger contract refunds upon maturity.
        Dispatches Tax Invoice to Treasurer AND Recipient Entity on execution.
        Suppresses recipient delivery on cancellation/refund.
        """
        try:
            active = supabase.table("transactions_testnet") \
                .select("*") \
                .in_("status", ["observing", "executable", "awaiting_approval", "quarantined"]) \
                .limit(50) \
                .execute()

            now = int(time.time())

            for item in (active.data or []):
                db_intent_id = item.get("intent_id")
                if not db_intent_id or db_intent_id in self.terminal_intents:
                    continue

                created_epoch = self.decode_timestamp(db_intent_id)
                delay_seconds = self._extract_delay_seconds(item)
                onchain_id = self.decode_onchain_id(db_intent_id)

                # Condition: Matured per configured delay OR elapsed over 1 hour (3600s)[cite: 21]
                time_elapsed = now - created_epoch
                is_delay_matured = now >= (created_epoch + delay_seconds)
                is_over_one_hour = time_elapsed >= 3600

                if is_delay_matured or is_over_one_hour:
                    status_str = (item.get("status") or "").lower()
                    is_quarantined = status_str == "quarantined"

                    cosigner_1 = item.get("cosigner_1_name") or ""
                    cosigner_2 = item.get("cosigner_2_name") or ""
                    has_assigned_cosigners = (
                        (cosigner_1.strip() and cosigner_1.strip().lower() != "none") or
                        (cosigner_2.strip() and cosigner_2.strip().lower() != "none")
                    )

                    note_str = item.get("note") or ""
                    desc_str = item.get("description") or ""
                    full_memo = f"{note_str} {desc_str}".upper()
                    co_signer_approved = "[SIGNED:" in full_memo or "CO-SIGNER APPROVED" in full_memo

                    # Resolve sender email if missing from the record[cite: 21]
                    sender_email = item.get("sender_email")
                    if not sender_email or "@" not in str(sender_email):
                        sender_wallet = item.get("from_wallet")
                        if sender_wallet:
                            lookup = supabase.table("organization_members") \
                                .select("email") \
                                .ilike("wallet_address", sender_wallet.strip()) \
                                .execute()
                            if lookup.data and len(lookup.data) > 0 and lookup.data[0].get("email"):
                                sender_email = lookup.data[0]["email"]

                    amount_val = float(item.get("total_amount") or 0.0)

                    try:
                        print(f"[Keeper] Intent #{db_intent_id} (On-chain #{onchain_id}) matured. Calling execute_intent on contract...")
                        result = settler.execute_matured_intent(onchain_id)
                        tx_hash = result.get("tx_hash")
                        is_contract_refund = result.get("is_refund", False)

                        # If it was quarantined OR cosigners were required but missing, it is a refund[cite: 21]
                        is_refund = is_contract_refund or is_quarantined or (has_assigned_cosigners and not co_signer_approved)
                        self.terminal_intents.add(db_intent_id)

                        if is_refund:
                            refund_reason = "Anomaly challenge or co-signer signature missing upon timelock expiry"
                            print(f"[Keeper] Intent #{db_intent_id} refunded on-chain. Updating database...")
                            supabase.table("transactions_testnet").update({
                                "status": "cancelled",
                                "note": f"Auto-refunded to treasury: {refund_reason}. Tx: {tx_hash}",
                                "tx_hash": tx_hash
                            }).eq("intent_id", db_intent_id).execute()

                            # Refund notice sent strictly to internal treasury (recipient receives no invoice)[cite: 20]
                            relayer.notify_refund_alert(
                                intent_id=db_intent_id,
                                amount=amount_val,
                                asset_symbol="XLM",
                                sender_email=sender_email,
                                cosigner_1_email=item.get("cosigner_1_email"),
                                reason=refund_reason
                            )
                        else:
                            print(f"[Keeper] Intent #{db_intent_id} settled and disbursed on-chain. Updating database...")
                            supabase.table("transactions_testnet").update({
                                "status": "executed",
                                "tx_hash": tx_hash,
                                "note": f"Settled & Disbursed on-chain. Tx: {tx_hash}"
                            }).eq("intent_id", db_intent_id).execute()

                            # Dual-Table Recipient Lookup: organization_members OR organizations[cite: 20]
                            recipient_wallet = (item.get("to_wallet") or item.get("recipient") or "").strip()
                            receiver_email = item.get("receiver_email")

                            if not receiver_email and recipient_wallet and recipient_wallet != "none":
                                try:
                                    # 1. Check organization_members
                                    rec_lookup = supabase.table("organization_members") \
                                        .select("email") \
                                        .ilike("wallet_address", recipient_wallet) \
                                        .execute()
                                    if rec_lookup.data and len(rec_lookup.data) > 0 and rec_lookup.data[0].get("email"):
                                        receiver_email = rec_lookup.data[0]["email"]

                                    # 2. Check organizations entity table
                                    if not receiver_email:
                                        org_lookup = supabase.table("organizations") \
                                            .select("email") \
                                            .ilike("wallet_address", recipient_wallet) \
                                            .execute()
                                        if org_lookup.data and len(org_lookup.data) > 0 and org_lookup.data[0].get("email"):
                                            receiver_email = org_lookup.data[0]["email"]
                                except Exception as lookup_err:
                                    print(f"[Keeper] Recipient email lookup notice: {lookup_err}")

                            relayer.notify_settlement_invoice(
                                intent_id=db_intent_id,
                                amount=amount_val,
                                asset_symbol="XLM",
                                recipient=recipient_wallet,
                                tx_hash=tx_hash,
                                org_name=item.get("org_name"),
                                sender_email=sender_email,
                                receiver_email=receiver_email,
                                cosigner_1_email=item.get("cosigner_1_email"),
                                cosigner_2_email=item.get("cosigner_2_email"),
                                note=item.get("note")
                            )

                        print(f"[Keeper] Successfully completed settlement cycle for Intent #{db_intent_id}.")
                    except Exception as err:
                        err_msg = str(err)
                        if "IntentAlreadyTerminal" in err_msg or "#14" in err_msg or "IntentNotFound" in err_msg:
                            self.terminal_intents.add(db_intent_id)
                        elif "IntentIsQuarantined" in err_msg or "#15" in err_msg:
                            print(f"[Keeper] Intent #{db_intent_id} has an active on-chain challenge bond. Awaiting Guardian resolution.")
                        else:
                            print(f"[Warning] Settle execution failed for #{db_intent_id}: {err}")
        except Exception as e:
            print(f"[Warning] Error during matured intents check: {e}")

    def _process_event(self, event):
        topics = event.topic
        if len(topics) < 2:
            return
        try:
            if scval.from_scval(topics[0]) == "intent" and scval.from_scval(topics[1]) == "created":
                raw_onchain_id = int(scval.from_scval(event.value))
                if raw_onchain_id not in self.processed_intents:
                    self.processed_intents.add(raw_onchain_id)
        except Exception:
            pass

    def evaluate_and_guard(self, db_intent_id: int):
        print(f"[Agent] Ingested Intent #{db_intent_id} for ML Risk Inspection...")

        res = supabase.table("transactions_testnet") \
            .select("*") \
            .eq("intent_id", db_intent_id) \
            .execute()

        if not res.data or len(res.data) == 0:
            return

        tx_record = res.data[0]
        sender = tx_record["from_wallet"]
        recipient = tx_record["to_wallet"]
        amount = float(tx_record["total_amount"])
        asset_address = tx_record.get("asset_address", "")
        org_name = tx_record.get("org_name", "none")
        existing_note = tx_record.get("note") or ""

        composite_score, features, rationale, should_challenge = calculate_composite_risk(
            intent_id=db_intent_id,
            sender=sender,
            recipient=recipient,
            amount=amount,
            asset_address=asset_address,
            daily_limit=50_000.0,
            timestamp_epoch=int(time.time()),
            purpose_hash_hex="",
            org_name=org_name
        )

        print(f"[Agent] Intent #{db_intent_id} [{org_name}] Score: {composite_score:.2f}/100. Action: {'CHALLENGE' if should_challenge else 'PASS'}")

        preserved_signatures = " ".join([part for part in existing_note.split() if "[SIGNED:" in part])

        if should_challenge:
            print(f"[Alert] Anomaly detected! Applying DB-Only Quarantine for Intent #{db_intent_id}...")
            quarantine_note = f"[QUARANTINED] ML Score: {composite_score:.2f} | {rationale} {preserved_signatures}".strip()
            
            supabase.table("transactions_testnet").update({
                "status": "quarantined",
                "note": quarantine_note
            }).eq("intent_id", db_intent_id).execute()

            relayer.notify_gas_webhook(
                intent_id=db_intent_id,
                sender_wallet=sender,
                recipient_wallet=recipient,
                amount=amount,
                risk_score=composite_score,
                rationale=rationale,
                tx_hash="DB_QUARANTINE",
                cosigner_1_email=tx_record.get("cosigner_1_email"),
                cosigner_2_email=tx_record.get("cosigner_2_email")
            )
        else:
            updated_note = f"ML Risk Score: {composite_score:.2f}/100 | {rationale} {preserved_signatures}".strip()
            supabase.table("transactions_testnet").update({
                "note": updated_note
            }).eq("intent_id", db_intent_id).execute()