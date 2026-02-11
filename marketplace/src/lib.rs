use near_sdk::{
    near, AccountId, PanicOnDefault, require, env, PromiseOrValue, NearToken
};
use near_sdk::json_types::U128;
use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_contract_standards::fungible_token::core::ext_ft_core;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Marketplace {
    pub owner_id: AccountId,
    pub vehicle_ft: AccountId,
    pub stable_ft: AccountId,
    pub price_per_token: U128,
}

#[near]
impl Marketplace {

    #[init]
    pub fn new(
        owner_id: AccountId,
        vehicle_ft: AccountId,
        stable_ft: AccountId,
        price_per_token: U128,
    ) -> Self {
        require!(price_per_token.0 > 0, "Price must be greater than 0");

        Self {
            owner_id,
            vehicle_ft,
            stable_ft,
            price_per_token,
        }
    }
}

#[near]
impl FungibleTokenReceiver for Marketplace {

    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        _msg: String,
    ) -> PromiseOrValue<U128> {

        // 1️⃣ Solo aceptar stablecoin
        require!(
            env::predecessor_account_id() == self.stable_ft,
            "Only stablecoin accepted"
        );

        let price = self.price_per_token.0;
        let amount_sent = amount.0;

        require!(amount_sent > 0, "Amount must be greater than 0");

        // 2️⃣ Calcular cuántos vehicle tokens comprar
        let tokens_to_send = amount_sent / price;

        require!(tokens_to_send > 0, "Insufficient amount sent");

        PromiseOrValue::Promise(
            ext_ft_core::ext(self.vehicle_ft.clone())
                .with_attached_deposit(NearToken::from_yoctonear(1))
                .ft_transfer(
                    sender_id.clone(),
                    U128(tokens_to_send),
                    Some("Vehicle token purchase".to_string())
                )
        )
    }
}
