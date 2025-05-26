'use client';

import React, { useEffect, useState } from 'react';
import {
  GlobeAltIcon,
  CodeBracketIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useEcosystem } from '@/hooks/useEcosystem';
import { projectStatsService } from '@/services/projectStats';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { Project, ProjectStats } from '@/services/ecosystem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DetailedStats extends ProjectStats {
  isStale?: boolean;
}

interface ProjectDetailsProps {
  id: string;
  project: Project;
}

export function ProjectDetails({ id, project: initialProject }: ProjectDetailsProps) {
  const { getProjectById } = useEcosystem();
  const [project, setProject] = useState<Project | null>(initialProject);
  const [stats, setStats] = useState<DetailedStats>({
    tvl: initialProject.stats.tvl || '',
    volume24h: initialProject.stats.volume24h || '',
    transactions24h: initialProject.stats.transactions24h || 0,
    uniqueUsers24h: initialProject.stats.uniqueUsers24h || 0,
    monthlyTransactions: initialProject.stats.monthlyTransactions || 0,
    monthlyActiveUsers: initialProject.stats.monthlyActiveUsers || 0,
    price: initialProject.stats.price || '',
    marketCap: initialProject.stats.marketCap || '',
    isStale: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PolkadotHubError | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) {
        setError(new PolkadotHubError(
          'Invalid project ID',
          ErrorCodes.VALIDATION.INVALID_ID,
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
            ErrorCodes.DATA.NOT_FOUND,
            `No project found with ID: ${id}`
          );
        }
        
        if (!projectData.chainId) {
          throw new PolkadotHubError(
            'Invalid project data',
            ErrorCodes.DATA.INVALID,
            'Project chain ID is missing'
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
                ErrorCodes.DATA.NOT_FOUND,
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
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <ErrorDisplay error={error || new PolkadotHubError(
          'Project not found',
          ErrorCodes.DATA.NOT_FOUND,
          'The requested project could not be found'
        )} />
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