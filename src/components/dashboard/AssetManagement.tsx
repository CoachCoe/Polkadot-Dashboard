'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TransactionList } from '@/components/portfolio/TransactionList';
import { TokenList } from '@/components/portfolio/TokenList';
import { BridgeTransfer } from '@/components/bridge/BridgeTransfer';
import { OnRamp } from '@/components/bridge/OnRamp';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import type { Transaction } from '@/services/portfolioService';

export function AssetManagement() {
  const [activeTab, setActiveTab] = useState('tokens');
  const { selectedAccount } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      if (!selectedAccount) return;
      
      try {
        setIsLoading(true);
        const data = await portfolioService.getTransactions(selectedAccount.address);
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadTransactions();
  }, [selectedAccount]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Asset Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setActiveTab('bridge')}>
            Bridge
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('onramp')}>
            Buy DOT
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="bridge">Bridge</TabsTrigger>
          <TabsTrigger value="onramp">Buy DOT</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <TokenList />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionList transactions={transactions} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="bridge">
          <BridgeTransfer />
        </TabsContent>

        <TabsContent value="onramp">
          <OnRamp />
        </TabsContent>
      </Tabs>
    </Card>
  );
} 