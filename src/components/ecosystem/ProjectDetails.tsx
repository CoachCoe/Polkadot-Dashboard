'use client';

import React from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import type { Project, ProjectStats } from '@/types/ecosystem';

interface DetailedStats extends ProjectStats {
  isStale?: boolean;
  lastUpdate?: Date;
}

interface ProjectDetailsProps {
  id: string;
  project: Project;
}

export function ProjectDetails({ id, project }: ProjectDetailsProps) {
  const [stats, setStats] = React.useState<DetailedStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // TODO: Implement stats fetching
        setStats({
          tvl: 1200000,
          dailyActiveUsers: 5000,
          totalTransactions: 150000,
          monthlyVolume: 500000,
          tokenPrice: 1.25,
          marketCap: 25000000,
          lastUpdate: new Date(),
          isStale: false
        });
      } catch (error) {
        console.error('Failed to fetch project stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, [id]);

  return (
    <DashboardLayout>
      <div className="px-6 py-4 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={project.logo}
              alt={project.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <a
              href={project.socialLinks.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <GlobeAltIcon className="h-6 w-6" />
            </a>
            {project.socialLinks.github && (
              <a
                href={project.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                <CodeBracketIcon className="h-6 w-6" />
              </a>
            )}
            {project.socialLinks.discord && (
              <a
                href={project.socialLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                <ChatBubbleLeftIcon className="h-6 w-6" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-pink-500" />
                  <h3 className="text-lg font-semibold">TVL</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  ${stats.tvl?.toLocaleString() ?? 'N/A'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-6 w-6 text-pink-500" />
                  <h3 className="text-lg font-semibold">Daily Active Users</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {stats.dailyActiveUsers?.toLocaleString() ?? 'N/A'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="h-6 w-6 text-pink-500" />
                  <h3 className="text-lg font-semibold">Total Transactions</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {stats.totalTransactions?.toLocaleString() ?? 'N/A'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-6 w-6 text-pink-500" />
                  <h3 className="text-lg font-semibold">Last Update</h3>
                </div>
                <p className="mt-2 text-lg">
                  {stats.lastUpdate?.toLocaleString()}
                </p>
              </div>
            </>
          ) : (
            <div className="col-span-4 text-center py-8">
              {isLoading ? 'Loading stats...' : 'Failed to load stats'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Category</p>
                <p className="font-medium">{project.category}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium">{project.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Launch Date</p>
                <p className="font-medium">
                  {project.launchDate
                    ? new Date(project.launchDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Chains</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {project.chains.map((chain) => (
                    <span
                      key={chain}
                      className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {chain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            {project.features ? (
              <ul className="list-disc list-inside space-y-2">
                {project.features.map((feature, index) => (
                  <li key={index} className="text-gray-700">
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No features listed</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 