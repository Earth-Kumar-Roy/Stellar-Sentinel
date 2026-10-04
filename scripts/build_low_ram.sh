#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Starting Low-RAM Soroban Contract Build"
echo "=========================================="

# Restrict Cargo to a single job and constrain memory consumption
export CARGO_BUILD_JOBS=1
export CARGO_NET_GIT_FETCH_WITH_CLI=true
export RUSTFLAGS="-C codegen-units=1 -C opt-level=z -C lto=fat"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONTRACTS_DIR="${ROOT_DIR}/contracts"

cd "${CONTRACTS_DIR}"

echo "Cleaning prior build artifacts..."
cargo clean

# Standard target for Soroban contract compilation
TARGET="wasm32-unknown-unknown"

# Detect if toolchain explicitly uses wasm32v1-none
if rustup target list | grep -q "wasm32v1-none (installed)"; then
  TARGET="wasm32v1-none"
fi

echo "Building WASM contract target (${TARGET}, single-threaded)..."
cargo build \
  --target "${TARGET}" \
  --release \
  -j 1

WASM_RAW="${CONTRACTS_DIR}/target/${TARGET}/release/sentinel_treasury.wasm"

# Fallback check
if [ ! -f "${WASM_RAW}" ]; then
  WASM_RAW="${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/sentinel_treasury.wasm"
fi

if [ ! -f "${WASM_RAW}" ]; then
  echo "[-] Build failed: Output WASM binary not found at ${WASM_RAW}"
  exit 1
fi

echo "[+] Raw WASM built: ${WASM_RAW}"

# Optimize WASM size using Stellar CLI
if command -v stellar &> /dev/null; then
  echo "Optimizing WASM binary with Stellar CLI..."
  stellar contract optimize --wasm "${WASM_RAW}"
  echo "[+] WASM optimization complete."
else
  echo "[!] Warning: 'stellar' CLI not found. Skipping optimization pass."
fi

echo "=========================================="
echo " Low-RAM Contract Build Complete!"
echo "=========================================="