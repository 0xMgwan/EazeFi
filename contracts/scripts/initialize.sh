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

# Load contract IDs from .env file
ENV_FILE="$(dirname "$0")/../.env.contracts.$NETWORK"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Contract IDs file not found: $ENV_FILE"
  echo "Please deploy the contracts first using deploy.sh"
  exit 1
fi

source "$ENV_FILE"

# Check if contract IDs are loaded
if [ -z "$REMITTANCE_CONTRACT_ID" ] || [ -z "$FAMILY_POOL_CONTRACT_ID" ] || [ -z "$TOKEN_WRAPPER_CONTRACT_ID" ]; then
  echo "Error: Contract IDs not found in $ENV_FILE"
  exit 1
fi

# Get admin public key
ADMIN_ADDRESS=$(soroban keys address "$ADMIN_KEY")

# Initialize remittance contract
echo "Initializing remittance contract..."
soroban contract invoke \
  --id "$REMITTANCE_CONTRACT_ID" \
  --source "$ADMIN_KEY" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS" \
  --fee_percentage 100 \
  --insurance_percentage 50

echo "Remittance contract initialized!"

# Initialize family pool contract
echo "Initializing family pool contract..."
soroban contract invoke \
  --id "$FAMILY_POOL_CONTRACT_ID" \
  --source "$ADMIN_KEY" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS"

echo "Family pool contract initialized!"

# Initialize token wrapper contract
echo "Initializing token wrapper contract..."
soroban contract invoke \
  --id "$TOKEN_WRAPPER_CONTRACT_ID" \
  --source "$ADMIN_KEY" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS" \
  --exchange_rate_oracle "$ADMIN_ADDRESS"

echo "Token wrapper contract initialized!"

echo "All contracts initialized successfully!"
