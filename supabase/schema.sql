-- ============================================================
-- NendazTech Concierge — Schema SQL complet pour Supabase
-- ============================================================

-- ============================================================
-- 1. TYPES ENUM
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'owner', 'manager', 'cleaner');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'completed');
CREATE TYPE booking_source AS ENUM ('airbnb', 'booking', 'direct', 'other');
CREATE TYPE task_type AS ENUM ('cleaning', 'maintenance', 'inspection', 'welcome');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============================================================
-- 2. FONCTION TRIGGER updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. TABLE profiles
-- ============================================================

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'owner',
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 4. TABLE properties
-- ============================================================

CREATE TABLE properties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  description TEXT,
  bedrooms    INTEGER NOT NULL DEFAULT 1,
  bathrooms   INTEGER NOT NULL DEFAULT 1,
  max_guests  INTEGER NOT NULL DEFAULT 2,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 5. TABLE bookings
-- ============================================================

CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_name   TEXT NOT NULL,
  guest_email  TEXT,
  guest_phone  TEXT,
  guest_count  INTEGER NOT NULL DEFAULT 1,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  status       booking_status NOT NULL DEFAULT 'confirmed',
  source       booking_source NOT NULL DEFAULT 'direct',
  total_amount NUMERIC(10, 2),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,

  CONSTRAINT check_dates CHECK (check_out > check_in)
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 6. TABLE tasks
-- ============================================================

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL,
  assigned_to  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type         task_type NOT NULL,
  status       task_status NOT NULL DEFAULT 'pending',
  priority     task_priority NOT NULL DEFAULT 'medium',
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checklist    JSONB DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 7. INDEX pour les requetes frequentes
-- ============================================================

CREATE INDEX idx_properties_owner ON properties(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_property ON bookings(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_property ON tasks(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- Helper : recuperer le role de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helpers pour eviter la recursion RLS entre tables
-- (les subqueries dans les policies doivent bypasser RLS)

CREATE OR REPLACE FUNCTION get_owned_property_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM properties WHERE owner_id = auth.uid() AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_assigned_task_property_ids()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT property_id FROM tasks WHERE assigned_to = auth.uid() AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_assigned_task_booking_ids()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT booking_id FROM tasks WHERE assigned_to = auth.uid() AND deleted_at IS NULL AND booking_id IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -------------------------------------------------------
-- RLS : profiles
-- -------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin : acces total
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- Chacun peut lire son propre profil
CREATE POLICY profiles_self_select ON profiles
  FOR SELECT USING (id = auth.uid());

-- Chacun peut modifier son propre profil
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Manager peut voir tous les profils (pour assigner des taches)
CREATE POLICY profiles_manager_select ON profiles
  FOR SELECT USING (get_user_role() = 'manager');

-- -------------------------------------------------------
-- RLS : properties
-- -------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Admin : acces total
CREATE POLICY properties_admin_all ON properties
  FOR ALL USING (get_user_role() = 'admin');

-- Owner : CRUD sur ses propres proprietes
CREATE POLICY properties_owner_all ON properties
  FOR ALL USING (
    get_user_role() = 'owner'
    AND owner_id = auth.uid()
    AND deleted_at IS NULL
  );

-- Manager : lecture de toutes les proprietes actives
CREATE POLICY properties_manager_select ON properties
  FOR SELECT USING (
    get_user_role() = 'manager'
    AND deleted_at IS NULL
  );

-- Cleaner : lecture des proprietes liees a ses taches
CREATE POLICY properties_cleaner_select ON properties
  FOR SELECT USING (
    get_user_role() = 'cleaner'
    AND deleted_at IS NULL
    AND id IN (SELECT get_assigned_task_property_ids())
  );

-- -------------------------------------------------------
-- RLS : bookings
-- -------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Admin : acces total
CREATE POLICY bookings_admin_all ON bookings
  FOR ALL USING (get_user_role() = 'admin');

-- Owner : voir les bookings de ses proprietes
CREATE POLICY bookings_owner_select ON bookings
  FOR SELECT USING (
    get_user_role() = 'owner'
    AND deleted_at IS NULL
    AND property_id IN (SELECT get_owned_property_ids())
  );

-- Manager : CRUD sur tous les bookings actifs
CREATE POLICY bookings_manager_all ON bookings
  FOR ALL USING (
    get_user_role() = 'manager'
    AND deleted_at IS NULL
  );

-- Cleaner : voir les bookings lies a ses taches
CREATE POLICY bookings_cleaner_select ON bookings
  FOR SELECT USING (
    get_user_role() = 'cleaner'
    AND deleted_at IS NULL
    AND id IN (SELECT get_assigned_task_booking_ids())
  );

-- -------------------------------------------------------
-- RLS : tasks
-- -------------------------------------------------------
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Admin : acces total
CREATE POLICY tasks_admin_all ON tasks
  FOR ALL USING (get_user_role() = 'admin');

-- Owner : voir les taches de ses proprietes
CREATE POLICY tasks_owner_select ON tasks
  FOR SELECT USING (
    get_user_role() = 'owner'
    AND deleted_at IS NULL
    AND property_id IN (SELECT get_owned_property_ids())
  );

-- Manager : CRUD sur toutes les taches actives
CREATE POLICY tasks_manager_all ON tasks
  FOR ALL USING (
    get_user_role() = 'manager'
    AND deleted_at IS NULL
  );

-- Cleaner : voir et modifier ses propres taches
CREATE POLICY tasks_cleaner_select ON tasks
  FOR SELECT USING (
    get_user_role() = 'cleaner'
    AND assigned_to = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY tasks_cleaner_update ON tasks
  FOR UPDATE USING (
    get_user_role() = 'cleaner'
    AND assigned_to = auth.uid()
    AND deleted_at IS NULL
  );

-- ============================================================
-- 9. TRIGGER : creer un profil automatiquement a l'inscription
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
