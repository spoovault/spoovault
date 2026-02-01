# 🔒 SpooVault - Enterprise Document Vault on Avalanche

> **NFT-Powered Multi-Signature Encrypted Document Vault**

SpooVault is a production-grade decentralized application built for the Avalanche builder competition. It provides secure, enterprise-ready document custody with client-side encryption, multi-signature approval flows, and NFT-based access control.

## 🚀 Features

### 🔐 Security
- **Client-Side Encryption**: All documents are encrypted before upload
- **Multi-Signature Vaults**: Configurable guardian approval thresholds
- **NFT Access Tokens**: ERC-721 tokens required for access requests
- **No On-Chain Secrets**: Only encrypted metadata stored on-chain

### 📋 Vault Management
- Create multi-guardian vaults with custom approval thresholds
- Add/remove guardians with invitation system
- Track vault activity and document history
- Configurable access levels (Read, Read/Write, Admin)

### 📄 Document Handling
- Encrypt documents client-side before IPFS upload
- Store only encrypted metadata + IPFS hash on-chain
- Multi-signature approval for access requests
- Audit trail for all document interactions

### 🎫 NFT Integration
- Mint ERC-721 access tokens for vault participants
- Burn tokens to revoke all access
- Token-gated document requests
- Visual NFT gallery with metadata

## 🏗️ Architecture

### Smart Contracts
- **Network**: Avalanche Fuji C-Chain
- **Contract**: SpooVault.sol (ERC-721 + Multi-Sig)
- **Standard**: Solidity 0.8.20
- **Libraries**: OpenZeppelin Contracts

### Frontend Stack
- **Framework**: React + TypeScript + Vite
- **UI Library**: HeroUI (Dark Theme)
- **Web3**: Ethers.js
- **Encryption**: Crypto-JS (AES)
- **Routing**: React Router DOM
- **State**: Zustand + React Context

## 📦 Project Structure
spoovault/
├── contracts/
│ └── SpooVault.sol # Main smart contract
├── src/
│ ├── components/ # Reusable UI components
│ ├── pages/ # Application pages
│ ├── context/ # React context providers
│ ├── hooks/ # Custom React hooks
│ ├── utils/ # Utility functions
│ ├── abis/ # Contract ABIs
│ ├── services/ # External service calls
│ └── styles/ # Global styles
├── public/ # Static assets
└── docs/ # Documentation

text

## 🚀 Deployment Guide

### 1. Smart Contract Deployment

#### Prerequisites
- MetaMask installed
- AVAX test tokens (get from [faucet](https://faucet.avax.network/))
- Remix IDE ([remix.ethereum.org](https://remix.ethereum.org))

#### Steps
1. Open Remix IDE in browser
2. Create new file: `SpooVault.sol`
3. Copy contract code from `contracts/SpooVault.sol`
4. Install OpenZeppelin contracts:
   - Go to "Solidity Compiler" tab (CTRL+SHIFT+S)
   - Set compiler to 0.8.20
   - Enable "Auto compile"
   - Check "Optimize" with 200 runs

5. Configure MetaMask for Fuji:
Network Name: Avalanche Fuji
RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Currency Symbol: AVAX
Block Explorer: https://testnet.snowtrace.io/

text

6. Get test AVAX from faucet

7. Deploy contract:
- Go to "Deploy & Run Transactions" tab
- Environment: "Injected Provider - MetaMask"
- Contract: "SpooVault"
- Click "Deploy"
- Confirm transaction in MetaMask

8. Copy contract address from transaction receipt

### 2. Frontend Setup

```bash
# Clone repository
git clone <repository-url>
cd spoovault

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your contract address

# Start development server
npm run dev

# Build for production
npm run build
3. Firebase Hosting (Optional)
bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init

# Select:
# - Hosting
# - Use existing project
# - dist as public directory
# - Single-page app: Yes
# - No auto-build

# Deploy
firebase deploy
🔧 Configuration
Environment Variables
env
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
VITE_CHAIN_ID=43113
IPFS Setup
Sign up at Pinata

Create API keys

Add to environment:

env
VITE_IPFS_API_KEY=your_key
VITE_IPFS_API_SECRET=your_secret
📱 Pages & Features
Dashboard
Overview of all vaults and activity

Quick stats and performance metrics

Recent activity timeline

Vault Management
Create new multi-signature vaults

Add/remove guardians

Configure approval thresholds

View vault details and documents

Document Handling
Upload encrypted documents

Manage document access

View document history

Multi-signature approval workflow

Access Requests
Request document access

Guardian approval interface

Track request status

Manage access rights

NFT Gallery
View minted access tokens

Mint new tokens for guardians

Burn tokens to revoke access

Visual token display

🔐 Security Model
Encryption Flow
User selects document for upload

Client generates random encryption key

Document encrypted with AES-256

Only encrypted file uploaded to IPFS

Encryption key split among guardians

Key reconstruction requires guardian approvals

Access Flow
User requests document access

System verifies NFT ownership

Guardians receive approval request

Threshold approvals grant access

Encryption key reconstructed client-side

Document downloaded and decrypted

🧪 Testing
Contract Testing
bash
# Test with Remix
# 1. Use Remix's Solidity Unit Testing
# 2. Deploy on Fuji testnet
# 3. Test all functions via Remix interface
Frontend Testing
bash
# Development server
npm run dev

# Manual testing checklist:
- [ ] Wallet connection
- [ ] Network switching
- [ ] Contract interaction
- [ ] Document encryption/decryption
- [ ] Multi-signature flows
- [ ] NFT minting/burning
📄 Smart Contract Reference
Key Functions
createVault() - Create new multi-sig vault

addDocument() - Add encrypted document metadata

requestAccess() - Request document access

approveAccess() - Guardian approval

mintAccessToken() - Mint NFT access token

burnAccessToken() - Burn token (revoke access)

Events
VaultCreated - New vault created

DocumentAdded - Document added to vault

AccessRequested - Access request submitted

AccessApproved - Guardian approved request

NFTMinted - New access token minted

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/amazing)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing)

Open Pull Request

📝 License
This project is licensed under the MIT License - see LICENSE file for details.

🙏 Acknowledgments
Avalanche for the testnet and infrastructure

OpenZeppelin for secure contract templates

HeroUI for the beautiful component library

MetaMask for wallet integration

🔗 Links
Live Demo: [Coming Soon]

Smart Contract: [Snowtrace Fuji]

Documentation: [GitHub Wiki]

Issues: [GitHub Issues]

Built with ❤️ for the Avalanche Builder Competition