use near_sdk::{
    near,
    env,
    require,
    AccountId,
    PanicOnDefault,
    Gas,
    NearToken,
    Promise,
};

use near_sdk::json_types::U128;
use near_contract_standards::non_fungible_token::{
    NonFungibleToken,
    metadata::TokenMetadata,
    core::NonFungibleTokenCore,
    Token,
};

use near_sdk::PromiseOrValue;
use near_sdk::ext_contract;

/// ===============================
/// CONSTANTS
/// ===============================

const GAS_FOR_FT_BALANCE: Gas = Gas::from_tgas(5);
const GAS_FOR_RESOLVE: Gas = Gas::from_tgas(10);
const GAS_FOR_BURN: Gas = Gas::from_tgas(5);

/// ===============================
/// EXTERNAL FT INTERFACE
/// ===============================

#[ext_contract(ext_ft)]
pub trait ExtFungibleToken {
    fn ft_balance_of(&self, account_id: AccountId) -> U128;
    fn burn_all_from(&mut self, account_id: AccountId);
}

/// ===============================
/// CONTRACT STATE
/// ===============================

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct VehicleNFTContract {
    pub owner_id: AccountId,
    pub nft: NonFungibleToken,
    pub ft_contract_id: AccountId,
    pub ft_total_supply: U128,
    pub claimed: bool,
}

/// ===============================
/// CONTRACT IMPLEMENTATION
/// ===============================

#[near]
impl VehicleNFTContract {

    /// Constructor
    #[init]
    pub fn new(
        owner_id: AccountId,
        ft_contract_id: AccountId,
        ft_total_supply: U128,
    ) -> Self {
        require!(!env::state_exists(), "Already initialized");

        Self {
            owner_id: owner_id.clone(),
            nft: NonFungibleToken::new(
                b"n".to_vec(),   // token prefix
                owner_id,
                Some(b"m".to_vec()), // metadata
                Some(b"e".to_vec()),
                Some(b"a".to_vec()),
            ),
            ft_contract_id,
            ft_total_supply,
            claimed: false,
        }
    }

    /// ===============================
    /// MINT VEHICLE NFT
    /// ===============================
    pub fn nft_mint_vehicle(
        &mut self,
        token_id: String,
        receiver_id: AccountId,
        vehicle_name: String,
        vehicle_description: String,
        ipfs_document_hash: String,
    ) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only contract owner can mint"
        );

        let metadata = TokenMetadata {
            title: Some(vehicle_name),
            description: Some(vehicle_description),
            extra: Some(ipfs_document_hash), // IPFS legal document
            copies: Some(1),
            ..Default::default()
        };

        self.nft.internal_mint(
            token_id,
            receiver_id,
            Some(metadata),
        );
    }

    /// ===============================
    /// CLAIM VEHICLE (FT → NFT)
    /// ===============================
    pub fn claim_vehicle(&mut self, token_id: String) -> Promise {
        require!(!self.claimed, "Vehicle already claimed");

        let caller = env::predecessor_account_id();

        ext_ft::ext(self.ft_contract_id.clone())
            .with_static_gas(GAS_FOR_FT_BALANCE)
            .with_attached_deposit(NearToken::from_yoctonear(0))
            .ft_balance_of(caller.clone())
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE)
                    .resolve_claim(token_id, caller)
            )
    }

    /// ===============================
    /// RESOLVE CLAIM
    /// ===============================
    #[private]
    pub fn resolve_claim(
        &mut self,
        token_id: String,
        claimant: AccountId,
        #[callback_result] balance: Result<U128, near_sdk::PromiseError>,
    ) -> bool {
        require!(!self.claimed, "Vehicle already claimed");

        let balance = balance.expect("Failed to get FT balance");

        require!(
            balance == self.ft_total_supply,
            "Caller does not own 100% of the vehicle"
        );

        // 🔒 Lock state
        self.claimed = true;

        // 🔥 Burn FT
        ext_ft::ext(self.ft_contract_id.clone())
            .with_static_gas(GAS_FOR_BURN)
            .with_attached_deposit(NearToken::from_yoctonear(0))
            .burn_all_from(claimant.clone());

        env::log_str("✅ Vehicle successfully claimed");
        true
    }
}

/// ===============================
/// NFT CORE (TRANSFERS DISABLED)
/// ===============================

impl NonFungibleTokenCore for VehicleNFTContract {

    fn nft_transfer(
        &mut self,
        _receiver_id: AccountId,
        _token_id: String,
        _approval_id: Option<u64>,
        _memo: Option<String>,
    ) {
        env::panic_str("NFT transfers are disabled. Ownership is managed via FT.");
    }

    fn nft_transfer_call(
        &mut self,
        _receiver_id: AccountId,
        _token_id: String,
        _approval_id: Option<u64>,
        _memo: Option<String>,
        _msg: String,
    ) -> PromiseOrValue<bool> {
        env::panic_str("NFT transfers are disabled. Ownership is managed via FT.");
    }

    fn nft_token(&self, token_id: String) -> Option<Token> {
        self.nft.nft_token(token_id)
    }
}
