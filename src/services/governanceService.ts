import { polkadotService } from './polkadot';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { AddressOrPair } from '@polkadot/api/types';
import { websocketService } from './websocketService';
import { securityAuditService } from './securityAuditService';
import { transactionConfirmationService } from './transactionConfirmationService';
import { encryptionService } from './encryptionService';
import type { Codec, AnyTuple } from '@polkadot/types/types';
import type { StorageKey } from '@polkadot/types';

interface TrackJson {
  id: { toNumber: () => number };
  name: { toString: () => string };
  description: { toString: () => string };
  minDeposit: { toString: () => string };
  decisionPeriod: { toNumber: () => number };
  preparePeriod: { toNumber: () => number };
  confirmPeriod: { toNumber: () => number };
}

interface DelegationInfoJson {
  target?: string;
  balance?: string;
}

export interface ReferendumInfo {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'cancelled';
  track: string;
  voteStart: number;
  voteEnd: number;
  threshold: string;
  ayes: string;
  nays: string;
  turnout: string;
}

export interface Track {
  id: number;
  name: string;
  description: string;
  minDeposit: string;
  decisionPeriod: number;
  preparePeriod: number;
  confirmPeriod: number;
  decidingPeriod: number;
  minApproval: number;
  minSupport: number;
}

export interface Vote {
  referendumIndex: number;
  voter: string;
  vote: {
    aye: boolean;
    conviction: number;
  };
  balance: string;
  timestamp: number;
}

export interface DelegationInfo {
  delegator: string;
  target: string;
  track: number;
  balance: string;
  timestamp: number;
}

export interface DelegateInfo {
  address: string;
  name?: string;
  delegatedBalance: string;
  delegatorCount: number;
  tracks: string[];
  votingHistory: {
    total: number;
    lastMonth: number;
    participation: number;
  };
}

class GovernanceService {
  private static instance: GovernanceService;

  private constructor() {}

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async getReferenda(filters?: {
    status?: string;
    track?: string;
    favorites?: boolean;
  }): Promise<ReferendumInfo[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api?.query?.referenda?.referendumInfoFor) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const referenda = await api.query.referenda.referendumInfoFor.entries();
      let results = referenda
        .map(([key, value]: [StorageKey<AnyTuple>, Codec]) => {
          try {
            const id = (key.args[0] as any).toNumber();
            const info = (value as any).unwrap();
            
            if (!info || info.isNone) return null;

            const data = info.unwrap();
            if (!data || !data.track || !data.proposer || !data.submitted || !data.length || !data.threshold || !data.tally) {
              return null;
            }

            const track = data.track.toString();
            const status = this.getReferendumStatus(data);
            
            return {
              id,
              title: `Referendum #${id}`,
              description: 'Description placeholder', // TODO: Get from IPFS or chain storage
              proposer: data.proposer.toString(),
              status,
              track,
              voteStart: data.submitted.toNumber(),
              voteEnd: data.submitted.toNumber() + data.length.toNumber(),
              threshold: data.threshold.toString(),
              ayes: data.tally.ayes.toString(),
              nays: data.tally.nays.toString(),
              turnout: data.tally.turnout.toString()
            };
          } catch (error) {
            console.error('Failed to parse referendum:', error);
            return null;
          }
        })
        .filter((ref): ref is ReferendumInfo => ref !== null);

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          results = results.filter(ref => ref.status === filters.status);
        }
        if (filters.track && filters.track !== 'all') {
          results = results.filter(ref => ref.track === filters.track);
        }
      }

      return results;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch referenda',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not load referenda. Please try again.'
      );
    }
  }

  async getFavoriteReferenda(address: string): Promise<number[]> {
    try {
      const response = await fetch(`/api/governance/favorites?address=${address}`);
      if (!response.ok) throw new Error('Failed to fetch favorites');
      const data = await response.json();
      return data.favorites;
    } catch (error) {
      console.error('Failed to fetch favorite referenda:', error);
      return [];
    }
  }

  async addFavoriteReferendum(address: string, referendumId: number): Promise<void> {
    try {
      const response = await fetch('/api/governance/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, referendumId }),
      });
      if (!response.ok) throw new Error('Failed to add favorite');
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to add favorite',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not add referendum to favorites. Please try again.'
      );
    }
  }

  async removeFavoriteReferendum(address: string, referendumId: number): Promise<void> {
    try {
      const response = await fetch('/api/governance/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, referendumId }),
      });
      if (!response.ok) throw new Error('Failed to remove favorite');
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to remove favorite',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not remove referendum from favorites. Please try again.'
      );
    }
  }

  async getDelegates(): Promise<DelegateInfo[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api?.query?.convictionVoting) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      // TODO: Implement delegate fetching from chain
      return [];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch delegates',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not load delegates. Please try again.'
      );
    }
  }

  private getReferendumStatus(data: any): ReferendumInfo['status'] {
    if (data.ongoing) return 'active';
    if (data.approved) return 'passed';
    if (data.rejected) return 'rejected';
    if (data.cancelled) return 'cancelled';
    return 'active';
  }

  async getTracks(): Promise<Track[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api.query.referenda?.tracks) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.PROPOSAL_FAILED,
          'Referenda module not available'
        );
      }

      const tracks = await api.query.referenda.tracks();
      const tracksArray = (tracks as unknown as TrackJson[]);

      return tracksArray.map(track => ({
        id: track.id.toNumber(),
        name: track.name.toString(),
        description: track.description.toString(),
        minDeposit: track.minDeposit.toString(),
        decisionPeriod: track.decisionPeriod.toNumber(),
        preparePeriod: track.preparePeriod.toNumber(),
        confirmPeriod: track.confirmPeriod.toNumber(),
        decidingPeriod: track.decisionPeriod.toNumber(),
        minApproval: 0.5,
        minSupport: 0.5
      }));
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch tracks',
        ErrorCodes.GOVERNANCE.PROPOSAL_FAILED,
        'Could not load governance tracks. Please try again.'
      );
    }
  }

  async vote(
    address: AddressOrPair,
    referendumIndex: number,
    vote: boolean,
    conviction: number,
    balance: string
  ): Promise<string> {
    try {
      // Perform security audit before transaction
      await securityAuditService.auditTransaction({
        type: 'vote',
        from: address.toString(),
        amount: balance,
        metadata: {
          referendumIndex,
          vote,
          conviction
        }
      });

      const api = await polkadotService.getApi();
      if (!api.tx.democracy?.vote) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.VOTE_FAILED,
          'Democracy module not available'
        );
      }

      const tx = api.tx.democracy.vote(referendumIndex, {
        Standard: {
          vote: { aye: vote, conviction },
          balance
        }
      });

      const result = await transactionConfirmationService.confirmAndSignTransaction(tx, {
        type: 'vote',
        from: address.toString(),
        method: 'democracy.vote',
        args: [referendumIndex, vote, conviction, balance]
      });

      if (!result.success) {
        throw new PolkadotHubError(
          result.error || 'Vote failed',
          ErrorCodes.GOVERNANCE.VOTE_FAILED,
          'Could not submit your vote. Please try again.'
        );
      }

      return result.hash || '';
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to submit vote',
        ErrorCodes.GOVERNANCE.VOTE_FAILED,
        'Could not submit your vote. Please try again.'
      );
    }
  }

  async delegate(
    address: AddressOrPair,
    target: string,
    track: number,
    balance: string,
    conviction: number
  ): Promise<string> {
    try {
      // Perform security audit before transaction
      await securityAuditService.auditTransaction({
        type: 'delegate',
        from: address.toString(),
        to: target,
        amount: balance,
        metadata: {
          track,
          conviction
        }
      });

      const api = await polkadotService.getApi();
      if (!api.tx.convictionVoting?.delegate) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
          'Conviction voting module not available'
        );
      }

      const tx = api.tx.convictionVoting.delegate(
        track,
        target,
        conviction,
        balance
      );

      const result = await transactionConfirmationService.confirmAndSignTransaction(tx, {
        type: 'delegate',
        from: address.toString(),
        to: target,
        amount: balance,
        method: 'convictionVoting.delegate',
        args: [track, target, conviction, balance]
      });

      if (!result.success) {
        throw new PolkadotHubError(
          result.error || 'Delegation failed',
          ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
          'Could not delegate your voting power. Please try again.'
        );
      }

      return result.hash || '';
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to delegate votes',
        ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
        'Could not delegate your voting power. Please try again.'
      );
    }
  }

  async undelegate(
    address: AddressOrPair,
    track: number
  ): Promise<string> {
    try {
      // Perform security audit before transaction
      await securityAuditService.auditTransaction({
        type: 'undelegate',
        from: address.toString(),
        metadata: {
          track
        }
      });

      const api = await polkadotService.getApi();
      if (!api.tx.convictionVoting?.undelegate) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
          'Conviction voting module not available'
        );
      }

      const tx = api.tx.convictionVoting.undelegate(track);

      const result = await transactionConfirmationService.confirmAndSignTransaction(tx, {
        type: 'undelegate',
        from: address.toString(),
        method: 'convictionVoting.undelegate',
        args: [track]
      });

      if (!result.success) {
        throw new PolkadotHubError(
          result.error || 'Undelegation failed',
          ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
          'Could not undelegate your voting power. Please try again.'
        );
      }

      return result.hash || '';
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to undelegate votes',
        ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
        'Could not undelegate your voting power. Please try again.'
      );
    }
  }

  async getDelegations(address: string): Promise<DelegationInfo[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api.query.convictionVoting?.votingFor) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
          'Conviction voting module not available'
        );
      }

      const delegations = await api.query.convictionVoting.votingFor.entries(address);

      // Encrypt sensitive delegation data
      const encryptedDelegations = await Promise.all(
        delegations.map(async ([key, value]) => {
          const delegationInfo = value.toJSON() as DelegationInfoJson;
          const keyData = key as unknown as { args: { toNumber: () => number }[] };
          
          if (!keyData.args?.[1] || !delegationInfo?.target || !delegationInfo?.balance) {
            throw new PolkadotHubError(
              'Invalid delegation data',
              ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
              'Could not parse delegation information'
            );
          }

          const delegation = {
            delegator: address,
            target: delegationInfo.target,
            track: keyData.args[1].toNumber(),
            balance: delegationInfo.balance,
            timestamp: Date.now()
          };

          // Encrypt sensitive data
          const encrypted = await encryptionService.encryptSensitiveData({
            walletAddress: delegation.target,
            privateData: delegation.balance,
            metadata: {
              track: delegation.track,
              timestamp: delegation.timestamp
            }
          });

          return {
            ...delegation,
            encryptedData: encrypted
          };
        })
      );

      return encryptedDelegations;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch delegations',
        ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
        'Could not load delegation information. Please try again.'
      );
    }
  }

  async getDelegationHistory(_address: string): Promise<DelegationInfo[]> {
    // This would typically require an indexer or additional storage
    // For now, return an empty array
    return [];
  }

  async subscribeToReferendumUpdates(
    callback: (referenda: ReferendumInfo[]) => void
  ): Promise<() => void> {
    return websocketService.subscribeToReferendumUpdates(async () => {
      const referenda = await this.getReferenda();
      callback(referenda);
    });
  }
}

export const governanceService = GovernanceService.getInstance(); 