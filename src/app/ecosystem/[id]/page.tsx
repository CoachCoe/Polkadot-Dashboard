'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/types/ecosystem';
import { ecosystemService } from '@/services/ecosystem/ecosystemService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { formatNumber } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';

interface ProjectDetailsProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailsPage({ params }: ProjectDetailsProps) {
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await ecosystemService.getProjectById(params.id);
      setProject(data);
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load project details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Project not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20">
              <Image
                src={project.logo}
                alt={`${project.name} logo`}
                fill
                className="rounded-lg object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex gap-2 mt-2">
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

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {project.longDescription || project.description}
            </p>
          </Card>

          {project.features && project.features.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {project.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </Card>
          )}

          {project.team && project.team.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.team.map((member, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {member.avatar && (
                      <div className="relative w-10 h-10">
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Project Stats</h2>
            {project.stats && (
              <div className="grid grid-cols-2 gap-4">
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
                {project.stats.totalTransactions !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Total Transactions</p>
                    <p className="font-medium">{formatNumber(project.stats.totalTransactions)}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {project.token && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Token Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Symbol</p>
                  <p className="font-medium">{project.token.symbol}</p>
                </div>
                {project.token.price !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-medium">${project.token.price.toFixed(4)}</p>
                  </div>
                )}
                {project.token.marketCap !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Market Cap</p>
                    <p className="font-medium">${formatNumber(project.token.marketCap)}</p>
                  </div>
                )}
                {project.token.holders !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Holders</p>
                    <p className="font-medium">{formatNumber(project.token.holders)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Links</h2>
            <div className="space-y-3">
              {project.socialLinks.website && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={project.socialLinks.website} target="_blank">
                    🌐 Website
                  </Link>
                </Button>
              )}
              {project.socialLinks.documentation && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={project.socialLinks.documentation} target="_blank">
                    📚 Documentation
                  </Link>
                </Button>
              )}
              {project.socialLinks.github && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={project.socialLinks.github} target="_blank">
                    💻 GitHub
                  </Link>
                </Button>
              )}
              {project.socialLinks.twitter && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={project.socialLinks.twitter} target="_blank">
                    🐦 Twitter
                  </Link>
                </Button>
              )}
              {project.socialLinks.discord && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={project.socialLinks.discord} target="_blank">
                    💬 Discord
                  </Link>
                </Button>
              )}
              {project.socialLinks.telegram && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={project.socialLinks.telegram} target="_blank">
                    ✈️ Telegram
                  </Link>
                </Button>
              )}
            </div>
          </Card>

          {project.githubStats && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">GitHub Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Stars</p>
                  <p className="font-medium">{formatNumber(project.githubStats.stars)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Forks</p>
                  <p className="font-medium">{formatNumber(project.githubStats.forks)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contributors</p>
                  <p className="font-medium">{formatNumber(project.githubStats.contributors)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Update</p>
                  <p className="font-medium">
                    {new Date(project.githubStats.lastUpdate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 