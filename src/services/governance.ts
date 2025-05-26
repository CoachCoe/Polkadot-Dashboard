import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types/types';
import { polkadotService } from './polkadot';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import type { Option } from '@polkadot/types';
import { BN } from '@polkadot/util';

export interface Referendum {
  index: number;
  track: string;
  title: string;
  description: string;
  status: 'Preparing' | 'Deciding' | 'Confirming' | 'Completed';
  tally: {
    ayes: string;
    nays: string;
    support: string;
  };
  enactmentPeriod: string;
  submittedBy: string;
  submittedAt: string;
}

export interface DelegationInfo {
  target: string;
  amount: string;
  conviction: number;
  trackId: number;
  delegatedAt: string;
}

export interface Track {
  id: number;
  name: string;
  description: string;
  stats?: {
    activeProposals: number;
    totalProposals: number;
    delegations: number;
    averageTurnout: number;
  };
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
      
      if (!api.query?.referenda?.referendumCount || !api.query?.referenda?.referendumInfoFor) {
        throw new PolkadotHubError(
          'Governance API not available',
          ErrorCodes.NETWORK.API_ERROR,
          'The governance API endpoints are not available. Please try again later.'
        );
      }

      const activeReferenda = await api.query.referenda.referendumInfoFor.entries();
      
      const referenda = await Promise.all(
        activeReferenda.map(async ([key, info]) => {
          try {
            const index = (key.args[0] as unknown as BN).toNumber();
            
            const referendumInfo = info as unknown as Option<Codec>;
            if (referendumInfo.isNone) {
              throw new PolkadotHubError(
                'Invalid referendum info',
                ErrorCodes.VALIDATION.INVALID_INFO,
                `Referendum #${index} information is not available.`
              );
            }

            const infoValue = referendumInfo.unwrap();
            const status = this.getReferendumStatus(infoValue);
            
            // Handle different referendum states
            if ((infoValue as any).isOngoing) {
              const ongoing = (infoValue as any).asOngoing;
              const hash = ongoing.proposal.hash.toHex();
              
              if (!api.query?.preimage?.preimageFor) {
                throw new PolkadotHubError(
                  'Preimage API not available',
                  ErrorCodes.NETWORK.API_ERROR,
                  'The preimage API endpoint is not available. Please try again later.'
                );
              }

              const preimage = await api.query.preimage.preimageFor(hash) as Option<Codec>;
              const preimageData = preimage.unwrapOr(null);
              
              if (!preimageData) {
                // Don't throw here, just log a warning and continue with placeholder data
                await securityLogger.logEvent({
                  type: SecurityEventType.API_ERROR,
                  timestamp: new Date().toISOString(),
                  details: {
                    warning: `Missing preimage data for referendum #${index}`,
                    hash
                  }
                });

                return {
                  index,
                  track: ongoing.track.toString(),
                  title: `Referendum #${index}`,
                  description: 'Preimage data not available.',
                  status,
                  tally: {
                    ayes: ongoing.tally.ayes.toString(),
                    nays: ongoing.tally.nays.toString(),
                    support: ongoing.tally.support.toString(),
                  },
                  enactmentPeriod: ongoing.enactment.toString(),
                  submittedBy: ongoing.submittedBy.toString(),
                  submittedAt: ongoing.submittedAt.toString()
                };
              }

              return {
                index,
                track: ongoing.track.toString(),
                title: `Referendum #${index}`,
                description: preimageData.toString(),
                status,
                tally: {
                  ayes: ongoing.tally.ayes.toString(),
                  nays: ongoing.tally.nays.toString(),
                  support: ongoing.tally.support.toString(),
                },
                enactmentPeriod: ongoing.enactment.toString(),
                submittedBy: ongoing.submittedBy.toString(),
                submittedAt: ongoing.submittedAt.toString()
              };
            } else if ((infoValue as any).isApproved || (infoValue as any).isRejected || (infoValue as any).isCancelled || (infoValue as any).isTimedOut) {
              // For completed referenda, return basic information
              return {
                index,
                track: '0', // Default track for completed referenda
                title: `Referendum #${index}`,
                description: 'This referendum has been completed.',
                status: 'Completed' as const,
                tally: {
                  ayes: '0',
                  nays: '0',
                  support: '0'
                },
                enactmentPeriod: '0',
                submittedBy: '',
                submittedAt: ''
              };
            } else {
              // For any other state, return a placeholder
              return {
                index,
                track: '0',
                title: `Referendum #${index}`,
                description: 'This referendum is in preparation.',
                status,
                tally: {
                  ayes: '0',
                  nays: '0',
                  support: '0'
                },
                enactmentPeriod: '0',
                submittedBy: '',
                submittedAt: ''
              };
            }
          } catch (error) {
            // Log the error but don't fail the entire request
            await securityLogger.logEvent({
              type: SecurityEventType.API_ERROR,
              timestamp: new Date().toISOString(),
              details: {
                error: String(error),
                referendumIndex: key.args[0]?.toString() || 'unknown'
              }
            });

            // Return a placeholder for failed referenda
            return {
              index: (key.args[0] as unknown as BN).toNumber(),
              track: '0',
              title: `Referendum #${(key.args[0] as unknown as BN).toNumber()}`,
              description: 'Failed to load referendum data.',
              status: 'Preparing' as const,
              tally: {
                ayes: '0',
                nays: '0',
                support: '0'
              },
              enactmentPeriod: '0',
              submittedBy: '',
              submittedAt: ''
            };
          }
        })
      );

      // Filter out any null values that might have occurred during processing
      return referenda.filter(Boolean);
    } catch (error) {
      // Log the error with more context
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error),
          component: 'GovernanceService',
          method: 'getReferenda'
        }
      });

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        'Failed to load governance data',
        ErrorCodes.DATA.ECOSYSTEM_LOAD_ERROR,
        'Unable to fetch referenda information. Please try again later.',
        error
      );
    }
  }

  async getTracks(): Promise<Track[]> {
    try {
      const api = await this.getApi();
      
      if (!api.query?.referenda?.trackQueue) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.NETWORK.API_ERROR,
          'The track queue API is not properly initialized.'
        );
      }

      const [tracks, referenda] = await Promise.all([
        api.query.referenda.trackQueue.entries(),
        this.getReferenda()
      ]);

      return tracks.map(([key, _]) => {
        const trackId = (key.args[0] as unknown as BN).toNumber();
        const trackReferenda = referenda.filter(ref => ref.track === trackId.toString());
        const activeProposals = trackReferenda.filter(ref => ref.status !== 'Completed').length;
        const totalProposals = trackReferenda.length;
        const delegations = 0; // This would come from an indexer in production
        const averageTurnout = trackReferenda.reduce((acc, ref) => {
          return acc + (parseFloat(ref.tally.support) || 0);
        }, 0) / (trackReferenda.length || 1);
        
        return {
          id: trackId,
          name: `Track ${trackId}`,
          description: this.getTrackDescription(trackId),
          stats: {
            activeProposals,
            totalProposals,
            delegations,
            averageTurnout: parseFloat((averageTurnout * 100).toFixed(1))
          }
        };
      });
    } catch (error) {
      throw handleError(error);
    }
  }

  async getDelegations(address: string): Promise<DelegationInfo[]> {
    if (!address) {
      throw new PolkadotHubError(
        'Invalid address',
        ErrorCodes.VALIDATION.INVALID_ADDRESS,
        'The provided address is invalid.'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.query?.convictionVoting?.votingFor) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.NETWORK.API_ERROR,
          'The conviction voting API is not properly initialized.'
        );
      }

      const delegations = await api.query.convictionVoting.votingFor.entries(address);
      return delegations.map(([key, info]) => {
        const trackId = (key.args[1] as unknown as BN).toNumber();
        const votingInfo = info as Codec;

        if (!(votingInfo as any).isDelegating) {
          throw new PolkadotHubError(
            'Invalid delegation state',
            ErrorCodes.VALIDATION.INVALID_STATE,
            'The voting state is not a delegation.'
          );
        }

        const delegationInfo = (votingInfo as any).asDelegating;
        
        return {
          target: delegationInfo.target.toString(),
          amount: delegationInfo.balance.toString(),
          conviction: delegationInfo.conviction.toNumber(),
          trackId,
          delegatedAt: new Date().toISOString() // In production, you'd get this from chain events
        };
      });
    } catch (error) {
      throw handleError(error);
    }
  }

  async getDelegationHistory(address: string): Promise<DelegationInfo[]> {
    if (!address) {
      throw new PolkadotHubError(
        'Invalid address',
        ErrorCodes.VALIDATION.INVALID_ADDRESS,
        'The provided address is invalid.'
      );
    }

    // In a production app, you'd typically get this from an indexer or chain events
    return this.getDelegations(address);
  }

  async castVote(referendumIndex: number, vote: 'aye' | 'nay', amount: string) {
    if (referendumIndex < 0) {
      throw new PolkadotHubError(
        'Invalid referendum index',
        ErrorCodes.VALIDATION.INVALID_INDEX,
        'The referendum index must be a positive number.'
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new PolkadotHubError(
        'Invalid amount',
        ErrorCodes.VALIDATION.INVALID_AMOUNT,
        'The voting amount must be a positive number.'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.tx?.convictionVoting?.vote) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.NETWORK.API_ERROR,
          'The conviction voting API is not properly initialized.'
        );
      }

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'CAST_VOTE',
          referendumIndex,
          vote,
          amount
        }
      });

      const tx = api.tx.convictionVoting.vote(referendumIndex, {
        Standard: { vote: vote === 'aye', balance: amount }
      });
      
      return tx;
    } catch (error) {
      throw handleError(error);
    }
  }

  async delegateVotes(trackId: number, target: string, amount: string, conviction: number) {
    if (trackId < 0) {
      throw new PolkadotHubError(
        'Invalid track ID',
        ErrorCodes.VALIDATION.INVALID_TRACK,
        'The track ID must be a positive number.'
      );
    }

    if (!target) {
      throw new PolkadotHubError(
        'Invalid target',
        ErrorCodes.VALIDATION.INVALID_TARGET,
        'The delegation target address is invalid.'
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new PolkadotHubError(
        'Invalid amount',
        ErrorCodes.VALIDATION.INVALID_AMOUNT,
        'The delegation amount must be a positive number.'
      );
    }

    if (conviction < 0 || conviction > 6) {
      throw new PolkadotHubError(
        'Invalid conviction',
        ErrorCodes.VALIDATION.INVALID_CONVICTION,
        'The conviction must be between 0 and 6.'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.tx?.convictionVoting?.delegate) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.NETWORK.API_ERROR,
          'The conviction voting API is not properly initialized.'
        );
      }

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'DELEGATE_VOTES',
          trackId,
          target,
          amount,
          conviction
        }
      });

      const tx = api.tx.convictionVoting.delegate(
        trackId,
        target,
        conviction,
        amount
      );
      
      return tx;
    } catch (error) {
      throw handleError(error);
    }
  }

  async undelegateVotes(trackId: number) {
    if (trackId < 0) {
      throw new PolkadotHubError(
        'Invalid track ID',
        ErrorCodes.VALIDATION.INVALID_TRACK,
        'The track ID must be a positive number.'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.tx?.convictionVoting?.undelegate) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.NETWORK.API_ERROR,
          'The conviction voting API is not properly initialized.'
        );
      }

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'UNDELEGATE_VOTES',
          trackId
        }
      });

      const tx = api.tx.convictionVoting.undelegate(trackId);
      return tx;
    } catch (error) {
      throw handleError(error);
    }
  }

  private getReferendumStatus(info: any): Referendum['status'] {
    if (info.isOngoing) {
      const ongoing = info.asOngoing;
      if (ongoing.deciding.isSome) {
        return 'Deciding';
      } else if (ongoing.confirming.isSome) {
        return 'Confirming';
      }
      return 'Preparing';
    } else if (info.isApproved || info.isRejected || info.isCancelled || info.isTimedOut) {
      return 'Completed';
    }
    return 'Preparing';
  }

  private getTrackDescription(trackId: number): string {
    const descriptions: Record<number, string> = {
      0: 'Root track for fundamental changes',
      1: 'Whitelisted caller track',
      2: 'General governance track',
      3: 'Council governance track',
      4: 'Technical track',
      // Add more track descriptions as needed
    };
    return descriptions[trackId] || 'Governance track';
  }
}

export const governanceService = GovernanceService.getInstance(); 