import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  GlobeAltIcon,
  CodeBracketIcon,
  ChatBubbleLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Project } from '@/services/ecosystem';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTVL = (tvl: string) => {
    const num = parseInt(tvl);
    if (isNaN(num)) return tvl;
    return `$${formatNumber(num)}`;
  };

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 bg-[#FFF5F9] rounded-lg p-2">
            <Image
              src={project.logo}
              alt={`${project.name} logo`}
              fill
              className="object-contain p-1"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#172026] group-hover:text-[#E6007A] transition-colors">
              {project.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="tag">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-1">
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#666666] hover:text-[#E6007A] transition-colors"
          >
            <GlobeAltIcon className="h-5 w-5" />
          </a>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#666666] hover:text-[#E6007A] transition-colors"
            >
              <CodeBracketIcon className="h-5 w-5" />
            </a>
          )}
          {(project.discord || project.telegram) && (
            <a
              href={project.discord || project.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#666666] hover:text-[#E6007A] transition-colors"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      <p className="text-[#666666] mb-6 line-clamp-2 h-12">
        {project.description}
      </p>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 mb-6">
        {project.stats.tvl && (
          <div>
            <p className="text-sm text-[#666666]">TVL</p>
            <p className="font-medium text-[#172026]">{formatTVL(project.stats.tvl)}</p>
          </div>
        )}
        {project.stats.monthlyActiveUsers && (
          <div>
            <p className="text-sm text-[#666666]">Monthly Users</p>
            <p className="font-medium text-[#172026]">
              {formatNumber(project.stats.monthlyActiveUsers)}
            </p>
          </div>
        )}
        {project.stats.monthlyTransactions && (
          <div>
            <p className="text-sm text-[#666666]">Monthly Txs</p>
            <p className="font-medium text-[#172026]">
              {formatNumber(project.stats.monthlyTransactions)}
            </p>
          </div>
        )}
      </div>

      <Link
        href={`/ecosystem/${project.id}`}
        className="btn-secondary w-full flex items-center justify-center group-hover:bg-[#E6007A] group-hover:text-white"
      >
        View Details
        <ArrowRightIcon className="h-4 w-4 ml-2" />
      </Link>
    </div>
  );
} 