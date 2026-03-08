-- Fonction : stats globales du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_properties', (SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL),
    'active_bookings',  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND check_out >= NOW() AND deleted_at IS NULL),
    'pending_tasks',    (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress') AND deleted_at IS NULL),
    'revenue_month',    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings
                         WHERE status = 'confirmed'
                         AND deleted_at IS NULL
                         AND DATE_TRUNC('month', check_in::timestamp) = DATE_TRUNC('month', NOW()))
  ) INTO result;
  RETURN result;
END;
$$;

-- Fonction : arrivées et départs du jour
CREATE OR REPLACE FUNCTION get_today_movements()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'arrivals', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', b.id,
        'guest_name', b.guest_name,
        'property_name', p.name,
        'check_in', b.check_in
      )), '[]'::json)
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.check_in = CURRENT_DATE::text
      AND b.status = 'confirmed'
      AND b.deleted_at IS NULL
    ),
    'departures', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', b.id,
        'guest_name', b.guest_name,
        'property_name', p.name,
        'check_out', b.check_out
      )), '[]'::json)
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.check_out = CURRENT_DATE::text
      AND b.status = 'confirmed'
      AND b.deleted_at IS NULL
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Fonction : taux d'occupation sur 7 jours
CREATE OR REPLACE FUNCTION get_occupation_7days()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_props INT;
BEGIN
  SELECT COUNT(*) INTO total_props FROM properties WHERE deleted_at IS NULL;

  SELECT COALESCE(json_agg(day_data ORDER BY day_date), '[]'::json) INTO result
  FROM (
    SELECT
      gs.day_date::DATE as day_date,
      TO_CHAR(gs.day_date, 'DD/MM') as label,
      CASE WHEN total_props = 0 THEN 0
        ELSE ROUND(
          COUNT(DISTINCT b.property_id)::NUMERIC / total_props * 100
        )
      END as occupation_pct
    FROM generate_series(
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '6 days',
      INTERVAL '1 day'
    ) AS gs(day_date)
    LEFT JOIN bookings b ON
      b.check_in::date <= gs.day_date::date
      AND b.check_out::date > gs.day_date::date
      AND b.status = 'confirmed'
      AND b.deleted_at IS NULL
    GROUP BY gs.day_date, total_props
  ) day_data;

  RETURN result;
END;
$$;

-- Droits d'exécution
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_movements() TO authenticated;
GRANT EXECUTE ON FUNCTION get_occupation_7days() TO authenticated;
