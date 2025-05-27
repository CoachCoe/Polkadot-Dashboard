'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Info } from 'lucide-react';

interface OpenGovGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  title: string;
  content: string;
  learnMoreUrl?: string;
}

const openGovSections: GuideSection[] = [
  {
    title: 'What is OpenGov?',
    content: "OpenGov is Polkadot's next-generation governance system, designed to make the network more democratic and decentralized. It allows token holders to participate in decision-making through various tracks, each with its own rules and requirements.",
    learnMoreUrl: 'https://wiki.polkadot.network/docs/learn-opengov'
  },
  {
    title: 'Governance Tracks',
    content: 'OpenGov features multiple tracks for different types of proposals, from small technical changes to major network upgrades. Each track has specific voting periods, approval thresholds, and minimum deposit requirements.',
    learnMoreUrl: 'https://wiki.polkadot.network/docs/learn-opengov#tracks'
  },
  {
    title: 'Voting Power',
    content: 'Your voting power is determined by two factors: the amount of DOT you lock and the conviction multiplier you choose. Higher conviction means your vote counts more, but your tokens are locked for longer.',
    learnMoreUrl: 'https://wiki.polkadot.network/docs/learn-opengov#conviction-voting'
  },
  {
    title: 'Decision Making',
    content: 'Proposals go through multiple phases: Preparation, Decision, and Confirmation. The outcome is determined by both the amount of support (total votes) and approval (percentage in favor).',
    learnMoreUrl: 'https://wiki.polkadot.network/docs/learn-opengov#deciding'
  }
];

export function OpenGovGuide({ isOpen, onClose }: OpenGovGuideProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
          Understanding OpenGov
          <Tooltip content="Learn about Polkadot's governance system">
            <Info className="h-5 w-5 text-muted-foreground" />
          </Tooltip>
        </DialogTitle>
        <DialogDescription className="mt-4">
          Learn how Polkadot's governance system works and how you can participate in decision-making.
        </DialogDescription>

        <div className="mt-6 space-y-6">
          {openGovSections.map((section, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card transition-colors hover:bg-accent/50"
            >
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {section.content}
              </p>
              {section.learnMoreUrl && (
                <a
                  href={section.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Learn more →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 