import { ApiPromise } from '@polkadot/api';
import { polkadotService } from './polkadot';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { formatBalance } from '@polkadot/util';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { AddressOrPair } from '@polkadot/api/types';

interface ReferendumInfoJSON {
  track: string;
  proposal: {
    title?: string;
    description?: string;
  };
  proposer: string;
  status: {
    type: string;
    deciding?: {
      since: string | number;
    };
    confirming?: {
      since: string | number;
    };
    completed?: {
      at: string | number;
    };
  };
  submittedAt: string | number;
  deposit: string | number;
  tally: {
    ayes: string | number;
    nays: string | number;
    support: string | number;
  };
}

interface TrackJSON {
  name: string;
  description: string;
  minDeposit: string | number;
  decisionPeriod: string | number;
  preparePeriod: string | number;
  decidingPeriod: string | number;
  confirmPeriod: string | number;
  minApproval: string | number;
  minSupport: string | number;
}

interface DelegationJSON {
  isDelegating: boolean;
  asDelegating?: {
    target: string;
    balance: string | number;
    conviction: string | number;
    delegatedAt: string | number;
  };
}

export interface Referendum {
  index: number;
  track: string;
  title: string;
  description: string;
  proposer: string;
  status: string;
  submittedAt: string;
  deposit: string;
  tally: {
    ayes: string;
    nays: string;
    support: string;
  };
  timeline: {
    created: number;
    deciding: number | null;
    confirming: number | null;
    completed: number | null;
  };
}

export interface DelegationInfo {
  trackId: number;
  target: string;
  amount: string;
  conviction: number;
  delegatedAt: number;
}

export interface Track {
  id: number;
  name: string;
  description: string;
  minDeposit: string;
  decisionPeriod: number;
  preparePeriod: number;
  decidingPeriod: number;
  confirmPeriod: number;
  minApproval: number;
  minSupport: number;
}

class GovernanceService {
  private api: ApiPromise | null = null;
  private static instance: GovernanceService;

  private constructor() {}

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async getApi(): Promise<ApiPromise> {
    try {
      if (!this.api) {
        this.api = await polkadotService.getApi();
      }
      if (!this.api?.isConnected) {
        throw new PolkadotHubError(
          'Failed to connect to network',
          ErrorCodes.NETWORK.ERROR,
          'Unable to establish connection to the blockchain network.'
        );
      }
      return this.api;
    } catch (error) {
      throw handleError(error);
    }
  }

  async getReferenda(): Promise<Referendum[]> {
    try {
      const api = await this.getApi();
      if (!api.query.referenda?.referendumInfoFor) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const referendaEntries = await api.query.referenda.referendumInfoFor.entries();
      const referenda = referendaEntries.map(([key, value]: [{ args: AnyTuple }, Codec]) => {
        const index = (key.args[0] as unknown as { toNumber(): number }).toNumber();
        const rawInfo = value.toJSON() as unknown;
        
        if (!rawInfo || typeof rawInfo !== 'object') {
          throw new PolkadotHubError(
            'Invalid referendum data',
            ErrorCodes.DATA.INVALID,
            `Failed to parse referendum data for index ${index}`
          );
        }

        const info = rawInfo as ReferendumInfoJSON;

        return {
          index,
          track: String(info.track),
          title: info.proposal?.title || `Referendum #${index}`,
          description: info.proposal?.description || '',
          proposer: String(info.proposer),
          status: String(info.status.type),
          submittedAt: String(info.submittedAt),
          deposit: formatBalance(info.deposit, { decimals: 10 }),
          tally: {
            ayes: formatBalance(info.tally.ayes, { decimals: 10 }),
            nays: formatBalance(info.tally.nays, { decimals: 10 }),
            support: formatBalance(info.tally.support, { decimals: 10 })
          },
          timeline: {
            created: Number(info.submittedAt),
            deciding: info.status.deciding?.since ? Number(info.status.deciding.since) : null,
            confirming: info.status.confirming?.since ? Number(info.status.confirming.since) : null,
            completed: info.status.completed?.at ? Number(info.status.completed.at) : null
          }
        };
      });

      return referenda;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch referenda',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load governance referenda. Please try again.'
      );
    }
  }

  async getTracks(): Promise<Track[]> {
    try {
      const api = await this.getApi();
      if (!api.query.referenda?.tracks) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const tracksData = await api.query.referenda.tracks();
      const rawTracks = tracksData.toJSON() as unknown;
      
      if (!rawTracks || !Array.isArray(rawTracks)) {
        throw new PolkadotHubError(
          'Invalid tracks data',
          ErrorCodes.DATA.INVALID,
          'Failed to parse tracks data'
        );
      }

      const tracks = rawTracks as TrackJSON[];

      return tracks.map((track, id) => ({
        id,
        name: String(track.name),
        description: String(track.description),
        minDeposit: formatBalance(track.minDeposit, { decimals: 10 }),
        decisionPeriod: Number(track.decisionPeriod),
        preparePeriod: Number(track.preparePeriod),
        decidingPeriod: Number(track.decidingPeriod),
        confirmPeriod: Number(track.confirmPeriod),
        minApproval: Number(track.minApproval),
        minSupport: Number(track.minSupport)
      }));
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch tracks',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load governance tracks. Please try again.'
      );
    }
  }

  async getDelegations(address: string): Promise<DelegationInfo[]> {
    try {
      const api = await this.getApi();
      if (!api.query.convictionVoting?.votingFor) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const delegations = await api.query.convictionVoting.votingFor.entries(address);
      return delegations.map(([key, value]: [{ args: AnyTuple }, Codec]) => {
        const trackId = (key.args[1] as unknown as { toNumber(): number }).toNumber();
        const rawInfo = value.toJSON() as unknown;

        if (!rawInfo || typeof rawInfo !== 'object') {
          return null;
        }

        const info = rawInfo as DelegationJSON;

        if (info.isDelegating && info.asDelegating) {
          const { target, balance, conviction, delegatedAt } = info.asDelegating;
          return {
            trackId,
            target: String(target),
            amount: formatBalance(balance, { decimals: 10 }),
            conviction: Number(conviction),
            delegatedAt: Number(delegatedAt)
          };
        }

        return null;
      }).filter((delegation): delegation is DelegationInfo => delegation !== null);
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch delegations',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load delegation information. Please try again.'
      );
    }
  }

  async getDelegationHistory(_address: string): Promise<DelegationInfo[]> {
    try {
      const api = await this.getApi();
      if (!api.query.convictionVoting?.votingFor) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      // For now, we'll return an empty array as the history feature
      // requires additional chain indexing or a separate service to track historical data
      return [];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch delegation history',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load delegation history. Please try again.'
      );
    }
  }

  async vote(
    referendumIndex: number,
    vote: 'aye' | 'nay',
    amount: string,
    account: AddressOrPair
  ): Promise<void> {
    try {
      const api = await this.getApi();
      if (!api.tx.referenda?.vote) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const tx = api.tx.referenda.vote(referendumIndex, {
        Standard: {
          vote: vote === 'aye' ? { Aye: null } : { Nay: null },
          balance: amount
        }
      });

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(account, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            resolve();
          } else if (result.status.isInvalid) {
            reject(new Error('Invalid transaction'));
          }
        }).catch(reject);
      });
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to submit vote',
        ErrorCodes.API.ERROR,
        'Could not submit your vote. Please try again.'
      );
    }
  }

  async delegate(
    trackId: number,
    target: string,
    amount: string,
    conviction: number,
    account: AddressOrPair
  ): Promise<void> {
    try {
      const api = await this.getApi();
      if (!api.tx.convictionVoting?.delegate) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const tx = api.tx.convictionVoting.delegate(
        trackId,
        target,
        conviction,
        amount
      );

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(account, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            resolve();
          } else if (result.status.isInvalid) {
            reject(new Error('Invalid transaction'));
          }
        }).catch(reject);
      });
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to delegate votes',
        ErrorCodes.API.ERROR,
        'Could not delegate your voting power. Please try again.'
      );
    }
  }

  async undelegate(trackId: number, account: AddressOrPair): Promise<void> {
    try {
      const api = await this.getApi();
      if (!api.tx.convictionVoting?.undelegate) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const tx = api.tx.convictionVoting.undelegate(trackId);

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(account, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            resolve();
          } else if (result.status.isInvalid) {
            reject(new Error('Invalid transaction'));
          }
        }).catch(reject);
      });
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to undelegate votes',
        ErrorCodes.API.ERROR,
        'Could not undelegate your voting power. Please try again.'
      );
    }
  }
}

export const governanceService = GovernanceService.getInstance(); 