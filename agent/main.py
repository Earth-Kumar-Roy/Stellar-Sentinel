import os
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core import settings, agent_keypair, supabase
from listeners.soroban_subscriber import SorobanSubscriber
from engine.risk_scorer import calculate_composite_risk

# Single Subscriber Instance
subscriber = SorobanSubscriber()

# Optional Secret to protect your crank endpoint from unauthorized triggers
CRANK_SECRET = os.getenv("CRANK_SECRET", "")


def run_settlement_cycle():
    """
    Executes a single screening, polling, and settlement cycle.
    1. Ingests and inspects new intents.
    2. Settles matured observation timelocks or auto-refunds unapproved quorums.
    """
    print("[Crank Worker] Running 15-minute scheduled screening & settlement cycle...")
    try:
        subscriber.poll_events()
        print("[Crank Worker] Settlement cycle completed successfully.")
    except Exception as e:
        print(f"[Crank Worker Error] Execution cycle error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs one sync check immediately when the container spins up
    print("[Agent Boot] Initializing Stellar Sentinel Keeper on Render...")
    try:
        await asyncio.to_thread(subscriber.sync_latest_ledger)
    except Exception as e:
        print(f"[Agent Boot Warning] Could not sync latest ledger sequence: {e}")
    yield
    print("[Agent Shutdown] Web service instance stopping.")


app = FastAPI(
    title="Stellar Sentinel - ML Risk & Settlement Keeper",
    version="2.4.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RiskEvaluationRequest(BaseModel):
    intent_id: int = 0
    sender: str
    recipient: str
    amount: float
    asset_address: str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
    daily_limit: float = 50_000.0
    purpose_hash_hex: str = ""
    org_name: str = "none"


@app.get("/")
def index():
    return {
        "service": "stellar-sentinel-keeper",
        "status": "online",
        "contract_id": settings.CONTRACT_ID,
        "mode": "cron-crank-15m"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "agent_address": agent_keypair.public_key,
        "contract_id": settings.CONTRACT_ID,
        "network": settings.STELLAR_NETWORK_PASSPHRASE,
        "cron_supported": True
    }


@app.api_route("/crank", methods=["GET", "POST"])
async def trigger_cron_crank(
    background_tasks: BackgroundTasks,
    x_crank_secret: str = Header(default="", alias="X-Crank-Secret")
):
    """
    HTTP endpoint triggered by cron-job.org every 15 minutes.
    Wakes up the Render free service, executes the batch cycle, and responds immediately.
    """
    if CRANK_SECRET and x_crank_secret != CRANK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized crank secret")

    # Run in background task so cron-job.org does not time out during RPC simulation
    background_tasks.add_task(run_settlement_cycle)
    
    return {
        "status": "acknowledged",
        "action": "settlement_cycle_dispatched",
        "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    }


@app.post("/evaluate")
def evaluate_risk(payload: RiskEvaluationRequest):
    """Real-time ML anomaly evaluation called by the frontend PaymentForm."""
    try:
        resolved_org = payload.org_name
        if not resolved_org or resolved_org.lower() == "none":
            try:
                res = supabase.table("organization_members") \
                    .select("org_name") \
                    .ilike("wallet_address", payload.sender.strip()) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    resolved_org = res.data[0].get("org_name") or "none"
            except Exception:
                resolved_org = "none"

        score, features, rationale, should_challenge = calculate_composite_risk(
            intent_id=payload.intent_id,
            sender=payload.sender,
            recipient=payload.recipient,
            amount=payload.amount,
            asset_address=payload.asset_address,
            daily_limit=payload.daily_limit,
            timestamp_epoch=int(time.time()),
            purpose_hash_hex=payload.purpose_hash_hex,
            org_name=resolved_org
        )
        return {
            "intent_id": payload.intent_id,
            "risk_score": round(score, 2),
            "should_challenge": should_challenge,
            "rationale": rationale,
            "feature_vector": [round(f, 4) for f in features]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)