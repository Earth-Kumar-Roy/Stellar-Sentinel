use crate::errors::SentinelError;
use crate::storage;
use crate::types::{
    ChallengeRecord, DataKey, ExecutionTier, IntentStatus, OrgProfile, PaymentIntent,
    RecipientHistory,
};
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, BytesN, Env, String, Vec};

pub const COSIGNER_THRESHOLD_AMOUNT: i64 = 50_000_000_000;  // 5,000 XLM (Mandates at least 1 Co-Signer)
pub const MULTISIG_THRESHOLD_AMOUNT: i64 = 100_000_000_000; // 10,000 XLM (Mandates 2 Co-Signers + 1 Guardian)
pub const MIN_OBSERVATION_DELAY: u64 = 180;                  // 3 Minutes minimum
pub const MAX_OBSERVATION_DELAY: u64 = 43_200;              // 12 Hours maximum
pub const INTENT_TTL_SECONDS: u64 = 604_800;                 // 7 Days
pub const MIN_CHALLENGE_BOND: i64 = 500_000_000;            // 50 XLM
pub const SECONDS_PER_DAY: u64 = 86_400;

#[contract]
pub struct SentinelTreasury;

#[contractimpl]
impl SentinelTreasury {
    // -------------------------------------------------------------------------
    // 1. Administration & Emergency Controls
    // -------------------------------------------------------------------------

    pub fn initialize(env: Env, admin: Address) -> Result<(), SentinelError> {
        if storage::get_admin(&env).is_some() {
            return Err(SentinelError::AlreadyInitialized);
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
        storage::set_policy(&env, &storage::get_default_policy());
        env.events().publish((symbol_short!("admin"), symbol_short!("init")), admin);
        Ok(())
    }

    pub fn set_emergency_freeze(env: Env, caller: Address, frozen: bool) -> Result<(), SentinelError> {
        caller.require_auth();
        if let Some(admin) = storage::get_admin(&env) {
            if caller != admin {
                return Err(SentinelError::Unauthorized);
            }
        }
        storage::set_frozen(&env, frozen);
        env.events().publish((symbol_short!("freeze"), symbol_short!("state")), frozen);
        Ok(())
    }

    pub fn set_native_token(env: Env, caller: Address, native_token: Address) -> Result<(), SentinelError> {
        caller.require_auth();
        if let Some(admin) = storage::get_admin(&env) {
            if caller != admin {
                return Err(SentinelError::Unauthorized);
            }
        }
        storage::set_native_token(&env, &native_token);
        env.events().publish((symbol_short!("token"), symbol_short!("native")), native_token);
        Ok(())
    }

    // -------------------------------------------------------------------------
    // 2. Organization Identity & Reputation Registry
    // -------------------------------------------------------------------------

    pub fn register_org(
        env: Env,
        caller: Address,
        wallet: Address,
        org_id: BytesN<32>,
        is_verified: bool,
        trust_score: u32,
    ) -> Result<(), SentinelError> {
        caller.require_auth();
        if caller != wallet {
            return Err(SentinelError::Unauthorized);
        }

        let profile = OrgProfile {
            org_id,
            is_verified,
            trust_score,
            registered_at: env.ledger().timestamp(),
        };

        storage::set_org_profile(&env, &wallet, &profile);
        env.events().publish((symbol_short!("org_reg"), wallet), trust_score);
        Ok(())
    }

    // -------------------------------------------------------------------------
    // 3. Intent Creation, Immediate Escrow & Configurable Time-Lock
    // -------------------------------------------------------------------------

    pub fn create_intent(
        env: Env,
        caller: Address,
        recipient: Address,
        cosigners: Vec<Address>,
        guardian: Vec<Address>,
        asset: Address,
        amount: i64,
        purpose_hash: BytesN<32>,
        observation_delay: u64,
    ) -> Result<u64, SentinelError> {
        if storage::is_frozen(&env) {
            return Err(SentinelError::EmergencyFrozen);
        }

        caller.require_auth();

        if amount <= 0 {
            return Err(SentinelError::InvalidIntentParameters);
        }

        if observation_delay < MIN_OBSERVATION_DELAY || observation_delay > MAX_OBSERVATION_DELAY {
            return Err(SentinelError::InvalidIntentParameters);
        }

        let policy = storage::get_policy(&env);
        if amount > policy.max_per_tx {
            return Err(SentinelError::AmountExceedsPerTxLimit);
        }

        // Determine if asset is Native XLM
        let native_asset = storage::get_native_token(&env).unwrap_or_else(|| {
            // Default official Stellar Testnet Native SAC address
            Address::from_string(&String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"))
        });
        let is_native_xlm = asset == native_asset;

        // Path A Rule Implementation:
        // - For Native XLM: Enforce strict 5k and 10k multi-sig bands.
        // - For Stablecoins (USDC / EURC): 5k/10k bands DO NOT apply.
        //   FastPath is allowed unless user/ML explicitly provided co-signers.
        let tier = if is_native_xlm && amount > MULTISIG_THRESHOLD_AMOUNT {
            if cosigners.len() < 2 || guardian.is_empty() {
                return Err(SentinelError::CosignerRequired);
            }
            ExecutionTier::GuardianRequired
        } else if is_native_xlm && amount > COSIGNER_THRESHOLD_AMOUNT {
            if cosigners.is_empty() {
                return Err(SentinelError::CosignerRequired);
            }
            ExecutionTier::StandardObserving
        } else if !cosigners.is_empty() {
            ExecutionTier::StandardObserving
        } else {
            ExecutionTier::FastPath
        };

        let now = env.ledger().timestamp();
        let intent_id = storage::get_next_intent_id(&env);
        let observation_until = now.saturating_add(observation_delay);

        let initial_status = if tier == ExecutionTier::FastPath {
            IntentStatus::Observing
        } else {
            IntentStatus::AwaitingApproval
        };

        let mut approvals = Vec::new(&env);
        approvals.push_back(caller.clone());

        let mut bound_guardian: Option<Address> = None;
        for g in guardian.iter() {
            bound_guardian = Some(g);
            break;
        }

        // Lock funds immediately into contract escrow
        token::Client::new(&env, &asset).transfer(
            &caller,
            &env.current_contract_address(),
            &(amount as i128),
        );

        let intent = PaymentIntent {
            id: intent_id,
            sender: caller.clone(),
            recipient,
            asset,
            amount,
            purpose_hash,
            status: initial_status,
            tier,
            created_at: now,
            observation_until,
            expires_at: now.saturating_add(policy.intent_ttl),
            cosigners,
            guardian: bound_guardian,
            approvals,
            guardian_approvals: Vec::new(&env),
            policy_version: policy.policy_version,
            observation_delay,
        };

        storage::set_intent(&env, intent_id, &intent);
        env.events().publish((symbol_short!("intent"), symbol_short!("created")), intent_id);

        Ok(intent_id)
    }

    // -------------------------------------------------------------------------
    // 4. Multi-Signature & Cosigner Quorum Approval
    // -------------------------------------------------------------------------

    pub fn approve_intent(env: Env, approver: Address, intent_id: u64) -> Result<(), SentinelError> {
        if storage::is_frozen(&env) {
            return Err(SentinelError::EmergencyFrozen);
        }

        approver.require_auth();

        let mut intent = storage::get_intent(&env, intent_id)?;
        if intent.status == IntentStatus::Executed || intent.status == IntentStatus::Cancelled {
            return Err(SentinelError::IntentAlreadyTerminal);
        }
        if intent.status == IntentStatus::Quarantined {
            return Err(SentinelError::IntentIsQuarantined);
        }
        let now = env.ledger().timestamp();
        if now > intent.expires_at || now > intent.observation_until {
            return Err(SentinelError::IntentExpired);
        }

        let mut is_authorized = false;
        for c in intent.cosigners.iter() {
            if c == approver {
                is_authorized = true;
                break;
            }
        }
        if !is_authorized {
            return Err(SentinelError::SignerNotAuthorized);
        }

        for vote in intent.approvals.iter() {
            if vote == approver {
                return Err(SentinelError::SignerAlreadyApproved);
            }
        }

        intent.approvals.push_back(approver);

        // Once co-signer approval is satisfied, advance status to Observing
        if intent.status == IntentStatus::AwaitingApproval {
            if intent.tier == ExecutionTier::GuardianRequired {
                if intent.approvals.len() >= 3 && intent.guardian_approvals.len() >= 1 {
                    intent.status = IntentStatus::Observing;
                }
            } else {
                intent.status = IntentStatus::Observing;
            }
        }

        storage::set_intent(&env, intent_id, &intent);
        env.events().publish((symbol_short!("approve"), intent_id), intent.approvals.len());
        Ok(())
    }

    pub fn approve_guardian(env: Env, guardian: Address, intent_id: u64) -> Result<(), SentinelError> {
        if storage::is_frozen(&env) {
            return Err(SentinelError::EmergencyFrozen);
        }

        guardian.require_auth();

        let mut intent = storage::get_intent(&env, intent_id)?;
        if intent.status == IntentStatus::Executed || intent.status == IntentStatus::Cancelled {
            return Err(SentinelError::IntentAlreadyTerminal);
        }

        if intent.guardian.as_ref() != Some(&guardian) {
            return Err(SentinelError::GuardianNotAuthorized);
        }

        for vote in intent.guardian_approvals.iter() {
            if vote == guardian {
                return Err(SentinelError::SignerAlreadyApproved);
            }
        }

        intent.guardian_approvals.push_back(guardian);

        if intent.status == IntentStatus::AwaitingApproval {
            if intent.approvals.len() >= 3 && intent.guardian_approvals.len() >= 1 {
                intent.status = IntentStatus::Observing;
            }
        }

        storage::set_intent(&env, intent_id, &intent);
        env.events().publish((symbol_short!("g_apprv"), intent_id), intent.guardian_approvals.len());
        Ok(())
    }

    // -------------------------------------------------------------------------
    // 5. ML Agent Challenges & Anti-Griefing Protection
    // -------------------------------------------------------------------------

    pub fn challenge_intent(
        env: Env,
        agent: Address,
        intent_id: u64,
        evidence_digest: BytesN<32>,
        bond_amount: i64,
    ) -> Result<(), SentinelError> {
        agent.require_auth();

        let policy = storage::get_policy(&env);
        if bond_amount < policy.min_challenge_bond {
            return Err(SentinelError::InsufficientChallengeBond);
        }

        let mut intent = storage::get_intent(&env, intent_id)?;
        if intent.status == IntentStatus::Executed || intent.status == IntentStatus::Cancelled {
            return Err(SentinelError::IntentAlreadyTerminal);
        }
        if intent.status == IntentStatus::Quarantined {
            return Err(SentinelError::ChallengeAlreadyActive);
        }

        let now = env.ledger().timestamp();
        if now > intent.expires_at {
            return Err(SentinelError::IntentExpired);
        }

        let challenge = ChallengeRecord {
            intent_id,
            agent: agent.clone(),
            evidence_digest: evidence_digest.clone(),
            bond_amount,
            timestamp: now,
            resolved: false,
        };

        storage::set_challenge(&env, intent_id, &challenge);
        intent.status = IntentStatus::Quarantined;
        storage::set_intent(&env, intent_id, &intent);

        env.events().publish((symbol_short!("quarantn"), intent_id), evidence_digest);
        Ok(())
    }

    pub fn resolve_challenge(
        env: Env,
        guardian: Address,
        intent_id: u64,
        dismiss_challenge: bool,
    ) -> Result<(), SentinelError> {
        guardian.require_auth();

        let mut intent = storage::get_intent(&env, intent_id)?;
        if intent.guardian.as_ref() != Some(&guardian) {
            return Err(SentinelError::GuardianNotAuthorized);
        }

        let mut challenge = storage::get_challenge(&env, intent_id)
            .ok_or(SentinelError::IntentNotChallenged)?;

        if challenge.resolved {
            return Err(SentinelError::IntentAlreadyTerminal);
        }

        challenge.resolved = true;
        storage::set_challenge(&env, intent_id, &challenge);

        if dismiss_challenge {
            intent.status = IntentStatus::Observing;
        } else {
            intent.status = IntentStatus::Cancelled;
            token::Client::new(&env, &intent.asset).transfer(
                &env.current_contract_address(),
                &intent.sender,
                &(intent.amount as i128),
            );
        }

        storage::set_intent(&env, intent_id, &intent);
        env.events().publish((symbol_short!("resolved"), intent_id), dismiss_challenge);
        Ok(())
    }

    // -------------------------------------------------------------------------
    // 6. Execution Settlement & Automatic Refund (Callable by Autonomous Keeper)
    // -------------------------------------------------------------------------

    pub fn execute_intent(env: Env, caller: Address, intent_id: u64) -> Result<(), SentinelError> {
        if storage::is_frozen(&env) {
            return Err(SentinelError::EmergencyFrozen);
        }

        caller.require_auth();

        let mut intent = storage::get_intent(&env, intent_id)?;
        let now = env.ledger().timestamp();

        if intent.status == IntentStatus::Executed || intent.status == IntentStatus::Cancelled {
            return Err(SentinelError::IntentAlreadyTerminal);
        }
        if intent.status == IntentStatus::Quarantined {
            return Err(SentinelError::IntentIsQuarantined);
        }

        // Auto-refund on total intent expiration
        if now > intent.expires_at {
            intent.status = IntentStatus::Cancelled;
            storage::set_intent(&env, intent_id, &intent);
            token::Client::new(&env, &intent.asset).transfer(
                &env.current_contract_address(),
                &intent.sender,
                &(intent.amount as i128),
            );
            env.events().publish((symbol_short!("refund"), intent_id), intent.sender);
            return Ok(());
        }

        // Timelock gate: Observation window must have matured
        if now < intent.observation_until {
            return Err(SentinelError::ObservationWindowActive);
        }

        // Tier Approval Verification
        if intent.tier == ExecutionTier::GuardianRequired {
            if intent.approvals.len() < 3 || intent.guardian_approvals.len() < 1 {
                intent.status = IntentStatus::Cancelled;
                storage::set_intent(&env, intent_id, &intent);
                token::Client::new(&env, &intent.asset).transfer(
                    &env.current_contract_address(),
                    &intent.sender,
                    &(intent.amount as i128),
                );
                env.events().publish((symbol_short!("refund"), intent_id), intent.sender);
                return Ok(());
            }
        } else if !intent.cosigners.is_empty() {
            let mut cosigner_satisfied = false;
            for c in intent.cosigners.iter() {
                for app in intent.approvals.iter() {
                    if c == app {
                        cosigner_satisfied = true;
                        break;
                    }
                }
            }
            if !cosigner_satisfied {
                intent.status = IntentStatus::Cancelled;
                storage::set_intent(&env, intent_id, &intent);
                token::Client::new(&env, &intent.asset).transfer(
                    &env.current_contract_address(),
                    &intent.sender,
                    &(intent.amount as i128),
                );
                env.events().publish((symbol_short!("refund"), intent_id), intent.sender);
                return Ok(());
            }
        }

        // Velocity tracking
        let policy = storage::get_policy(&env);
        let current_day_bucket = now - (now % SECONDS_PER_DAY);
        let mut velocity = storage::get_velocity(&env, &intent.asset);

        if velocity.current_window_start != current_day_bucket {
            velocity.current_window_start = current_day_bucket;
            velocity.spent_amount = 0;
        }

        let updated_spent = velocity
            .spent_amount
            .checked_add(intent.amount)
            .ok_or(SentinelError::DailyLimitExceeded)?;

        if updated_spent > policy.daily_limit {
            return Err(SentinelError::DailyLimitExceeded);
        }

        velocity.spent_amount = updated_spent;
        storage::set_velocity(&env, &intent.asset, &velocity);

        storage::update_recipient_history(&env, &intent.recipient, intent.amount, now);

        intent.status = IntentStatus::Executed;
        storage::set_intent(&env, intent_id, &intent);

        // Disburse tokens to destination recipient
        token::Client::new(&env, &intent.asset).transfer(
            &env.current_contract_address(),
            &intent.recipient,
            &(intent.amount as i128),
        );

        env.events().publish((symbol_short!("executed"), intent_id), intent.amount);
        Ok(())
    }

    pub fn cancel_intent(env: Env, caller: Address, intent_id: u64) -> Result<(), SentinelError> {
        caller.require_auth();

        let mut intent = storage::get_intent(&env, intent_id)?;
        if intent.status == IntentStatus::Executed || intent.status == IntentStatus::Cancelled {
            return Err(SentinelError::IntentAlreadyTerminal);
        }

        let is_sender = intent.sender == caller;
        let is_guardian = intent.guardian.as_ref() == Some(&caller);
        let mut is_cosigner = false;
        for c in intent.cosigners.iter() {
            if c == caller {
                is_cosigner = true;
                break;
            }
        }

        if !is_sender && !is_guardian && !is_cosigner {
            return Err(SentinelError::Unauthorized);
        }

        intent.status = IntentStatus::Cancelled;
        storage::set_intent(&env, intent_id, &intent);

        // Refund escrowed tokens back to the treasurer
        token::Client::new(&env, &intent.asset).transfer(
            &env.current_contract_address(),
            &intent.sender,
            &(intent.amount as i128),
        );

        env.events().publish((symbol_short!("cancelled"), intent_id), caller);
        Ok(())
    }

    // -------------------------------------------------------------------------
    // 7. Pure On-Chain Query Accessors
    // -------------------------------------------------------------------------

    pub fn get_total_intents(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::TotalIntentCount).unwrap_or(0)
    }

    pub fn get_intent(env: Env, intent_id: u64) -> Result<PaymentIntent, SentinelError> {
        storage::get_intent(&env, intent_id)
    }

    pub fn get_org(env: Env, wallet: Address) -> Option<OrgProfile> {
        storage::get_org_profile(&env, &wallet)
    }

    pub fn get_challenge(env: Env, intent_id: u64) -> Option<ChallengeRecord> {
        storage::get_challenge(&env, intent_id)
    }

    pub fn get_recipient_track(env: Env, recipient: Address) -> RecipientHistory {
        storage::get_recipient_history(&env, &recipient)
    }
}