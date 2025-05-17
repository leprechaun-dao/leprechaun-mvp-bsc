# Leprechaun Protocol Frontend

This repository contains the frontend application for the Leprechaun Protocol, a decentralized finance (DeFi) system that enables users to create synthetic assets backed by collateral.

## Overview

Leprechaun Protocol allows users to mint synthetic assets (such as synthetic DOW, Gold, or Oil) by depositing various types of collateral. The frontend provides an intuitive interface for:

- Creating and managing collateralized debt positions (CDPs)
- Minting new synthetic assets
- Depositing additional collateral
- Withdrawing collateral
- Closing positions
- Viewing position health and metrics

## Key Features

- **Position Creation**: Create new positions by depositing collateral and minting synthetic assets
- **Position Management**: Deposit, withdraw, and close positions with an intuitive UI
- **Real-time Calculations**: Dynamic collateral ratio calculations and preview of operations
- **Collateral Management**: Support for multiple collateral types (mUSDC, mWETH, mWBTC)
- **Risk Visualization**: Clear indicators for position health and liquidation risk
- **Transaction Feedback**: Toast notifications for transaction status and confirmations

## Tech Stack

- **Framework**: Next.js
- **UI Components**: Built based on Shadcn
- **Form Handling**: React Hook Form
- **Blockchain Interaction**: Wagmi and viem
- **Wallet Connection**: ConnectKit
- **Styling**: Tailwind CSS
- **Notifications**: Sonner toast notifications

## Project Structure

The frontend is organized into several key components:

- **Main Page (`Home`)**: Entry point with mint form and positions table
- **Position Management Dialogs**:
  - `DepositDialog`: Add additional collateral to positions
  - `WithdrawalDialog`: Withdraw collateral from positions
  - `ClosePositionDialog`: Close and liquidate positions
- **Utilities**:
  - `constants.ts`: Contract addresses and ABIs
  - `web3/interfaces.ts`: TypeScript interfaces for contract data
  - `DecimalInput`: Custom input component for decimal values

## Getting Started

### Prerequisites

- Node.js (We recommend using v20+)
- Yarn
- A web3 wallet (MetaMask recommended)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/leprechaun-frontend.git
cd leprechaun-frontend
```

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Creating a Position

1. Connect your wallet using the "Connect Wallet" button
2. Select the collateral type and amount you want to deposit
3. Select the synthetic asset you want to mint
4. Adjust the collateral ratio using the slider (higher ratios are safer)
5. Click "Approve" to allow the contract to use your tokens
6. Click "Mint" to create your position

### Managing Positions

Your active positions are displayed in the table at the bottom of the page. For each position, you can:

- **Deposit**: Add more collateral to improve your position's health
- **Withdraw**: Remove excess collateral if your position is over-collateralized
- **Close Position**: Completely close your position by burning the synthetic asset

### Using Mock Tokens

For testing purposes, you can mint mock tokens (mUSDC, mWETH, mWBTC) using the buttons in the mint form. This is only available on test networks.

## Contract Addresses

The application interacts with the following smart contracts on the Base Network:

- **LeprechaunFactory**: `0x364A6127A8b425b6857f4962412b0664D257BDD5`
- **PositionManager**: `0x401d1cD4D0ff1113458339065Cf9a1f2e8425afb`
- **OracleInterface**: `0xBc2e651eD3566c6dF862815Ed05b99eFb9bC0255`
- **LeprechaunLens**: `0x80d4D0e68efDBB8b16fdD1e8ff7511ecc3869503`
- **Mock Tokens**:
  - mUSDC: `0x39510c9f9E577c65b9184582745117341e7bdD73`
  - mWETH: `0x95539ce7555F53dACF3a79Ff760C06e5B4e310c3`
  - mWBTC: `0x1DBf5683c73E0D0A0e20AfC76F924e08E95637F7`

## Key Components

### Position Creation Interface

The main interface allows users to:

1. Select a collateral type (mUSDC, mWETH, mWBTC)
2. Enter the amount of collateral to deposit
3. Select the synthetic asset to mint
4. Set a target collateral ratio (with minimum safety requirements)
5. View the maximum amount of synthetic assets that can be minted

### Position Management

For each position, users can:

- View current collateral ratio and liquidation threshold
- Monitor position health with visual indicators
- Add collateral to improve position health
- Withdraw excess collateral when over-collateralized
- Close positions to recover collateral

### Smart Features

- **Dynamic Calculations**: Real-time updates of mintable amounts based on collateral inputs
- **Health Indicators**: Visual indicators showing position health (danger, warning, safe zones)
- **Fee Previews**: Transparent display of protocol fees before transactions
- **Transaction Tracking**: Status updates for pending and confirmed transactions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
