import hashlib
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from stellar_sdk import Keypair, Server
from supabase import create_client, Client

ENV_PATH = Path(__file__).resolve().parent / ".env"


class AgentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Network & Soroban Configuration
    STELLAR_RPC_URL: str = Field(
        default="https://soroban-testnet.stellar.org",
        description="Soroban RPC node endpoint"
    )
    STELLAR_NETWORK_PASSPHRASE: str = Field(
        default="Test SDF Network ; September 2015",
        description="Stellar Network Passphrase"
    )
    HORIZON_URL: str = Field(
        default="https://horizon-testnet.stellar.org",
        description="Horizon API endpoint for account state"
    )
    CONTRACT_ID: str = Field(
        ...,
        description="Deployed SentinelTreasury contract address"
    )

    # ML Agent Signer & Keeper Identity (Mandatory from Environment)
    AGENT_SECRET_KEY: str = Field(
        ...,
        description="Secret key (S...) of the authorized ML detector account"
    )
    BOT_SECRET_KEY: str = Field(
        ...,
        description="Funded keeper bot secret key for autonomous timelock execution"
    )
    MIN_CHALLENGE_BOND_STROOPS: int = Field(
        default=500_000_000,
        description="Anti-griefing bond amount in stroops (50 XLM, 7 decimals)"
    )

    # Database & Storage (Mandatory from Environment)
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        ..., 
        description="Supabase Service Role Key for backend ingestion"
    )

    # Google Apps Script Webhook (Mandatory from Environment)
    GAS_WEBHOOK_URL: str = Field(
        ...,
        description="Google Apps Script endpoint for alerts and invoices"
    )

    # Daemon Execution Controls & Crank Security
    POLL_INTERVAL_SECONDS: int = Field(default=5)
    RISK_CHALLENGE_THRESHOLD: float = Field(
        default=75.0,
        description="Composite score threshold (0-100) above which intent is challenged"
    )
    CRANK_SECRET: str = Field(
        default="",
        description="Optional shared secret header to protect /crank endpoint"
    )


# Singleton configuration instance
settings = AgentSettings()

# Stellar Keypairs & Network Initializers
agent_keypair = Keypair.from_secret(settings.AGENT_SECRET_KEY)
bot_keypair = Keypair.from_secret(settings.BOT_SECRET_KEY)
stellar_server = Server(horizon_url=settings.HORIZON_URL)

# Supabase Client Initializer
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)


def compute_evidence_digest(
    intent_id: int,
    risk_score: float,
    feature_vector: list[float],
    rationale: str
) -> bytes:
    """
    Computes deterministic SHA-256 evidence digest matching contract's BytesN<32>.
    """
    hasher = hashlib.sha256()
    hasher.update(str(intent_id).encode("utf-8"))
    hasher.update(f"{risk_score:.4f}".encode("utf-8"))
    
    for val in feature_vector:
        hasher.update(f"{val:.6f}".encode("utf-8"))
        
    hasher.update(rationale.encode("utf-8"))
    return hasher.digest()


def is_stellar_address_valid(address: str) -> bool:
    """Validates 56-character Stellar public key format."""
    if not address or len(address) != 56 or not address.startswith("G"):
        return False
    try:
        Keypair.from_public_key(address)
        return True
    except Exception:
        return False