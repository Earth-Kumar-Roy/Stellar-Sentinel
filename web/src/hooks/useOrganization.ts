import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import type { OrgMember } from '../types';

export interface UseOrganizationReturn {
  member: OrgMember | null;
  isLoading: boolean;
  isRegistered: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
}

export function useOrganization(walletAddress: string | null): UseOrganizationReturn {
  const [member, setMember] = useState<OrgMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgDetails = useCallback(async () => {
    if (!walletAddress) {
      setMember(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      setMember((data as OrgMember) || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve organization member';
      setError(msg);
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

  return {
    member,
    isLoading,
    isRegistered: Boolean(member),
    error,
    refreshOrganization: fetchOrgDetails,
  };
}