#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Map, String, Symbol, Vec,
};
use soroban_auth::{Identifier, Signature};

// Status of a remittance
#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum RemittanceStatus {
    Pending,
    Completed,
    Cancelled,
    Expired,
}

// Remittance data structure
#[derive(Clone)]
#[contracttype]
pub struct Remittance {
    pub id: BytesN<32>,
    pub sender: Address,
    pub recipient_phone: String,
    pub recipient_name: String,
    pub recipient_country: String,
    pub amount: i128,
    pub source_token: Address,
    pub target_token: Address,
    pub exchange_rate: i128,
    pub fee: i128,
    pub insurance: bool,
    pub insurance_fee: i128,
    pub redemption_code: String,
    pub status: RemittanceStatus,
    pub created_at: u64,
    pub completed_at: u64,
    pub notes: String,
}

// Contract storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Remittance(BytesN<32>),
    UserRemittances(Address),
    PhoneRemittances(String),
    RemittanceCount,
    FeePercentage,
    InsurancePercentage,
}

#[contract]
pub struct RemittanceContract;

#[contractimpl]
impl RemittanceContract {
    // Initialize the contract with admin address and fee settings
    pub fn initialize(env: Env, admin: Address, fee_percentage: i128, insurance_percentage: i128) {
        // Check if contract is already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        // Verify fee percentages are reasonable
        if fee_percentage > 1000 || insurance_percentage > 1000 {
            panic!("Fee percentages must be less than 10% (1000 basis points)");
        }

        // Store admin address and fee settings
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeePercentage, &fee_percentage);
        env.storage()
            .instance()
            .set(&DataKey::InsurancePercentage, &insurance_percentage);
        env.storage().instance().set(&DataKey::RemittanceCount, &0u32);
    }

    // Create a new remittance
    pub fn create_remittance(
        env: Env,
        sender: Address,
        recipient_phone: String,
        recipient_name: String,
        recipient_country: String,
        amount: i128,
        source_token: Address,
        target_token: Address,
        exchange_rate: i128,
        insurance: bool,
        redemption_code: String,
        notes: String,
    ) -> BytesN<32> {
        // Verify sender
        sender.require_auth();

        // Verify amount is positive
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Get fee percentages
        let fee_percentage = env
            .storage()
            .instance()
            .get::<_, i128>(&DataKey::FeePercentage)
            .unwrap_or(100); // Default 1%

        let insurance_percentage = env
            .storage()
            .instance()
            .get::<_, i128>(&DataKey::InsurancePercentage)
            .unwrap_or(50); // Default 0.5%

        // Calculate fees
        let fee = (amount * fee_percentage) / 10000; // Convert basis points to percentage
        let insurance_fee = if insurance {
            (amount * insurance_percentage) / 10000
        } else {
            0
        };

        // Calculate total amount to transfer
        let total_amount = amount + fee + insurance_fee;

        // Transfer tokens from sender to contract
        let token_client = token::Client::new(&env, &source_token);
        token_client.transfer(
            &sender,
            &env.current_contract_address(),
            &total_amount,
        );

        // Generate a unique ID for the remittance
        let count = env
            .storage()
            .instance()
            .get::<_, u32>(&DataKey::RemittanceCount)
            .unwrap_or(0);
        let id = env.crypto().sha256(
            &(
                sender.clone(),
                recipient_phone.clone(),
                env.ledger().timestamp(),
                count,
            )
                .into_val(&env),
        );

        // Create remittance record
        let remittance = Remittance {
            id: id.clone(),
            sender: sender.clone(),
            recipient_phone: recipient_phone.clone(),
            recipient_name,
            recipient_country,
            amount,
            source_token,
            target_token,
            exchange_rate,
            fee,
            insurance,
            insurance_fee,
            redemption_code,
            status: RemittanceStatus::Pending,
            created_at: env.ledger().timestamp(),
            completed_at: 0,
            notes,
        };

        // Store remittance data
        env.storage()
            .instance()
            .set(&DataKey::Remittance(id.clone()), &remittance);

        // Update user's remittances
        let mut user_remittances = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::UserRemittances(sender.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        user_remittances.push_back(id.clone());
        env.storage()
            .instance()
            .set(&DataKey::UserRemittances(sender), &user_remittances);

        // Update phone's remittances
        let mut phone_remittances = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::PhoneRemittances(recipient_phone.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        phone_remittances.push_back(id.clone());
        env.storage()
            .instance()
            .set(&DataKey::PhoneRemittances(recipient_phone), &phone_remittances);

        // Increment remittance count
        env.storage()
            .instance()
            .set(&DataKey::RemittanceCount, &(count + 1));

        // Return the remittance ID
        id
    }

    // Redeem a remittance
    pub fn redeem_remittance(
        env: Env,
        id: BytesN<32>,
        redemption_code: String,
        recipient: Address,
    ) -> bool {
        // Verify recipient
        recipient.require_auth();

        // Get remittance data
        let mut remittance = env
            .storage()
            .instance()
            .get::<_, Remittance>(&DataKey::Remittance(id.clone()))
            .expect("Remittance not found");

        // Check if remittance is pending
        if remittance.status != RemittanceStatus::Pending {
            panic!("Remittance is not pending");
        }

        // Verify redemption code
        if remittance.redemption_code != redemption_code {
            panic!("Invalid redemption code");
        }

        // Calculate target amount using exchange rate
        let target_amount = (remittance.amount * remittance.exchange_rate) / 10000; // Assuming exchange rate is in basis points

        // Transfer tokens to recipient
        let token_client = token::Client::new(&env, &remittance.target_token);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &target_amount,
        );

        // Update remittance status
        remittance.status = RemittanceStatus::Completed;
        remittance.completed_at = env.ledger().timestamp();
        env.storage()
            .instance()
            .set(&DataKey::Remittance(id), &remittance);

        true
    }

    // Cancel a remittance (can only be done by sender)
    pub fn cancel_remittance(env: Env, id: BytesN<32>, sender: Address) -> bool {
        // Verify sender
        sender.require_auth();

        // Get remittance data
        let mut remittance = env
            .storage()
            .instance()
            .get::<_, Remittance>(&DataKey::Remittance(id.clone()))
            .expect("Remittance not found");

        // Check if sender is authorized
        if remittance.sender != sender {
            panic!("Not authorized to cancel this remittance");
        }

        // Check if remittance is pending
        if remittance.status != RemittanceStatus::Pending {
            panic!("Remittance is not pending");
        }

        // Calculate refund amount (minus fees if insurance was not purchased)
        let refund_amount = if remittance.insurance {
            remittance.amount + remittance.fee + remittance.insurance_fee
        } else {
            remittance.amount // Fees are not refunded if no insurance
        };

        // Transfer tokens back to sender
        let token_client = token::Client::new(&env, &remittance.source_token);
        token_client.transfer(
            &env.current_contract_address(),
            &sender,
            &refund_amount,
        );

        // Update remittance status
        remittance.status = RemittanceStatus::Cancelled;
        env.storage()
            .instance()
            .set(&DataKey::Remittance(id), &remittance);

        true
    }

    // Get remittance details
    pub fn get_remittance(env: Env, id: BytesN<32>) -> Remittance {
        env.storage()
            .instance()
            .get::<_, Remittance>(&DataKey::Remittance(id))
            .expect("Remittance not found")
    }

    // Get user's remittances
    pub fn get_user_remittances(env: Env, user: Address) -> Vec<Remittance> {
        let remittance_ids = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::UserRemittances(user))
            .unwrap_or_else(|| Vec::new(&env));

        let mut remittances = Vec::new(&env);
        for id in remittance_ids.iter() {
            let remittance = env
                .storage()
                .instance()
                .get::<_, Remittance>(&DataKey::Remittance(id))
                .expect("Remittance not found");
            remittances.push_back(remittance);
        }

        remittances
    }

    // Get remittances by phone number
    pub fn get_phone_remittances(env: Env, phone: String) -> Vec<Remittance> {
        let remittance_ids = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::PhoneRemittances(phone))
            .unwrap_or_else(|| Vec::new(&env));

        let mut remittances = Vec::new(&env);
        for id in remittance_ids.iter() {
            let remittance = env
                .storage()
                .instance()
                .get::<_, Remittance>(&DataKey::Remittance(id))
                .expect("Remittance not found");
            remittances.push_back(remittance);
        }

        remittances
    }

    // Update fee percentage (admin only)
    pub fn update_fee_percentage(env: Env, admin: Address, fee_percentage: i128) {
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

        // Verify fee percentage is reasonable
        if fee_percentage > 1000 {
            panic!("Fee percentage must be less than 10% (1000 basis points)");
        }

        // Update fee percentage
        env.storage()
            .instance()
            .set(&DataKey::FeePercentage, &fee_percentage);
    }

    // Update insurance percentage (admin only)
    pub fn update_insurance_percentage(env: Env, admin: Address, insurance_percentage: i128) {
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

        // Verify insurance percentage is reasonable
        if insurance_percentage > 1000 {
            panic!("Insurance percentage must be less than 10% (1000 basis points)");
        }

        // Update insurance percentage
        env.storage()
            .instance()
            .set(&DataKey::InsurancePercentage, &insurance_percentage);
    }
}
