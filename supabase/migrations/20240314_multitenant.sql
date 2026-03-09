-- =============================================
-- TABLE TENANTS
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Plan
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive', 'trialing', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',

  -- Limites selon le plan
  max_properties INT DEFAULT 1,
  max_users INT DEFAULT 2,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter tenant_id sur toutes les tables existantes
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);

-- =============================================
-- RLS MULTI-TENANT
-- =============================================

-- Fonction pour récupérer le tenant_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid UUID;
BEGIN
  SELECT p.tenant_id INTO tid
  FROM profiles p
  WHERE p.id = auth.uid();
  RETURN tid;
END;
$$;

-- RLS sur tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_owner_access" ON tenants
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "tenant_member_read" ON tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- RLS sur properties (multi-tenant)
DROP POLICY IF EXISTS "properties_tenant_isolation" ON properties;
CREATE POLICY "properties_tenant_isolation" ON properties
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- RLS sur bookings (multi-tenant)
DROP POLICY IF EXISTS "bookings_tenant_isolation" ON bookings;
CREATE POLICY "bookings_tenant_isolation" ON bookings
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- RLS sur tasks (multi-tenant)
DROP POLICY IF EXISTS "tasks_tenant_isolation" ON tasks;
CREATE POLICY "tasks_tenant_isolation" ON tasks
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Créer un nouveau tenant lors de l'inscription
CREATE OR REPLACE FUNCTION create_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_owner_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Créer le tenant
  INSERT INTO tenants (name, slug, owner_id, plan, plan_status)
  VALUES (p_name, p_slug, p_owner_id, 'free', 'trialing')
  RETURNING id INTO new_tenant_id;

  -- Associer le profil au tenant
  UPDATE profiles
  SET tenant_id = new_tenant_id, role = 'admin'
  WHERE id = p_owner_id;

  RETURN new_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_tenant(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;

-- Mettre à jour le plan après paiement Stripe
CREATE OR REPLACE FUNCTION update_tenant_plan(
  p_stripe_customer_id TEXT,
  p_plan TEXT,
  p_status TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_price_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tenants SET
    plan = p_plan,
    plan_status = p_status,
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_price_id = p_stripe_price_id,
    max_properties = CASE p_plan
      WHEN 'pro' THEN 10
      WHEN 'business' THEN 999
      ELSE 1
    END,
    max_users = CASE p_plan
      WHEN 'pro' THEN 5
      WHEN 'business' THEN 999
      ELSE 2
    END,
    updated_at = NOW()
  WHERE stripe_customer_id = p_stripe_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_tenant_plan(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
