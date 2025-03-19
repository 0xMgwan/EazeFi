#!/bin/bash

# Exit on error
set -e

# Build all contracts
echo "Building all contracts..."

# Build remittance contract
echo "Building remittance contract..."
cd "$(dirname "$0")/.."
cargo build --target wasm32-unknown-unknown --release -p remittance
cp target/wasm32-unknown-unknown/release/remittance.wasm ./target/

# Build family-pool contract
echo "Building family-pool contract..."
cargo build --target wasm32-unknown-unknown --release -p family-pool
cp target/wasm32-unknown-unknown/release/family_pool.wasm ./target/

# Build token-wrapper contract
echo "Building token-wrapper contract..."
cargo build --target wasm32-unknown-unknown --release -p token-wrapper
cp target/wasm32-unknown-unknown/release/token_wrapper.wasm ./target/

echo "All contracts built successfully!"
echo "Contracts are available in the ./target/ directory"
