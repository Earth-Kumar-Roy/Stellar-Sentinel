import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import type { PaymentIntentRecord } from '../types';

export interface UseDualTransactionsReturn {
  intents: PaymentIntentRecord[];
  quarantinedCount: number;
  isLoading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
  refetch: () => Promise<void>;
  fetchIntents: () => Promise<void>;
}

export function useDualTransactions(walletAddress: string | null): UseDualTransactionsReturn {
  const [intents, setIntents] = useState<PaymentIntentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) {
      setIntents([]);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Resolve user's organization to permit org-wide visibility for authorized roles
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('org_name, role')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      const orgName = memberData?.org_name;

      // 2. Query intents where the wallet is sender, counterparty, designated cosigner, or part of the same org
      let query = supabase.from('transactions_testnet').select('*');

      if (orgName && orgName !== 'none') {
        query = query.or(
          `from_wallet.eq.${walletAddress},to_wallet.eq.${walletAddress},cosigner_1_name.eq.${walletAddress},cosigner_2_name.eq.${walletAddress},org_name.eq.${orgName}`
        );
      } else {
        query = query.or(
          `from_wallet.eq.${walletAddress},to_wallet.eq.${walletAddress},cosigner_1_name.eq.${walletAddress},cosigner_2_name.eq.${walletAddress}`
        );
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setIntents((data as PaymentIntentRecord[]) || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to query transaction records';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    setIsLoading(true);
    fetchTransactions();

    // Deterministic polling interval matching ML Sentinel cycle (5 seconds)
    pollingRef.current = setInterval(() => {
      fetchTransactions();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchTransactions]);

  const quarantinedCount = intents.filter(
    (item) => item.status === 'quarantined'
  ).length;

  return {
    intents,
    quarantinedCount,
    isLoading,
    error,
    refreshTransactions: fetchTransactions,
    refetch: fetchTransactions,
    fetchIntents: fetchTransactions,
  };
}