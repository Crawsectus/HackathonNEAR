use near_sdk::{
    near,
    near_bindgen,
    AccountId,
    PanicOnDefault,
    env,
    require,ext_contract,
    Gas,
};

use near_contract_standards::non_fungible_token::{
    NonFungibleToken,
    metadata::TokenMetadata,
};
use near_sdk::PromiseOrValue;
use near_contract_standards::non_fungible_token::core::NonFungibleTokenCore;
use near_contract_standards::non_fungible_token::Token;
use near_sdk::json_types::U128;

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
}
#[ext_contract(ext_ft)]
pub trait ExtFungibleToken {
    fn ft_balance_of(&self, account_id: AccountId) -> U128;
}
const GAS_FOR_FT_BALANCE: Gas = Gas::from_tgas(5);
const GAS_FOR_RESOLVE: Gas = Gas::from_tgas(10);
/// ===============================
/// CONTRACT IMPLEMENTATION
/// ===============================

#[near_bindgen]
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
                b"n".to_vec(),
                owner_id,
                Some(b"m".to_vec()),
                Some(b"e".to_vec()),
                Some(b"a".to_vec()),
            ),
            ft_contract_id,
            ft_total_supply,
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
        // 🔒 Only contract owner can mint
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only contract owner can mint"
        );

        let metadata = TokenMetadata {
            title: Some(vehicle_name),
            description: Some(vehicle_description),
            media: None,
            media_hash: None,
            copies: Some(1),
            issued_at: None,
            expires_at: None,
            starts_at: None,
            updated_at: None,
            extra: Some(ipfs_document_hash), // 📄 IPFS legal document
            reference: None,
            reference_hash: None,
        };

        self.nft.internal_mint(
            token_id,
            receiver_id,
            Some(metadata),
        );
    }
}

#[near_bindgen]
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

#[near_bindgen]
impl VehicleNFTContract {

    pub fn claim_vehicle_nft(&mut self, token_id: String) {
        let caller = env::predecessor_account_id();

        ext_ft::ext(self.ft_contract_id.clone())
            .with_static_gas(GAS_FOR_FT_BALANCE)
            .ft_balance_of(caller.clone())
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE)
                    .resolve_claim(token_id, caller)
            );
    }
}

#[near_bindgen]
impl VehicleNFTContract {

    #[private]
    pub fn resolve_claim(
        &mut self,
        token_id: String,
        claimant: AccountId,
        #[callback_result] balance: Result<U128, near_sdk::PromiseError>,
    ) -> bool {
        let balance = balance.expect("Failed to get FT balance");

        require!(
            balance == self.ft_total_supply,
            "You must own 100% of the FT supply to claim the vehicle NFT"
        );

        // Transferencia interna (ignora bloqueo externo)
        self.nft.internal_transfer(
            &self.owner_id,
            &claimant,
            &token_id,
            None,
            None,
        );

        true
    }
}
