#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Map, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Pool(BytesN<32>),
    PoolCount,
    UserPools(Address),
}

#[contracttype]
#[derive(Clone)]
pub enum MemberRole {
    Admin,
    Contributor,
    Recipient,
}

#[contracttype]
#[derive(Clone)]
pub enum WithdrawalPeriod {
    Daily,
    Weekly,
    Monthly,
}

#[contracttype]
#[derive(Clone)]
pub struct PoolMember {
    pub address: Address,
    pub role: MemberRole,
    pub joined_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Contribution {
    pub contributor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Withdrawal {
    pub recipient: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub approved: bool,
    pub approver: Option<Address>,
}

#[contracttype]
#[derive(Clone)]
pub struct FamilyPool {
    pub id: BytesN<32>,
    pub name: String,
    pub creator: Address,
    pub token: Address,
    pub members: Vec<PoolMember>,
    pub contributions: Vec<Contribution>,
    pub withdrawals: Vec<Withdrawal>,
    pub balance: i128,
    pub withdrawal_limit: i128,
    pub withdrawal_period: WithdrawalPeriod,
    pub created_at: u64,
}

#[contract]
pub struct FamilyPoolContract;

#[contractimpl]
impl FamilyPoolContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PoolCount, &0u32);
    }

    pub fn create_pool(
        env: Env,
        creator: Address,
        name: String,
        token: Address,
        withdrawal_limit: i128,
        withdrawal_period: WithdrawalPeriod,
    ) -> BytesN<32> {
        creator.require_auth();

        // Create pool ID
        let id = env.crypto().sha256(&env.ledger().sequence().to_be_bytes());
        
        // Create creator as admin member
        let creator_member = PoolMember {
            address: creator.clone(),
            role: MemberRole::Admin,
            joined_at: env.ledger().timestamp(),
        };
        
        let members = Vec::from_array(&env, [creator_member]);
        
        // Create pool
        let pool = FamilyPool {
            id: id.clone(),
            name,
            creator: creator.clone(),
            token,
            members,
            contributions: Vec::new(&env),
            withdrawals: Vec::new(&env),
            balance: 0,
            withdrawal_limit,
            withdrawal_period,
            created_at: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Pool(id.clone()), &pool);
        
        // Increment pool count
        let count = env.storage().instance().get::<_, u32>(&DataKey::PoolCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::PoolCount, &(count + 1));
        
        // Add pool to user's pools
        let mut user_pools = env.storage().instance().get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(creator.clone())).unwrap_or(Vec::new(&env));
        user_pools.push_back(id.clone());
        env.storage().instance().set(&DataKey::UserPools(creator), &user_pools);

        id
    }

    pub fn add_member(
        env: Env,
        admin: Address,
        pool_id: BytesN<32>,
        member_address: Address,
        role: MemberRole,
    ) -> bool {
        admin.require_auth();

        let mut pool = env.storage().instance().get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone())).unwrap();
        
        // Check if admin is a pool admin
        let admin_is_pool_admin = pool.members.iter().any(|m| m.address == admin && matches!(m.role, MemberRole::Admin));
        if !admin_is_pool_admin {
            panic!("Only pool admins can add members");
        }
        
        // Check if member already exists
        if pool.members.iter().any(|m| m.address == member_address) {
            panic!("Member already exists in the pool");
        }
        
        // Add new member
        let new_member = PoolMember {
            address: member_address.clone(),
            role,
            joined_at: env.ledger().timestamp(),
        };
        
        pool.members.push_back(new_member);
        env.storage().instance().set(&DataKey::Pool(pool_id.clone()), &pool);
        
        // Add pool to user's pools
        let mut user_pools = env.storage().instance().get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(member_address.clone())).unwrap_or(Vec::new(&env));
        user_pools.push_back(pool_id.clone());
        env.storage().instance().set(&DataKey::UserPools(member_address), &user_pools);

        true
    }

    pub fn contribute(
        env: Env,
        contributor: Address,
        pool_id: BytesN<32>,
        amount: i128,
    ) -> bool {
        contributor.require_auth();

        let mut pool = env.storage().instance().get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone())).unwrap();
        
        // Check if contributor is a pool member
        if !pool.members.iter().any(|m| m.address == contributor) {
            panic!("Only pool members can contribute");
        }
        
        // Transfer tokens from contributor to contract
        let client = token::Client::new(&env, &pool.token);
        client.transfer(&contributor, &env.current_contract_address(), &amount);
        
        // Record contribution
        let contribution = Contribution {
            contributor: contributor.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };
        
        pool.contributions.push_back(contribution);
        pool.balance += amount;
        env.storage().instance().set(&DataKey::Pool(pool_id), &pool);

        true
    }

    pub fn request_withdrawal(
        env: Env,
        recipient: Address,
        pool_id: BytesN<32>,
        amount: i128,
    ) -> u32 {
        recipient.require_auth();

        let mut pool = env.storage().instance().get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone())).unwrap();
        
        // Check if recipient is a pool member
        let recipient_member = pool.members.iter().find(|m| m.address == recipient);
        if recipient_member.is_none() {
            panic!("Only pool members can request withdrawals");
        }
        
        // Check if amount is within withdrawal limit
        if amount > pool.withdrawal_limit {
            panic!("Withdrawal amount exceeds the pool's withdrawal limit");
        }
        
        // Check if pool has enough balance
        if amount > pool.balance {
            panic!("Insufficient pool balance");
        }
        
        // Create withdrawal request
        let withdrawal = Withdrawal {
            recipient: recipient.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            approved: false,
            approver: None,
        };
        
        pool.withdrawals.push_back(withdrawal);
        env.storage().instance().set(&DataKey::Pool(pool_id), &pool);

        // Return the index of the withdrawal request
        (pool.withdrawals.len() - 1) as u32
    }

    pub fn approve_withdrawal(
        env: Env,
        approver: Address,
        pool_id: BytesN<32>,
        withdrawal_index: u32,
    ) -> bool {
        approver.require_auth();

        let mut pool = env.storage().instance().get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone())).unwrap();
        
        // Check if approver is a pool admin
        let approver_is_admin = pool.members.iter().any(|m| m.address == approver && matches!(m.role, MemberRole::Admin));
        if !approver_is_admin {
            panic!("Only pool admins can approve withdrawals");
        }
        
        // Get the withdrawal request
        if withdrawal_index as usize >= pool.withdrawals.len() {
            panic!("Invalid withdrawal index");
        }
        
        let mut withdrawal = pool.withdrawals.get(withdrawal_index as u32).unwrap();
        
        if withdrawal.approved {
            panic!("Withdrawal already approved");
        }
        
        // Check if pool has enough balance
        if withdrawal.amount > pool.balance {
            panic!("Insufficient pool balance");
        }
        
        // Update withdrawal
        withdrawal.approved = true;
        withdrawal.approver = Some(approver.clone());
        pool.withdrawals.set(withdrawal_index as u32, withdrawal.clone());
        
        // Update pool balance
        pool.balance -= withdrawal.amount;
        env.storage().instance().set(&DataKey::Pool(pool_id.clone()), &pool);
        
        // Transfer tokens to recipient
        let client = token::Client::new(&env, &pool.token);
        client.transfer(&env.current_contract_address(), &withdrawal.recipient, &withdrawal.amount);

        true
    }

    pub fn get_pool(env: Env, pool_id: BytesN<32>) -> FamilyPool {
        env.storage().instance().get::<_, FamilyPool>(&DataKey::Pool(pool_id)).unwrap()
    }

    pub fn get_user_pools(env: Env, user: Address) -> Vec<BytesN<32>> {
        env.storage().instance().get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(user)).unwrap_or(Vec::new(&env))
    }

    pub fn get_pool_count(env: Env) -> u32 {
        env.storage().instance().get::<_, u32>(&DataKey::PoolCount).unwrap_or(0)
    }
}
