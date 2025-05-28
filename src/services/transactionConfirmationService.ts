import { SubmittableExtrinsic } from '@polkadot/api/types';
import { securityAuditService } from './securityAuditService';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { Signer } from '@polkadot/types/types/extrinsic';

interface TransactionDetails {
  type: string;
  from: string;
  to?: string;
  amount?: string;
  method?: string;
  args?: any[];
}

interface ConfirmationResult {
  success: boolean;
  hash?: string;
  blockHash?: string;
  error?: string;
}

class TransactionConfirmationService {
  private static instance: TransactionConfirmationService;

  private constructor() {}

  static getInstance(): TransactionConfirmationService {
    if (!TransactionConfirmationService.instance) {
      TransactionConfirmationService.instance = new TransactionConfirmationService();
    }
    return TransactionConfirmationService.instance;
  }

  async confirmAndSignTransaction(
    tx: SubmittableExtrinsic<'promise'>,
    details: TransactionDetails
  ): Promise<ConfirmationResult> {
    try {
      // Perform security audit
      await securityAuditService.auditTransaction(details);

      // Get signer
      const injector = await web3FromAddress(details.from);
      if (!injector?.signer) {
        throw new PolkadotHubError(
          'No signer found',
          ErrorCodes.WALLET.NO_SIGNER,
          'No signer available for this account'
        );
      }

      // Log transaction attempt
      await securityLogger.logEvent({
        type: SecurityEventType.TRANSACTION_SUBMIT,
        timestamp: new Date().toISOString(),
        details: {
          ...details,
          method: tx.method.section + '.' + tx.method.method
        }
      });

      // Sign and send transaction
      return new Promise((resolve, reject) => {
        tx.signAndSend(
          details.from,
          { signer: injector.signer as unknown as Signer },
          ({ status, events, dispatchError }) => {
            try {
              if (status.isInBlock || status.isFinalized) {
                const blockHash = status.asInBlock.toHex();

                if (dispatchError) {
                  const errorMessage = dispatchError.isModule 
                    ? `Module Error: ${dispatchError.asModule.toString()}`
                    : dispatchError.toString();

                  securityLogger.logEvent({
                    type: SecurityEventType.TRANSACTION_FAILURE,
                    timestamp: new Date().toISOString(),
                    details: {
                      ...details,
                      error: errorMessage,
                      blockHash
                    }
                  });

                  resolve({
                    success: false,
                    error: errorMessage,
                    blockHash
                  });
                } else {
                  // Check for ExtrinsicSuccess event
                  const successEvent = events.find(({ event }) => 
                    event.section === 'system' && event.method === 'ExtrinsicSuccess'
                  );

                  if (successEvent) {
                    securityLogger.logEvent({
                      type: SecurityEventType.TRANSACTION_SUCCESS,
                      timestamp: new Date().toISOString(),
                      details: {
                        ...details,
                        blockHash
                      }
                    });

                    resolve({
                      success: true,
                      hash: tx.hash.toHex(),
                      blockHash
                    });
                  }
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              securityLogger.logEvent({
                type: SecurityEventType.TRANSACTION_FAILURE,
                timestamp: new Date().toISOString(),
                details: {
                  ...details,
                  error: errorMessage
                }
              });
              reject(new PolkadotHubError(
                errorMessage,
                ErrorCodes.TX.FAILED,
                'Failed to process transaction'
              ));
            }
          }
        ).catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          securityLogger.logEvent({
            type: SecurityEventType.TRANSACTION_FAILURE,
            timestamp: new Date().toISOString(),
            details: {
              ...details,
              error: errorMessage
            }
          });
          reject(new PolkadotHubError(
            errorMessage,
            ErrorCodes.TX.FAILED,
            'Failed to submit transaction'
          ));
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await securityLogger.logEvent({
        type: SecurityEventType.TRANSACTION_FAILURE,
        timestamp: new Date().toISOString(),
        details: {
          ...details,
          error: errorMessage
        }
      });
      throw error;
    }
  }
}

export const transactionConfirmationService = TransactionConfirmationService.getInstance(); 