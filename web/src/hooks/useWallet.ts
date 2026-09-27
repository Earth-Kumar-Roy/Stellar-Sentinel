import { useState, useEffect, useCallback } from 'react';
import { WalletService } from '../services/wallet';

export interface UseWalletReturn {
  walletAddress: string | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  hasFreighterInstalled: boolean | null;
}

export function useWallet(): UseWalletReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFreighterInstalled, setHasFreighterInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkExtension() {
      const installed = await WalletService.hasFreighter();
      if (isMounted) {
        setHasFreighterInstalled(installed);
        if (installed) {
          const active = await WalletService.getActiveAddress();
          if (active && isMounted) {
            setWalletAddress(active);
          }
        }
      }
    }
    checkExtension();
    return () => {
      isMounted = false;
    };
  }, []);

  const connectWallet = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);

    try {
      const address = await WalletService.requestConnection();
      setWalletAddress(address);
      return address;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Freighter';
      setError(msg);
      setWalletAddress(null);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setError(null);
  }, []);

  return {
    walletAddress,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    hasFreighterInstalled,
  };
}