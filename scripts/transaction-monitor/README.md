# EazeFi Transaction Monitor

This service monitors the Stellar network for EazeFi remittance transactions and automatically issues TSHT tokens to recipients based on the XLM amount and exchange rate.

## How It Works

1. The monitor watches for transactions with the memo prefix `EazeFi:` on the Stellar testnet
2. When a matching transaction is found, it:
   - Extracts the recipient address and XLM amount
   - Calculates the equivalent TSHT amount using the configured exchange rate
   - Issues TSHT tokens directly to the recipient
   - Records the transaction in a local history file

## Setup

### Prerequisites

- Node.js (v14 or higher)
- A funded Stellar account with the TSHT issuer secret key

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure the issuer secret key:
   ```
   export ISSUER_SECRET=S...
   ```

### Running the Monitor

Start the monitor:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## Configuration

Edit the config object in `monitor.js` to customize:

- Network settings (testnet/mainnet)
- TSHT token details
- Exchange rate
- Remittance contract ID
- Monitoring preferences

## Security Notes

- **NEVER commit your issuer secret key to version control**
- Always use environment variables for sensitive information
- The issuer account must have sufficient XLM for transaction fees
- The issuer account must be authorized to issue TSHT tokens

## For Hackathon Demo

For a hackathon demo, you can:

1. Run this monitor on your local machine
2. Send test transactions from the EazeFi frontend
3. Verify that recipients receive TSHT tokens in their wallet

## Troubleshooting

- Check the console logs for detailed error messages
- Verify that the issuer account has sufficient XLM balance
- Ensure recipients have established a trustline for TSHT tokens
