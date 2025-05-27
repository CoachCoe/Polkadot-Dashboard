'use client';

import * as React from 'react';
import { Slider } from '@/components/ui/Slider';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Tooltip } from '@/components/ui/Tooltip';
import { Info } from 'lucide-react';

interface VotingPowerVisualizerProps {
  balance: string;
  onVotingPowerChange?: (votingPower: number) => void;
}

interface ConvictionMultiplier {
  value: number;
  lockPeriod: string;
}

const DEFAULT_MULTIPLIER: ConvictionMultiplier = {
  value: 0.1,
  lockPeriod: 'None'
};

const CONVICTION_MULTIPLIERS: ConvictionMultiplier[] = [
  DEFAULT_MULTIPLIER,
  { value: 1, lockPeriod: '1 day' },
  { value: 2, lockPeriod: '2 days' },
  { value: 3, lockPeriod: '4 days' },
  { value: 4, lockPeriod: '8 days' },
  { value: 5, lockPeriod: '16 days' },
  { value: 6, lockPeriod: '32 days' }
];

export function VotingPowerVisualizer({ balance, onVotingPowerChange }: VotingPowerVisualizerProps) {
  const [amount, setAmount] = React.useState(0);
  const [conviction, setConviction] = React.useState(1);
  const maxAmount = parseFloat(balance);
  const multiplier = CONVICTION_MULTIPLIERS[conviction] || DEFAULT_MULTIPLIER;
  const votingPower = amount * multiplier.value;

  React.useEffect(() => {
    onVotingPowerChange?.(votingPower);
  }, [votingPower, onVotingPowerChange]);

  const handleAmountChange = (values: number[]) => {
    const newAmount = values[0] ?? 0;
    setAmount(newAmount);
  };

  const handleConvictionChange = (values: number[]) => {
    const newConviction = values[0] ?? 0;
    if (newConviction >= 0 && newConviction < CONVICTION_MULTIPLIERS.length) {
      setConviction(newConviction);
    }
  };

  const firstMultiplier = CONVICTION_MULTIPLIERS[0] || DEFAULT_MULTIPLIER;
  const lastMultiplier = CONVICTION_MULTIPLIERS[CONVICTION_MULTIPLIERS.length - 1] || DEFAULT_MULTIPLIER;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Amount to Vote With</Label>
            <Tooltip content="The amount of tokens you want to use for voting">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Tooltip>
          </div>
          <Slider
            value={[amount]}
            max={maxAmount}
            step={0.1}
            onValueChange={handleAmountChange}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0 DOT</span>
            <span>{maxAmount.toFixed(2)} DOT</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Conviction</Label>
            <Tooltip content="Higher conviction means more voting power but longer token lock period">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Tooltip>
          </div>
          <Slider
            value={[conviction]}
            max={CONVICTION_MULTIPLIERS.length - 1}
            step={1}
            onValueChange={handleConvictionChange}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0.1x ({firstMultiplier.lockPeriod})</span>
            <span>6x ({lastMultiplier.lockPeriod})</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <Label>Total Voting Power</Label>
            <span className="text-2xl font-bold">{votingPower.toFixed(2)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {amount.toFixed(2)} DOT × {multiplier.value}x multiplier
          </div>
          <div className="text-sm text-muted-foreground">
            Lock period: {multiplier.lockPeriod}
          </div>
        </div>
      </div>
    </Card>
  );
} 