#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Map, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ExchangeRateOracle,
    Token(String), // token code -> TokenInfo
    TokenByAddress(Address), // token address -> token code
    TokenList,
}

#[contracttype]
#[derive(Clone)]
pub struct TokenInfo {
    pub code: String,
    pub name: String,
    pub symbol: String,
    pub decimal: u32,
    pub issuer: Address,
    pub token_address: Address,
    pub is_stablecoin: bool,
    pub country_code: String,
    pub exchange_rate: u64, // Base rate multiplied by 10^6
}

#[contract]
pub struct TokenWrapperContract;

#[contractimpl]
impl TokenWrapperContract {
    pub fn initialize(env: Env, admin: Address, exchange_rate_oracle: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ExchangeRateOracle, &exchange_rate_oracle);
        env.storage().instance().set(&DataKey::TokenList, &Vec::<String>::new(&env));
    }

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
        exchange_rate: u64,
    ) -> bool {
        admin.require_auth();
        
        let stored_admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can register tokens");
        }
        
        // Check if token already exists
        if env.storage().instance().has(&DataKey::Token(code.clone())) {
            panic!("Token already registered");
        }
        
        // Create token info
        let token_info = TokenInfo {
            code: code.clone(),
            name,
            symbol,
            decimal,
            issuer,
            token_address: token_address.clone(),
            is_stablecoin,
            country_code,
            exchange_rate,
        };
        
        // Store token info
        env.storage().instance().set(&DataKey::Token(code.clone()), &token_info);
        env.storage().instance().set(&DataKey::TokenByAddress(token_address), &code.clone());
        
        // Add to token list
        let mut token_list = env.storage().instance().get::<_, Vec<String>>(&DataKey::TokenList).unwrap();
        token_list.push_back(code);
        env.storage().instance().set(&DataKey::TokenList, &token_list);

        true
    }

    pub fn update_token_exchange_rate(
        env: Env,
        oracle: Address,
        code: String,
        new_exchange_rate: u64,
    ) -> bool {
        oracle.require_auth();
        
        let stored_oracle = env.storage().instance().get::<_, Address>(&DataKey::ExchangeRateOracle).unwrap();
        if oracle != stored_oracle {
            panic!("Only the exchange rate oracle can update rates");
        }
        
        // Get token info
        let mut token_info = env.storage().instance().get::<_, TokenInfo>(&DataKey::Token(code.clone())).unwrap();
        
        // Update exchange rate
        token_info.exchange_rate = new_exchange_rate;
        env.storage().instance().set(&DataKey::Token(code), &token_info);

        true
    }

    pub fn get_token_info(env: Env, code: String) -> TokenInfo {
        env.storage().instance().get::<_, TokenInfo>(&DataKey::Token(code)).unwrap()
    }

    pub fn get_token_by_address(env: Env, token_address: Address) -> String {
        env.storage().instance().get::<_, String>(&DataKey::TokenByAddress(token_address)).unwrap()
    }

    pub fn get_exchange_rate(env: Env, source_code: String, dest_code: String) -> u64 {
        let source_token = env.storage().instance().get::<_, TokenInfo>(&DataKey::Token(source_code)).unwrap();
        let dest_token = env.storage().instance().get::<_, TokenInfo>(&DataKey::Token(dest_code)).unwrap();
        
        // Calculate exchange rate: source_rate / dest_rate
        (source_token.exchange_rate * 1_000_000) / dest_token.exchange_rate
    }

    pub fn get_token_list(env: Env) -> Vec<String> {
        env.storage().instance().get::<_, Vec<String>>(&DataKey::TokenList).unwrap()
    }

    pub fn update_oracle(env: Env, admin: Address, new_oracle: Address) -> bool {
        admin.require_auth();
        
        let stored_admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can update the oracle");
        }
        
        env.storage().instance().set(&DataKey::ExchangeRateOracle, &new_oracle);
        true
    }

    pub fn transfer_admin(env: Env, admin: Address, new_admin: Address) -> bool {
        admin.require_auth();
        
        let stored_admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can transfer admin rights");
        }
        
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        true
    }
}
