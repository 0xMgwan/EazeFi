# EazeFi

A Stellar-based platform that enables anyone around the world to send tokenized mobile money instantly across borders, while also allowing recipients to use those same tokens for cross-border travel or trade. Tanzania serves as our initial implementation example, but the platform is designed to work globally.

## Vision

EazeFi bridges the gap between traditional remittance services and modern blockchain technology, providing:

- **For Global Senders**: Easy conversion of any currency (USD/EUR/GBP etc.) to tokenized local currencies, redeemable via mobile money platforms or banks in the recipient's country
- **For Recipients & Travelers**: Seamless use of these tokens globally, with automatic conversion between currencies via Stellar's DEX
- **For Example**: A person in the US can send USD that converts to tokenized TZS, redeemable via M-Pesa in Tanzania, and the recipient can use those same tokens when traveling to Kenya, with automatic conversion to KES

## Key Features

- User-friendly onboarding with simple KYC
- Tokenized currencies on the Stellar blockchain
- Smart contract-secured remittances
- Cross-border currency conversion via Stellar DEX (SDEX)
- Real-time market rates and liquidity information
- Mobile money and banking integrations worldwide
- Micro-insurance for remittance delays
- Location-based automatic currency conversion
- Family pool for collaborative remittances
- Direct token swapping with minimal slippage

## Technical Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Blockchain**: Stellar network with Soroban smart contracts
- **DEX**: Stellar Decentralized Exchange (SDEX) for currency swaps
- **APIs**: Stellar SDK, Soroban SDK, M-Pesa API

## Development

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Stellar account (testnet for development)
- Optional: MongoDB for local development

### Setup

1. Clone the repository
2. Install all dependencies at once:
   ```
   npm run install-all
   ```
   Or install dependencies separately:
   ```
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` in both the server and client directories
   - Update the variables with your own values
   - For Stellar testnet, you can generate keys using [Stellar Laboratory](https://laboratory.stellar.org/)

4. Start development servers:
   ```
   # Start both client and server concurrently
   npm run dev

   # Or start them separately
   # Start client
   npm run client

   # Start server
   npm run server
   ```

### Project Structure

```
├── client/                 # React frontend
│   ├── public/             # Static files
│   ├── src/                # React source code
│   └── .env                # Client environment variables
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # API controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── .env                # Server environment variables
│   └── server.js           # Entry point
└── package.json            # Root package.json
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/payment-method` - Add or update payment method

#### Wallets
- `GET /api/wallets` - Get user's wallet
- `POST /api/wallets` - Create a new wallet
- `GET /api/wallets/balance` - Get wallet balance
- `POST /api/wallets/fund` - Fund wallet
- `POST /api/wallets/withdraw` - Withdraw from wallet

#### SDEX (Stellar Decentralized Exchange)
- `GET /api/sdex/rate` - Get exchange rate between two assets
- `GET /api/sdex/liquidity` - Get liquidity information for a trading pair
- `POST /api/sdex/swap` - Execute a swap on SDEX
- `GET /api/sdex/pairs` - Get available trading pairs
- `GET /api/sdex/history` - Get historical prices for a trading pair

#### Remittances
- `POST /api/remittances/send` - Send remittance
- `GET /api/remittances` - Get user's remittances
- `GET /api/remittances/:id` - Get remittance by ID
- `POST /api/remittances/redeem` - Redeem remittance
- `POST /api/remittances/family-pool/create` - Create a family pool
- `POST /api/remittances/family-pool/contribute` - Contribute to a family pool
- `POST /api/remittances/family-pool/withdraw` - Withdraw from a family pool

## Hackathon Project

This project is being developed for a Stellar hackathon on testnet, showcasing how blockchain technology can revolutionize global remittances and cross-border payments. While we use Tanzania as our primary example, the architecture is designed to be adaptable to any country or region worldwide.

## Smart Contracts and SDEX Integration

The EazeFi platform uses Soroban smart contracts and the Stellar Decentralized Exchange (SDEX) to handle the core functionality:

- **Remittance Contract**: Manages the sending and receiving of remittances, with features like redemption codes, insurance, and status tracking.
- **Family Pool Contract**: Enables collaborative remittances through shared pools with customizable withdrawal limits and member roles.
- **Token Wrapper Contract**: Manages different tokens and currencies, including exchange rates and conversions.
- **SDEX Integration**: Provides real-time currency swapping with optimal rates and minimal slippage, leveraging Stellar's built-in decentralized exchange for efficient cross-border transactions.

For more details on the smart contracts, see the [contracts README](/contracts/README.md).

## License

MIT
