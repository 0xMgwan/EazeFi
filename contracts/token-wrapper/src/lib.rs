#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Map, String, Symbol, Vec,
};
use soroban_auth::{Identifier, Signature};

// Token data structure
#[derive(Clone)]
#[contracttype]
pub struct TokenInfo {
    pub code: String,
    pub name: String,
    pub symbol: String,
    pub decimal: u32,
    pub issuer: Address,
    pub token_address: Address,
    pub is_stablecoin: bool,
    pub country_code: String,
    pub exchange_rate: i128, // Exchange rate to USD in basis points (1 USD = 10000)
    pub created_at: u64,
}

// Contract storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Token(String), // By token code
    TokenBySymbol(String), // By token symbol
    TokenByCountry(String), // By country code
    TokenList,
    ExchangeRateOracle,
}

#[contract]
pub struct TokenWrapperContract;

#[contractimpl]
impl TokenWrapperContract {
    // Initialize the contract with admin address
    pub fn initialize(env: Env, admin: Address, exchange_rate_oracle: Address) {
        // Check if contract is already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        // Store admin address
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ExchangeRateOracle, &exchange_rate_oracle);
        env.storage().instance().set(&DataKey::TokenList, &Vec::<String>::new(&env));
    }

    // Register a new token
    pub fn register_token(
        env: Env,
        admin: Address,
        code: String,
        name: String,
        symbol: String,
        decimal: u32,
        issuer: Address,
        token_address: Address,
        is_stablecoin: bool,
        country_code: String,
        exchange_rate: i128,
    ) -> bool {
        // Verify admin
        admin.require_auth();

        // Check if caller is admin
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .expect("Contract not initialized");

        if admin != stored_admin {
            panic!("Not authorized");
        }

        // Check if token already exists
        if env.storage().instance().has(&DataKey::Token(code.clone())) {
            panic!("Token already registered");
        }

        // Create token info
        let token_info = TokenInfo {
            code: code.clone(),
            name,
            symbol: symbol.clone(),
            decimal,
            issuer,
            token_address,
            is_stablecoin,
            country_code: country_code.clone(),
            exchange_rate,
            created_at: env.ledger().timestamp(),
        };

        // Store token info
        env.storage()
            .instance()
            .set(&DataKey::Token(code.clone()), &token_info);
        env.storage()
            .instance()
            .set(&DataKey::TokenBySymbol(symbol), &code.clone());
        env.storage()
            .instance()
            .set(&DataKey::TokenByCountry(country_code), &code.clone());

        // Update token list
        let mut token_list = env
            .storage()
            .instance()
            .get::<_, Vec<String>>(&DataKey::TokenList)
            .expect("Token list not found");
        token_list.push_back(code);
        env.storage()
            .instance()
            .set(&DataKey::TokenList, &token_list);

        true
    }

    // Update token exchange rate
    pub fn update_exchange_rate(
        env: Env,
        oracle: Address,
        code: String,
        new_exchange_rate: i128,
    ) -> bool {
        // Verify oracle
        oracle.require_auth();

        // Check if caller is oracle
        let stored_oracle = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::ExchangeRateOracle)
            .expect("Contract not initialized");

        if oracle != stored_oracle {
            panic!("Not authorized");
        }

        // Get token info
        let mut token_info = env
            .storage()
            .instance()
            .get::<_, TokenInfo>(&DataKey::Token(code.clone()))
            .expect("Token not found");

        // Update exchange rate
        token_info.exchange_rate = new_exchange_rate;
        env.storage()
            .instance()
            .set(&DataKey::Token(code), &token_info);

        true
    }

    // Get token info by code
    pub fn get_token_by_code(env: Env, code: String) -> TokenInfo {
        env.storage()
            .instance()
            .get::<_, TokenInfo>(&DataKey::Token(code))
            .expect("Token not found")
    }

    // Get token info by symbol
    pub fn get_token_by_symbol(env: Env, symbol: String) -> TokenInfo {
        let code = env
            .storage()
            .instance()
            .get::<_, String>(&DataKey::TokenBySymbol(symbol))
            .expect("Symbol not found");

        env.storage()
            .instance()
            .get::<_, TokenInfo>(&DataKey::Token(code))
            .expect("Token not found")
    }

    // Get token info by country
    pub fn get_token_by_country(env: Env, country_code: String) -> TokenInfo {
        let code = env
            .storage()
            .instance()
            .get::<_, String>(&DataKey::TokenByCountry(country_code))
            .expect("Country not found");

        env.storage()
            .instance()
            .get::<_, TokenInfo>(&DataKey::Token(code))
            .expect("Token not found")
    }

    // Get all tokens
    pub fn get_all_tokens(env: Env) -> Vec<TokenInfo> {
        let token_list = env
            .storage()
            .instance()
            .get::<_, Vec<String>>(&DataKey::TokenList)
            .expect("Token list not found");

        let mut tokens = Vec::new(&env);
        for code in token_list.iter() {
            let token_info = env
                .storage()
                .instance()
                .get::<_, TokenInfo>(&DataKey::Token(code))
                .expect("Token not found");
            tokens.push_back(token_info);
        }

        tokens
    }

    // Get stablecoins
    pub fn get_stablecoins(env: Env) -> Vec<TokenInfo> {
        let token_list = env
            .storage()
            .instance()
            .get::<_, Vec<String>>(&DataKey::TokenList)
            .expect("Token list not found");

        let mut stablecoins = Vec::new(&env);
        for code in token_list.iter() {
            let token_info = env
                .storage()
                .instance()
                .get::<_, TokenInfo>(&DataKey::Token(code))
                .expect("Token not found");
            
            if token_info.is_stablecoin {
                stablecoins.push_back(token_info);
            }
        }

        stablecoins
    }

    // Calculate exchange rate between two tokens
    pub fn calculate_exchange_rate(
        env: Env,
        from_token: String,
        to_token: String,
        amount: i128,
    ) -> i128 {
        // Get token info
        let from_token_info = env
            .storage()
            .instance()
            .get::<_, TokenInfo>(&DataKey::Token(from_token))
            .expect("From token not found");

        let to_token_info = env
            .storage()
            .instance()
            .get::<_, TokenInfo>(&DataKey::Token(to_token))
            .expect("To token not found");

        // Calculate exchange rate
        // First convert from token to USD, then from USD to target token
        let usd_amount = (amount * 10000) / from_token_info.exchange_rate;
        let target_amount = (usd_amount * to_token_info.exchange_rate) / 10000;

        target_amount
    }

    // Update oracle address
    pub fn update_oracle(env: Env, admin: Address, new_oracle: Address) -> bool {
        // Verify admin
        admin.require_auth();

        // Check if caller is admin
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .expect("Contract not initialized");

        if admin != stored_admin {
            panic!("Not authorized");
        }

        // Update oracle address
        env.storage()
            .instance()
            .set(&DataKey::ExchangeRateOracle, &new_oracle);

        true
    }
}
