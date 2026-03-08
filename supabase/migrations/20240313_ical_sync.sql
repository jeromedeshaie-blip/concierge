-- Ajouter les colonnes iCal sur les propriétés
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS ical_airbnb_url TEXT,
ADD COLUMN IF NOT EXISTS ical_booking_url TEXT,
ADD COLUMN IF NOT EXISTS ical_last_sync TIMESTAMPTZ;

-- Ajouter l'identifiant externe sur les réservations (pour dédoublonner)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS external_uid TEXT;

-- Index unique pour éviter les doublons lors de la sync
CREATE UNIQUE INDEX IF NOT EXISTS bookings_external_uid_idx
ON bookings(external_uid)
WHERE external_uid IS NOT NULL;

-- Fonction d'upsert iCal (appelée par l'API)
CREATE OR REPLACE FUNCTION upsert_ical_booking(
  p_property_id UUID,
  p_external_uid TEXT,
  p_guest_name TEXT,
  p_check_in DATE,
  p_check_out DATE,
  p_source TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_id UUID;
BEGIN
  INSERT INTO bookings (
    property_id, external_uid, guest_name,
    check_in, check_out, source, status, guest_count
  )
  VALUES (
    p_property_id, p_external_uid, p_guest_name,
    p_check_in, p_check_out, p_source, 'confirmed', 1
  )
  ON CONFLICT (external_uid) WHERE external_uid IS NOT NULL
  DO UPDATE SET
    check_in = EXCLUDED.check_in,
    check_out = EXCLUDED.check_out,
    guest_name = EXCLUDED.guest_name,
    updated_at = NOW()
  RETURNING id INTO booking_id;

  RETURN booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_ical_booking(UUID, TEXT, TEXT, DATE, DATE, TEXT) TO service_role;

-- Fonction de mise à jour de la date de dernière sync
CREATE OR REPLACE FUNCTION update_ical_last_sync(p_property_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE properties SET ical_last_sync = NOW() WHERE id = p_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_ical_last_sync(UUID) TO service_role;
