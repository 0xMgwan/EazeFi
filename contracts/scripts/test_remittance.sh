#!/bin/bash

# Exit on error
set -e

# Check if network parameter is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <network> [sender_key_name]"
  echo "Example: $0 testnet sender"
  exit 1
fi

NETWORK=$1
SENDER_KEY=${2:-deployer}

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

# Get sender public key
SENDER_ADDRESS=$(soroban keys address "$SENDER_KEY")

# Create a test remittance
echo "Creating test remittance..."
REMITTANCE_ID=$(soroban contract invoke \
  --id "$REMITTANCE_CONTRACT_ID" \
  --source-account "$SENDER_KEY" \
  --network "$NETWORK" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- \
  create_remittance \
  --sender "$SENDER_ADDRESS" \
  --recipient "{\"string\":\"255712345678\"}" \
  --amount 1000000)

echo "Test remittance created with ID: $REMITTANCE_ID"
echo "Stellar Expert URL: https://stellar.expert/explorer/$NETWORK/contract/$REMITTANCE_CONTRACT_ID"
