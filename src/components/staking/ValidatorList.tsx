'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { stakingService, type ValidatorDetails } from '@/services/stakingService';
import { formatBalance } from '@polkadot/util';
import {
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface ValidatorListProps {
}

export function ValidatorList({}: ValidatorListProps) {
  const [validators, setValidators] = useState<ValidatorDetails[]>([]);
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void loadValidators();
  }, []);

  const loadValidators = async () => {
    try {
      setIsLoading(true);
      const validatorsData = await stakingService.getValidators();
      setValidators(validatorsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNominate = async () => {
    if (!stakeAmount || selectedValidators.length === 0) return;

    try {
      setIsLoading(true);
      await stakingService.nominate(selectedValidators, stakeAmount);
      await loadValidators(); // Refresh validators after nomination
      setStakeAmount('');
      setSelectedValidators([]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredValidators = validators.filter(validator => {
    const searchLower = searchTerm.toLowerCase();
    return (
      validator.identity.display.toLowerCase().includes(searchLower) ||
      validator.address.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search validators..."
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
          />
        </div>

        {selectedValidators.length > 0 && (
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount to stake"
              className="w-40 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
            <Button
              onClick={() => void handleNominate()}
              disabled={!stakeAmount || isLoading}
            >
              Nominate Selected
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredValidators.map((validator) => (
          <Card
            key={validator.address}
            className={`p-6 cursor-pointer transition-colors ${
              selectedValidators.includes(validator.address)
                ? 'ring-2 ring-pink-500'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setSelectedValidators(prev =>
                prev.includes(validator.address)
                  ? prev.filter(addr => addr !== validator.address)
                  : [...prev, validator.address]
              );
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {validator.identity.display || validator.address.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-500">
                  {validator.address}
                </p>
                {validator.identity.web && (
                  <a
                    href={validator.identity.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-600 hover:text-pink-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {validator.identity.web}
                  </a>
                )}
              </div>
              <span
                className={`text-sm px-2 py-1 rounded ${
                  validator.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {validator.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Total Stake</p>
                  <p className="font-medium">
                    {formatBalance(validator.totalStake, { decimals: 10 })} DOT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Commission</p>
                  <p className="font-medium">{validator.commission}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nominators</p>
                  <p className="font-medium">{validator.nominators}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Era Points</p>
                  <p className="font-medium">
                    {validator.performance[0]?.points || 0}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredValidators.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No validators found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
} 