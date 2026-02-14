use near_sdk::{
    env, near, require,
    AccountId, PanicOnDefault,
    Promise, PromiseOrValue,
    NearToken, Gas,
};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::U128;
use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Marketplace {
    pub vehicle_ft: AccountId,
    pub usdt_token: AccountId,
    pub owner_id: AccountId,

    // seller -> amount listed (escrow)

    // precio fijo por share en unidades de USDT
    pub price_per_share: u128,
    pub listings: UnorderedMap<AccountId, u128>,
}

#[near]
impl Marketplace {
    #[init]
    pub fn new(
        owner_id: AccountId,
        vehicle_ft: AccountId,
        usdt_token: AccountId,
        price_per_share: U128,
    ) -> Self {
        require!(!env::state_exists(), "Already initialized");

        Self {
            owner_id,
            vehicle_ft,
            usdt_token,
            listings: UnorderedMap::new(b"l"),
            price_per_share: price_per_share.0,
        }
    }


    // Permite cancelar listing
    pub fn cancel_listing(&mut self, amount: U128) -> Promise {
        let caller = env::predecessor_account_id();
        let listed = self.listings.get(&caller).unwrap_or(0);

        require!(listed >= amount.0, "Not enough listed");

        self.listings.insert(&caller, &(listed - amount.0));
        let new_balance = listed - amount.0;
        if new_balance > 0 {
            self.listings.insert(&caller, &new_balance);
        } else {
            self.listings.remove(&caller); // 🧹 Limpieza también al cancelar
        }
        Promise::new(self.vehicle_ft.clone()).function_call(
            "ft_transfer".to_string(),
            near_sdk::serde_json::json!({
                "receiver_id": caller,
                "amount": amount
            })
            .to_string()
            .into_bytes(),
            NearToken::from_yoctonear(1),
            Gas::from_tgas(10),
        )
    }
    pub fn get_listing(&self, seller: AccountId) -> U128 {
        U128(self.listings.get(&seller).unwrap_or(0))
    }

    // Ver precio por share
    pub fn get_price_per_share(&self) -> U128 {
        U128(self.price_per_share)
    }

    // Ver contratos configurados
    pub fn get_config(&self) -> (AccountId, AccountId) {
        (self.vehicle_ft.clone(), self.usdt_token.clone())
    }
    pub fn get_all_listings(&self) -> Vec<(AccountId, U128)> {
        self.listings
            .iter()
            .map(|(account, amount)| (account, U128(amount)))
            .collect()
    }
}

#[derive(near_sdk::serde::Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct BuyMsg {
    pub seller: AccountId,
    pub shares: U128,
}

#[near]
impl FungibleTokenReceiver for Marketplace {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {

        let token_contract = env::predecessor_account_id();

        // =========================
        // CASO 1: LISTAR VehicleFT
        // =========================
        if token_contract == self.vehicle_ft {
            require!(msg == "list", "Invalid listing message");

            let current = self.listings.get(&sender_id).unwrap_or(0);
            self.listings.insert(&sender_id, &(current + amount.0));

            // mantener los tokens en escrow
            return PromiseOrValue::Value(U128(0));
        }

        // =========================
        // CASO 2: COMPRAR con USDT
        // =========================
        if token_contract == self.usdt_token {

            let BuyMsg { seller, shares } =
                near_sdk::serde_json::from_str(&msg)
                    .expect("Invalid purchase message");

            let shares = shares.0;
            require!(shares > 0, "Invalid share amount");

            let available = self.listings.get(&seller).unwrap_or(0);
            require!(available >= shares, "Not enough shares listed");

            let required_payment = shares * self.price_per_share;
            require!(amount.0 == required_payment, "Incorrect USDT amount");

            // actualizar estado antes de hacer promesas
            let new_balance = available - shares;

            // 2. Actualizamos o removemos según corresponda
            if new_balance > 0 {
                self.listings.insert(&seller, &new_balance);
            } else {
                self.listings.remove(&seller); // 🧹 Limpia el estado si ya no hay nada
            }
            
            // transferir USDT al seller
            Promise::new(self.usdt_token.clone())
                .function_call(
                    "ft_transfer".to_string(),
                    near_sdk::serde_json::json!({
                        "receiver_id": seller,
                        "amount": amount
                    })
                    .to_string()
                    .into_bytes(),
                    NearToken::from_yoctonear(1),
                    Gas::from_tgas(10),
                )
                .then(
                    Promise::new(self.vehicle_ft.clone()).function_call(
                        "ft_transfer".to_string(),
                        near_sdk::serde_json::json!({
                            "receiver_id": sender_id,
                            "amount": U128(shares)
                        })
                        .to_string()
                        .into_bytes(),
                        NearToken::from_yoctonear(1),
                        Gas::from_tgas(10),
                    )
                );

            return PromiseOrValue::Value(U128(0));
        }

        // Token no permitido → devolver fondos
        PromiseOrValue::Value(amount)
    }
}
