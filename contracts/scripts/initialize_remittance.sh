#!/bin/bash

# Exit on error
set -e

# Check if network parameter is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <network> [admin_key_name]"
  echo "Example: $0 testnet admin"
  exit 1
fi

NETWORK=$1
ADMIN_KEY=${2:-admin}

# Load contract IDs from .env.contracts file
ENV_CONTRACTS_FILE="$(dirname "$0")/../../.env.contracts"
if [ ! -f "$ENV_CONTRACTS_FILE" ]; then
  echo "Error: $ENV_CONTRACTS_FILE not found!"
  exit 1
fi

# Extract contract ID
REMITTANCE_CONTRACT_ID=$(grep REMITTANCE_CONTRACT_ID "$ENV_CONTRACTS_FILE" | cut -d '=' -f2)

# Check if contract IDs are loaded
if [ -z "$REMITTANCE_CONTRACT_ID" ]; then
  echo "Error: Remittance Contract ID not found in $ENV_CONTRACTS_FILE"
  exit 1
fi

# Set network passphrase based on network
if [ "$NETWORK" = "testnet" ]; then
  NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
elif [ "$NETWORK" = "mainnet" ]; then
  NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
else
  NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
fi

# Get admin public key
ADMIN_ADDRESS=$(soroban keys address "$ADMIN_KEY")

# Initialize remittance contract
echo "Initializing remittance contract..."
soroban contract invoke \
  --id "$REMITTANCE_CONTRACT_ID" \
  --source-account "$ADMIN_KEY" \
  --network "$NETWORK" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS" \
  --fee_percentage 100

echo "Remittance Contract initialized successfully!"
echo "Stellar Expert URL: https://stellar.expert/explorer/$NETWORK/contract/$REMITTANCE_CONTRACT_ID"
