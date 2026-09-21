import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient } from '@ton/ton';
import { useCallback } from 'react';
import { useAsyncInitialize } from './useAsyncInitialize';

export function useTonClient() {
  const initialize = useCallback(
    async () =>
      new TonClient({
        endpoint: await getHttpEndpoint({ network: 'testnet' }),
      }),
    [],
  );

  return useAsyncInitialize(initialize);
}
