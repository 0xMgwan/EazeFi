#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Map, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Remittance(BytesN<32>),
    RemittanceCount,
    FeePercentage,
    InsurancePercentage,
}

#[contracttype]
#[derive(Clone)]
pub enum RemittanceStatus {
    Pending,
    Completed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Remittance {
    pub id: BytesN<32>,
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub token: Address,
    pub status: RemittanceStatus,
    pub redemption_code: BytesN<32>,
    pub created_at: u64,
    pub completed_at: Option<u64>,
    pub insurance: bool,
}

#[contract]
pub struct RemittanceContract;

#[contractimpl]
impl RemittanceContract {
    pub fn initialize(env: Env, admin: Address, fee_percentage: u32, insurance_percentage: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeePercentage, &fee_percentage);
        env.storage().instance().set(&DataKey::InsurancePercentage, &insurance_percentage);
        env.storage().instance().set(&DataKey::RemittanceCount, &0u32);
    }

    pub fn create_remittance(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
        token: Address,
        redemption_code: BytesN<32>,
        insurance: bool,
    ) -> BytesN<32> {
        sender.require_auth();

        let fee_percentage = env.storage().instance().get::<_, u32>(&DataKey::FeePercentage).unwrap();
        let fee_amount = (amount * fee_percentage as i128) / 10000;
        let total_amount = amount + if insurance { 
            let insurance_percentage = env.storage().instance().get::<_, u32>(&DataKey::InsurancePercentage).unwrap();
            (amount * insurance_percentage as i128) / 10000 
        } else { 
            0 
        };

        // Transfer tokens from sender to contract
        let client = token::Client::new(&env, &token);
        client.transfer(&sender, &env.current_contract_address(), &total_amount);

        // Create remittance
        let id = env.crypto().sha256(&env.ledger().sequence().to_be_bytes());
        let remittance = Remittance {
            id: id.clone(),
            sender: sender.clone(),
            recipient: recipient.clone(),
            amount,
            token: token.clone(),
            status: RemittanceStatus::Pending,
            redemption_code,
            created_at: env.ledger().timestamp(),
            completed_at: None,
            insurance,
        };

        env.storage().instance().set(&DataKey::Remittance(id.clone()), &remittance);
        
        // Increment remittance count
        let count = env.storage().instance().get::<_, u32>(&DataKey::RemittanceCount).unwrap();
        env.storage().instance().set(&DataKey::RemittanceCount, &(count + 1));

        id
    }

    pub fn redeem_remittance(
        env: Env,
        recipient: Address,
        remittance_id: BytesN<32>,
        redemption_code: BytesN<32>,
    ) -> bool {
        recipient.require_auth();

        let mut remittance = env.storage().instance().get::<_, Remittance>(&DataKey::Remittance(remittance_id.clone())).unwrap();
        
        if remittance.status != RemittanceStatus::Pending {
            panic!("Remittance is not pending");
        }

        if remittance.recipient != recipient {
            panic!("Not the intended recipient");
        }

        if remittance.redemption_code != redemption_code {
            panic!("Invalid redemption code");
        }

        // Update remittance status
        remittance.status = RemittanceStatus::Completed;
        remittance.completed_at = Some(env.ledger().timestamp());
        env.storage().instance().set(&DataKey::Remittance(remittance_id.clone()), &remittance);

        // Transfer tokens to recipient
        let client = token::Client::new(&env, &remittance.token);
        client.transfer(&env.current_contract_address(), &recipient, &remittance.amount);

        true
    }

    pub fn cancel_remittance(env: Env, sender: Address, remittance_id: BytesN<32>) -> bool {
        sender.require_auth();

        let mut remittance = env.storage().instance().get::<_, Remittance>(&DataKey::Remittance(remittance_id.clone())).unwrap();
        
        if remittance.status != RemittanceStatus::Pending {
            panic!("Remittance is not pending");
        }

        if remittance.sender != sender {
            panic!("Not the sender of this remittance");
        }

        // Update remittance status
        remittance.status = RemittanceStatus::Cancelled;
        env.storage().instance().set(&DataKey::Remittance(remittance_id.clone()), &remittance);

        // Calculate refund amount (if insured, full refund; otherwise, minus fees)
        let refund_amount = if remittance.insurance {
            remittance.amount
        } else {
            let fee_percentage = env.storage().instance().get::<_, u32>(&DataKey::FeePercentage).unwrap();
            let fee_amount = (remittance.amount * fee_percentage as i128) / 10000;
            remittance.amount - fee_amount
        };

        // Transfer tokens back to sender
        let client = token::Client::new(&env, &remittance.token);
        client.transfer(&env.current_contract_address(), &sender, &refund_amount);

        true
    }

    pub fn get_remittance(env: Env, remittance_id: BytesN<32>) -> Remittance {
        env.storage().instance().get::<_, Remittance>(&DataKey::Remittance(remittance_id)).unwrap()
    }

    pub fn get_remittance_count(env: Env) -> u32 {
        env.storage().instance().get::<_, u32>(&DataKey::RemittanceCount).unwrap_or(0)
    }

    pub fn update_fee_percentage(env: Env, admin: Address, fee_percentage: u32) {
        admin.require_auth();
        let stored_admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can update fee percentage");
        }
        env.storage().instance().set(&DataKey::FeePercentage, &fee_percentage);
    }

    pub fn update_insurance_percentage(env: Env, admin: Address, insurance_percentage: u32) {
        admin.require_auth();
        let stored_admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can update insurance percentage");
        }
        env.storage().instance().set(&DataKey::InsurancePercentage, &insurance_percentage);
    }
}
