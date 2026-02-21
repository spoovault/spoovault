# SpooVault

Enterprise-grade document custody app on Avalanche Fuji with client-side encryption, guardian-based approvals, and NFT access passes.

## Live
- App: https://spoovault.web.app
- Network: Avalanche Fuji (Chain ID 43113)
- Contract: `0x64128680775Ef626379DeF6E5c815AeA8F4707Ef`
- Deploy block: `51988771`

## Core Capabilities
- Client-side AES encryption before upload
- IPFS document storage with on-chain metadata references
- Access vaults with guardian multi-signature thresholds
- Release policies for live, emergency, and post-death access
- ERC-721 access pass minting and revocation
- On-chain audit trail via contract events

## Stack
- Frontend: React + TypeScript + Vite
- UI: HeroUI + Tailwind CSS
- Web3: ethers v6
- Crypto: crypto-js
- Hosting: Firebase Hosting
- Contract: Solidity 0.8.20 (Remix workflow)

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```

## Environment Variables
Create `.env` from `.env.example`:

```env
VITE_CONTRACT_ADDRESS=0x64128680775Ef626379DeF6E5c815AeA8F4707Ef
VITE_AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
VITE_CHAIN_ID=43113
VITE_CHAIN_NAME=Avalanche Fuji Testnet
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_CONTRACT_DEPLOY_BLOCK=51988771
VITE_TX_WAIT_TIMEOUT_MS=180000

# Pinata (set either JWT or key/secret)
VITE_PINATA_JWT=
VITE_PINATA_API_KEY=
VITE_PINATA_API_SECRET=
```

## Contract Deployment (Remix)
1. Open `contracts/SpooVault.sol` in Remix.
2. Compiler: Solidity `0.8.20`.
3. Enable optimizer (low runs recommended when size warning appears).
4. Deploy to Avalanche Fuji via injected MetaMask.
5. Copy deployed address into `VITE_CONTRACT_ADDRESS`.
6. Set `VITE_CONTRACT_DEPLOY_BLOCK` to the contract deploy block.

## Firebase Deploy
```bash
npm run build
firebase deploy --only hosting
```

## Notes
- Read calls are routed through stable Fuji RPC fallbacks.
- Upload flow includes IPFS timeout handling and clearer errors.
- Transaction confirmation wait has a configurable timeout.

## License
MIT
