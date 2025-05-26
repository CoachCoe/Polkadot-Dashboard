'use client';

import React, { useState } from 'react';
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
  const [project] = useState<Project>(initialProject);
  const [stats] = useState<DetailedStats>({
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