use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum SentinelError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    EmergencyFrozen = 4,

    IntentNotFound = 10,
    IntentAlreadyExists = 11,
    InvalidIntentParameters = 12,
    IntentExpired = 13,
    IntentAlreadyTerminal = 14,
    InvalidStateTransition = 15,
    CosignerRequired = 16,

    AmountExceedsPerTxLimit = 20,
    DailyLimitExceeded = 21,
    CumulativeLimitExceeded = 22,
    AssetNotSupported = 23,
    RecipientRestricted = 24,

    ObservationWindowActive = 30,
    IntentIsQuarantined = 31,
    IntentNotChallenged = 32,
    ChallengeAlreadyActive = 33,

    InsufficientApprovals = 40,
    SignerAlreadyApproved = 41,
    SignerNotAuthorized = 42,
    GuardianNotAuthorized = 43,
    GuardianApprovalRequired = 44,

    AgentNotAuthorized = 50,
    InsufficientChallengeBond = 51,
    ChallengePeriodExpired = 52,
    InvalidEvidenceDigest = 53,

    InsufficientTreasuryBalance = 60,
    TransferFailed = 61,
}