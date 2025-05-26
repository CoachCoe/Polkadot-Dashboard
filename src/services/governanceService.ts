import { polkadotService } from './polkadot';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { AddressOrPair } from '@polkadot/api/types';
import { websocketService } from './websocketService';

interface ReferendumInfoJson {
  title?: string;
  description?: string;
  proposer?: string;
  status?: string;
  ended?: boolean;
  tally?: {
    ayes?: string | number;
    nays?: string | number;
  };
  threshold?: string;
  end?: number;
}

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
  index: number;
  title: string;
  description: string;
  proposer: string;
  status: 'Ongoing' | 'Passed' | 'Rejected' | 'Cancelled';
  voteCount: {
    ayes: string;
    nays: string;
  };
  threshold: string;
  end: number;
}

export interface Track {
  id: number;
  name: string;
  description: string;
  minDeposit: string;
  decisionPeriod: number;
  preparePeriod: number;
  confirmPeriod: number;
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

class GovernanceService {
  private static instance: GovernanceService;

  private constructor() {}

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async getReferenda(): Promise<ReferendumInfo[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api.query.democracy?.referendumInfoOf) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.PROPOSAL_FAILED,
          'Democracy module not available'
        );
      }

      const referenda = await api.query.democracy.referendumInfoOf.entries();

      return referenda
        .map(([key, value]) => {
          const info = value.toJSON() as ReferendumInfoJson;
          if (!info || info.ended) return null;

          const keyData = key as unknown as { args: { toNumber: () => number }[] };
          if (!keyData.args?.[0]) return null;

          const index = keyData.args[0].toNumber();
          return {
            index,
            title: info.title || `Referendum #${index}`,
            description: info.description || '',
            proposer: info.proposer || '',
            status: (info.status || 'Ongoing') as ReferendumInfo['status'],
            voteCount: {
              ayes: (info.tally?.ayes || '0').toString(),
              nays: (info.tally?.nays || '0').toString()
            },
            threshold: info.threshold || 'SimpleMajority',
            end: info.end || 0
          };
        })
        .filter((ref): ref is ReferendumInfo => ref !== null);
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch referenda',
        ErrorCodes.GOVERNANCE.PROPOSAL_FAILED,
        'Could not load active referenda. Please try again.'
      );
    }
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
        confirmPeriod: track.confirmPeriod.toNumber()
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

      const hash = await tx.signAndSend(address);
      return hash.toString();
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

      const hash = await tx.signAndSend(address);
      return hash.toString();
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
      const api = await polkadotService.getApi();
      if (!api.tx.convictionVoting?.undelegate) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
          'Conviction voting module not available'
        );
      }

      const tx = api.tx.convictionVoting.undelegate(track);

      const hash = await tx.signAndSend(address);
      return hash.toString();
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

      return delegations.map(([key, value]) => {
        const delegationInfo = value.toJSON() as DelegationInfoJson;
        const keyData = key as unknown as { args: { toNumber: () => number }[] };
        if (!keyData.args?.[1] || !delegationInfo?.target || !delegationInfo?.balance) {
          throw new PolkadotHubError(
            'Invalid delegation data',
            ErrorCodes.GOVERNANCE.DELEGATION_FAILED,
            'Could not parse delegation information'
          );
        }

        return {
          delegator: address,
          target: delegationInfo.target,
          track: keyData.args[1].toNumber(),
          balance: delegationInfo.balance,
          timestamp: Date.now()
        };
      });
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