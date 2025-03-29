# EazeFi

A cross-border remittance platform built on Stellar that enables anyone around the world to send tokenized mobile money instantly across borders, while also allowing recipients to use those same tokens for cross-border travel or trade. Tanzania serves as our initial implementation example with users receiving funds directly to their M-Pesa accounts, however the platform is designed to work globally.

[![GitHub license](https://img.shields.io/github/license/0xMgwan/EazeFi)](https://github.com/0xMgwan/EazeFi/blob/main/LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-brightgreen)](https://stellar.org)
[![React](https://img.shields.io/badge/React-v18-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16-green)](https://nodejs.org/)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-orange)](https://soroban.stellar.org/)

## Project Overview and Problem Statement

Cross-border remittances in Africa face significant challenges:

- **High Fees**: Traditional remittance services charge 7-10% in fees
- **Slow Processing**: Transfers can take 3-5 business days
- **Limited Access**: Many rural areas lack banking infrastructure
- **Currency Volatility**: Local currencies often experience significant fluctuations
- **Lack of Interoperability**: Different mobile money systems don't easily connect across borders

EazeFi addresses these challenges by leveraging Stellar's blockchain technology and Soroban smart contracts to create a seamless, low-cost remittance solution that:

1. Reduces fees to under 1%
2. Enables near-instant settlement
3. Connects directly with popular mobile money platforms like M-Pesa
4. Provides stable tokenized local currencies
5. Creates interoperability between different payment systems

Our initial focus is on Tanzania, where remittances are a vital economic lifeline but are hampered by inefficient systems and high costs.

## Vision

EazeFi bridges the gap between traditional remittance services and modern blockchain technology, providing:

- **For Global Senders**: Easy conversion of any currency (USD/EUR/GBP etc.) to tokenized local currencies, redeemable via mobile money platforms or banks in the recipient's country
- **For Recipients & Travelers**: Seamless use of these tokens globally, with automatic conversion between currencies via Stellar's DEX
- **For Example**: A person in the US can send USD that converts to tokenized TZS, redeemable via M-Pesa in Tanzania, and the recipient can use those same tokens when traveling to Kenya, with automatic conversion to KES

## Key Features

### User Experience
- **Seamless Wallet Integration**: Connect with popular Stellar wallets including Albedo, Freighter, Lobstr, and XBull
- **Persistent Wallet Connection**: Wallet state is maintained across sessions for a seamless experience
- **Intuitive Dashboard**: Clean, modern interface showing wallet balances, transaction history, and quick actions
- **User-friendly Onboarding**: Simple KYC process with minimal friction
- **Mobile Responsive Design**: Fully responsive interface that works on all devices

### Remittance Capabilities
- **Cross-Border Transfers**: Send money globally with minimal fees and near-instant settlement
- **Tokenized Local Currencies**: Support for multiple tokenized currencies on the Stellar blockchain
- **Smart Contract Security**: Remittances secured by Soroban smart contracts
- **Family Pools**: Collaborative remittance pools for family members to contribute together
- **Transaction History**: Detailed history of all remittances with status tracking
- **SEP-31 Compliance**: Full implementation of Stellar Ecosystem Proposal 31 for standardized cross-border payments

### Financial Features
- **Real-time Exchange Rates**: Up-to-date market rates for all supported currencies
- **Stellar DEX Integration**: Cross-border currency conversion via Stellar's built-in DEX
- **Liquidity Information**: Real-time liquidity data for all trading pairs
- **Minimal Slippage**: Optimized token swapping with minimal price impact
- **Micro-insurance**: Optional coverage for remittance delays

### Technical Innovations
- **Mobile Money Integration**: Connect with popular mobile money platforms like M-Pesa
- **Banking Connections**: Link traditional bank accounts for funding and withdrawals
- **Location-based Conversion**: Automatic currency conversion based on user location
- **Secure Key Management**: Best practices for handling private keys and sensitive information
- **Testnet Development**: Built on Stellar Testnet for safe development and testing

## Technical Architecture and Implementation Details

### System Architecture

EazeFi employs a three-layer architecture:

1. **Client Layer**: React-based web application with wallet integration
2. **Server Layer**: Node.js/Express backend for API handling and business logic
3. **Blockchain Layer**: Stellar network with Soroban smart contracts

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Layer   │     │   Server Layer   │     │ Blockchain Layer│
│                 │     │                 │     │                 │
│  - React UI     │     │  - Node.js API  │     │  - Stellar      │
│  - Wallet       │◄───►│  - Business     │◄───►│  - Soroban      │
│    Integration  │     │    Logic        │     │    Contracts    │
│  - State        │     │  - M-Pesa       │     │  - TSHT Token   │
│    Management   │     │    Integration  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Smart Contract Architecture

EazeFi utilizes three primary Soroban smart contracts:

1. **Remittance Contract (ID: CDRZTAFZ5U2CJ3ICR23U2RT46I5FVPKEG3ZSA233RHISFH4QKUK2RL3A)**
   - Handles the core remittance functionality
   - Manages escrow of funds during transactions
   - Implements time-locked redemptions
   - Tracks transaction status and history

2. **Family Pool Contract (ID: CAA7DKVW5IO7OSPJ6ZJLMRUJRJ3PKMVXVT7I2AVGEEXPDGOUHZSP2ADN)**
   - Enables collaborative remittances
   - Manages multi-signature approvals
   - Implements contribution tracking
   - Handles distribution rules

3. **Token Wrapper Contract (ID: CDXEBQDKPLAAVMEYT7KSDYARPPFG4TPE5ALPYRYH4WEK2HC5QP76BUAO)**
   - Manages tokenized local currencies (e.g., TSHT)
   - Handles exchange rate updates
   - Implements token minting and burning
   - Manages token allowances

### Technical Stack

#### Frontend
- **Framework**: React.js 18 with functional components and hooks
- **State Management**: React Context API for global state (Auth, Wallet)
- **Styling**: Tailwind CSS with custom components and responsive design
- **Routing**: React Router v6 for navigation
- **Wallet Connectivity**: Custom integrations with Albedo, Freighter, Lobstr, and XBull wallets
- **UI Components**: Custom-built components with modern design principles
- **API Communication**: Axios for HTTP requests

#### Backend
- **Server**: Node.js with Express.js
- **Authentication**: JWT-based authentication system
- **API Architecture**: RESTful API design
- **Middleware**: Custom middleware for authentication, error handling, and logging
- **Environment**: Environment variable management for different deployment scenarios
- **Stellar Integration**: SEP (Stellar Ecosystem Proposal) implementations

#### Blockchain
- **Network**: Stellar Testnet (moving to Mainnet for production)
- **Smart Contracts**: Soroban smart contracts written in Rust
- **Wallet Management**: Secure key storage and transaction signing
- **Asset Handling**: Support for multiple Stellar assets and tokens
- **DEX**: Stellar Decentralized Exchange (SDEX) for currency swaps

#### External Integrations
- **Stellar SDK**: JavaScript Stellar SDK for blockchain interactions
- **Soroban SDK**: For smart contract development and deployment
- **Payment Processors**: Integration with M-Pesa API for mobile money transactionsorms
- **Banking APIs**: Connections to traditional banking systems
- **Exchange Rate APIs**: Real-time currency conversion rates

## Development

### Prerequisites

- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher (or yarn equivalent)
- **Git**: For version control
- **Stellar Account**: Testnet account for development (can be created using Stellar Laboratory)
- **Web Browser**: Chrome, Firefox, or Edge with wallet extensions installed
- **Wallet Extensions**: Freighter or Albedo for testing wallet connections
- **Optional**: MongoDB for local development if using persistent storage

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xMgwan/EazeFi.git
   cd EazeFi
   ```

2. **Install dependencies**
   
   Install all dependencies at once:
   ```bash
   npm run install-all
   ```
   
   Or install dependencies separately:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**
   
   Create and configure environment files:
   ```bash
   # For client
   cp client/.env.example client/.env
   
   # For server
   cp server/.env.example server/.env
   ```
   
   Update the variables with your own values:
   - `REACT_APP_API_URL`: URL of your backend API (default: http://localhost:5000)
   - `REACT_APP_STELLAR_NETWORK`: Stellar network to use (default: TESTNET)
   - `JWT_SECRET`: Secret key for JWT token generation
   - `STELLAR_SECRET_KEY`: Your Stellar account secret key (for server operations)
   - `STELLAR_PUBLIC_KEY`: Your Stellar account public key
   
   For Stellar testnet accounts, you can generate keys using [Stellar Laboratory](https://laboratory.stellar.org/)

4. **Start development servers**
   
   Start both client and server concurrently:
   ```bash
   npm run dev
   ```
   
   Or start them separately:
   ```bash
   # Start client (in one terminal)
   npm run client

   # Start server (in another terminal)
   npm run server
   ```

5. **Access the application**
   
   Open your browser and navigate to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Wallet Setup for Testing

1. **Install wallet extensions**:
   - [Freighter](https://freighter.app/) - A Stellar wallet browser extension
   - [Albedo](https://albedo.link/) - A web-based Stellar wallet

2. **Create testnet accounts**:
   - Use [Stellar Laboratory](https://laboratory.stellar.org/) to create testnet accounts
   - Fund your testnet account using [Stellar Friendbot](https://friendbot.stellar.org/)

3. **Connect wallet in the app**:
   - Use the "Connect Wallet" button in the application
   - Select your preferred wallet (Freighter or Albedo)
   - Authorize the connection when prompted by the wallet extension

### Project Structure

```
EazeFi/
├── client/                      # React frontend
│   ├── public/                  # Static files
│   │   ├── index.html          # HTML template
│   │   ├── favicon.ico         # Site favicon
│   │   └── assets/             # Static assets (images, fonts)
│   ├── src/                    # React source code
│   │   ├── components/         # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   │   ├── Login.js    # Login component
│   │   │   │   └── Register.js # Registration component
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── family/         # Family pool components
│   │   │   ├── layout/         # Layout components
│   │   │   │   ├── Navbar.js   # Navigation bar
│   │   │   │   └── Footer.js   # Footer component
│   │   │   ├── remittance/     # Remittance components
│   │   │   └── wallet/         # Wallet components
│   │   │       ├── Wallet.js   # Main wallet component
│   │   │       └── ConnectWalletModal.js # Wallet connection modal
│   │   ├── context/            # React context providers
│   │   │   ├── AuthContext.js  # Authentication context
│   │   │   └── WalletContext.js # Wallet context
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Main App component
│   │   └── index.js            # Entry point
│   ├── package.json            # Client dependencies
│   └── .env                    # Client environment variables
├── server/                     # Node.js backend
│   ├── config/                 # Configuration files
│   │   └── db.js               # Database configuration
│   ├── controllers/            # API controllers
│   │   ├── auth.js             # Authentication controller
│   │   ├── users.js            # User management
│   │   ├── wallets.js          # Wallet operations
│   │   └── remittances.js      # Remittance operations
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # Authentication middleware
│   │   └── error.js            # Error handling middleware
│   ├── models/                 # Data models
│   │   ├── User.js             # User model
│   │   └── Remittance.js       # Remittance model
│   ├── routes/                 # API routes
│   │   ├── api/                # API endpoints
│   │   │   ├── auth.js         # Authentication routes
│   │   │   ├── users.js        # User routes
│   │   │   ├── wallets.js      # Wallet routes
│   │   │   └── remittances.js  # Remittance routes
│   │   └── sep/                # Stellar Ecosystem Proposal routes
│   │       └── sep24.js        # SEP-24 implementation
│   ├── utils/                  # Utility functions
│   │   └── stellar.js          # Stellar network utilities
│   ├── .env                    # Server environment variables
│   └── server.js               # Entry point
├── contracts/                  # Soroban smart contracts
│   ├── remittance/             # Remittance contract
│   └── family-pool/            # Family pool contract
├── package.json                # Root package.json
└── README.md                   # Project documentation
```

### API Endpoints

#### Authentication
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/auth/register` | Register a new user | `{ name, email, password, country }` | JWT token and user data |
| `POST` | `/api/auth/login` | Login user | `{ email, password }` | JWT token and user data |
| `GET` | `/api/auth/me` | Get current user | None | User data |
| `POST` | `/api/auth/logout` | Logout user | None | Success message |
| `POST` | `/api/auth/verify-email` | Verify user email | `{ token }` | Success message |
| `POST` | `/api/auth/forgot-password` | Request password reset | `{ email }` | Success message |
| `POST` | `/api/auth/reset-password` | Reset password | `{ token, password }` | Success message |

#### Users
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/users` | Get all users (admin only) | None | Array of users |
| `GET` | `/api/users/:id` | Get user by ID | None | User data |
| `PUT` | `/api/users/:id` | Update user | `{ name, email, etc. }` | Updated user data |
| `DELETE` | `/api/users/:id` | Delete user | None | Success message |
| `PUT` | `/api/users/:id/payment-method` | Add or update payment method | `{ type, details }` | Updated user data |
| `GET` | `/api/users/:id/activity` | Get user activity | None | Activity log |
| `PUT` | `/api/users/:id/preferences` | Update user preferences | `{ preferences }` | Updated preferences |

#### Wallets
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/wallets` | Get user's wallet | None | Wallet data |
| `POST` | `/api/wallets` | Create a new wallet | `{ type, network }` | New wallet data |
| `GET` | `/api/wallets/balance` | Get wallet balance | None | Balance data |
| `POST` | `/api/wallets/fund` | Fund wallet | `{ amount, asset, source }` | Transaction data |
| `POST` | `/api/wallets/withdraw` | Withdraw from wallet | `{ amount, asset, destination }` | Transaction data |
| `GET` | `/api/wallets/transactions` | Get wallet transactions | None | Array of transactions |
| `GET` | `/api/wallets/assets` | Get supported assets | None | Array of assets |

#### SDEX (Stellar Decentralized Exchange)
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/sdex/rate` | Get exchange rate between two assets | Query: `{ from, to }` | Rate data |
| `GET` | `/api/sdex/liquidity` | Get liquidity information | Query: `{ pair }` | Liquidity data |
| `POST` | `/api/sdex/swap` | Execute a swap on SDEX | `{ from, to, amount }` | Transaction data |
| `GET` | `/api/sdex/pairs` | Get available trading pairs | None | Array of pairs |
| `GET` | `/api/sdex/history` | Get historical prices | Query: `{ pair, period }` | Historical data |
| `GET` | `/api/sdex/orderbook` | Get orderbook for a pair | Query: `{ pair }` | Orderbook data |

#### Remittances
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/remittances/send` | Send remittance | `{ recipient, amount, asset, message }` | Remittance data |
| `GET` | `/api/remittances` | Get user's remittances | None | Array of remittances |
| `GET` | `/api/remittances/:id` | Get remittance by ID | None | Remittance data |
| `POST` | `/api/remittances/redeem` | Redeem remittance | `{ id, destination }` | Transaction data |
| `GET` | `/api/remittances/stats` | Get remittance statistics | None | Statistics data |

#### SEP-31 (Cross-Border Payments API)
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/sep31/info` | Get supported currencies and fields | None | Currency information |
| `POST` | `/sep31/transactions` | Create a new cross-border payment | `{ amount, asset_code, sender_id, receiver_id, fields }` | Transaction data |
| `GET` | `/sep31/transactions/:id` | Get transaction details | None | Transaction data |
| `PATCH` | `/sep31/transactions/:id` | Update transaction information | `{ status, fields }` | Success message |
| `POST` | `/sep31/transactions/:id/process` | Process transaction with Soroban | None | Remittance ID and status |
| `POST` | `/sep31/transactions/:id/complete` | Complete transaction | `{ redeemMethod, accountNumber }` | Success message |

#### Family Pool
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/family-pool/create` | Create a family pool | `{ name, description, target }` | Pool data |
| `GET` | `/api/family-pool` | Get user's family pools | None | Array of pools |
| `GET` | `/api/family-pool/:id` | Get pool by ID | None | Pool data |
| `POST` | `/api/family-pool/:id/contribute` | Contribute to a pool | `{ amount, asset }` | Transaction data |
| `POST` | `/api/family-pool/:id/withdraw` | Withdraw from a pool | `{ amount, destination }` | Transaction data |
| `PUT` | `/api/family-pool/:id/members` | Manage pool members | `{ members, permissions }` | Updated pool data |

#### SEP (Stellar Ecosystem Proposal) Endpoints
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/sep/info` | Get SEP information | None | SEP support info |
| `GET` | `/sep24/transactions` | Get interactive transactions | Auth header | Transaction list |
| `POST` | `/sep24/transactions` | Create interactive transaction | Transaction details | Transaction info |
| `GET` | `/sep24/transaction/:id` | Get transaction by ID | None | Transaction details |
| `GET` | `/.well-known/stellar.toml` | Get Stellar TOML file | None | TOML configuration |

## Wallet Integration

EazeFi provides seamless integration with popular Stellar wallets, allowing users to connect their existing wallets or create new ones within the platform.

### Supported Wallets

- **Freighter**: Browser extension wallet for Stellar
- **Albedo**: Web-based Stellar wallet with advanced security features
- **Lobstr**: Mobile and web wallet for Stellar assets
- **XBull**: Feature-rich Stellar wallet with advanced trading capabilities

### Wallet Features

- **Persistent Connection**: Wallet connection state is maintained across sessions
- **Secure Key Management**: Private keys never leave the user's device
- **Transaction Signing**: All transactions require explicit user approval
- **Asset Management**: Support for multiple Stellar assets and tokens
- **Transaction History**: Complete record of all wallet transactions
- **Disconnection**: Easy wallet disconnection when needed

### Wallet Connection Process

1. User clicks "Connect Wallet" button in the application
2. User selects their preferred wallet provider
3. Wallet extension or interface prompts for connection approval
4. Upon approval, the wallet's public key is shared with the application
5. The application verifies the wallet and establishes a connection
6. User can now perform transactions using their connected wallet

## Other Integrations

- **Cross-Border Remittances**: Enabling instant, low-cost money transfers between countries
- **Mobile Money Integration**: Connecting blockchain with popular mobile payment systems
- **Tokenized Local Currencies**: Creating digital representations of local currencies on Stellar
- **Family Pool Collaboration**: Allowing multiple contributors to a single remittance
- **Location-Based Conversion**: Automatic currency conversion based on user location

While Tanzania serves as our primary implementation example, the architecture is designed to be adaptable to any country or region worldwide. The project continues to evolve beyond the hackathon, with ongoing development and feature enhancements.

## Smart Contracts and SDEX Integration

The EazeFi platform leverages Soroban smart contracts and the Stellar Decentralized Exchange (SDEX) to handle core functionality:

### Smart Contracts

- **Remittance Contract**: 
  - Manages the sending and receiving of remittances
  - Provides status tracking (Pending, Completed, Cancelled)
  - Handles secure transaction processing
  - Deployed on Stellar Testnet: [CDRZTAFZ5U2CJ3ICR23U2RT46I5FVPKEG3ZSA233RHISFH4QKUK2RL3A](https://stellar.expert/explorer/testnet/contract/CDRZTAFZ5U2CJ3ICR23U2RT46I5FVPKEG3ZSA233RHISFH4QKUK2RL3A)
  - Fully integrated with M-Pesa for mobile money transfers in Tanzania

- **Family Pool Contract**: 
  - Enables collaborative remittances through shared pools
  - Provides transparent contribution tracking
  - Deployed on Stellar Testnet: [CAA7DKVW5IO7OSPJ6ZJLMRUJRJ3PKMVXVT7I2AVGEEXPDGOUHZSP2ADN](https://stellar.expert/explorer/testnet/contract/CAA7DKVW5IO7OSPJ6ZJLMRUJRJ3PKMVXVT7I2AVGEEXPDGOUHZSP2ADN)
  - Currently in early development stage

- **Token Wrapper Contract**: 
  - Manages different tokens and currencies
  - Handles exchange rates and conversions
  - Deployed on Stellar Testnet: [CDXEBQDKPLAAVMEYT7KSDYARPPFG4TPE5ALPYRYH4WEK2HC5QP76BUAO](https://stellar.expert/explorer/testnet/contract/CDXEBQDKPLAAVMEYT7KSDYARPPFG4TPE5ALPYRYH4WEK2HC5QP76BUAO)
  - Supports token swapping with minimal slippage

### SDEX Integration

- **Real-time Currency Swapping**: Instant conversion between different currencies
- **Optimal Rates**: Algorithms to find the best exchange rates across all order books
- **Minimal Slippage**: Smart order routing to minimize price impact
- **Liquidity Aggregation**: Combining liquidity from multiple sources
- **Path Payments**: Executing multi-hop transactions for exotic currency pairs

For more details on the smart contracts, see the [contracts README](/contracts/README.md). All contracts have been successfully deployed to the Stellar Testnet and can be viewed on [Stellar Expert](https://stellar.expert/explorer/testnet).

## Stellar Ecosystem Proposals (SEPs)

EazeFi implements several Stellar Ecosystem Proposals (SEPs) to ensure interoperability with the broader Stellar ecosystem. SEPs are standardized protocols that enable different applications and services to work together seamlessly.

### SEP-24: Interactive Deposit and Withdrawal

Our primary implementation is SEP-24, which provides a standard API for deposit and withdrawal operations with interactive user flows. This enables:

- **Seamless Deposits**: Users can deposit funds from external sources (like mobile money or bank accounts) into their Stellar wallets
- **Easy Withdrawals**: Users can withdraw funds from their Stellar wallets to external destinations
- **Interactive Flows**: When additional information is needed, users are guided through an interactive process
- **Status Tracking**: Users can track the status of their deposit or withdrawal operations

#### SEP-24 Endpoints

| Endpoint | Description |
|----------|-------------|
| `/sep24/info` | Returns information about what currencies are supported for deposit/withdrawal |
| `/sep24/fee` | Returns the fee that would be charged for a deposit/withdrawal |
| `/sep24/transactions` | Returns a list of transactions created by the user |
| `/sep24/transaction` | Returns information about a specific transaction |

### Future SEP Implementations

We plan to implement additional SEPs in the future:

- **SEP-6**: Non-interactive deposit and withdrawal API
- **SEP-10**: Stellar Web Authentication for secure authentication
- **SEP-12**: KYC API for standardized KYC information exchange
- **SEP-31**: Cross-Border Payments API for financial institution transfers

### Integration with Smart Contracts

Our SEP implementations work in conjunction with our Soroban smart contracts:

- The SEP-24 API interacts with the Remittance Contract (ID: CDRZTAFZ5U2CJ3ICR23U2RT46I5FVPKEG3ZSA233RHISFH4QKUK2RL3A) for processing cross-border transfers
- The Token Wrapper Contract (ID: CDXEBQDKPLAAVMEYT7KSDYARPPFG4TPE5ALPYRYH4WEK2HC5QP76BUAO) handles the tokenized assets that users deposit and withdraw
- The Family Pool Contract (ID: CAA7DKVW5IO7OSPJ6ZJLMRUJRJ3PKMVXVT7I2AVGEEXPDGOUHZSP2ADN) enables collaborative remittances that can be funded through SEP-24 deposits

For more information about Stellar Ecosystem Proposals, visit the [Stellar GitHub repository](https://github.com/stellar/stellar-protocol/tree/master/ecosystem).

## Security

EazeFi implements multiple layers of security to protect user funds and data:

### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Different permission levels for users and administrators
- **Two-factor Authentication**: Optional 2FA for enhanced account security
- **Session Management**: Secure handling of user sessions with automatic timeouts

### Wallet Security
- **Client-side Key Management**: Private keys never leave the user's device
- **Transaction Signing**: All blockchain transactions require explicit user approval
- **Hardware Wallet Support**: Compatibility with hardware wallets for enhanced security
- **Wallet Connection Verification**: Ensuring wallet connections are legitimate

### Data Protection
- **Encryption**: Sensitive data is encrypted both in transit and at rest
- **Input Validation**: All user inputs are validated to prevent injection attacks
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Regular Security Audits**: Ongoing security assessments and penetration testing

## Justification for Technical Decisions and Approaches

### Why Stellar and Soroban?

We chose the Stellar blockchain and Soroban smart contracts for several key reasons:

1. **Low Transaction Costs**: Stellar's minimal fees (0.00001 XLM per operation) make it ideal for remittances, especially for small amounts common in developing markets.

2. **Fast Settlement**: Stellar's 3-5 second transaction finality enables near-instant remittances, compared to days with traditional services.

3. **Built-in DEX**: Stellar's native decentralized exchange eliminates the need for third-party exchanges, reducing complexity and costs.

4. **Multi-Asset Support**: Stellar's ability to handle custom assets made it perfect for creating tokenized local currencies like TSHT (Tanzania Shilling Token).

5. **Soroban Smart Contracts**: Soroban provides a secure, efficient environment for our remittance logic with several advantages:
   - Written in Rust for memory safety and performance
   - Deterministic execution for predictable gas costs
   - WebAssembly compilation for cross-platform compatibility
   - Strong typing system to prevent common smart contract vulnerabilities

### Why React and Node.js?

1. **Component Reusability**: React's component-based architecture allows us to build a modular UI that scales efficiently.

2. **JavaScript Ecosystem**: Using JavaScript across the stack (React frontend, Node.js backend, Stellar SDK) reduces context switching and enables code sharing.

3. **Performance**: React's virtual DOM and efficient rendering make for a responsive user experience, critical for financial applications.

4. **Developer Availability**: The widespread adoption of React and Node.js ensures a large talent pool for future development.

### M-Pesa Integration Approach

Our M-Pesa integration uses a direct API approach rather than intermediaries, which provides several benefits:

1. **Reduced Fees**: Direct integration eliminates middleman costs.

2. **Faster Processing**: Removing additional hops in the transaction flow speeds up the process.

3. **Better Error Handling**: Direct integration allows for more granular error handling and recovery.

4. **Enhanced Security**: Fewer parties involved means fewer potential security vulnerabilities.

## Team's Experience with Development on Stellar

EazeFi represents our team's first major project built on the Stellar blockchain. Based in Tanzania, our team is actively involved in the growing Stellar community in East Africa. Our journey with Stellar began through participation in local blockchain meetups and Stellar Development Foundation (SDF) educational initiatives.

Despite being new to Stellar development, our team brings diverse expertise in:

- Web and mobile application development
- Financial technology solutions for African markets
- Mobile money integration experience (particularly with M-Pesa)
- User experience design for financial applications

Our learning process involved:

1. Completing SDF's developer courses and documentation
2. Participating in Stellar community forums and discussions
3. Building small proof-of-concept applications before tackling EazeFi
4. Receiving mentorship from experienced Stellar developers

As part of the Stellar community in Tanzania, we're committed to sharing our learnings and contributing to the ecosystem's growth in East Africa.

## Development Setup

### Prerequisites

- Node.js v16 or later
- npm v8 or later
- Git
- Rust and Cargo (for Soroban contract development)
- Soroban CLI

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/0xMgwan/EazeFi.git
   cd EazeFi
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

### Deploying Soroban Contracts

1. Navigate to the contracts directory
   ```bash
   cd contracts
   ```

2. Build the contracts
   ```bash
   ./scripts/build.sh
   ```

3. Deploy to Stellar Testnet
   ```bash
   ./scripts/deploy.sh
   ```

4. Initialize contracts with required parameters
   ```bash
   ./scripts/initialize.sh
   ```

## Deployment and Testing Instructions

### Local Testing

1. Run the test suite
   ```bash
   npm test
   ```

2. Run contract tests
   ```bash
   cd contracts
   cargo test
   ```

### Testnet Deployment

EazeFi is currently deployed on Stellar Testnet. To interact with the deployed version:

1. Visit [https://eazefi.vercel.app](https://eazefi.vercel.app)
2. Connect your Stellar testnet wallet (Freighter, Albedo, etc.)
3. Fund your testnet wallet using Stellar's Friendbot if needed
4. Try sending a test remittance

### Testing Credentials

For testing the M-Pesa integration on testnet:

- **Test Phone Number**: +255747630873
- **Test M-Pesa PIN**: 1234
- **Test Recipient Name**: Mary Mwanjelwa
- **Test Country**: Tanzania

### Soroban Contract IDs

- **Remittance Contract**: CDCYWK73YTYFJZZSJ5V7EDFNHYBG4QN3VUNG4DQHI72HPQYQTQKBVVKL
- **Family Pool Contract**: (Contact team for current testnet deployment ID)
- **Token Wrapper Contract**: (Contact team for current testnet deployment ID)

### TSHT Token Details

- **Asset Code**: TSHT (Tanzania Shilling Token)
- **Issuer**: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
- **Network**: Stellar Testnet

## Contributing

We welcome contributions to the EazeFi project! Here's how you can help:

1. **Fork the Repository**: Create your own fork of the project
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Your Changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the Branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**: Submit your changes for review

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features and bug fixes
- Update documentation to reflect your changes
- Ensure all tests pass before submitting a pull request
- Keep pull requests focused on a single feature or bug fix

### Issue Reporting

If you find a bug or have a feature request, please create an issue on GitHub with the following information:

- A clear and descriptive title
- Steps to reproduce the issue (for bugs)
- Expected and actual behavior
- Screenshots or code snippets if applicable
- Any additional context that might be helpful

## License

MIT License

Copyright (c) 2025 EazeFi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
