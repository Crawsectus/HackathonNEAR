use near_sdk::{
    near,
    near_bindgen,
    AccountId,
    PanicOnDefault,
    require,
    env,NearToken,assert_one_yocto
};
use near_sdk::json_types::U128;

use near_contract_standards::fungible_token::FungibleToken;
use near_contract_standards::fungible_token::core::FungibleTokenCore;
use near_contract_standards::fungible_token::metadata::{
    FungibleTokenMetadata,
    FungibleTokenMetadataProvider,
    FT_METADATA_SPEC,
};
use near_contract_standards::storage_management::{
    StorageManagement, StorageBalance, StorageBalanceBounds,
};
use near_contract_standards::fungible_token::resolver::FungibleTokenResolver;
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct VehicleFTContract {
    pub owner_id: AccountId,
    pub nft_contract_id: AccountId,  
    pub token: FungibleToken,
}

#[near]
impl VehicleFTContract {

    #[init]
    pub fn new(
        owner_id: AccountId,
        total_supply: U128,
        nft_contract_id: AccountId,
    ) -> Self {
        require!(!env::state_exists(), "Already initialized");

        let mut token = FungibleToken::new(b"t".to_vec());

        token.internal_register_account(&owner_id);
        token.internal_deposit(&owner_id, total_supply.0);

        Self {
            owner_id,
            token,
            nft_contract_id,
        }
    }

    /// 🔒 Mint bloqueado
    pub fn mint_disabled(&self) {
        panic!("Minting is disabled");
    }

    /// 🔥 Burn ALL tokens from an account (used for NFT claim)
    #[private]
    pub fn burn_all_from(&mut self, account_id: AccountId) {
        require!(
            env::predecessor_account_id() == self.nft_contract_id,
            "Only NFT contract can burn tokens"
        );

        let balance = self.token.ft_balance_of(account_id.clone()).0;
        require!(balance > 0, "Nothing to burn");

        self.token.internal_withdraw(&account_id, balance);
        self.token.total_supply -= balance;
    }

}

/* ---------------- FT CORE ---------------- */

#[near]
impl FungibleTokenCore for VehicleFTContract {

    #[payable]
    fn ft_transfer(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
    ) {
        assert_one_yocto();
        self.token.ft_transfer(receiver_id, amount, memo)
    }

    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> near_sdk::PromiseOrValue<U128> {
        assert_one_yocto();
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}


/* ---------------- STORAGE MANAGEMENT (CLAVE) ---------------- */

#[near]
impl StorageManagement for VehicleFTContract {

    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance {
        self.token.storage_deposit(account_id, registration_only)
    }

    #[payable]
    fn storage_withdraw(
        &mut self,
        amount: Option<NearToken>,
    ) -> StorageBalance {
        self.token.storage_withdraw(amount)
    }

    fn storage_unregister(&mut self, force: Option<bool>) -> bool {
        self.token.storage_unregister(force)
    }

    fn storage_balance_of(
        &self,
        account_id: AccountId,
    ) -> Option<StorageBalance> {
        self.token.storage_balance_of(account_id)
    }

    fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        self.token.storage_balance_bounds()
    }
}


/* ---------------- METADATA ---------------- */

#[near]
impl FungibleTokenMetadataProvider for VehicleFTContract {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        FungibleTokenMetadata {
            spec: FT_METADATA_SPEC.to_string(),
            name: "Vehicle Ownership Token".to_string(),
            symbol: "vUSD".to_string(),
            decimals: 0,
            icon: None,
            reference: None,
            reference_hash: None,
        }
    }
}

#[near]
impl FungibleTokenResolver for VehicleFTContract {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        self.token.ft_resolve_transfer(sender_id, receiver_id, amount)
    }
}
