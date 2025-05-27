# Polkadot Dashboard

A modern, feature-rich dashboard for the Polkadot ecosystem, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Portfolio Management
- Real-time balance tracking across multiple accounts
- Detailed breakdown of total, available, and locked balances
- WebSocket integration for live balance updates
- Support for DOT and other ecosystem tokens
- Interactive balance cards with responsive design

### Ecosystem Explorer
- Comprehensive project directory with detailed information about Polkadot ecosystem projects
- Advanced filtering and sorting capabilities
- Real-time project statistics and analytics
- Project categories: DeFi, NFTs, Infrastructure, Developer Tools, Gaming, Social, DAOs, Privacy, and Identity
- Detailed project pages with:
  - Project overview and description
  - Team information
  - Token metrics
  - Social links and documentation
  - GitHub statistics
  - Performance analytics

### Project Stats
- Total Value Locked (TVL)
- Daily Active Users
- Transaction volumes
- Market capitalization
- Token holder statistics
- GitHub engagement metrics

### Wallet Integration
- Seamless wallet connection and management
- Real-time balance monitoring
- Support for multiple accounts
- Secure transaction handling
- Balance history tracking

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: React Query, Zustand
- **API Integration**: 
  - Polkadot.js API
  - WebSocket connections for real-time updates
- **Authentication**: NextAuth.js
- **Testing**: Jest, React Testing Library
- **Real-time Updates**: WebSocket integration
- **Data Formatting**: @polkadot/util

## Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn package manager

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

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

4. Seed the project data:
```bash
npm run seed
# or
yarn seed
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── ecosystem/         # Ecosystem explorer pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ecosystem/        # Ecosystem-specific components
│   ├── portfolio/        # Portfolio and balance components
│   └── ui/               # Reusable UI components
├── services/             # Service layer
│   ├── portfolioService  # Portfolio management services
│   └── ...              # Other services
├── store/               # State management
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed project data
- `npm test` - Run tests

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
- [Substrate](https://substrate.io/)