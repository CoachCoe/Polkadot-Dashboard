'use client';

import { Project } from '@/types/ecosystem';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import Image from 'next/image';
import { formatNumber } from '@/utils/formatters';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/ecosystem/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image
                src={project.logo}
                alt={`${project.name} logo`}
                fill
                className="rounded-lg object-contain"
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <div className="flex gap-2">
                <Badge variant="outline">{project.category}</Badge>
                <Badge variant={project.status === 'live' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
                {project.isVerified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-gray-600 line-clamp-2">
            {project.description}
          </p>

          {project.stats && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {project.stats.tvl !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">TVL</p>
                  <p className="font-medium">${formatNumber(project.stats.tvl)}</p>
                </div>
              )}
              {project.stats.dailyActiveUsers !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">Daily Users</p>
                  <p className="font-medium">{formatNumber(project.stats.dailyActiveUsers)}</p>
                </div>
              )}
              {project.stats.monthlyVolume !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">Monthly Volume</p>
                  <p className="font-medium">${formatNumber(project.stats.monthlyVolume)}</p>
                </div>
              )}
              {project.token?.marketCap !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p className="font-medium">${formatNumber(project.token.marketCap)}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {project.chains.map(chain => (
              <Badge key={chain} variant="outline" className="text-xs">
                {chain}
              </Badge>
            ))}
          </div>

          {project.githubStats && (
            <div className="flex gap-4 text-sm text-gray-500">
              <span>⭐ {formatNumber(project.githubStats.stars)}</span>
              <span>🔄 {formatNumber(project.githubStats.forks)}</span>
              <span>👥 {formatNumber(project.githubStats.contributors)}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
} 