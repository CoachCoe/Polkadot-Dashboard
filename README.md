# Polkadot Dashboard

A modern, feature-rich dashboard for the Polkadot ecosystem, built with Next.js, TypeScript, and Tailwind CSS. Access real-time blockchain data, manage your portfolio, and explore the Polkadot ecosystem all in one place.

## Features

### Portfolio Management
- Real-time balance tracking across multiple accounts
- Detailed breakdown of total, available, and locked balances
- Cross-chain balance monitoring (Polkadot, Asset Hub, Acala, Moonbeam, Astar)
- WebSocket integration for live balance updates
- Support for DOT and ecosystem tokens
- Interactive balance cards with responsive design
- Staking rewards tracking and analytics

### Staking Features
- Real-time validator information
- Staking rewards history and analytics
- APR calculations and projections
- Validator performance metrics
- Bonding and unbonding management
- Era and epoch tracking

### Governance Integration
- Referendum tracking and voting
- Delegation management
- Governance participation analytics
- Democracy locks monitoring
- Proposal tracking and analysis

### Ecosystem Explorer
- Comprehensive project directory
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

### Product Roadmap
- Overview of upcoming products and features
- Status tracking for each product
- Detailed feature lists
- Development progress indicators
- Three main products:
  - Polkadot Hub: Central dashboard for asset management and governance
  - PDP (Polkadot Development Platform): Comprehensive developer tools
  - Mobile Payments App: Seamless mobile payment solution

### Social Integration
- Direct links to Polkadot's social media
- Community engagement through:
  - X (Twitter) updates
  - Discord community
  - LinkedIn network
- Real-time social feed integration (coming soon)

### Wallet Integration
- Seamless wallet connection via Polkadot.js extension
- Multi-account support
- Real-time balance monitoring
- Secure transaction handling
- Balance history tracking
- Cross-chain transaction support

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: Zustand
- **Testing**:
  - Jest for unit and component testing
  - Cypress for end-to-end testing
  - Testing Library for React component testing
- **API Integration**: 
  - Polkadot.js API
  - WebSocket connections for real-time updates
  - Subscan API integration
- **Data Handling**: 
  - @polkadot/api
  - @polkadot/util
  - @polkadot/extension-dapp
- **Build & Deploy**: GitHub Actions, GitHub Pages
- **Real-time Updates**: WebSocket integration

## Getting Started

### Prerequisites
- Node.js 20.x or later
- npm or yarn package manager
- Polkadot.js extension installed in your browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CoachCoe/Polkadot-Dashboard.git
cd Polkadot-Dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── ecosystem/         # Ecosystem explorer pages
│   ├── staking/          # Staking management pages
│   ├── governance/       # Governance pages
│   └── home/        # Home pages
├── components/            # React components
│   ├── ecosystem/        # Ecosystem-specific components
│   ├── staking/         # Staking components
│   ├── governance/      # Governance components
│   ├── home/        # Home components
│   └── ui/               # Reusable UI components
├── services/             # Service layer
│   ├── polkadotApiService # Polkadot API integration
│   ├── portfolioService   # Portfolio management
│   ├── stakingService    # Staking operations
│   └── governanceService # Governance operations
│   └── homeService   # Home management
├── store/               # State management
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build static export
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest tests in watch mode
- `npm run test:coverage` - Run Jest tests with coverage report
- `npm run test:e2e` - Run Cypress tests in headless mode
- `npm run test:e2e:dev` - Open Cypress Test Runner for interactive testing
- `npm run test:all` - Run all tests (Jest, Cypress, and performance tests)

## Testing

### Unit and Component Tests
The project uses Jest and React Testing Library for unit and component testing. These tests ensure individual components and functions work as expected.

```bash
# Run Jest tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests
Cypress is used for end-to-end testing, ensuring the application works correctly from a user's perspective. The test suite covers critical user flows including:

- Wallet connection and management
- Governance page functionality
- Navigation and routing
- Component interactions

```bash
# Run Cypress tests in headless mode
npm run test:e2e

# Open Cypress Test Runner for interactive testing
npm run test:e2e:dev
```

Key test files:
- `cypress/e2e/governance.cy.ts` - Tests for governance functionality
- `cypress/e2e/wallet.cy.ts` - Tests for wallet connection and management

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
- [Subscan](https://subscan.io/)