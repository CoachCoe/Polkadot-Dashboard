'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  GlobeAltIcon,
  CodeBracketIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useEcosystem } from '@/hooks/useEcosystem';
import { projectStatsService } from '@/services/projectStats';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError } from '@/utils/errorHandling';
import type { Project, ProjectStats } from '@/services/ecosystem';

interface DetailedStats extends ProjectStats {
  // Additional fields specific to the detail view
  isStale?: boolean;
}

function StaleDataIndicator() {
  return (
    <div className="text-sm text-amber-600 flex items-center gap-1 mt-1">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <span>Stats may be outdated due to API limits</span>
    </div>
  );
}

function ProjectStats({ stats, isStale }: { stats: ProjectStats, isStale?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <dt className="text-sm font-medium text-gray-500">Total Value Locked</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          ${Number(stats.tvl || 0).toLocaleString()}
        </dd>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <dt className="text-sm font-medium text-gray-500">24h Volume</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          ${Number(stats.volume24h || 0).toLocaleString()}
        </dd>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <dt className="text-sm font-medium text-gray-500">24h Transactions</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {Number(stats.transactions24h || 0).toLocaleString()}
        </dd>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <dt className="text-sm font-medium text-gray-500">24h Active Users</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {Number(stats.uniqueUsers24h || 0).toLocaleString()}
        </dd>
      </div>
      {isStale && <StaleDataIndicator />}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { getProjectById } = useEcosystem();
  
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<DetailedStats>({
    tvl: '',
    volume24h: '',
    transactions24h: 0,
    uniqueUsers24h: 0,
    monthlyTransactions: 0,
    monthlyActiveUsers: 0,
    price: '',
    marketCap: '',
    isStale: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PolkadotHubError | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) {
        setError(new PolkadotHubError(
          'Invalid project ID',
          'INVALID_ID',
          'No project ID was provided'
        ));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get project details from ecosystem service
        const projectData = getProjectById(id);
        if (!projectData) {
          throw new PolkadotHubError(
            'Project not found',
            'NOT_FOUND',
            `No project found with ID: ${id}`
          );
        }
        setProject(projectData);

        // Fetch project stats
        const projectStats = await projectStatsService.getProjectStats(
          id,
          projectData.chainId
        );

        setStats({
          tvl: projectStats.tvl || '',
          volume24h: projectStats.volume24h || '',
          transactions24h: projectStats.transactions24h || 0,
          uniqueUsers24h: projectStats.uniqueUsers24h || 0,
          monthlyTransactions: projectStats.monthlyTransactions || 0,
          monthlyActiveUsers: projectStats.monthlyActiveUsers || 0,
          price: projectStats.price || '',
          marketCap: projectStats.marketCap || '',
          isStale: false
        });
      } catch (err) {
        setError(
          err instanceof PolkadotHubError
            ? err
            : new PolkadotHubError(
                'Failed to load project details',
                'LOAD_ERROR',
                err instanceof Error ? err.message : 'Unknown error occurred'
              )
        );
        console.error('Project detail error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjectDetails();
  }, [id, getProjectById]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="px-6 py-8">
          <ErrorDisplay
            error={error || new PolkadotHubError(
              'Project not found',
              'NOT_FOUND',
              'The requested project could not be found'
            )}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={project.logo}
              alt={`${project.name} logo`}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BanknotesIcon className="h-5 w-5 text-gray-400" />
              <h2 className="ml-3 text-sm font-medium text-gray-500">TVL</h2>
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.tvl ? `$${Number(stats.tvl).toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
              <h2 className="ml-3 text-sm font-medium text-gray-500">24h Volume</h2>
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.volume24h ? `$${Number(stats.volume24h).toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArrowPathIcon className="h-5 w-5 text-gray-400" />
              <h2 className="ml-3 text-sm font-medium text-gray-500">Monthly Transactions</h2>
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.monthlyTransactions?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <h2 className="ml-3 text-sm font-medium text-gray-500">Monthly Active Users</h2>
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.monthlyActiveUsers?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
              <h2 className="ml-3 text-sm font-medium text-gray-500">Website</h2>
            </div>
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              {project.website}
            </a>
          </div>

          {project.github && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CodeBracketIcon className="h-5 w-5 text-gray-400" />
                <h2 className="ml-3 text-sm font-medium text-gray-500">GitHub</h2>
              </div>
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                {project.github}
              </a>
            </div>
          )}

          {project.discord && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
                <h2 className="ml-3 text-sm font-medium text-gray-500">Discord</h2>
              </div>
              <a
                href={project.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                {project.discord}
              </a>
            </div>
          )}

          {project.twitter && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <h2 className="ml-3 text-sm font-medium text-gray-500">Twitter</h2>
              </div>
              <a
                href={project.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                {project.twitter}
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 