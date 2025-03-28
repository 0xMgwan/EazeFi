# Deploying EazeFi to Vercel

This guide provides step-by-step instructions for deploying the EazeFi platform to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional for advanced configuration)
3. Git repository with your EazeFi project

## Environment Variables

Ensure you set up the following environment variables in your Vercel project:

```
# Server Configuration
NODE_ENV=production

# MongoDB Connection
MONGO_URI=your_production_mongodb_uri

# JWT Authentication
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d

# Stellar Network Configuration
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Soroban Contract IDs
REMITTANCE_CONTRACT_ID=CDCYWK73YTYFJZZSJ5V7EDFNHYBG4QN3VUNG4DQHI72HPQYQTQKBVVKL
TOKEN_WRAPPER_CONTRACT_ID=your_token_wrapper_contract_id_here
FAMILY_POOL_CONTRACT_ID=your_family_pool_contract_id_here

# M-Pesa Integration
MPESA_API_KEY=your_mpesa_api_key
MPESA_API_SECRET=your_mpesa_api_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_CALLBACK_URL=your_mpesa_callback_url

# USDC Issuer (Currently using testnet placeholder)
USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Vercel account
2. Click "Add New..." > "Project"
3. Select your EazeFi repository
4. Configure project settings:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: Leave default (it will use the vercel.json configuration)
   - Output Directory: Leave default

### 2. Configure Environment Variables

1. In the project settings, navigate to the "Environment Variables" tab
2. Add all the required environment variables listed above
3. Make sure to set `NODE_ENV` to `production`

### 3. Deploy

1. Click "Deploy"
2. Wait for the build and deployment to complete
3. Once deployed, Vercel will provide you with a URL to access your application

## Important Notes

### Soroban Smart Contracts

The EazeFi platform relies on three Soroban smart contracts deployed to the Stellar network:

1. **Remittance Contract** - Handles cross-border money transfers
   - Current Contract ID: `CDCYWK73YTYFJZZSJ5V7EDFNHYBG4QN3VUNG4DQHI72HPQYQTQKBVVKL`

2. **Family Pool Contract** - Manages collaborative remittances
   - Ensure you have deployed this contract and set the ID in environment variables

3. **Token Wrapper Contract** - Handles different tokens and currencies
   - Ensure you have deployed this contract and set the ID in environment variables

### M-Pesa Integration

The M-Pesa Soroban integration connects the Soroban remittance contract with M-Pesa's mobile money service in Tanzania. Make sure all M-Pesa environment variables are correctly set for this integration to work properly.

## Troubleshooting

If you encounter issues during deployment:

1. Check the Vercel deployment logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure your MongoDB instance is accessible from Vercel's servers
4. Check that your Soroban contracts are properly deployed and accessible

## Updating Your Deployment

To update your deployment after making changes:

1. Push your changes to the connected repository
2. Vercel will automatically trigger a new deployment
3. Monitor the deployment logs for any issues

For manual deployments or more advanced configuration, use the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd /path/to/eazefi
vercel
```
