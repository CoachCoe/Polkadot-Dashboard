'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  highlightElement?: string;
}

const defaultSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Polkadot Hub',
    description: 'Your all-in-one dashboard for managing Polkadot assets and participating in governance.',
    image: '/images/onboarding/welcome.png'
  },
  {
    title: 'Connect Your Wallet',
    description: 'Start by connecting your wallet to access your assets and participate in the network.',
    highlightElement: '[data-onboarding="wallet-connect"]'
  },
  {
    title: 'View Your Assets',
    description: 'Track your DOT balance, staking rewards, and other assets in one place.',
    highlightElement: '[data-onboarding="assets-overview"]'
  },
  {
    title: 'Participate in Governance',
    description: 'Vote on proposals and help shape the future of the network.',
    highlightElement: '[data-onboarding="governance-section"]'
  }
];

interface OnboardingFlowProps {
  steps?: OnboardingStep[];
  onComplete?: () => void;
}

export function OnboardingFlow({ steps = defaultSteps, onComplete }: OnboardingFlowProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [currentStep, setCurrentStep] = React.useState(0);

  const currentStepData = steps[currentStep];

  React.useEffect(() => {
    if (!currentStepData) return;

    const element = currentStepData.highlightElement 
      ? document.querySelector(currentStepData.highlightElement)
      : null;

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    }

    return () => {
      if (element) {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }
    };
  }, [currentStep, steps, currentStepData]);

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      setIsOpen(false);
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onComplete?.();
  };

  if (!currentStepData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="text-2xl font-bold">
          {currentStepData.title}
        </DialogTitle>
        <DialogDescription className="mt-4 text-base">
          {currentStepData.description}
        </DialogDescription>
        {currentStepData.image && (
          <div className="mt-4">
            <img
              src={currentStepData.image}
              alt={currentStepData.title}
              className="rounded-lg w-full"
            />
          </div>
        )}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    index === currentStep ? 'bg-primary' : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 