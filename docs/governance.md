# Polkadot Dashboard Governance Features

## Overview
The Polkadot Dashboard provides a comprehensive interface for participating in on-chain governance. Users can view, vote on, and track referenda, as well as learn about the OpenGov system.

## Features

### Referenda Management
- View all active and past referenda
- Filter referenda by track and status
- Vote on referenda with conviction voting
- View detailed referendum information including:
  - Title and description
  - Track and status
  - Voting tallies
  - Timeline information

### Favorite Referenda
Users can mark referenda as favorites to:
- Keep track of important proposals
- Get quick access to frequently monitored referenda
- Filter and sort favorite referenda
- Persist favorites across sessions

Implementation details:
- Uses Zustand for state management
- Stores favorites in local storage
- Real-time updates of favorite status
- Proper error handling and loading states

### Voting History
Track your voting activity with:
- Complete history of past votes
- Filter by vote status (active/completed)
- View vote amounts and timestamps
- Sort by various criteria

Implementation details:
- Fetches voting history from the chain
- Handles both direct votes and delegations
- Provides filtering and sorting capabilities
- Shows detailed vote information

### OpenGov Education
Learn about Polkadot's governance system:
- Beginner-friendly introduction
- Detailed track explanations
- Voting mechanism tutorials
- Best practices and tips

Content is organized by difficulty level:
- Beginner: Basic concepts and terminology
- Intermediate: Detailed mechanics and strategies
- Advanced: Complex governance scenarios

### Technical Implementation

#### State Management
- Uses Zustand for client-side state
- Implements proper TypeScript types
- Handles loading and error states
- Provides real-time updates

#### API Integration
- Connects to Polkadot API for chain data
- Implements proper error handling
- Uses TypeScript for type safety
- Provides fallback mechanisms

#### Testing
- Unit tests for components
- Integration tests for API calls
- Mock implementations for testing
- Test coverage for edge cases

## Usage

### Viewing Referenda
1. Navigate to the Governance page
2. Browse the list of referenda
3. Use filters to find specific proposals
4. Click on a referendum for details

### Managing Favorites
1. Click the star icon to favorite a referendum
2. Access favorites from the Favorites tab
3. Remove favorites by clicking the star again
4. View only favorite referenda

### Checking Voting History
1. Connect your wallet
2. Navigate to the Voting History tab
3. View your past votes
4. Filter by status or date

### Learning About OpenGov
1. Visit the Learn tab
2. Choose your difficulty level
3. Read through the materials
4. Access quick tips and resources

## Development

### Adding New Features
1. Follow the established component structure
2. Implement proper TypeScript types
3. Add comprehensive tests
4. Update documentation

### Testing
Run tests with:
```bash
npm test
```

### Building
Build the project with:
```bash
npm run build
``` 