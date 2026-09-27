#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Starting Low-RAM Soroban Contract Build"
echo "=========================================="

# Restrict Cargo to a single job and constrain memory consumption
export CARGO_BUILD_JOBS=1
export RUSTFLAGS="-C codegen-units=1 -C opt-level=z -C lto=fat"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONTRACTS_DIR="${ROOT_DIR}/contracts"

cd "${CONTRACTS_DIR}"

echo "Cleaning prior build artifacts..."
cargo clean

echo "Building WASM contract target (single-threaded)..."
cargo build \
  --target wasm32v1-none \
  --release \
  -j 1

WASM_RAW="${CONTRACTS_DIR}/target/wasm32v1-none/release/sentinel_treasury.wasm"

if [ ! -f "${WASM_RAW}" ]; then
  # Fallback check for older toolchain target naming
  WASM_RAW="${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/sentinel_treasury.wasm"
fi

if [ ! -f "${WASM_RAW}" ]; then
  echo "[-] Build failed: Output WASM binary not found."
  exit 1
fi

echo "[+] Raw WASM built: ${WASM_RAW}"

# Optimize WASM size using stellar contract optimize if available
if command -v stellar &> /dev/null; then
  echo "Optimizing WASM binary with Stellar CLI..."
  stellar contract optimize --wasm "${WASM_RAW}"
  echo "[+] WASM optimization complete."
fi

echo "=========================================="
echo " Low-RAM Contract Build Complete!"
echo "=========================================="