# Polkadot Dashboard

A modern, user-friendly dashboard for interacting with the Polkadot ecosystem. Built with Next.js and Polkadot.js.

## Features

- 🔐 **Secure Wallet Integration**: Connect with Polkadot.js extension or other compatible wallets
- 📊 **Ecosystem Explorer**: Browse and discover Polkadot ecosystem projects
- 🏛️ **Governance**: Participate in on-chain governance and track referenda
- 💰 **Staking**: Manage your staking positions and validator relationships
- 📈 **Real-time Stats**: View TVL, transaction volumes, and other key metrics
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- [Polkadot.js Extension](https://polkadot.js.org/extension/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/polkadot-dashboard.git
cd polkadot-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_SUBSCAN_API_KEY=your_subscan_api_key
NEXT_PUBLIC_CSRF_TOKEN=your_csrf_token
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Architecture

- **Frontend**: Next.js 13+ with App Router
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Blockchain Integration**: Polkadot.js API
- **Authentication**: Wallet-based authentication with message signing
- **Data Sources**: 
  - Subscan API for blockchain data
  - DeFi Llama for TVL and market data
  - On-chain data via Polkadot.js API

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/         # React components
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── services/          # API and blockchain services
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Polkadot Network](https://polkadot.network/)
- [Polkadot.js](https://polkadot.js.org/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/) 