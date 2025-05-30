import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
          Explore Polkadot with a Modern Dashboard
        </h1>
        <p className="text-xl mb-12 text-gray-600">
          Access real-time blockchain data, manage your home dashboard, and participate in the ecosystem
        </p>
        <div className="flex justify-center gap-6">
          <Link href="/dashboard">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white">
              Launch Dashboard
            </Button>
          </Link>
          <Link href="https://github.com/CoachCoe/Polkadot-Dashboard" target="_blank">
            <Button size="lg" variant="outline" className="border-pink-600 text-pink-600 hover:bg-pink-600/10">
              View on GitHub
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Portfolio Management */}
          <Card className="p-6 bg-white border border-gray-200 hover:border-pink-200 transition-colors">
            <h3 className="text-2xl font-semibold mb-4 text-pink-500">Portfolio</h3>
            <p className="text-gray-600 mb-4">
              Track your balances, monitor staking rewards, and manage your assets across multiple chains
            </p>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-pink-500 hover:text-pink-600">
                Open Portfolio →
              </Button>
            </Link>
          </Card>

          {/* Staking */}
          <Card className="p-6 bg-white border border-gray-200 hover:border-purple-200 transition-colors">
            <h3 className="text-2xl font-semibold mb-4 text-purple-500">Staking</h3>
            <p className="text-gray-600 mb-4">
              Participate in network security, earn rewards, and monitor validator performance
            </p>
            <Link href="/staking">
              <Button variant="ghost" className="text-purple-500 hover:text-purple-600">
                Start Staking →
              </Button>
            </Link>
          </Card>

          {/* Governance */}
          <Card className="p-6 bg-white border border-gray-200 hover:border-indigo-200 transition-colors">
            <h3 className="text-2xl font-semibold mb-4 text-indigo-500">Governance</h3>
            <p className="text-gray-600 mb-4">
              Vote on referenda, delegate your voting power, and shape the future of the network
            </p>
            <Link href="/governance">
              <Button variant="ghost" className="text-indigo-500 hover:text-indigo-600">
                Participate →
              </Button>
            </Link>
          </Card>

          {/* Ecosystem */}
          <Card className="p-6 bg-white border border-gray-200 hover:border-blue-200 transition-colors">
            <h3 className="text-2xl font-semibold mb-4 text-blue-500">Ecosystem</h3>
            <p className="text-gray-600 mb-4">
              Discover projects, track performance metrics, and explore the Polkadot ecosystem
            </p>
            <Link href="/ecosystem">
              <Button variant="ghost" className="text-blue-500 hover:text-blue-600">
                Explore →
              </Button>
            </Link>
          </Card>

          {/* Developer Tools */}
          <Card className="p-6 bg-white border border-gray-200 hover:border-cyan-200 transition-colors">
            <h3 className="text-2xl font-semibold mb-4 text-cyan-500">Developer</h3>
            <p className="text-gray-600 mb-4">
              Access comprehensive documentation, APIs, and tools for building on Polkadot
            </p>
            <Link href="https://polkadot.js.org/docs/" target="_blank">
              <Button variant="ghost" className="text-cyan-500 hover:text-cyan-600">
                View Docs →
              </Button>
            </Link>
          </Card>

          {/* Network Stats */}
          <Card className="p-6 bg-white border border-gray-200 hover:border-teal-200 transition-colors">
            <h3 className="text-2xl font-semibold mb-4 text-teal-500">Network</h3>
            <p className="text-gray-600 mb-4">
              Monitor network performance, view statistics, and track key metrics
            </p>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-teal-500 hover:text-teal-600">
                View Stats →
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
} 