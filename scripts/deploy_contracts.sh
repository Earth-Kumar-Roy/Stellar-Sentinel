#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Deploying SentinelTreasury to Testnet"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONTRACTS_DIR="${ROOT_DIR}/contracts"

NETWORK="testnet"
ADMIN_ALIAS="sentinel-admin"
DETECTOR_ALIAS="sentinel-detector"
NATIVE_TOKEN="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

# Ensure stellar CLI exists
if ! command -v stellar &> /dev/null; then
  echo "[-] Stellar CLI not found in PATH. Please install stellar-cli."
  exit 1
fi

# Multi-path search for optimized or raw WASM
CANDIDATE_PATHS=(
  "${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/sentinel_treasury.optimized.wasm"
  "${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/sentinel_treasury.wasm"
  "${CONTRACTS_DIR}/target/wasm32v1-none/release/sentinel_treasury.optimized.wasm"
  "${CONTRACTS_DIR}/target/wasm32v1-none/release/sentinel_treasury.wasm"
)

WASM_PATH=""
for path in "${CANDIDATE_PATHS[@]}"; do
  if [ -f "${path}" ]; then
    WASM_PATH="${path}"
    break
  fi
done

if [ -z "${WASM_PATH}" ]; then
  echo "[-] WASM artifact not found in target directories."
  echo "[-] Run ./scripts/build_low_ram.sh first."
  exit 1
fi

echo "[+] Using WASM file: ${WASM_PATH}"

echo "Fetching account addresses..."
ADMIN_ADDR=$(stellar keys address "${ADMIN_ALIAS}")
DETECTOR_ADDR=$(stellar keys address "${DETECTOR_ALIAS}")

echo "Admin Address:    ${ADMIN_ADDR}"
echo "Detector Address: ${DETECTOR_ADDR}"

echo "Deploying contract WASM..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "${WASM_PATH}" \
  --source "${ADMIN_ALIAS}" \
  --network "${NETWORK}")

echo "=========================================="
echo "[+] Contract Deployed Successfully!"
echo "Contract ID: ${CONTRACT_ID}"
echo "=========================================="

# Create temporary configuration payloads for initialization
POLICY_FILE=$(mktemp)
SIGNERS_FILE=$(mktemp)
AGENTS_FILE=$(mktemp)

cat <<EOF > "${POLICY_FILE}"
{
  "daily_limit": "500000000000",
  "fast_path_limit": "1000000000",
  "guardian_quorum": 1,
  "intent_ttl": 86400,
  "max_per_tx": "100000000000",
  "min_challenge_bond": "500000000",
  "observation_delay": 3600,
  "policy_version": 1,
  "quorum": 1
}
EOF

cat <<EOF > "${SIGNERS_FILE}"
["${ADMIN_ADDR}"]
EOF

cat <<EOF > "${AGENTS_FILE}"
["${DETECTOR_ADDR}"]
EOF

echo "Initializing contract state on Testnet..."
stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --source "${ADMIN_ALIAS}" \
  --network "${NETWORK}" \
  -- \
  initialize \
  --admin "${ADMIN_ADDR}" \
  --policy-file-path "${POLICY_FILE}" \
  --native_token "${NATIVE_TOKEN}" \
  --signers-file-path "${SIGNERS_FILE}" \
  --guardians-file-path "${SIGNERS_FILE}" \
  --agents-file-path "${AGENTS_FILE}"

rm -f "${POLICY_FILE}" "${SIGNERS_FILE}" "${AGENTS_FILE}"

echo "=========================================="
echo "[+] Initialization Complete!"
echo "Update CONTRACT_ID in .env and web/.env:"
echo "CONTRACT_ID=${CONTRACT_ID}"
echo "=========================================="