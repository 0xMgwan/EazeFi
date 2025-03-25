#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Bytes, Env, String, Vec};
use soroban_sdk::vec;

// Status of a remittance
#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum RemittanceStatus {
    Pending,
    Completed,
    Cancelled,
}

// Simplified remittance data structure
#[derive(Clone)]
#[contracttype]
pub struct Remittance {
    pub id: BytesN<32>,
    pub sender: Address,
    pub recipient: String,
    pub amount: i128,
    pub status: RemittanceStatus,
}

// Contract storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Remittance(BytesN<32>),
    RemittanceCount,
    FeePercentage,
    UserRemittances(Address),
}

#[contract]
pub struct RemittanceContract;

#[contractimpl]
impl RemittanceContract {
    // Initialize the contract with admin address and fee settings
    pub fn initialize(env: Env, admin: Address, fee_percentage: i128) {
        // Check if contract is already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        // Verify fee percentage is reasonable
        if fee_percentage > 1000 {
            panic!("Fee percentage must be less than 10% (1000 basis points)");
        }

        // Store admin address and fee settings
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeePercentage, &fee_percentage);
        env.storage().instance().set(&DataKey::RemittanceCount, &0u32);
    }

    // Create a new remittance
    pub fn create_remittance(
        env: Env,
        sender: Address,
        recipient: String,
        amount: i128,
    ) -> BytesN<32> {
        // Verify sender
        sender.require_auth();

        // Verify amount is positive
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Get fee percentage
        let fee_percentage = env
            .storage()
            .instance()
            .get::<_, i128>(&DataKey::FeePercentage)
            .unwrap_or(100); // Default 1%

        // Calculate fee
        let fee = (amount * fee_percentage) / 10000; // Convert basis points to percentage

        // Generate a unique ID for the remittance
        let count = env
            .storage()
            .instance()
            .get::<_, u32>(&DataKey::RemittanceCount)
            .unwrap_or(0);
            
        // Generate a unique ID using the count and timestamp
        let timestamp = env.ledger().timestamp();
        let bytes = Bytes::from_slice(&env, &timestamp.to_be_bytes());
        let id = env.crypto().sha256(&bytes);
        
        
        // Increment the remittance count
        env.storage().instance().set(&DataKey::RemittanceCount, &(count + 1));

        // Create remittance record
        let remittance = Remittance {
            id: id.clone(),
            sender: sender.clone(),
            recipient: recipient.clone(),
            amount: amount,
            status: RemittanceStatus::Pending,
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
            .unwrap_or(vec![&env]);
        user_remittances.push_back(id.clone());
        env.storage()
            .instance()
            .set(&DataKey::UserRemittances(sender), &user_remittances);



        // Return the remittance ID
        id
    }

    // Complete a remittance
    pub fn complete_remittance(
        env: Env,
        id: BytesN<32>,
        admin: Address,
    ) -> bool {
        // Verify admin authorization
        admin.require_auth();
        
        // Get stored admin
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .expect("Admin not set");
            
        if admin != stored_admin {
            panic!("Only admin can complete remittances");
        }

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

        // Update remittance status
        remittance.status = RemittanceStatus::Completed;

        // Store updated remittance
        env.storage()
            .instance()
            .set(&DataKey::Remittance(id), &remittance);

        true
    }

    // Cancel a remittance
    pub fn cancel_remittance(env: Env, sender: Address, id: BytesN<32>) -> bool {
        // Verify sender
        sender.require_auth();

        // Get remittance data
        let mut remittance = env
            .storage()
            .instance()
            .get::<_, Remittance>(&DataKey::Remittance(id.clone()))
            .expect("Remittance not found");

        // Check if sender is the original sender
        if remittance.sender != sender {
            panic!("Only the sender can cancel the remittance");
        }

        // Check if remittance is pending
        if remittance.status != RemittanceStatus::Pending {
            panic!("Only pending remittances can be cancelled");
        }

        // Update remittance status
        remittance.status = RemittanceStatus::Cancelled;

        // Store updated remittance
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

        if stored_admin != admin {
            panic!("Only admin can update fee percentage");
        }

        // Verify fee percentage is reasonable
        if fee_percentage > 1000 {
            panic!("Fee percentage must be less than 10% (1000 basis points)");
        }

        // Update fee percentage
        env.storage().instance().set(&DataKey::FeePercentage, &fee_percentage);
    }


}
