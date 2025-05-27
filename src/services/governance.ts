import { ApiPromise } from '@polkadot/api';
import { polkadotService } from './polkadot';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { formatBalance } from '@polkadot/util';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { AddressOrPair } from '@polkadot/api/types';

// Add logger
const LOG_PREFIX = '[GovernanceService]';
const log = {
  info: (message: string, ...args: any[]) => console.log(`${LOG_PREFIX} ${message}`, ...args),
  error: (message: string, error?: any) => console.error(`${LOG_PREFIX} ${message}`, error || ''),
  warn: (message: string, ...args: any[]) => console.warn(`${LOG_PREFIX} ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`${LOG_PREFIX} ${message}`, ...args)
};


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

export interface ReferendumComment {
  id: string;
  referendumIndex: number;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  parentId?: string;
  reactions: {
    [key: string]: string[]; // emoji -> array of addresses that reacted
  };
}

export interface CreateCommentParams {
  referendumIndex: number;
  content: string;
  parentId?: string | undefined;
}

export interface VoteHistory {
  referendumIndex: number;
  vote: 'aye' | 'nay';
  amount: string;
  timestamp: number;
  status: 'active' | 'completed' | 'cancelled';
  title: string;
}

class GovernanceService {
  private api: ApiPromise | null = null;
  private static instance: GovernanceService;

  private constructor() {
    log.info('Initializing GovernanceService');
  }

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async getApi(): Promise<ApiPromise> {
    try {
      if (!this.api) {
        log.info('Connecting to Polkadot API...');
        this.api = await polkadotService.getApi();
        log.info('Successfully connected to Polkadot API');
      }
      if (!this.api?.isConnected) {
        log.error('API connection check failed');
        throw new PolkadotHubError(
          'Failed to connect to network',
          ErrorCodes.NETWORK.ERROR,
          'Unable to establish connection to the blockchain network.'
        );
      }
      return this.api;
    } catch (error) {
      log.error('Failed to get API connection', error);
      throw handleError(error);
    }
  }

  async getReferenda(): Promise<Referendum[]> {
    try {
      log.info('Fetching referenda...');
      const api = await this.getApi();
      if (!api.query.referenda?.referendumInfoFor) {
        log.error('Governance API endpoints not available');
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      const referendaEntries = await api.query.referenda.referendumInfoFor.entries();
      log.info(`Found ${referendaEntries.length} referenda`);

      const referenda = referendaEntries.map(([key, value]: [{ args: AnyTuple }, Codec]) => {
        const index = (key.args[0] as unknown as { toNumber(): number }).toNumber();
        const rawInfo = value.toJSON() as unknown;
        
        // Debug log to see the actual data structure
        log.debug(`Raw referendum data for index ${index}:`, rawInfo);

        if (!rawInfo || typeof rawInfo !== 'object') {
          log.warn(`Skipping invalid referendum data for index ${index}`);
          return null;
        }

        // Handle different possible referendum status formats
        let status = 'unknown';
        let decidingSince = null;
        let confirmingSince = null;
        let completedAt = null;
        let submittedAt = 0;
        let track = '0';
        let proposal = null;
        let proposer = '';
        let deposit = '0';
        let tally = { ayes: '0', nays: '0', support: '0' };

        // Check if it's the newer format with ongoing/approved/rejected status
        if ('ongoing' in rawInfo) {
          status = 'ongoing';
          const ongoing = (rawInfo as any).ongoing;
          track = String(ongoing?.track || 0);
          proposal = ongoing?.proposal;
          proposer = String(ongoing?.proposer || '');
          submittedAt = Number(ongoing?.submitted || 0);
          deposit = ongoing?.deposit || 0;
          tally = ongoing?.tally || { ayes: 0, nays: 0, support: 0 };
          
          if (ongoing?.deciding) {
            decidingSince = Number(ongoing.deciding.since || 0);
          }
          if (ongoing?.confirming) {
            confirmingSince = Number(ongoing.confirming.since || 0);
          }
        } else if ('approved' in rawInfo) {
          status = 'approved';
          const approved = (rawInfo as any).approved;
          completedAt = Number(approved?.since || 0);
        } else if ('rejected' in rawInfo) {
          status = 'rejected';
          const rejected = (rawInfo as any).rejected;
          completedAt = Number(rejected?.since || 0);
        } else if ('cancelled' in rawInfo) {
          status = 'cancelled';
          const cancelled = (rawInfo as any).cancelled;
          completedAt = Number(cancelled?.since || 0);
        } else if ('timedOut' in rawInfo) {
          status = 'timedOut';
          const timedOut = (rawInfo as any).timedOut;
          completedAt = Number(timedOut?.since || 0);
        } else if ('killed' in rawInfo) {
          status = 'killed';
          const killed = (rawInfo as any).killed;
          completedAt = Number(killed?.since || 0);
        }

        return {
          index,
          track: String(track),
          title: proposal?.title || `Referendum #${index}`,
          description: proposal?.description || '',
          proposer,
          status,
          submittedAt: String(submittedAt),
          deposit: formatBalance(deposit, { decimals: 10 }),
          tally: {
            ayes: formatBalance(tally.ayes, { decimals: 10 }),
            nays: formatBalance(tally.nays, { decimals: 10 }),
            support: formatBalance(tally.support, { decimals: 10 })
          },
          timeline: {
            created: submittedAt,
            deciding: decidingSince,
            confirming: confirmingSince,
            completed: completedAt
          }
        };
      }).filter((ref): ref is Referendum => ref !== null);

      return referenda;
    } catch (error) {
      log.error('Failed to fetch referenda', error);
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
      
      // Debug log the available API paths
      log.debug('Available API paths:', {
        referenda: Object.keys(api.query.referenda || {}),
        consts: Object.keys(api.consts.referenda || {}),
        query: Object.keys(api.query || {})
      });

      // Try different possible paths for tracks
      let tracks: Track[] = [];
      let seenTrackIds = new Set<number>();

      // Try convictionVoting.classLocksFor
      if (api.query.convictionVoting?.classLocksFor) {
        log.debug('Using convictionVoting.classLocksFor for tracks');
        const classIds = await api.query.convictionVoting.classLocksFor.entries();
        tracks = classIds.map(([key]) => {
          const id = (key.args[0] as any).toNumber?.() || 0;
          seenTrackIds.add(id);
          return {
            id,
            name: `Track ${id}`,
            description: '',
            minDeposit: formatBalance(0, { decimals: 10 }),
            decisionPeriod: 0,
            preparePeriod: 0,
            decidingPeriod: 0,
            confirmPeriod: 0,
            minApproval: 0,
            minSupport: 0
          };
        });
      }
      // Try referenda.decidingCount
      else if (api.query.referenda?.decidingCount) {
        log.debug('Using referenda.decidingCount for tracks');
        const trackCount = await api.query.referenda.decidingCount.entries();
        tracks = trackCount.map(([key]) => {
          const id = (key.args[0] as any).toNumber?.() || 0;
          if (seenTrackIds.has(id)) return null;
          seenTrackIds.add(id);
          return {
            id,
            name: `Track ${id}`,
            description: '',
            minDeposit: formatBalance(0, { decimals: 10 }),
            decisionPeriod: 0,
            preparePeriod: 0,
            decidingPeriod: 0,
            confirmPeriod: 0,
            minApproval: 0,
            minSupport: 0
          };
        }).filter((track): track is Track => track !== null);
      }
      // Try fellowship tracks as fallback
      else if (api.query.fellowshipReferenda?.trackQueue) {
        log.debug('Using fellowshipReferenda.trackQueue for tracks');
        const fellowshipTracks = await api.query.fellowshipReferenda.trackQueue.entries();
        tracks = fellowshipTracks.map(([key]) => {
          const id = (key.args[0] as any).toNumber?.() || 0;
          if (seenTrackIds.has(id)) return null;
          seenTrackIds.add(id);
          return {
            id,
            name: `Fellowship Track ${id}`,
            description: 'Fellowship Governance Track',
            minDeposit: formatBalance(0, { decimals: 10 }),
            decisionPeriod: 0,
            preparePeriod: 0,
            decidingPeriod: 0,
            confirmPeriod: 0,
            minApproval: 0,
            minSupport: 0
          };
        }).filter((track): track is Track => track !== null);
      }

      if (tracks.length === 0) {
        // If no tracks found, create default tracks 0-10
        log.warn('No tracks found, using default tracks');
        tracks = Array.from({ length: 11 }, (_, i) => {
          if (seenTrackIds.has(i)) return null;
          seenTrackIds.add(i);
          return {
            id: i,
            name: `Track ${i}`,
            description: 'Default Track',
            minDeposit: formatBalance(0, { decimals: 10 }),
            decisionPeriod: 0,
            preparePeriod: 0,
            decidingPeriod: 0,
            confirmPeriod: 0,
            minApproval: 0,
            minSupport: 0
          };
        }).filter((track): track is Track => track !== null);
      }

      // Sort tracks by ID to ensure consistent ordering
      tracks.sort((a, b) => a.id - b.id);

      log.info(`Successfully fetched ${tracks.length} tracks`);
      return tracks;

    } catch (error) {
      log.error('Failed to fetch tracks:', error);
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

  async getComments(referendumIndex: number): Promise<ReferendumComment[]> {
    try {
      log.info(`Fetching comments for referendum #${referendumIndex}`);
      const api = await this.getApi();
      
      if (!api.query.referenda) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      // TODO: Implement actual comment fetching logic
      // For now, return mock data
      return [
        {
          id: '1',
          referendumIndex,
          author: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          content: 'This is a sample comment',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          reactions: {}
        }
      ];
    } catch (error) {
      log.error('Failed to fetch comments', error);
      throw handleError(error);
    }
  }

  async addComment(params: CreateCommentParams, _account: AddressOrPair): Promise<void> {
    try {
      log.info(`Adding comment to referendum #${params.referendumIndex}`);
      const api = await this.getApi();
      
      if (!api.query.referenda) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      // TODO: Implement actual comment submission logic
      // For now, just log the attempt
      log.info('Comment would be added with params:', params);
    } catch (error) {
      log.error('Failed to add comment', error);
      throw handleError(error);
    }
  }

  async reactToComment(
    commentId: string,
    reaction: string,
    _account: AddressOrPair
  ): Promise<void> {
    try {
      log.info(`Adding reaction to comment ${commentId}`);
      const api = await this.getApi();
      
      if (!api.query.referenda) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      // TODO: Implement actual reaction submission logic
      // For now, just log the attempt
      log.info('Reaction would be added:', { commentId, reaction });
    } catch (error) {
      log.error('Failed to add reaction', error);
      throw handleError(error);
    }
  }

  async getVotingHistory(address: string): Promise<VoteHistory[]> {
    try {
      log.info(`Fetching voting history for address: ${address}`);
      const api = await this.getApi();
      
      if (!api.query.convictionVoting?.votingFor) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.API.ERROR,
          'The governance API endpoints are not available. Please try again.'
        );
      }

      // Get all referenda the address has voted on
      const votingEntries = await api.query.convictionVoting.votingFor.entries(address);

      // Process each voting entry
      const votes = await Promise.all(
        votingEntries.map(async ([key, value]: [{ args: AnyTuple }, Codec]) => {
          try {
            const referendumIndex = (key.args[1] as unknown as { toNumber(): number }).toNumber();
            const voteInfo = value.toJSON() as any;

            // Skip if not a direct vote
            if (!voteInfo?.casting?.vote) {
              return null;
            }

            // Get referendum details
            if (!api.query.referenda?.referendumInfoFor) {
              log.warn(`Referenda query not available for index ${referendumIndex}`);
              return null;
            }

            const referendum = await api.query.referenda.referendumInfoFor(referendumIndex);
            const referendumData = referendum.toJSON() as any;

            if (!referendumData) {
              return null;
            }

            // Determine vote status
            let status: 'active' | 'completed' | 'cancelled' = 'active';
            if (referendumData.approved || referendumData.rejected) {
              status = 'completed';
            } else if (referendumData.cancelled || referendumData.timedOut || referendumData.killed) {
              status = 'cancelled';
            }

            // Format the vote data
            return {
              referendumIndex,
              vote: voteInfo.casting.vote.aye ? 'aye' : 'nay',
              amount: formatBalance(voteInfo.casting.vote.balance, { decimals: 10 }),
              timestamp: Number(voteInfo.casting.vote.at || 0),
              status,
              title: referendumData?.ongoing?.proposal?.title || `Referendum #${referendumIndex}`
            };
          } catch (error) {
            log.error(`Error processing vote for referendum ${key.args[1]}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and sort by timestamp (newest first)
      return votes
        .filter((vote): vote is VoteHistory => vote !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      log.error('Failed to fetch voting history:', error);
      throw new PolkadotHubError(
        'Failed to fetch voting history',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load your voting history. Please try again.'
      );
    }
  }
}

export const governanceService = GovernanceService.getInstance(); 