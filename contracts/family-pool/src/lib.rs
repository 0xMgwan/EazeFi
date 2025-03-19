#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Map, String, Symbol, Vec,
};
use soroban_auth::{Identifier, Signature};

// Member role in the family pool
#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum MemberRole {
    Admin,
    Contributor,
    Recipient,
}

// Status of a withdrawal
#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum WithdrawalStatus {
    Pending,
    Approved,
    Rejected,
    Completed,
}

// Withdrawal period for limits
#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum WithdrawalPeriod {
    Daily,
    Weekly,
    Monthly,
}

// Member data structure
#[derive(Clone)]
#[contracttype]
pub struct Member {
    pub address: Address,
    pub role: MemberRole,
    pub added_at: u64,
}

// Contribution data structure
#[derive(Clone)]
#[contracttype]
pub struct Contribution {
    pub id: BytesN<32>,
    pub contributor: Address,
    pub amount: i128,
    pub token: Address,
    pub created_at: u64,
}

// Withdrawal data structure
#[derive(Clone)]
#[contracttype]
pub struct Withdrawal {
    pub id: BytesN<32>,
    pub requester: Address,
    pub recipient: Address,
    pub amount: i128,
    pub token: Address,
    pub status: WithdrawalStatus,
    pub created_at: u64,
    pub completed_at: u64,
}

// Family Pool data structure
#[derive(Clone)]
#[contracttype]
pub struct FamilyPool {
    pub id: BytesN<32>,
    pub name: String,
    pub creator: Address,
    pub token: Address,
    pub balance: i128,
    pub withdrawal_limit: i128,
    pub withdrawal_period: WithdrawalPeriod,
    pub created_at: u64,
}

// Contract storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Pool(BytesN<32>),
    PoolMembers(BytesN<32>),
    PoolContributions(BytesN<32>),
    PoolWithdrawals(BytesN<32>),
    UserPools(Address),
    PoolCount,
}

#[contract]
pub struct FamilyPoolContract;

#[contractimpl]
impl FamilyPoolContract {
    // Create a new family pool
    pub fn create_pool(
        env: Env,
        creator: Address,
        name: String,
        token: Address,
        withdrawal_limit: i128,
        withdrawal_period: WithdrawalPeriod,
    ) -> BytesN<32> {
        // Verify creator
        creator.require_auth();

        // Verify withdrawal limit is positive
        if withdrawal_limit <= 0 {
            panic!("Withdrawal limit must be positive");
        }

        // Generate a unique ID for the pool
        let count = env
            .storage()
            .instance()
            .get::<_, u32>(&DataKey::PoolCount)
            .unwrap_or(0);
        let id = env.crypto().sha256(
            &(
                creator.clone(),
                name.clone(),
                env.ledger().timestamp(),
                count,
            )
                .into_val(&env),
        );

        // Create pool record
        let pool = FamilyPool {
            id: id.clone(),
            name,
            creator: creator.clone(),
            token,
            balance: 0,
            withdrawal_limit,
            withdrawal_period,
            created_at: env.ledger().timestamp(),
        };

        // Store pool data
        env.storage().instance().set(&DataKey::Pool(id.clone()), &pool);

        // Initialize members with creator as admin
        let members = Vec::from_array(
            &env,
            [Member {
                address: creator.clone(),
                role: MemberRole::Admin,
                added_at: env.ledger().timestamp(),
            }],
        );
        env.storage()
            .instance()
            .set(&DataKey::PoolMembers(id.clone()), &members);

        // Initialize empty contributions and withdrawals
        env.storage()
            .instance()
            .set(&DataKey::PoolContributions(id.clone()), &Vec::<Contribution>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::PoolWithdrawals(id.clone()), &Vec::<Withdrawal>::new(&env));

        // Update user's pools
        let mut user_pools = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(creator.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        user_pools.push_back(id.clone());
        env.storage()
            .instance()
            .set(&DataKey::UserPools(creator), &user_pools);

        // Increment pool count
        env.storage()
            .instance()
            .set(&DataKey::PoolCount, &(count + 1));

        // Return the pool ID
        id
    }

    // Add a member to the pool
    pub fn add_member(
        env: Env,
        pool_id: BytesN<32>,
        admin: Address,
        new_member: Address,
        role: MemberRole,
    ) -> bool {
        // Verify admin
        admin.require_auth();

        // Get pool data
        let pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Get members
        let mut members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if admin is authorized
        let admin_is_authorized = members.iter().any(|m| m.address == admin && m.role == MemberRole::Admin);
        if !admin_is_authorized {
            panic!("Not authorized to add members");
        }

        // Check if member already exists
        if members.iter().any(|m| m.address == new_member) {
            panic!("Member already exists");
        }

        // Add new member
        members.push_back(Member {
            address: new_member.clone(),
            role,
            added_at: env.ledger().timestamp(),
        });
        env.storage()
            .instance()
            .set(&DataKey::PoolMembers(pool_id.clone()), &members);

        // Update user's pools if they're not already in another pool
        if role != MemberRole::Recipient {
            let mut user_pools = env
                .storage()
                .instance()
                .get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(new_member.clone()))
                .unwrap_or_else(|| Vec::new(&env));
            
            if !user_pools.iter().any(|p| *p == pool_id) {
                user_pools.push_back(pool_id.clone());
                env.storage()
                    .instance()
                    .set(&DataKey::UserPools(new_member), &user_pools);
            }
        }

        true
    }

    // Remove a member from the pool
    pub fn remove_member(
        env: Env,
        pool_id: BytesN<32>,
        admin: Address,
        member_to_remove: Address,
    ) -> bool {
        // Verify admin
        admin.require_auth();

        // Get pool data
        let pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Get members
        let mut members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if admin is authorized
        let admin_is_authorized = members.iter().any(|m| m.address == admin && m.role == MemberRole::Admin);
        if !admin_is_authorized {
            panic!("Not authorized to remove members");
        }

        // Cannot remove the creator/original admin
        if member_to_remove == pool.creator {
            panic!("Cannot remove the pool creator");
        }

        // Find and remove the member
        let initial_len = members.len();
        members = members
            .iter()
            .filter(|m| m.address != member_to_remove)
            .cloned()
            .collect(&env);

        if members.len() == initial_len {
            panic!("Member not found");
        }

        env.storage()
            .instance()
            .set(&DataKey::PoolMembers(pool_id.clone()), &members);

        // Update user's pools
        let mut user_pools = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(member_to_remove.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        
        user_pools = user_pools
            .iter()
            .filter(|p| **p != pool_id)
            .cloned()
            .collect(&env);
            
        env.storage()
            .instance()
            .set(&DataKey::UserPools(member_to_remove), &user_pools);

        true
    }

    // Contribute to the pool
    pub fn contribute(
        env: Env,
        pool_id: BytesN<32>,
        contributor: Address,
        amount: i128,
    ) -> BytesN<32> {
        // Verify contributor
        contributor.require_auth();

        // Verify amount is positive
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Get pool data
        let mut pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Get members
        let members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if contributor is a member
        let is_member = members.iter().any(|m| m.address == contributor);
        if !is_member {
            panic!("Not a member of this pool");
        }

        // Transfer tokens from contributor to contract
        let token_client = token::Client::new(&env, &pool.token);
        token_client.transfer(
            &contributor,
            &env.current_contract_address(),
            &amount,
        );

        // Generate a unique ID for the contribution
        let contribution_id = env.crypto().sha256(
            &(
                contributor.clone(),
                pool_id.clone(),
                amount,
                env.ledger().timestamp(),
            )
                .into_val(&env),
        );

        // Create contribution record
        let contribution = Contribution {
            id: contribution_id.clone(),
            contributor: contributor.clone(),
            amount,
            token: pool.token.clone(),
            created_at: env.ledger().timestamp(),
        };

        // Update pool contributions
        let mut contributions = env
            .storage()
            .instance()
            .get::<_, Vec<Contribution>>(&DataKey::PoolContributions(pool_id.clone()))
            .expect("Contributions not found");
        contributions.push_back(contribution);
        env.storage()
            .instance()
            .set(&DataKey::PoolContributions(pool_id.clone()), &contributions);

        // Update pool balance
        pool.balance += amount;
        env.storage()
            .instance()
            .set(&DataKey::Pool(pool_id.clone()), &pool);

        // Return the contribution ID
        contribution_id
    }

    // Request a withdrawal from the pool
    pub fn request_withdrawal(
        env: Env,
        pool_id: BytesN<32>,
        requester: Address,
        recipient: Address,
        amount: i128,
    ) -> BytesN<32> {
        // Verify requester
        requester.require_auth();

        // Verify amount is positive
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Get pool data
        let pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Check if pool has sufficient balance
        if pool.balance < amount {
            panic!("Insufficient pool balance");
        }

        // Get members
        let members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if requester is a member with appropriate role
        let requester_role = members
            .iter()
            .find(|m| m.address == requester)
            .map(|m| m.role);

        if requester_role.is_none() {
            panic!("Not a member of this pool");
        }

        let is_admin = requester_role == Some(MemberRole::Admin);
        let is_recipient_valid = members.iter().any(|m| m.address == recipient && m.role == MemberRole::Recipient);

        // Only admins can request withdrawals for recipients
        if recipient != requester && !is_admin {
            panic!("Not authorized to request withdrawal for another user");
        }

        // If recipient is not the requester, check if they are a valid recipient
        if recipient != requester && !is_recipient_valid {
            panic!("Invalid recipient");
        }

        // Check withdrawal limit
        if amount > pool.withdrawal_limit {
            panic!("Amount exceeds withdrawal limit");
        }

        // Generate a unique ID for the withdrawal
        let withdrawal_id = env.crypto().sha256(
            &(
                requester.clone(),
                recipient.clone(),
                pool_id.clone(),
                amount,
                env.ledger().timestamp(),
            )
                .into_val(&env),
        );

        // Create withdrawal record
        let withdrawal = Withdrawal {
            id: withdrawal_id.clone(),
            requester: requester.clone(),
            recipient: recipient.clone(),
            amount,
            token: pool.token.clone(),
            status: if is_admin {
                WithdrawalStatus::Approved
            } else {
                WithdrawalStatus::Pending
            },
            created_at: env.ledger().timestamp(),
            completed_at: 0,
        };

        // Update pool withdrawals
        let mut withdrawals = env
            .storage()
            .instance()
            .get::<_, Vec<Withdrawal>>(&DataKey::PoolWithdrawals(pool_id.clone()))
            .expect("Withdrawals not found");
        withdrawals.push_back(withdrawal);
        env.storage()
            .instance()
            .set(&DataKey::PoolWithdrawals(pool_id.clone()), &withdrawals);

        // If admin requested, process the withdrawal immediately
        if is_admin {
            Self::process_withdrawal(env, pool_id, withdrawal_id, requester, true);
        }

        // Return the withdrawal ID
        withdrawal_id
    }

    // Approve or reject a withdrawal request
    pub fn process_withdrawal(
        env: Env,
        pool_id: BytesN<32>,
        withdrawal_id: BytesN<32>,
        admin: Address,
        approve: bool,
    ) -> bool {
        // Verify admin
        admin.require_auth();

        // Get pool data
        let mut pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Get members
        let members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if admin is authorized
        let admin_is_authorized = members.iter().any(|m| m.address == admin && m.role == MemberRole::Admin);
        if !admin_is_authorized {
            panic!("Not authorized to process withdrawals");
        }

        // Get withdrawals
        let mut withdrawals = env
            .storage()
            .instance()
            .get::<_, Vec<Withdrawal>>(&DataKey::PoolWithdrawals(pool_id.clone()))
            .expect("Withdrawals not found");

        // Find the withdrawal
        let withdrawal_index = withdrawals
            .iter()
            .position(|w| w.id == withdrawal_id)
            .expect("Withdrawal not found");

        let mut withdrawal = withdrawals.get(withdrawal_index).unwrap().clone();

        // Check if withdrawal is pending
        if withdrawal.status != WithdrawalStatus::Pending {
            panic!("Withdrawal is not pending");
        }

        if approve {
            // Check if pool has sufficient balance
            if pool.balance < withdrawal.amount {
                panic!("Insufficient pool balance");
            }

            // Update withdrawal status
            withdrawal.status = WithdrawalStatus::Approved;
            withdrawal.completed_at = env.ledger().timestamp();

            // Transfer tokens to recipient
            let token_client = token::Client::new(&env, &pool.token);
            token_client.transfer(
                &env.current_contract_address(),
                &withdrawal.recipient,
                &withdrawal.amount,
            );

            // Update pool balance
            pool.balance -= withdrawal.amount;
            env.storage()
                .instance()
                .set(&DataKey::Pool(pool_id.clone()), &pool);
        } else {
            // Reject the withdrawal
            withdrawal.status = WithdrawalStatus::Rejected;
            withdrawal.completed_at = env.ledger().timestamp();
        }

        // Update withdrawals
        withdrawals.set(withdrawal_index, withdrawal);
        env.storage()
            .instance()
            .set(&DataKey::PoolWithdrawals(pool_id.clone()), &withdrawals);

        true
    }

    // Get pool details
    pub fn get_pool(env: Env, pool_id: BytesN<32>) -> FamilyPool {
        env.storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id))
            .expect("Pool not found")
    }

    // Get pool members
    pub fn get_pool_members(env: Env, pool_id: BytesN<32>) -> Vec<Member> {
        env.storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id))
            .expect("Members not found")
    }

    // Get pool contributions
    pub fn get_pool_contributions(env: Env, pool_id: BytesN<32>) -> Vec<Contribution> {
        env.storage()
            .instance()
            .get::<_, Vec<Contribution>>(&DataKey::PoolContributions(pool_id))
            .expect("Contributions not found")
    }

    // Get pool withdrawals
    pub fn get_pool_withdrawals(env: Env, pool_id: BytesN<32>) -> Vec<Withdrawal> {
        env.storage()
            .instance()
            .get::<_, Vec<Withdrawal>>(&DataKey::PoolWithdrawals(pool_id))
            .expect("Withdrawals not found")
    }

    // Get user's pools
    pub fn get_user_pools(env: Env, user: Address) -> Vec<FamilyPool> {
        let pool_ids = env
            .storage()
            .instance()
            .get::<_, Vec<BytesN<32>>>(&DataKey::UserPools(user))
            .unwrap_or_else(|| Vec::new(&env));

        let mut pools = Vec::new(&env);
        for id in pool_ids.iter() {
            let pool = env
                .storage()
                .instance()
                .get::<_, FamilyPool>(&DataKey::Pool(id))
                .expect("Pool not found");
            pools.push_back(pool);
        }

        pools
    }

    // Update pool withdrawal limit
    pub fn update_withdrawal_limit(
        env: Env,
        pool_id: BytesN<32>,
        admin: Address,
        new_limit: i128,
    ) -> bool {
        // Verify admin
        admin.require_auth();

        // Verify new limit is positive
        if new_limit <= 0 {
            panic!("Withdrawal limit must be positive");
        }

        // Get pool data
        let mut pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Get members
        let members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if admin is authorized
        let admin_is_authorized = members.iter().any(|m| m.address == admin && m.role == MemberRole::Admin);
        if !admin_is_authorized {
            panic!("Not authorized to update withdrawal limit");
        }

        // Update withdrawal limit
        pool.withdrawal_limit = new_limit;
        env.storage()
            .instance()
            .set(&DataKey::Pool(pool_id.clone()), &pool);

        true
    }

    // Update pool withdrawal period
    pub fn update_withdrawal_period(
        env: Env,
        pool_id: BytesN<32>,
        admin: Address,
        new_period: WithdrawalPeriod,
    ) -> bool {
        // Verify admin
        admin.require_auth();

        // Get pool data
        let mut pool = env
            .storage()
            .instance()
            .get::<_, FamilyPool>(&DataKey::Pool(pool_id.clone()))
            .expect("Pool not found");

        // Get members
        let members = env
            .storage()
            .instance()
            .get::<_, Vec<Member>>(&DataKey::PoolMembers(pool_id.clone()))
            .expect("Members not found");

        // Check if admin is authorized
        let admin_is_authorized = members.iter().any(|m| m.address == admin && m.role == MemberRole::Admin);
        if !admin_is_authorized {
            panic!("Not authorized to update withdrawal period");
        }

        // Update withdrawal period
        pool.withdrawal_period = new_period;
        env.storage()
            .instance()
            .set(&DataKey::Pool(pool_id.clone()), &pool);

        true
    }
}
