HelioX — Tokenized Mobility Infrastructure & Agentic Intents on NEAR

HelioX transforms real-world vehicles into programmable digital assets on NEAR Protocol, connecting physical mobility with on-chain economic logic through Autonomous Intent Abstraction.

Built for NEARCON Innovation Sandbox, HelioX demonstrates the convergence of Real World Assets (RWA), IoT Oracles, and Agentic UX to create the next generation of decentralized mobility infrastructure.
🤖 The HelioX Smart Agent: Intent-Based Mobility

Beyond a traditional marketplace, HelioX introduces an Agentic Intent Layer. This abstraction allows users to interact with complex RWA smart contracts using natural language commands, effectively removing the friction of manual on-chain interactions.
Features of the HelioX Agent:

    Semantic Intent Parsing: Locally processes user desires (buy, sell, optimize) without exposing sensitive data to external LLM APIs.

    Liquidity Discovery Agent: Automatically scans the order book to find the optimal match for user requests, abstracting the "Search & Match" complexity.

    Guardrail Logic: Built-in safety protocols prevent self-trading and invalid state execution, acting as an intelligent middleware between the user and the blockchain.

    Chain Abstraction Enabler: Moves the user experience from "Clicking Buttons" to "Declaring Intentions," aligning with the NEAR core vision of frictionless Web3.

The Problem

Today vehicles remain:

    Illiquid physical assets with high entry barriers.

    Disconnected Data Silos: IoT data is wasted instead of driving economic value.

    Complex On-chain UX: Managing RWA fractions, Escrow, and Oracles is daunting for non-technical users.

The Solution — What HelioX Delivers

HelioX converts physical vehicles into on-chain economic infrastructure through:

    NFT Tokenization (NEP-171) Each vehicle is a unique NFT with Dynamic Metadata that reacts to real-world usage.

    Fractional Ownership (NEP-141) The vehicle’s value is divided into fungible tokens, enabling hyper-accessible participation.

    Autonomous Marketplace Agent An intent-based interface that handles order matching and execution through natural language.

    Oracle-Driven State Machine Physical data (Mileage, Temperature) triggers on-chain events like Automatic Maintenance Lockdowns.

MVP Architecture

    Frontend: React / Next.js with Agentic UX Design.

    Agent Layer: Client-side NLP Intent Parser for high-speed, private execution.

    Smart Contracts (Rust):

        NFT Contract (NEP-171): Manages asset identity and maintenance states.

        FT Contract (NEP-141): Manages fractional ownership.

        Marketplace Contract: Handles atomic swaps and Escrow.

    IoT Simulation Layer: Real-time data injection to test Oracle responsiveness.

Real World Assets (RWA) & IoT

Each vehicle in HelioX is treated as a Live Asset:

    Verifiable Digital Identity: On-chain record of the vehicle's history.

    Predictive Maintenance: Oracle data can trigger maintenance states, protecting share value by pausing trades when the asset is at risk.

    Transparency: Every kilometer traveled is recorded on the NEAR blockchain.

Scalability — Designed for Growth
Transactional & Economic Scalability

Leveraging NEAR’s Nightshade Sharding, HelioX can manage entire fleets of autonomous vehicles, processing micro-transactions for mileage and maintenance in parallel with near-zero costs.
Agentic Scalability

As the HelioX Agent evolves, it will integrate with NEAR Intents (Solver Network), allowing it to swap assets across different shards and protocols to fulfill user requests in the most efficient way possible.
What Is Already Implemented

    ✅ Agentic UI: Natural language command bar for market interaction.

    ✅ Dynamic NFTs: Metadata that reflects vehicle health.

    ✅ Fractional Marketplace: Secure Escrow for NEP-141 shares.

    ✅ Oracle Integration: Functional sensor data submission and validation.

    ✅ Dark Mode Pro: Optimized for high-stakes innovation environments.

Roadmap

    Phase 1: RWA Tokenization & Fractionalization (Current MVP).

    Phase 2: Autonomous Agent Expansion (Moving logic from client-side to NEAR Solver Nodes).

    Phase 3: Integration with real IoT hardware (OBD-II Dongles).

    Phase 4: Cross-chain RWA liquidity via NEAR Chain Abstraction.

How to Test the MVP


1. Clone the repo: git clone https://github.com/Crawsectus/HackathonNEAR
2. Navigate to the dApp: cd dapp/heliox
3. Install & Run: npm install && npm run dev
4. Connect Wallet: Use a NEAR Testnet account.
5. Command the Agent: Type "Buy 5" or "Sell 10" in the AI Hub.

Built for NEARCON Innovation Sandbox

Real mobility. On-chain economy. Agentic execution. HelioX is building the foundation for physical infrastructure that operates as a programmable, autonomous economic entity.