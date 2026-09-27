export interface OrgMember {
  id: string;
  org_name: string;
  email: string;
  phone?: string | null;
  full_name: string;
  role: 'Treasurer' | 'Guardian' | 'Signer';
  status: 'pending' | 'active' | 'rejected';
  password_hash: string;
  wallet_address: string;
  gst_number?: string | null;
  gst_cert_url?: string | null;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AuthState =
  | { status: 'DISCONNECTED' }
  | { status: 'CHECKING' }
  | { status: 'UNREGISTERED_WALLET'; wallet: string }
  | { status: 'WALLET_MISMATCH'; requiredWallet: string; currentWallet: string }
  | { status: 'PENDING_APPROVAL'; member: OrgMember }
  | { status: 'REJECTED_MEMBER'; member: OrgMember }
  | { status: 'AUTHENTICATED'; member: OrgMember; wallet: string };

export interface PaymentIntentRecord {
  id: string;
  timestamp_ist?: string;
  intent_id: number;
  from_wallet: string;
  to_wallet: string;
  org_name: string;
  sender_name: string;
  sender_role: string;
  cosigner_1_name?: string;
  cosigner_1_role?: string;
  cosigner_2_name?: string;
  cosigner_2_role?: string;
  total_amount: string;
  asset_address: string;
  description?: string;
  tx_hash?: string;
  status:
    | 'pending'
    | 'observing'
    | 'quarantined'
    | 'executed'
    | 'cancelled'
    | 'rejected';
  note?: string;
  sender_email?: string;
  receiver_email?: string;
  cosigner_1_email?: string;
  cosigner_2_email?: string;
  created_at: string;
}