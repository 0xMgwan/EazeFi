# EazeFi Soroban Smart Contracts

This directory contains the Soroban smart contracts for the EazeFi remittance platform. These contracts handle the core functionality of the platform, including remittance processing, family pool management, and token wrapping.

## Contract Overview

### Remittance Contract

The remittance contract handles the core functionality of sending money across borders. It includes features such as:

- Creating remittances with specified recipients
- Redeeming remittances using a redemption code
- Cancelling remittances (with insurance options)
- Tracking remittance status and history

### Family Pool Contract

The family pool contract enables families to create shared pools of funds for collaborative remittances. Features include:

- Creating family pools with customizable withdrawal limits
- Adding and removing members with different roles (admin, contributor, recipient)
- Contributing to family pools
- Requesting and approving withdrawals
- Managing pool balances and transaction history

### Token Wrapper Contract

The token wrapper contract manages the different tokens and currencies used in the platform. Features include:

- Registering new tokens with their metadata
- Tracking exchange rates between tokens
- Converting between different currencies
- Managing stablecoins and country-specific tokens

## Building the Contracts

To build the contracts, you need to have Rust and the Soroban CLI installed. Follow these steps:

1. Install Rust and Cargo:
   ```
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install the Soroban CLI:
   ```
   cargo install --locked soroban-cli
   ```

3. Build the contracts:
   ```
   cd /Users/macbookpro/Eaze/contracts
   cargo build --release
   ```

4. The compiled WASM files will be available in the `target/wasm32-unknown-unknown/release` directory.

## Deploying the Contracts

To deploy the contracts to the Stellar network, follow these steps:

1. Generate a Stellar account keypair:
   ```
   soroban keys generate deployer
   ```

2. Fund the account on the testnet:
   ```
   soroban keys fund deployer --network testnet
   ```

3. Deploy the remittance contract:
   ```
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/remittance.wasm \
     --source deployer \
     --network testnet
   ```

4. Deploy the family pool contract:
   ```
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/family_pool.wasm \
     --source deployer \
     --network testnet
   ```

5. Deploy the token wrapper contract:
   ```
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/token_wrapper.wasm \
     --source deployer \
     --network testnet
   ```

## Interacting with the Contracts

After deploying the contracts, you can interact with them using the Soroban CLI or through the EazeFi platform's backend services.

### Initialize the Token Wrapper Contract

```
soroban contract invoke \
  --id <token_wrapper_contract_id> \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin <admin_address> \
  --exchange_rate_oracle <oracle_address>
```

### Register a Token

```
soroban contract invoke \
  --id <token_wrapper_contract_id> \
  --source deployer \
  --network testnet \
  -- \
  register_token \
  --admin <admin_address> \
  --code "USDC" \
  --name "USD Coin" \
  --symbol "USDC" \
  --decimal 6 \
  --issuer <issuer_address> \
  --token_address <token_address> \
  --is_stablecoin true \
  --country_code "US" \
  --exchange_rate 10000
```

### Initialize the Remittance Contract

```
soroban contract invoke \
  --id <remittance_contract_id> \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin <admin_address> \
  --fee_percentage 100 \
  --insurance_percentage 50
```

### Create a Family Pool

```
soroban contract invoke \
  --id <family_pool_contract_id> \
  --source deployer \
  --network testnet \
  -- \
  create_pool \
  --creator <creator_address> \
  --name "Family Support Pool" \
  --token <token_address> \
  --withdrawal_limit 100000000 \
  --withdrawal_period "Weekly"
```

## Integration with Backend and SDEX

The EazeFi backend services interact with these contracts through the Stellar SDK. The integration is handled in the following utility files:

- `server/utils/stellar.js`: Provides utility functions for creating accounts, managing wallets, and executing contract calls.
- `server/utils/sdex.js`: Handles interactions with the Stellar Decentralized Exchange (SDEX) for token swapping and liquidity management.

### SDEX Integration

The Stellar Decentralized Exchange (SDEX) is integrated into the EazeFi platform to provide efficient currency swapping capabilities. This integration allows users to:

- Swap between different tokens with minimal slippage
- Get real-time exchange rates based on actual market conditions
- View liquidity information for trading pairs
- Access historical price data for informed decision-making

### Example: Executing a Swap on SDEX

```javascript
// Using the sdex.js utility functions
const swapResult = await sdexUtils.createMarketOrder(
  userSecret,
  'USDC', // Sell asset code
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', // Sell asset issuer
  'TZS', // Buy asset code
  'GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX', // Buy asset issuer
  '100' // Amount to sell
);
```

The SDEX integration complements the smart contracts by providing efficient market-based exchange rates and liquidity, while the smart contracts handle the business logic for remittances and family pools.

For more information on how to integrate these contracts with your application, refer to the [Soroban documentation](https://soroban.stellar.org/docs) and the [Stellar Developer Documentation](https://developers.stellar.org/docs/fundamentals-and-concepts/stellar-dex).
