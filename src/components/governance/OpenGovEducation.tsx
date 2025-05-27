'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';

interface Topic {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const topics: Topic[] = [
  {
    id: 'intro',
    title: 'Introduction to OpenGov',
    content: `OpenGov is Polkadot's governance system that enables token holders to participate in the decision-making process. It introduces multiple tracks for different types of proposals, each with its own requirements and voting periods.`,
    difficulty: 'beginner'
  },
  {
    id: 'tracks',
    title: 'Governance Tracks',
    content: `Different proposal types are organized into tracks, each with specific parameters:
    • Root Track: For fundamental changes
    • Whitelist: For runtime upgrades
    • General Admin: For administrative decisions
    • Referendum: For general proposals
    Each track has its own deposit requirements, voting periods, and approval thresholds.`,
    difficulty: 'intermediate'
  },
  {
    id: 'voting',
    title: 'Voting Mechanisms',
    content: `OpenGov uses conviction voting, where you can lock your tokens for longer to increase your voting power. The longer you lock, the more voting power you get:
    • No lock: 1x voting power
    • 1 week: 2x voting power
    • 2 weeks: 3x voting power
    • 4 weeks: 4x voting power
    • 8 weeks: 5x voting power
    • 16 weeks: 6x voting power`,
    difficulty: 'beginner'
  },
  {
    id: 'delegation',
    title: 'Vote Delegation',
    content: `You can delegate your voting power to other addresses that you trust. This is useful if you want to participate in governance but don't have time to research every proposal. Delegation can be:
    • Track-specific: Delegate only for certain types of proposals
    • Token-specific: Delegate only a portion of your tokens
    • Conviction-based: Apply lock periods to delegated votes`,
    difficulty: 'intermediate'
  },
  {
    id: 'lifecycle',
    title: 'Proposal Lifecycle',
    content: `A proposal goes through several phases:
    1. Submission: Proposer submits with required deposit
    2. Preparation: Initial period for community discussion
    3. Decision: Active voting period begins
    4. Confirmation: Final period to ensure sustained support
    5. Execution: If approved, the proposal is enacted`,
    difficulty: 'advanced'
  }
];

export function OpenGovEducation() {
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredTopics = topics.filter(
    (topic) => filter === 'all' || topic.difficulty === filter
  );

  const renderTopic = (topic: Topic) => (
    <Card key={topic.id} className="p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{topic.title}</h3>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
              topic.difficulty === 'beginner'
                ? 'bg-green-100 text-green-800'
                : topic.difficulty === 'intermediate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
          </span>
          <div className="mt-2 text-gray-700 whitespace-pre-wrap">
            {topic.content}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">OpenGov Education</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'beginner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('beginner')}
          >
            Beginner
          </Button>
          <Button
            variant={filter === 'intermediate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('intermediate')}
          >
            Intermediate
          </Button>
          <Button
            variant={filter === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('advanced')}
          >
            Advanced
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTopics.map(renderTopic)}
      </div>

      <Card className="p-4 bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900">Need Help?</h3>
        <p className="mt-2 text-blue-800">
          If you have questions about OpenGov or need help understanding any
          concept, join our community channels or reach out to the support team.
        </p>
        <div className="mt-4 flex space-x-4">
          <Button variant="outline" size="sm">
            Join Discord
          </Button>
          <Button variant="outline" size="sm">
            Visit Wiki
          </Button>
          <Popover
            content={
              <div className="p-4">
                <h4 className="font-medium mb-2">Quick Tips</h4>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Start with beginner topics</li>
                  <li>Practice with small amounts first</li>
                  <li>Join community discussions</li>
                  <li>Follow proposal discussions</li>
                  <li>Ask questions in Discord</li>
                </ul>
              </div>
            }
          >
            <Button variant="outline" size="sm">
              Quick Tips
            </Button>
          </Popover>
        </div>
      </Card>
    </div>
  );
} 