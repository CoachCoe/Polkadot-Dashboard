import { ApiPromise, WsProvider } from '@polkadot/api';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { AccountInfo } from '@polkadot/types/interfaces';
import type { Header } from '@polkadot/types/interfaces/runtime';
import type { Vec } from '@polkadot/types';

export interface SubscriptionCallback<T = any> {
  (data: T): void;
}

class WebSocketService {
  private static instance: WebSocketService;
  private api: ApiPromise | null = null;
  private subscriptions: Map<string, () => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async connect(endpoint: string = 'wss://rpc.polkadot.io'): Promise<void> {
    try {
      if (this.api) {
        return;
      }

      const provider = new WsProvider(endpoint);
      this.api = await ApiPromise.create({ provider });

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;

      // Handle disconnection
      provider.on('disconnected', () => {
        console.warn('WebSocket disconnected. Attempting to reconnect...');
        void this.handleDisconnect();
      });

      // Handle errors
      provider.on('error', (error) => {
        console.error('WebSocket error:', error);
        void this.handleDisconnect();
      });
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to connect to WebSocket',
        ErrorCodes.WEBSOCKET.CONNECTION_ERROR,
        'Could not establish WebSocket connection. Please try again.'
      );
    }
  }

  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new PolkadotHubError(
        'Max reconnection attempts reached',
        ErrorCodes.WEBSOCKET.MAX_RETRIES_REACHED,
        'Could not reconnect to the network. Please check your connection and try again.'
      );
    }

    this.reconnectAttempts++;
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts));
    await this.connect();
  }

  async subscribeToBalanceChanges(
    address: string,
    callback: SubscriptionCallback<string>
  ): Promise<() => void> {
    if (!this.api?.query?.system?.account) {
      throw new PolkadotHubError(
        'WebSocket not connected',
        ErrorCodes.WEBSOCKET.NOT_CONNECTED,
        'Please connect to WebSocket before subscribing.'
      );
    }

    const unsubFn = (await this.api.query.system.account(
      address,
      (accountInfo: AccountInfo) => {
        const balance = accountInfo.data.free.toString();
        callback(balance);
      }
    )) as unknown as () => void;

    const subscriptionId = `balance:${address}`;
    this.subscriptions.set(subscriptionId, () => {
      try {
        unsubFn();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });

    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  async subscribeToValidatorUpdates(
    callback: SubscriptionCallback<string[]>
  ): Promise<() => void> {
    if (!this.api?.query?.staking?.validators) {
      throw new PolkadotHubError(
        'WebSocket not connected',
        ErrorCodes.WEBSOCKET.NOT_CONNECTED,
        'Please connect to WebSocket before subscribing.'
      );
    }

    const unsubFn = (await this.api.query.staking.validators((validators: Vec<any>) => {
      const validatorList = validators.toArray().map(v => v.toString());
      callback(validatorList);
    })) as unknown as () => void;

    const subscriptionId = 'validators';
    this.subscriptions.set(subscriptionId, () => {
      try {
        unsubFn();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });

    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  async subscribeToReferendumUpdates(
    callback: SubscriptionCallback<any[]>
  ): Promise<() => void> {
    if (!this.api?.query?.democracy?.referendumInfoOf?.entries) {
      throw new PolkadotHubError(
        'WebSocket not connected',
        ErrorCodes.WEBSOCKET.NOT_CONNECTED,
        'Please connect to WebSocket before subscribing.'
      );
    }

    const unsubFn = (await this.api.query.democracy.referendumInfoOf.entries((entries: any[]) => {
      const referenda = entries.map(([key, value]: [any, any]) => ({
        index: key.args[0].toString(),
        info: value.toJSON()
      }));
      callback(referenda);
    })) as unknown as () => void;

    const subscriptionId = 'referenda';
    this.subscriptions.set(subscriptionId, () => {
      try {
        unsubFn();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });

    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  async subscribeToBlockUpdates(
    callback: SubscriptionCallback<any>
  ): Promise<() => void> {
    if (!this.api?.rpc?.chain?.subscribeNewHeads) {
      throw new PolkadotHubError(
        'WebSocket not connected',
        ErrorCodes.WEBSOCKET.NOT_CONNECTED,
        'Please connect to WebSocket before subscribing.'
      );
    }

    const unsubFn = await this.api.rpc.chain.subscribeNewHeads((header: Header) => {
      callback({
        number: header.number.toString(),
        hash: header.hash.toString(),
        parentHash: header.parentHash.toString(),
        stateRoot: header.stateRoot.toString(),
        extrinsicsRoot: header.extrinsicsRoot.toString()
      });
    });

    const subscriptionId = 'blocks';
    this.subscriptions.set(subscriptionId, () => {
      try {
        unsubFn();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });

    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      // Unsubscribe from all subscriptions
      Array.from(this.subscriptions.values()).forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      this.subscriptions.clear();

      // Disconnect the API
      await this.api.disconnect();
      this.api = null;
    }
  }

  isConnected(): boolean {
    return this.api?.isConnected ?? false;
  }
}

export const websocketService = WebSocketService.getInstance(); 