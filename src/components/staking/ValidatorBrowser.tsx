import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import polkadotApiService from '@/services/polkadotApiService';
import type { ValidatorInfo } from '@/types/staking';
import { formatBalance } from '@polkadot/util';

interface ValidatorBrowserProps {
  onSelect?: (validators: ValidatorInfo[]) => void;
  selectedValidators?: ValidatorInfo[];
  maxSelections?: number;
  className?: string;
}

export function ValidatorBrowser({
  onSelect,
  selectedValidators = [],
  maxSelections = 16,
  className
}: ValidatorBrowserProps) {
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [filteredValidators, setFilteredValidators] = useState<ValidatorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ValidatorInfo | 'identity.display';
    direction: 'asc' | 'desc';
  }>({ key: 'totalStake', direction: 'desc' });

  useEffect(() => {
    void loadValidators();
  }, []);

  useEffect(() => {
    filterAndSortValidators();
  }, [searchTerm, sortConfig, validators]);

  const loadValidators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const validatorList = await polkadotApiService.getValidators();
      setValidators(validatorList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load validators');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortValidators = () => {
    let filtered = [...validators];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(validator => 
        validator.address.toLowerCase().includes(term) ||
        validator.identity?.display?.toLowerCase().includes(term) ||
        validator.identity?.web?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = sortConfig.key === 'identity.display' 
        ? a.identity?.display || ''
        : a[sortConfig.key];
      let bValue: any = sortConfig.key === 'identity.display'
        ? b.identity?.display || ''
        : b[sortConfig.key];

      // Convert string numbers to actual numbers for proper sorting
      if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredValidators(filtered);
  };

  const handleSort = (key: keyof ValidatorInfo | 'identity.display') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleValidatorSelect = (validator: ValidatorInfo) => {
    const isSelected = selectedValidators.some(v => v.address === validator.address);
    let newSelection: ValidatorInfo[];

    if (isSelected) {
      newSelection = selectedValidators.filter(v => v.address !== validator.address);
    } else if (selectedValidators.length < maxSelections) {
      newSelection = [...selectedValidators, validator];
    } else {
      return; // Max selections reached
    }

    onSelect?.(newSelection);
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => void loadValidators()}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search validators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <Button
            variant="outline"
            onClick={() => void loadValidators()}
            className="shrink-0"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2 font-medium text-gray-500">
                  <button
                    onClick={() => handleSort('identity.display')}
                    className="flex items-center hover:text-gray-900"
                  >
                    Validator
                  </button>
                </th>
                <th className="pb-2 font-medium text-gray-500">
                  <button
                    onClick={() => handleSort('commission')}
                    className="flex items-center hover:text-gray-900"
                  >
                    Commission
                  </button>
                </th>
                <th className="pb-2 font-medium text-gray-500">
                  <button
                    onClick={() => handleSort('totalStake')}
                    className="flex items-center hover:text-gray-900"
                  >
                    Total Stake
                  </button>
                </th>
                <th className="pb-2 font-medium text-gray-500">
                  <button
                    onClick={() => handleSort('nominators')}
                    className="flex items-center hover:text-gray-900"
                  >
                    Nominators
                  </button>
                </th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredValidators.map((validator) => {
                const isSelected = selectedValidators.some(v => v.address === validator.address);
                const isDisabled = !isSelected && selectedValidators.length >= maxSelections;

                return (
                  <tr
                    key={validator.address}
                    className={`border-b last:border-b-0 ${
                      isSelected ? 'bg-pink-50' : 'hover:bg-gray-50'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-medium">
                          {validator.identity?.display || validator.address.slice(0, 6) + '...' + validator.address.slice(-4)}
                        </p>
                        {validator.identity?.web && (
                          <p className="text-sm text-gray-500">{validator.identity.web}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      {Number(validator.commission) / 10_000_000}%
                    </td>
                    <td className="py-4">
                      {formatBalance(validator.totalStake, { withUnit: 'DOT' })}
                    </td>
                    <td className="py-4">
                      {validator.nominators}
                    </td>
                    <td className="py-4">
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => handleValidatorSelect(validator)}
                        disabled={isDisabled}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedValidators.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Selected validators: {selectedValidators.length}/{maxSelections}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 