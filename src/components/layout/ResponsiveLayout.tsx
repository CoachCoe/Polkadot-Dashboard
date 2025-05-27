'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveLayout({
  sidebar,
  children,
  className
}: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Sidebar */}
            <div
              className={cn(
                'fixed inset-0 z-50 lg:hidden',
                isSidebarOpen ? 'block' : 'hidden'
              )}
            >
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setIsSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-64 bg-background border-r p-4">
                {sidebar}
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 border-r p-4">
              {sidebar}
            </div>
          </>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 p-4',
          sidebar ? 'lg:ml-64' : ''
        )}>
          {children}
        </main>
      </div>
    </div>
  );
} 