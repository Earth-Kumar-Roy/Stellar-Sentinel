-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE 1: Organization Members & Auth
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Treasurer', 'Signer')),
    password_hash TEXT NOT NULL,
    wallet_address VARCHAR(56) NOT NULL,
    gst_number TEXT DEFAULT NULL,
    gst_cert_url TEXT DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: Maximum 4 roles per organization
CREATE OR REPLACE FUNCTION check_max_org_roles()
RETURNS TRIGGER AS $$
DECLARE
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count
    FROM public.organization_members
    WHERE LOWER(org_name) = LOWER(NEW.org_name);

    IF role_count >= 4 THEN
        RAISE EXCEPTION 'An organization can have a maximum of 4 registered roles.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_org_roles ON public.organization_members;
CREATE TRIGGER enforce_max_org_roles
BEFORE INSERT ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION check_max_org_roles();

-- =====================================================
-- TABLE 2: Transactions (Testnet)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions_testnet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp_ist TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    intent_id BIGINT DEFAULT NULL,
    from_wallet VARCHAR(56) NOT NULL,
    to_wallet VARCHAR(56) NOT NULL,
    org_name TEXT NOT NULL DEFAULT 'none',
    sender_name TEXT NOT NULL DEFAULT 'none',
    sender_role TEXT NOT NULL DEFAULT 'none',
    cosigner_1_name TEXT NOT NULL DEFAULT 'none',
    cosigner_1_role TEXT NOT NULL DEFAULT 'none',
    cosigner_2_name TEXT NOT NULL DEFAULT 'none',
    cosigner_2_role TEXT NOT NULL DEFAULT 'none',
    total_amount NUMERIC(20, 7) NOT NULL,
    asset_address VARCHAR(56) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tx_hash VARCHAR(64) DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'observing', 'quarantined', 'executed', 'cancelled', 'rejected')),
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 3: Transactions (Mainnet)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions_mainnet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp_ist TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    intent_id BIGINT DEFAULT NULL,
    from_wallet VARCHAR(56) NOT NULL,
    to_wallet VARCHAR(56) NOT NULL,
    org_name TEXT NOT NULL DEFAULT 'none',
    sender_name TEXT NOT NULL DEFAULT 'none',
    sender_role TEXT NOT NULL DEFAULT 'none',
    cosigner_1_name TEXT NOT NULL DEFAULT 'none',
    cosigner_1_role TEXT NOT NULL DEFAULT 'none',
    cosigner_2_name TEXT NOT NULL DEFAULT 'none',
    cosigner_2_role TEXT NOT NULL DEFAULT 'none',
    total_amount NUMERIC(20, 7) NOT NULL,
    asset_address VARCHAR(56) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tx_hash VARCHAR(64) DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'observing', 'quarantined', 'executed', 'cancelled', 'rejected')),
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES & PERFORMANCE OPTIMIZATION
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_org_members_wallet ON public.organization_members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_org_members_org_name ON public.organization_members(org_name);

CREATE INDEX IF NOT EXISTS idx_tx_testnet_from ON public.transactions_testnet(from_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_testnet_to ON public.transactions_testnet(to_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_testnet_intent ON public.transactions_testnet(intent_id);

CREATE INDEX IF NOT EXISTS idx_tx_mainnet_from ON public.transactions_mainnet(from_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_mainnet_to ON public.transactions_mainnet(to_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_mainnet_intent ON public.transactions_mainnet(intent_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_testnet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_mainnet ENABLE ROW LEVEL SECURITY;

-- Allow public read for company search and recipient lookups
CREATE POLICY "Public Read Organizations" ON public.organization_members
    FOR SELECT USING (true);

-- Allow new member registrations
CREATE POLICY "Allow Insert Organizations" ON public.organization_members
    FOR INSERT WITH CHECK (true);

-- Allow public read for audit and explorer dashboard
CREATE POLICY "Public Read Testnet Transactions" ON public.transactions_testnet
    FOR SELECT USING (true);

CREATE POLICY "Public Insert Testnet Transactions" ON public.transactions_testnet
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Update Testnet Transactions" ON public.transactions_testnet
    FOR UPDATE USING (true);

CREATE POLICY "Public Read Mainnet Transactions" ON public.transactions_mainnet
    FOR SELECT USING (true);

CREATE POLICY "Public Insert Mainnet Transactions" ON public.transactions_mainnet
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Update Mainnet Transactions" ON public.transactions_mainnet
    FOR UPDATE USING (true);



-- Add email fields to transactions_testnet
ALTER TABLE public.transactions_testnet
ADD COLUMN IF NOT EXISTS sender_email TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS receiver_email TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cosigner_1_email TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cosigner_2_email TEXT NOT NULL DEFAULT 'none';

-- Add email fields to transactions_mainnet
ALTER TABLE public.transactions_mainnet
ADD COLUMN IF NOT EXISTS sender_email TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS receiver_email TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cosigner_1_email TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cosigner_2_email TEXT NOT NULL DEFAULT 'none';