'use client';

import Link from 'next/link';
import { Twitter, MessageCircle, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          <div className="flex space-x-6 mb-6">
            <Link
              href="https://twitter.com/Polkadot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#E6007A] transition-colors"
            >
              <Twitter className="w-6 h-6" />
              <span className="sr-only">Polkadot on X (Twitter)</span>
            </Link>
            <Link
              href="https://discord.gg/polkadot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#E6007A] transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="sr-only">Polkadot Discord</span>
            </Link>
            <Link
              href="https://www.linkedin.com/company/polkadot-network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#E6007A] transition-colors"
            >
              <Linkedin className="w-6 h-6" />
              <span className="sr-only">Polkadot LinkedIn</span>
            </Link>
          </div>
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Polkadot Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 