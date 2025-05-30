'use client';

import { Card } from '@/components/ui/Card';

interface ProductCard {
  title: string;
  description: string;
  status: 'In Development' | 'Coming Soon' | 'Live';
  features: string[];
}

const products: ProductCard[] = [
  {
    title: 'Polkadot Hub',
    description: 'Your central dashboard for managing Polkadot assets and participating in governance.',
    status: 'In Development',
    features: [
      'Portfolio Management',
      'Staking Interface',
      'Governance Participation',
      'Cross-chain Operations'
    ]
  },
  {
    title: 'Polkadot Development Platform (PDP)',
    description: 'A comprehensive platform for developers building on Polkadot.',
    status: 'Coming Soon',
    features: [
      'Development Tools',
      'Testing Framework',
      'Documentation Hub',
      'Community Support'
    ]
  },
  {
    title: 'Mobile Payments App',
    description: 'Seamless mobile payments solution for the Polkadot ecosystem.',
    status: 'Coming Soon',
    features: [
      'Instant Transfers',
      'QR Code Payments',
      'Merchant Integration',
      'Multi-chain Support'
    ]
  }
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900">Product Roadmap</h1>
          <p className="mt-2 text-gray-600 text-lg">
            Explore our upcoming products and features for the Polkadot ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.title} className="p-6 bg-white shadow-sm border border-gray-100">
              <div className="flex flex-col h-full">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{product.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.status === 'Live' ? 'bg-green-100 text-green-800' :
                      product.status === 'In Development' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-6">{product.description}</p>
                </div>
                <div className="mt-auto">
                  <h3 className="font-medium text-gray-900 mb-2">Key Features:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center text-gray-600">
                        <span className="w-1.5 h-1.5 bg-[#E6007A] rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">Polkadot Jam</h3>
            <p className="text-gray-600">Join us for Polkadot Jam, a community event to explore and build on Polkadot.</p>
          </Card>
        </div>
      </div>
    </div>
  );
} 