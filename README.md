# SpooVault

Enterprise-grade document custody app supporting both **Avalanche (EVM)** and **Stellar (Soroban)** networks with client-side encryption, guardian-based approvals, and NFT access passes.

---

## Live & Networks
- **App**: https://spoovault.web.app
- **Avalanche Fuji Testnet**: Chain ID `43113` | Contract: `0x64128680775Ef626379DeF6E5c815AeA8F4707Ef`
- **Stellar Soroban Testnet**: Supported via Freighter Wallet & local mock prototyping

---

## Core Capabilities
- **Multi-Chain Connectivity**: Switch dynamically between the Avalanche Fuji and Stellar Soroban networks directly from the UI sidebar.
- **Client-side Encryption**: AES encryption before upload ensures documents are private.
- **IPFS Document Storage**: Secure storage with on-chain metadata references (supports serverless proxy to avoid Pinata API key exposure).
- **Access Vaults**: Multi-signature guardian thresholds for secure document release.
- **My Access Workflow**: Beneficiary request, guardian approval, and key-package import.

---

## Tech Stack
- **Frontend**: React + TypeScript + Vite (with HeroUI and Tailwind CSS)
- **Avalanche Core**: ethers v6 & Hardhat (Solidity 0.8.20)
- **Stellar Core**: Soroban Rust SDK & Freighter wallet integration
- **Crypto & Storage**: TweetNaCl, Crypto-js, and IPFS

---

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm run dev
   ```

---

## Production Build & Deploy
- Build:
  ```bash
  npm run build
  ```
- Deploy to Firebase:
  ```bash
  firebase deploy --only hosting
  ```

---

## Environment Variables
Create a `.env` file based on `.env.example`:

```env
VITE_CONTRACT_ADDRESS=0x64128680775Ef626379DeF6E5c815AeA8F4707Ef
VITE_AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
VITE_CHAIN_ID=43113
VITE_CHAIN_NAME=Avalanche Fuji Testnet
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_CONTRACT_DEPLOY_BLOCK=51988771
VITE_TX_WAIT_TIMEOUT_MS=180000

# Optional: Stellar Soroban contract address (leave empty for mock mode)
VITE_STELLAR_CONTRACT_ADDRESS=

# Pinata / IPFS Configuration
VITE_PINATA_JWT=
VITE_PINATA_API_KEY=
VITE_PINATA_API_SECRET=
VITE_IPFS_PROXY_URL=
```

---

## Contributing & Smart Contracts
For details on building, compiling, and testing the smart contracts (Solidity for Avalanche & Rust for Stellar Soroban), see [CONTRIBUTING.md](file:///c:/Users/HP/spoovault/CONTRIBUTING.md).

---

## License
MIT
