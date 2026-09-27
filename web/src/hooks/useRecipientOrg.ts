import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import type { OrgMember } from '../types';

export interface UseRecipientOrgReturn {
  recipientOrg: OrgMember | null;
  isSearching: boolean;
  isValidAddress: boolean;
}

export function useRecipientOrg(addressInput: string): UseRecipientOrgReturn {
  const [recipientOrg, setRecipientOrg] = useState<OrgMember | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanAddress = addressInput.trim();
  const isValidAddress = cleanAddress.length === 56 && cleanAddress.startsWith('G');

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isValidAddress) {
      setRecipientOrg(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('*')
          .eq('wallet_address', cleanAddress)
          .maybeSingle();

        if (error) throw error;
        setRecipientOrg((data as OrgMember) || null);
      } catch (err) {
        console.error('Failed to lookup recipient organization:', err);
        setRecipientOrg(null);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cleanAddress, isValidAddress]);

  return {
    recipientOrg,
    isSearching,
    isValidAddress,
  };
}