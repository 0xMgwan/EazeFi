#!/bin/bash

# Exit on error
set -e

# Build remittance contract
echo "Building remittance contract..."
cd "$(dirname "$0")/.."

# Ensure target directory exists
mkdir -p ./target

# Build the contract
cargo build --target wasm32-unknown-unknown --release -p remittance

# Copy the Wasm binary to the target directory
SOROBAN_WASM_PATH="target/wasm32-unknown-unknown/release/remittance.wasm"
if [ -f "$SOROBAN_WASM_PATH" ]; then
    echo "Copying Wasm binary to target directory..."
    # Copy the Wasm file to the target directory
    cp "$SOROBAN_WASM_PATH" "./target/remittance.wasm"
else
    echo "Error: Wasm binary not found at $SOROBAN_WASM_PATH"
    exit 1
fi

echo "Remittance contract built successfully!"
echo "Contract is available in the ./target/ directory"
