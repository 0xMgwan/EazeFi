#!/bin/bash

# Exit on error
set -e

# Check if network parameter is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <network> [deployer_key_name]"
  echo "Example: $0 testnet deployer"
  exit 1
fi

NETWORK=$1
DEPLOYER_KEY=${2:-deployer}

# Build contracts first
echo "Building contracts..."
"$(dirname "$0")/build.sh"

# Deploy contracts
echo "Deploying contracts to $NETWORK..."

# Deploy remittance contract
echo "Deploying remittance contract..."
REMITTANCE_ID=$(soroban contract deploy \
  --wasm ./target/remittance.wasm \
  --source "$DEPLOYER_KEY" \
  --network "$NETWORK" \
  --output json | jq -r '.id')

echo "Remittance contract deployed with ID: $REMITTANCE_ID"

# Deploy family-pool contract
echo "Deploying family-pool contract..."
FAMILY_POOL_ID=$(soroban contract deploy \
  --wasm ./target/family_pool.wasm \
  --source "$DEPLOYER_KEY" \
  --network "$NETWORK" \
  --output json | jq -r '.id')

echo "Family Pool contract deployed with ID: $FAMILY_POOL_ID"

# Deploy token-wrapper contract
echo "Deploying token-wrapper contract..."
TOKEN_WRAPPER_ID=$(soroban contract deploy \
  --wasm ./target/token_wrapper.wasm \
  --source "$DEPLOYER_KEY" \
  --network "$NETWORK" \
  --output json | jq -r '.id')

echo "Token Wrapper contract deployed with ID: $TOKEN_WRAPPER_ID"

# Save contract IDs to a file
echo "Saving contract IDs to .env.contracts.$NETWORK..."
cat > "$(dirname "$0")/../.env.contracts.$NETWORK" << EOF
REMITTANCE_CONTRACT_ID=$REMITTANCE_ID
FAMILY_POOL_CONTRACT_ID=$FAMILY_POOL_ID
TOKEN_WRAPPER_CONTRACT_ID=$TOKEN_WRAPPER_ID
EOF

echo "All contracts deployed successfully!"
echo "Contract IDs saved to .env.contracts.$NETWORK"
