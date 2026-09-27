use soroban_sdk::{contracttype, Address, BytesN, Vec};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum IntentStatus {
    Requested = 0,
    PolicyRejected = 1,
    FastPath = 2,
    Observing = 3,
    Challenged = 4,
    Quarantined = 5,
    AwaitingApproval = 6,
    Executable = 7,
    Executed = 8,
    Cancelled = 9,
    Expired = 10,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ExecutionTier {
    FastPath = 0,
    StandardObserving = 1,
    GuardianRequired = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrgProfile {
    pub org_id: BytesN<32>,
    pub is_verified: bool,
    pub trust_score: u32,
    pub registered_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientHistory {
    pub total_volume: i64,
    pub tx_count: u32,
    pub largest_tx: i64,
    pub first_seen: u64,
    pub last_seen: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TreasuryPolicy {
    pub max_per_tx: i64,
    pub daily_limit: i64,
    pub fast_path_limit: i64,
    pub observation_delay: u64,
    pub intent_ttl: u64,
    pub quorum: u32,
    pub guardian_quorum: u32,
    pub min_challenge_bond: i64,
    pub policy_version: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentIntent {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub asset: Address,
    pub amount: i64,
    pub purpose_hash: BytesN<32>,
    pub status: IntentStatus,
    pub tier: ExecutionTier,
    pub created_at: u64,
    pub observation_until: u64,
    pub expires_at: u64,
    pub cosigners: Vec<Address>,
    pub guardian: Option<Address>,
    pub approvals: Vec<Address>,
    pub guardian_approvals: Vec<Address>,
    pub policy_version: u32,
    pub observation_delay: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ChallengeRecord {
    pub intent_id: u64,
    pub agent: Address,
    pub evidence_digest: BytesN<32>,
    pub bond_amount: i64,
    pub timestamp: u64,
    pub resolved: bool,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub struct DailyVelocity {
    pub current_window_start: u64,
    pub spent_amount: i64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    EmergencyFrozen,
    Policy,
    TotalIntentCount,
    NativeToken,
    Org(Address),
    Intent(u64),
    Challenge(u64),
    RecipientTrack(Address),
    SpendingVelocity(Address),
}