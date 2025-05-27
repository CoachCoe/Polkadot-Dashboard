'use client';
import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ProjectFilter, ProjectCategory, ProjectStatus } from '@/types/ecosystem';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Checkbox } from '@/components/ui/Checkbox';

interface ProjectFiltersProps {
  currentFilter: ProjectFilter;
  onChange: (filter: ProjectFilter) => void;
  isLoading?: boolean;
}

export function ProjectFilters({ currentFilter, onChange, isLoading = false }: ProjectFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(currentFilter.searchTerm || '');
  const [selectedCategories, setSelectedCategories] = useState<ProjectCategory[]>(currentFilter.categories || []);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>(currentFilter.status || []);
  const [selectedChains, setSelectedChains] = useState<string[]>(currentFilter.chains || []);
  const [isVerified, setIsVerified] = useState(currentFilter.isVerified || false);
  const [isParachain, setIsParachain] = useState(currentFilter.isParachain || false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onChange({
      searchTerm: value,
      categories: selectedCategories,
      status: selectedStatuses,
      chains: selectedChains,
      isVerified,
      isParachain
    });
  };

  const handleCategoryChange = (categories: ProjectCategory[]) => {
    setSelectedCategories(categories);
    onChange({
      searchTerm,
      categories,
      status: selectedStatuses,
      chains: selectedChains,
      isVerified,
      isParachain
    });
  };

  const handleStatusChange = (statuses: ProjectStatus[]) => {
    setSelectedStatuses(statuses);
    onChange({
      searchTerm,
      categories: selectedCategories,
      status: statuses,
      chains: selectedChains,
      isVerified,
      isParachain
    });
  };

  const handleChainChange = (chains: string[]) => {
    setSelectedChains(chains);
    onChange({
      searchTerm,
      categories: selectedCategories,
      status: selectedStatuses,
      chains,
      isVerified,
      isParachain
    });
  };

  const handleVerifiedChange = (checked: boolean) => {
    setIsVerified(checked);
    onChange({
      searchTerm,
      categories: selectedCategories,
      status: selectedStatuses,
      chains: selectedChains,
      isVerified: checked,
      isParachain
    });
  };

  const handleParachainChange = (checked: boolean) => {
    setIsParachain(checked);
    onChange({
      searchTerm,
      categories: selectedCategories,
      status: selectedStatuses,
      chains: selectedChains,
      isVerified,
      isParachain: checked
    });
  };

  const categoryOptions: { value: ProjectCategory; label: string }[] = [
    { value: 'defi', label: 'DeFi' },
    { value: 'nft', label: 'NFTs' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'developer-tools', label: 'Developer Tools' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'social', label: 'Social' },
    { value: 'dao', label: 'DAO' },
    { value: 'privacy', label: 'Privacy' },
    { value: 'identity', label: 'Identity' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'live', label: 'Live' },
    { value: 'beta', label: 'Beta' },
    { value: 'testnet', label: 'Testnet' },
    { value: 'development', label: 'Development' },
    { value: 'concept', label: 'Concept' }
  ];

  const chainOptions = [
    { value: 'polkadot', label: 'Polkadot' },
    { value: 'kusama', label: 'Kusama' },
    { value: 'asset-hub', label: 'Asset Hub' },
    { value: 'acala', label: 'Acala' },
    { value: 'astar', label: 'Astar' },
    { value: 'moonbeam', label: 'Moonbeam' }
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          disabled={isLoading}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Categories</label>
          <MultiSelect
            value={selectedCategories}
            onValueChange={handleCategoryChange}
            items={categoryOptions}
            placeholder="Select categories"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <MultiSelect
            value={selectedStatuses}
            onValueChange={handleStatusChange}
            items={statusOptions}
            placeholder="Select status"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Chains</label>
          <MultiSelect
            value={selectedChains}
            onValueChange={handleChainChange}
            items={chainOptions}
            placeholder="Select chains"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified"
            checked={isVerified}
            onCheckedChange={handleVerifiedChange}
            disabled={isLoading}
          />
          <label
            htmlFor="verified"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Verified Projects
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="parachain"
            checked={isParachain}
            onCheckedChange={handleParachainChange}
            disabled={isLoading}
          />
          <label
            htmlFor="parachain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Parachains Only
          </label>
        </div>
      </div>
    </div>
  );
} 