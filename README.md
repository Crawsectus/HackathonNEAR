# 🚀 Heliox: Real World Assets on NEAR

**Heliox** is a sophisticated RWA (Real World Asset) tokenization platform designed to manage vehicle assets through **Dynamic NFTs** (NEP-171) and fractional ownership via **Fungible Tokens** (NEP-141). Developed for the **NearCon Innovation Sandbox**, this project demonstrates a full-cycle ecosystem for asset monitoring, fractional investment, and peer-to-peer trading.



## 🛠️ Project Ecosystem

The platform integrates three specialized smart contracts working in orchestration:

1.  **Vehicle NFT (NEP-171):** Acts as the "Digital Twin" of the physical vehicle. It is a dynamic NFT that stores real-time telemetry (mileage and temperature). It features on-chain logic to trigger a "Maintenance Required" state if parameters exceed safety thresholds.
2.  **Vehicle FT (NEP-141):** Represents fractional ownership (shares). This allows high-value assets to be divided among multiple liquidity providers.
3.  **Marketplace Contract:** A specialized Escrow system that facilitates secure trading. It allows users to list shares and purchase them using **USDT** (6 decimals), ensuring atomic swaps between participants.

---

## ✨ Key Features

* **Real-Time Status Dashboard:** Visual monitoring of vehicle health with dynamic UI indicators (Red/Green) based on blockchain-verified maintenance status.
* **Oracle Simulator:** An integrated interface to push telemetry data (temperature/mileage) directly to the blockchain, simulating IoT sensor behavior.
* **Advanced P2P Marketplace:**
    * **Listing:** Securely move shares to escrow using `ft_transfer_call`.
    * **Atomic Purchase:** Seamless exchange of USDT for shares in a single transaction flow.
    * **Smart Cancellation:** Sellers can reclaim their listed shares. The contract utilizes state-cleaning logic (`remove`) to optimize storage costs.
* **Optimized UX:** Automatic handling of token decimals, TGas allocation, and smart UI feedback for user-owned listings.



---

## Technical Architecture (Rust)

The smart contracts are built using the **NEAR Rust SDK**, prioritizing security and storage efficiency.

### Core Logic:
* **Dynamic Metadata:** The NFT contract updates its state based on external inputs, affecting the asset's "operativity" status on-chain.
* **Fungible Token Receiver:** The Marketplace implements the `FungibleTokenReceiver` trait to react to incoming payments and listings without requiring separate approval transactions.
* **Storage Management:** Implements efficient state cleanup by removing entries from `UnorderedMap` when balances reach zero, reducing the contract's storage footprint.

---

## Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/Crawsectus/HackathonNEAR.git](https://github.com/Crawsectus/HackathonNEAR.git)
cd HackathonNEAR
2. Install dependencies
Bash

npm install

### 3. Contract Configuration

Check src/config.ts to verify the deployed Testnet addresses:

    NFT_CONTRACT: heliox-nft.testnet

    FT_CONTRACT: heliox-ft.testnet

    MARKET_CONTRACT: heliox-marketplace.testnet

    USDT_CONTRACT: usdt-mock.testnet

### 4. Run Locally
Bash

npm run dev

### Preview

The interface features a dual-panel layout:

    Vehicle Monitor: Gauge-style tracking of mileage and temperature.

    Marketplace Orderbook: Clean, filtered list of available shares with distinct actions for buyers and sellers.

### Project Information

    Event: NearCon Innovation Sandbox

    Network: NEAR Testnet
