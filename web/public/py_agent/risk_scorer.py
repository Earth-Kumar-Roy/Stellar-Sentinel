import math
from datetime import datetime, timezone
from typing import Tuple
from core import supabase
from ml.pipeline import FeatureExtractor, AnomalyDetector

detector = AnomalyDetector()


def normalize_to_xlm_equivalent(amount: float, asset_address: str) -> float:
    addr_upper = (asset_address or "").upper()
    if "USDC" in addr_upper or addr_upper.startswith("CBPD"):
        return amount * 5.0  # 1,000 USDC = 5,000 XLM[cite: 15]
    elif "EURC" in addr_upper or addr_upper.startswith("CCEW"):
        return amount * 5.55 # 900 EURC ~ 5,000 XLM[cite: 15]
    return amount


def parse_iso_epoch(ts_str: str) -> float:
    if not ts_str:
        return 0.0
    try:
        cleaned = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        return dt.timestamp()
    except Exception:
        return 0.0


def evaluate_recipient_trust_history(
    treasury_address: str, 
    recipient_address: str, 
    org_name: str,
    current_intent_id: int = 0
) -> dict:
    target_addr = recipient_address.strip()
    treasurer_addr = treasury_address.strip()

    # 1. Corporate GST Registry Verification
    is_verified_entity = False
    try:
        org_dir = supabase.table("organizations") \
            .select("id, is_verified") \
            .eq("wallet_address", target_addr) \
            .limit(1) \
            .execute()
        if org_dir.data and len(org_dir.data) > 0:
            is_verified_entity = bool(org_dir.data[0].get("is_verified", True))
    except Exception:
        pass

    if not is_verified_entity:
        try:
            member_res = supabase.table("organization_members") \
                .select("id, is_verified") \
                .eq("wallet_address", target_addr) \
                .limit(1) \
                .execute()
            if member_res.data and len(member_res.data) > 0:
                is_verified_entity = True
        except Exception:
            pass

    # 2. Scoped Historical Query: Filter strictly by this treasury's disbursements
    query = supabase.table("transactions_testnet") \
        .select("id, intent_id, total_amount, created_at, status, note, description, from_wallet, cosigner_1_name, cosigner_2_name, cosigner_1_email, cosigner_2_email") \
        .eq("to_wallet", target_addr)

    # Enforce multi-tenant isolation: only this treasurer's historical transfers
    if treasurer_addr and treasurer_addr.lower() not in ["", "none", "null"]:
        query = query.eq("from_wallet", treasurer_addr)

    if current_intent_id > 0:
        query = query.neq("intent_id", current_intent_id)

    tx_res = query.order("created_at", desc=False).execute()
    records = tx_res.data or []

    executed_records = []
    cosigned_epochs = []
    recipient_amounts = []
    first_seen_epoch = 0.0
    now_epoch = datetime.now(timezone.utc).timestamp()

    # Pass 1: Identify all historical records, separate executed vs cancelled, identify co-signed events
    for rec in records:
        rec_id = str(rec.get("intent_id") or "")
        if current_intent_id > 0 and str(current_intent_id) == rec_id:
            continue

        memo = f"{rec.get('note') or ''} {rec.get('description') or ''}".upper()
        c1 = (rec.get("cosigner_1_name") or "").strip().lower()
        c2 = (rec.get("cosigner_2_name") or "").strip().lower()
        status = (rec.get("status") or "").strip().lower()
        epoch = parse_iso_epoch(rec.get("created_at"))

        if epoch > 0 and not first_seen_epoch:
            first_seen_epoch = epoch

        # Detect co-signer endorsements
        has_cosigner = (c1 not in ["", "none", "null", "undefined"]) or (c2 not in ["", "none", "null", "undefined"])
        is_memo_signed = ("[SIGNED:" in memo) or ("CO-SIGNER APPROVED" in memo)

        if is_memo_signed or (has_cosigner and status == "executed"):
            if epoch > 0:
                cosigned_epochs.append(epoch)

        # Only executed disbursements count toward baselines
        if status == "executed":
            executed_records.append(rec)
            try:
                val = float(rec.get("total_amount") or 0)
                if val > 0:
                    recipient_amounts.append(val)
            except (ValueError, TypeError):
                pass

    cosigned_count = len(cosigned_epochs)
    latest_cosigned_epoch = max(cosigned_epochs) if cosigned_epochs else 0.0

    # Pass 2: Count executed transfers occurred STRICTLY AFTER the latest co-signer endorsement
    transfers_since_last_cosign = 0
    if latest_cosigned_epoch > 0:
        for rec in executed_records:
            epoch = parse_iso_epoch(rec.get("created_at"))
            # Must be strictly after the latest co-signed transaction timestamp
            if epoch > (latest_cosigned_epoch + 2.0):
                transfers_since_last_cosign += 1
    else:
        transfers_since_last_cosign = len(executed_records)

    # 3. Global Treasury Baseline: Last 25 executed transactions across this company's treasury
    global_query = supabase.table("transactions_testnet") \
        .select("total_amount, created_at, status, to_wallet, from_wallet") \
        .eq("status", "executed")

    if treasurer_addr and treasurer_addr.lower() not in ["", "none", "null"]:
        global_query = global_query.eq("from_wallet", treasurer_addr)

    if current_intent_id > 0:
        global_query = global_query.neq("intent_id", current_intent_id)

    global_res = global_query.order("created_at", desc=True).limit(25).execute()
    global_records = global_res.data or []
    global_amounts = []

    for g_item in global_records:
        try:
            v = float(g_item.get("total_amount") or 0)
            if v > 0:
                global_amounts.append(v)
        except (ValueError, TypeError):
            pass

    avg_global_amount = (sum(global_amounts) / len(global_amounts)) if global_amounts else 50.0

    # 4. Post-Cosign Frequency Clustering: Check in the last 12 executed treasury transactions
    # If 9+ are to the same wallet strictly after the latest co-signer endorsement
    post_cosign_recent_12 = []
    for g_item in global_records[:12]:
        g_epoch = parse_iso_epoch(g_item.get("created_at"))
        if latest_cosigned_epoch == 0.0 or g_epoch > (latest_cosigned_epoch + 2.0):
            post_cosign_recent_12.append(g_item)

    same_wallet_frequency = 0
    for item in post_cosign_recent_12:
        dest = (item.get("to_wallet") or "").strip().upper()
        if dest == target_addr.upper():
            same_wallet_frequency += 1

    is_frequency_clustering = (len(post_cosign_recent_12) >= 9 and same_wallet_frequency >= 9)

    # 5. Counterparty Baseline: Recent 8 successful disbursements
    recent_recipient = recipient_amounts[-8:] if len(recipient_amounts) >= 8 else recipient_amounts
    avg_recipient_amount = (sum(recent_recipient) / len(recent_recipient)) if recent_recipient else 0.0
    highest_endorsed_amount = max(recipient_amounts) if recipient_amounts else 0.0

    if len(recent_recipient) > 1:
        variance = sum((x - avg_recipient_amount) ** 2 for x in recent_recipient) / len(recent_recipient)
        std_dev = math.sqrt(variance)
    else:
        std_dev = max(avg_recipient_amount * 0.5, 20.0)

    recipient_age_days = max((now_epoch - first_seen_epoch) / 86400.0, 0.0) if first_seen_epoch else 0.0

    return {
        "is_verified_entity": is_verified_entity,
        "historical_count": len(executed_records),
        "total_attempts": len(records),
        "cosigned_count": cosigned_count,
        "transfers_since_last_cosign": transfers_since_last_cosign,
        "is_frequency_clustering": is_frequency_clustering,
        "same_wallet_frequency": same_wallet_frequency,
        "avg_recipient_amount": avg_recipient_amount,
        "highest_endorsed_amount": highest_endorsed_amount,
        "avg_global_amount": avg_global_amount,
        "std_dev": std_dev,
        "recipient_age_days": recipient_age_days
    }


def calculate_composite_risk(
    intent_id: int,
    sender: str,
    recipient: str,
    amount: float,
    asset_address: str,
    daily_limit: float,
    timestamp_epoch: int,
    purpose_hash_hex: str,
    org_name: str
) -> Tuple[float, list[float], str, bool]:
    trust = evaluate_recipient_trust_history(
        treasury_address=sender,
        recipient_address=recipient,
        org_name=org_name,
        current_intent_id=intent_id
    )
    xlm_equivalent = normalize_to_xlm_equivalent(amount, asset_address)

    is_verified = trust["is_verified_entity"]
    past_executed_count = trust["historical_count"]
    cosigned_count = trust["cosigned_count"]
    transfers_since_cosign = trust["transfers_since_last_cosign"]
    is_frequency_clustering = trust["is_frequency_clustering"]
    same_wallet_frequency = trust["same_wallet_frequency"]
    avg_recipient = trust["avg_recipient_amount"]
    highest_endorsed = trust["highest_endorsed_amount"]
    avg_global = trust["avg_global_amount"]
    std_dev = trust["std_dev"]
    recipient_age = trust["recipient_age_days"]

    features = FeatureExtractor.extract_features(
        amount=xlm_equivalent,
        daily_limit=daily_limit,
        destination_24h_count=transfers_since_cosign,
        recipient_age_days=recipient_age,
        timestamp_epoch=timestamp_epoch,
        purpose_hash_hex=purpose_hash_hex,
        is_independent_wallet=not is_verified,
        historical_transfers_to_wallet=past_executed_count
    )

    base_ml_score = detector.score_anomaly(features) * 35.0
    composite_score = base_ml_score
    rationale = []

    # ------------------------------------------------------------------
    # 1. High-Value Protocol Cap (> 5,000 XLM / 1,000 USDC / 900 EURC)
    # ------------------------------------------------------------------
    if xlm_equivalent > 5000.0:
        composite_score = max(composite_score + 45.0, 78.0)
        rationale.append("High-value disbursement (> 5,000 XLM / 1,000 USDC / 900 EURC) mandates multi-sig approval.")

    # ------------------------------------------------------------------
    # 2. Global Treasury Entropy Anomaly (> 30x of last 25 baseline)
    # ------------------------------------------------------------------
    is_entropy_anomaly = False
    if avg_global > 0:
        global_entropy_ratio = xlm_equivalent / avg_global
        if global_entropy_ratio >= 30.0 and xlm_equivalent >= 150.0:
            is_entropy_anomaly = True
            composite_score = max(composite_score + 50.0, 80.0)
            rationale.append(
                f"Global treasury entropy anomaly: {global_entropy_ratio:.1f}x spike over 25-tx average ({avg_global:.1f} XLM). Multi-sig verification required."
            )

    # ------------------------------------------------------------------
    # 3. Frequency Clustering Anomaly (9+ out of last 12 without co-sign)
    # ------------------------------------------------------------------
    if is_frequency_clustering:
        composite_score = max(composite_score + 48.0, 78.0)
        rationale.append(
            f"Frequency concentration detected: {same_wallet_frequency} of the last 12 disbursements sent to this address without co-signer validation."
        )

    # ------------------------------------------------------------------
    # 4. Relative Counterparty Volume Surge
    # ------------------------------------------------------------------
    effective_baseline = max(avg_recipient, highest_endorsed)
    if past_executed_count >= 2 and effective_baseline > 0:
        surge_ratio = xlm_equivalent / effective_baseline
        if (surge_ratio >= 25.0 and xlm_equivalent >= 250.0) or (surge_ratio >= 35.0):
            composite_score = max(composite_score + 45.0, 78.0)
            rationale.append(
                f"Severe flow surge: {surge_ratio:.1f}x spike over baseline ({effective_baseline:.1f} XLM). Co-signer quorum required."
            )

    # ------------------------------------------------------------------
    # 5. Fixed Trust-Laddering Bands
    # ------------------------------------------------------------------
    # Unregistered: Band 1 = 7, Band 2+ = 13
    # Registered:   Band 1 = 10, Band 2+ = 18
    if not is_entropy_anomaly and not is_frequency_clustering and xlm_equivalent <= 5000.0:
        if is_verified:
            # ---------------- Verified GST Corporate Entity ----------------
            active_band = 10 if cosigned_count <= 1 else 18
            band_label = "Band 1" if cosigned_count <= 1 else "Band 2"

            if past_executed_count in [0, 1]:
                composite_score = min(composite_score, 18.0)
                rationale.append("Verified GST corporate entity (routine operational transfer).")
            elif past_executed_count == 2 and cosigned_count == 0:
                composite_score = max(composite_score, 76.0)
                rationale.append("Milestone transfer #3: Multi-sig endorsement required to establish corporate vendor tier.")
            else:
                if cosigned_count > 0:
                    if transfers_since_cosign >= active_band:
                        composite_score = max(composite_score, 76.0)
                        rationale.append(
                            f"Periodic multisig review cycle ({band_label}: {active_band} transfers completed since last endorsement)."
                        )
                    else:
                        composite_score = min(composite_score, 20.0)
                        rationale.append(
                            f"Compliant corporate entity within active trust window ({transfers_since_cosign + 1}/{active_band} in {band_label})."
                        )
                else:
                    composite_score = max(composite_score, 78.0)
                    rationale.append("Unverified corporate sequence: Multi-sig co-signer endorsement required.")
        else:
            # ---------------- Independent Unregistered Address ----------------
            active_band = 7 if cosigned_count <= 1 else 13
            band_label = "Band 1" if cosigned_count <= 1 else "Band 2"

            if past_executed_count == 0:
                composite_score = min(max(composite_score, 28.0), 32.0)
                rationale.append("Initial transfer to independent unverified address.")
            elif past_executed_count == 1 and cosigned_count == 0:
                composite_score = max(composite_score, 78.0)
                rationale.append("Secondary transfer to independent wallet mandates co-signer authorization to establish trust.")
            else:
                if cosigned_count > 0:
                    if transfers_since_cosign >= active_band:
                        composite_score = max(composite_score, 76.0)
                        rationale.append(
                            f"Periodic quorum check for independent wallet ({band_label}: {active_band} transfers completed since last endorsement)."
                        )
                    else:
                        composite_score = min(composite_score, 24.0)
                        rationale.append(
                            f"Active trust window for co-signed independent address ({transfers_since_cosign + 1}/{active_band} in {band_label})."
                        )
                else:
                    composite_score = max(composite_score, 82.0)
                    rationale.append(
                        f"Sequence warning: {past_executed_count + 1} transfers to unverified address without multi-sig validation."
                    )

    final_score = float(min(max(composite_score, 0.0), 100.0))
    should_challenge = final_score >= 75.0

    if not rationale:
        rationale.append("Transaction within normal relative behavioral flow.")

    return final_score, features, " | ".join(rationale), should_challenge