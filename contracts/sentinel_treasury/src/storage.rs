use soroban_sdk::{Address, Env};
use crate::errors::SentinelError;
use crate::types::{
    ChallengeRecord, DailyVelocity, DataKey, OrgProfile, PaymentIntent, RecipientHistory, TreasuryPolicy,
};

pub fn get_default_policy() -> TreasuryPolicy {
    TreasuryPolicy {
        max_per_tx: 500_000_000_000,     // 50,000 XLM / Units
        daily_limit: 10_000_000_000_000, // 1,000,000 XLM / Units
        fast_path_limit: 1_000_000_000,  // 100 XLM / Units
        observation_delay: 600,          // Default 10 minutes (within 3m - 12h range)
        intent_ttl: 604_800,             // 7 Days
        quorum: 2,
        guardian_quorum: 1,
        min_challenge_bond: 500_000_000, // 50 XLM / Units
        policy_version: 1,
    }
}

pub fn is_frozen(env: &Env) -> bool {
    env.storage().instance().get(&DataKey::EmergencyFrozen).unwrap_or(false)
}

pub fn set_frozen(env: &Env, frozen: bool) {
    env.storage().instance().set(&DataKey::EmergencyFrozen, &frozen);
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_native_token(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::NativeToken)
}

pub fn set_native_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::NativeToken, token);
}

pub fn get_policy(env: &Env) -> TreasuryPolicy {
    env.storage()
        .instance()
        .get(&DataKey::Policy)
        .unwrap_or_else(get_default_policy)
}

pub fn set_policy(env: &Env, policy: &TreasuryPolicy) {
    env.storage().instance().set(&DataKey::Policy, policy);
}

pub fn get_next_intent_id(env: &Env) -> u64 {
    let count: u64 = env
        .storage()
        .instance()
        .get(&DataKey::TotalIntentCount)
        .unwrap_or(0);
    let next = count + 1;
    env.storage().instance().set(&DataKey::TotalIntentCount, &next);
    next
}

pub fn set_org_profile(env: &Env, wallet: &Address, profile: &OrgProfile) {
    let key = DataKey::Org(wallet.clone());
    env.storage().persistent().set(&key, profile);
}

pub fn get_org_profile(env: &Env, wallet: &Address) -> Option<OrgProfile> {
    let key = DataKey::Org(wallet.clone());
    env.storage().persistent().get(&key)
}

pub fn set_intent(env: &Env, intent_id: u64, intent: &PaymentIntent) {
    let key = DataKey::Intent(intent_id);
    env.storage().persistent().set(&key, intent);
}

pub fn get_intent(env: &Env, intent_id: u64) -> Result<PaymentIntent, SentinelError> {
    let key = DataKey::Intent(intent_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(SentinelError::IntentNotFound)
}

pub fn set_challenge(env: &Env, intent_id: u64, challenge: &ChallengeRecord) {
    let key = DataKey::Challenge(intent_id);
    env.storage().persistent().set(&key, challenge);
}

pub fn get_challenge(env: &Env, intent_id: u64) -> Option<ChallengeRecord> {
    let key = DataKey::Challenge(intent_id);
    env.storage().persistent().get(&key)
}

pub fn get_recipient_history(env: &Env, recipient: &Address) -> RecipientHistory {
    let key = DataKey::RecipientTrack(recipient.clone());
    env.storage().persistent().get(&key).unwrap_or(RecipientHistory {
        total_volume: 0,
        tx_count: 0,
        largest_tx: 0,
        first_seen: 0,
        last_seen: 0,
    })
}

pub fn update_recipient_history(env: &Env, recipient: &Address, amount: i64, now: u64) {
    let mut hist = get_recipient_history(env, recipient);
    if hist.tx_count == 0 {
        hist.first_seen = now;
    }
    hist.tx_count += 1;
    hist.last_seen = now;
    hist.total_volume = hist.total_volume.saturating_add(amount);
    if amount > hist.largest_tx {
        hist.largest_tx = amount;
    }
    let key = DataKey::RecipientTrack(recipient.clone());
    env.storage().persistent().set(&key, &hist);
}

pub fn get_velocity(env: &Env, asset: &Address) -> DailyVelocity {
    let key = DataKey::SpendingVelocity(asset.clone());
    env.storage().persistent().get(&key).unwrap_or(DailyVelocity {
        current_window_start: 0,
        spent_amount: 0,
    })
}

pub fn set_velocity(env: &Env, asset: &Address, velocity: &DailyVelocity) {
    let key = DataKey::SpendingVelocity(asset.clone());
    env.storage().persistent().set(&key, velocity);
}