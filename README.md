# Carbon Credit Marketplace

A decentralized application (dApp) for managing carbon credit tokens (CCT) and green NFTs. This platform allows users to claim CO₂ reductions, audit claims, and trade carbon credits in a transparent and secure manner.

## Features

- **Claim CO₂ Reduction**: Users can submit claims for CO₂ reduction projects
- **Audit System**: Registered auditors can verify and approve claims
- **Green NFTs**: Each audited claim is represented as a unique NFT
- **Carbon Credit Tokens (CCT)**: Minted upon successful audit of claims
- **Marketplace**: Buy and sell CCT tokens
- **Role-Based Access**: Different roles for project owners, auditors, and regular users

## Smart Contracts

The project consists of three main smart contracts:

1. **CarbonMarketplace.sol**: Main contract managing the marketplace, claims, and audits
2. **GreenNFT.sol**: ERC721 contract for minting NFTs representing audited claims
3. **CarbonCreditToken.sol**: ERC20 contract for the carbon credit tokens

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask wallet
- Access to a blockchain network (e.g., local development network or testnet)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd carbon-credit-marketplace
```

2. Install dependencies:
```bash
# Install smart contract dependencies
cd smart-contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment:
- Copy `.env.example` to `.env` in both `smart-contracts` and `frontend` directories
- Update the environment variables with your configuration

## Deployment

1. Deploy smart contracts:
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network <network-name>
```

2. Update contract addresses:
- Copy the deployed contract addresses to `frontend/src/addresses.js`

3. Start the frontend:
```bash
cd frontend
npm start
```

## Usage

### Connecting Wallet
1. Click "Connect Wallet" button
2. Approve the connection in MetaMask
3. View your wallet status and role (auditor/owner/regular user)

### Claiming CO₂ Reduction
1. Navigate to "Claim CO₂ Reduction" page
2. Enter the amount of CO₂ reduced
3. Submit the claim
4. Note the generated Project ID

### Auditing Claims (Auditors Only)
1. Navigate to "Audit Claims" page
2. Enter the Project ID
3. Provide documentation URI
4. Submit the audit

### Trading CCT Tokens
1. Navigate to "Marketplace" page
2. View your CCT balance
3. List tokens for sale or buy available tokens

### Registering Auditors (Contract Owner Only)
1. Navigate to "Register Auditor" page
2. Enter the auditor's wallet address
3. Submit the registration

## Roles and Permissions

- **Contract Owner**: Can register auditors and transfer contract ownership
- **Auditors**: Can audit claims and approve CO₂ reduction projects
- **Regular Users**: Can claim CO₂ reductions and trade CCT tokens

## Development

### Smart Contracts
- Located in `smart-contracts/contracts/`
- Tests in `smart-contracts/test/`
- Deployment scripts in `smart-contracts/scripts/`

### Frontend
- Built with React
- Uses ethers.js for blockchain interaction
- Styled with CSS

## Testing

1. Run smart contract tests:
```bash
cd smart-contracts
npx hardhat test
```

2. Run frontend tests:
```bash
cd frontend
npm test
```

## Security Considerations

- Always verify contract addresses
- Use secure networks for transactions
- Keep private keys secure
- Verify auditor status before submitting claims

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue in the repository. 