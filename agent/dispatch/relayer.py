import time
import httpx
from stellar_sdk import (
    TransactionBuilder,
    Network,
    scval,
    Address as StellarAddress,
    xdr,
)
from stellar_sdk.soroban_rpc import (
    SendTransactionStatus,
    GetTransactionStatus,
)
from stellar_sdk.soroban_server import SorobanServer
from core import settings, agent_keypair, bot_keypair, compute_evidence_digest, supabase


class ChallengeRelayer:
    """
    Submits on-chain challenge transactions to the SentinelTreasury Soroban contract
    and dispatches immediate alerts to Google Apps Script.
    """
    def __init__(self):
        self.soroban_server = SorobanServer(settings.STELLAR_RPC_URL)

    def submit_challenge(
        self,
        intent_id: int,
        risk_score: float,
        feature_vector: list[float],
        rationale: str
    ) -> str:
        evidence_digest = compute_evidence_digest(
            intent_id=intent_id,
            risk_score=risk_score,
            feature_vector=feature_vector,
            rationale=rationale
        )

        source_account = self.soroban_server.load_account(agent_keypair.public_key)
        contract_id = settings.CONTRACT_ID
        agent_addr = StellarAddress(agent_keypair.public_key)

        tx = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=settings.STELLAR_NETWORK_PASSPHRASE,
                base_fee=100_000,
            )
            .append_invoke_contract_function_op(
                contract_id=contract_id,
                function_name="challenge_intent",
                parameters=[
                    scval.to_address(agent_addr.address),
                    scval.to_uint64(intent_id),
                    scval.to_bytes(evidence_digest),
                    scval.to_int64(settings.MIN_CHALLENGE_BOND_STROOPS),
                ],
            )
            .set_timeout(30)
            .build()
        )

        sim_response = self.soroban_server.simulate_transaction(tx)
        if sim_response.error:
            raise RuntimeError(f"Simulation failed: {sim_response.error}")

        prepared_tx = self.soroban_server.prepare_transaction(tx, sim_response)
        prepared_tx.sign(agent_keypair)

        send_response = self.soroban_server.send_transaction(prepared_tx)
        if send_response.status != SendTransactionStatus.PENDING:
            raise RuntimeError(f"Soroban submission failed: {send_response.error_result_xdr}")

        tx_hash = send_response.hash

        for _ in range(10):
            time.sleep(2)
            get_tx = self.soroban_server.get_transaction(tx_hash)
            if get_tx.status == GetTransactionStatus.SUCCESS:
                return tx_hash
            elif get_tx.status == GetTransactionStatus.FAILED:
                raise RuntimeError(f"Challenge transaction execution failed: {get_tx.result_xdr}")

        return tx_hash

    @staticmethod
    def notify_gas_webhook(
        intent_id: int,
        sender_wallet: str,
        recipient_wallet: str,
        amount: float,
        risk_score: float,
        rationale: str,
        tx_hash: str,
        cosigner_1_email: str = None,
        cosigner_2_email: str = None
    ):
        """
        Dispatches immediate quarantine and cosigner notification to Google Apps Script.
        """
        payload = {
            "action": "COSIGNER_MANDATE_NOTIFY",
            "intent_id": intent_id,
            "total_amount": f"{amount:.4f}",
            "asset_symbol": "XLM",
            "recipient": recipient_wallet,
            "cosigner_1_email": cosigner_1_email,
            "cosigner_2_email": cosigner_2_email,
            "ml_score": risk_score,
            "reason": rationale,
            "tx_hash": tx_hash
        }

        try:
            # follow_redirects=True is mandatory for Google Apps Script Webhook redirects
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                client.post(settings.GAS_WEBHOOK_URL, json=payload)
        except Exception as e:
            print(f"[Warning] Failed to dispatch GAS quarantine notification: {e}")

    @staticmethod
    def notify_settlement_invoice(
        intent_id: int,
        amount: float,
        asset_symbol: str,
        recipient: str,
        tx_hash: str,
        org_name: str = None,
        sender_email: str = None,
        receiver_email: str = None,
        cosigner_1_email: str = None,
        cosigner_2_email: str = None,
        note: str = None
    ):
        """
        Dispatches completed settlement invoice receipt to Google Apps Script.
        """
        clean_email = sender_email if (sender_email and "@" in sender_email) else None
        payload = {
            "action": "INVOICE_SETTLED_NOTIFY",
            "intent_id": intent_id,
            "total_amount": f"{amount:.2f}",
            "asset_symbol": asset_symbol or "XLM",
            "recipient": recipient,
            "tx_hash": tx_hash,
            "org_name": org_name or "Stellar Sentinel Treasury",
            "email": clean_email,
            "treasurer_email": clean_email,
            "sender_email": clean_email,
            "receiver_email": receiver_email,
            "cosigner_1_email": cosigner_1_email,
            "cosigner_2_email": cosigner_2_email,
            "note": note or "Disbursement settled autonomously upon timelock maturation"
        }

        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                client.post(settings.GAS_WEBHOOK_URL, json=payload)
        except Exception as e:
            print(f"[Warning] Failed to dispatch GAS settlement invoice email: {e}")

    @staticmethod
    def notify_refund_alert(
        intent_id: int,
        amount: float,
        asset_symbol: str,
        sender_email: str = None,
        cosigner_1_email: str = None,
        reason: str = None
    ):
        """
        Dispatches refund notice to Google Apps Script.
        """
        clean_email = sender_email if (sender_email and "@" in sender_email) else None
        payload = {
            "action": "ANOMALY_REFUNDED_NOTIFY",
            "intent_id": intent_id,
            "total_amount": f"{amount:.2f}",
            "asset_symbol": asset_symbol or "XLM",
            "email": clean_email,
            "treasurer_email": clean_email,
            "sender_email": clean_email,
            "cosigner_1_email": cosigner_1_email,
            "reason": reason or "Auto-refunded: Signature requirements not satisfied upon timelock expiry"
        }

        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                client.post(settings.GAS_WEBHOOK_URL, json=payload)
        except Exception as e:
            print(f"[Warning] Failed to dispatch GAS refund email: {e}")


class AutonomousSettler:
    """
    Submits execute_intent on-chain via the dedicated bot keypair
    once observation delay / timelock has elapsed.
    """
    def __init__(self):
        self.soroban_server = SorobanServer(settings.STELLAR_RPC_URL)

    def execute_matured_intent(self, intent_id: int) -> dict:
        """
        Executes intent settlement on-chain.
        Returns a dict: {"tx_hash": str, "is_refund": bool}
        """
        source_account = self.soroban_server.load_account(bot_keypair.public_key)
        bot_addr = StellarAddress(bot_keypair.public_key)

        tx = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=settings.STELLAR_NETWORK_PASSPHRASE,
                base_fee=150_000,
            )
            .append_invoke_contract_function_op(
                contract_id=settings.CONTRACT_ID,
                function_name="execute_intent",
                parameters=[
                    scval.to_address(bot_addr.address),
                    scval.to_uint64(intent_id),
                ],
            )
            .set_timeout(60)
            .build()
        )

        sim_response = self.soroban_server.simulate_transaction(tx)
        if sim_response.error:
            raise RuntimeError(f"Simulation failed: {sim_response.error}")

        prepared_tx = self.soroban_server.prepare_transaction(tx, sim_response)
        prepared_tx.sign(bot_keypair)

        send_response = self.soroban_server.send_transaction(prepared_tx)
        if send_response.status != SendTransactionStatus.PENDING:
            raise RuntimeError(f"Execution submission failed: {send_response.error_result_xdr}")

        tx_hash = send_response.hash

        for _ in range(15):
            time.sleep(2)
            get_tx = self.soroban_server.get_transaction(tx_hash)
            if get_tx.status == GetTransactionStatus.SUCCESS:
                # Safe event introspection for auto-refund detection
                is_refund = False
                result_meta_xdr = getattr(get_tx, "result_meta_xdr", None)
                if result_meta_xdr:
                    try:
                        meta = xdr.TransactionMeta.from_xdr(result_meta_xdr)
                        v3 = getattr(meta, "v3", None)
                        if callable(v3):
                            v3 = v3()
                        
                        soroban_meta = getattr(v3, "soroban_meta", None)
                        if callable(soroban_meta):
                            soroban_meta = soroban_meta()

                        if soroban_meta and getattr(soroban_meta, "events", None):
                            for ev in soroban_meta.events:
                                topics = []
                                for t in ev.body.v0.topics:
                                    try:
                                        topics.append(str(scval.from_scval(t)).lower())
                                    except Exception:
                                        topics.append(str(t).lower())
                                if any("refund" in top for top in topics):
                                    is_refund = True
                                    break
                    except Exception as meta_err:
                        print(f"[Meta Parse Notice]: {meta_err}")
                
                return {"tx_hash": tx_hash, "is_refund": is_refund}
            elif get_tx.status == GetTransactionStatus.FAILED:
                raise RuntimeError(f"Settlement transaction failed on-chain: {get_tx.result_xdr}")

        return {"tx_hash": tx_hash, "is_refund": False}