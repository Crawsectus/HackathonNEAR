use near_sdk::{
    near,
    near_bindgen,
    AccountId,
    PanicOnDefault,
    require,
    env,
};

use near_sdk::json_types::U128;

use near_contract_standards::fungible_token::FungibleToken;
use near_contract_standards::fungible_token::core::FungibleTokenCore;
use near_contract_standards::fungible_token::metadata::{
    FungibleTokenMetadata,
    FungibleTokenMetadataProvider,
    FT_METADATA_SPEC,
};

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct VehicleFTContract {
    pub owner_id: AccountId,
    pub token: FungibleToken,
}

#[near_bindgen]
impl VehicleFTContract {

    #[init]
    pub fn new(
        owner_id: AccountId,
        total_supply: U128,
    ) -> Self {
        require!(!env::state_exists(), "Already initialized");

        let mut token = FungibleToken::new(b"t".to_vec());

        // Mint inicial: TODO el supply al owner
        token.internal_register_account(&owner_id);
        token.internal_deposit(&owner_id, total_supply.0);

        Self {
            owner_id,
            token,
        }
    }

    // 🔒 Mint bloqueado (diseño intencional)
    pub fn mint_disabled(&self) {
        panic!("Minting is disabled");
    }
}

#[near_bindgen]
impl FungibleTokenCore for VehicleFTContract {
    fn ft_transfer(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
    ) {
        self.token.ft_transfer(receiver_id, amount, memo)
    }

    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> near_sdk::PromiseOrValue<U128> {
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}

#[near_bindgen]
impl FungibleTokenMetadataProvider for VehicleFTContract {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        FungibleTokenMetadata {
            spec: FT_METADATA_SPEC.to_string(),
            name: "Vehicle Ownership Token".to_string(),
            symbol: "vUSD".to_string(),
            decimals: 0, // 1 token = 1 USD
            icon: None,
            reference: None,
            reference_hash: None,
        }
    }
}
