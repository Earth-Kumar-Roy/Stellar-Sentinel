#![cfg(test)]

use super::*;
use crate::contract::SentinelTreasuryClient;
use crate::errors::SentinelError;
use crate::types::{ExecutionTier, IntentStatus, TreasuryPolicy};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, BytesN, Env, Vec,
};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> token::Client<'a> {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    token::Client::new(e, &sac.address())
}

struct TestSetup<'a> {
    env: Env,
    client: SentinelTreasuryClient<'a>,
    contract_id: Address,
    admin: Address,
    signer: Address,
    guardian: Address,
    recipient: Address,
    native_token: token::Client<'a>,
    usdc_token: token::Client<'a>,
}

fn setup_test<'a>() -> TestSetup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SentinelTreasury, ());
    let client = SentinelTreasuryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let signer = Address::generate(&env);
    let guardian = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let native_token = create_token_contract(&env, &token_admin);
    let usdc_token = create_token_contract(&env, &token_admin);

    client.initialize(&admin);
    client.set_native_token(&admin, &native_token.address);

    // Mint balances
    let native_admin_client = token::StellarAssetClient::new(&env, &native_token.address);
    native_admin_client.mint(&signer, &200_000_000_000); // 20,000 XLM
    native_admin_client.mint(&contract_id, &100_000_000_000);

    let usdc_admin_client = token::StellarAssetClient::new(&env, &usdc_token.address);
    usdc_admin_client.mint(&signer, &200_000_000_000); // 20,000 USDC
    usdc_admin_client.mint(&contract_id, &100_000_000_000);

    TestSetup {
        env,
        client,
        contract_id,
        admin,
        signer,
        guardian,
        recipient,
        native_token,
        usdc_token,
    }
}

#[test]
fn test_immediate_escrow_and_configurable_timelock() {
    let setup = setup_test();
    let env = setup.env;
    let client = setup.client;

    let purpose_hash = BytesN::from_array(&env, &[5u8; 32]);
    let amount = 1_000_000_000; // 100 units
    let custom_delay = 300; // 5 minutes

    let signer_balance_before = setup.native_token.balance(&setup.signer);

    let cosigners = Vec::new(&env);
    let guardian_vec = Vec::new(&env);

    let intent_id = client.create_intent(
        &setup.signer,
        &setup.recipient,
        &cosigners,
        &guardian_vec,
        &setup.native_token.address,
        &amount,
        &purpose_hash,
        &custom_delay,
    );

    let intent = client.get_intent(&intent_id);
    assert_eq!(intent.amount, amount);
    assert_eq!(setup.native_token.balance(&setup.signer), signer_balance_before - amount);

    let res = client.try_execute_intent(&setup.signer, &intent_id);
    assert_eq!(res.unwrap_err().unwrap(), SentinelError::ObservationWindowActive);

    env.ledger().set_timestamp(env.ledger().timestamp() + 301);

    client.execute_intent(&setup.signer, &intent_id);
    let updated = client.get_intent(&intent_id);
    assert_eq!(updated.status, IntentStatus::Executed);
    assert_eq!(setup.native_token.balance(&setup.recipient), amount);
}

#[test]
fn test_cancellation_and_auto_refund() {
    let setup = setup_test();
    let env = setup.env;
    let client = setup.client;

    let purpose_hash = BytesN::from_array(&env, &[6u8; 32]);
    let amount = 2_000_000_000; // 200 units
    let signer_balance_before = setup.native_token.balance(&setup.signer);

    let intent_id = client.create_intent(
        &setup.signer,
        &setup.recipient,
        &Vec::new(&env),
        &Vec::new(&env),
        &setup.native_token.address,
        &amount,
        &purpose_hash,
        &600,
    );

    assert_eq!(setup.native_token.balance(&setup.signer), signer_balance_before - amount);

    client.cancel_intent(&setup.signer, &intent_id);

    let intent = client.get_intent(&intent_id);
    assert_eq!(intent.status, IntentStatus::Cancelled);
    assert_eq!(setup.native_token.balance(&setup.signer), signer_balance_before);
}

#[test]
fn test_path_a_asset_threshold_differentiation() {
    let setup = setup_test();
    let env = setup.env;
    let client = setup.client;

    let purpose_hash = BytesN::from_array(&env, &[7u8; 32]);
    let amount_over_5k = 60_000_000_000; // 6,000 units (> 5,000 limit)

    // 1. Native XLM without co-signer must be rejected with CosignerRequired
    let res_native = client.try_create_intent(
        &setup.signer,
        &setup.recipient,
        &Vec::new(&env),
        &Vec::new(&env),
        &setup.native_token.address,
        &amount_over_5k,
        &purpose_hash,
        &300,
    );
    assert_eq!(res_native.unwrap_err().unwrap(), SentinelError::CosignerRequired);

    // 2. Stablecoin (USDC) with same amount (6,000 USDC) and 0 co-signers must succeed on FastPath
    let intent_id_usdc = client.create_intent(
        &setup.signer,
        &setup.recipient,
        &Vec::new(&env),
        &Vec::new(&env),
        &setup.usdc_token.address,
        &amount_over_5k,
        &purpose_hash,
        &300,
    );

    let intent_usdc = client.get_intent(&intent_id_usdc);
    assert_eq!(intent_usdc.tier, ExecutionTier::FastPath);
    assert_eq!(intent_usdc.status, IntentStatus::Observing);
}