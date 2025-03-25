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

# Build remittance contract first
echo "Building remittance contract..."
"$(dirname "$0")/build_remittance.sh"

# Deploy remittance contract
echo "Deploying remittance contract to $NETWORK..."

echo "Deploying remittance contract..."
# Set network passphrase based on network
if [ "$NETWORK" = "testnet" ]; then
  NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
elif [ "$NETWORK" = "mainnet" ]; then
  NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
else
  NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
fi

# Use the correct Soroban CLI syntax for deploying contracts
REMITTANCE_ID=$(soroban contract deploy \
  --wasm "$(dirname "$0")/../target/remittance.wasm" \
  --source-account "$DEPLOYER_KEY" \
  --network "$NETWORK" \
  --network-passphrase "$NETWORK_PASSPHRASE")

echo "Remittance contract deployed with ID: $REMITTANCE_ID"

# Update the main .env.contracts file
ENV_CONTRACTS_FILE="$(dirname "$0")/../../.env.contracts"
if grep -q "REMITTANCE_CONTRACT_ID" "$ENV_CONTRACTS_FILE"; then
  # Update existing entry
  sed -i '' "s/REMITTANCE_CONTRACT_ID=.*/REMITTANCE_CONTRACT_ID=$REMITTANCE_ID/" "$ENV_CONTRACTS_FILE"
else
  # Add new entry
  echo "REMITTANCE_CONTRACT_ID=$REMITTANCE_ID" >> "$ENV_CONTRACTS_FILE"
fi

echo "Updated $ENV_CONTRACTS_FILE with Remittance Contract ID"
echo "Stellar Expert URL: https://stellar.expert/explorer/$NETWORK/contract/$REMITTANCE_ID"
