-- =============================================
-- TABLE CLEANING TASKS (ménages)
-- =============================================
CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  title TEXT NOT NULL DEFAULT 'Ménage',
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'urgent')),
  notes TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE CHECKLIST ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_task_id UUID REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  done_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE CHECKLIST TEMPLATES (modèles réutilisables)
-- =============================================
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Template standard',
  items JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_property ON cleaning_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_date ON cleaning_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_status ON cleaning_tasks(status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_task ON checklist_items(cleaning_task_id);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cleaning_tasks_access" ON cleaning_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'cleaner')
    )
  );

CREATE POLICY "checklist_items_access" ON checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'cleaner')
    )
  );

CREATE POLICY "checklist_templates_access" ON checklist_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =============================================
-- FONCTIONS
-- =============================================

-- Créer un ménage avec check-list depuis un template
CREATE OR REPLACE FUNCTION create_cleaning_task(
  p_property_id UUID,
  p_booking_id UUID,
  p_scheduled_date DATE,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_task_id UUID;
  template_items JSONB;
  item JSONB;
  position_counter INT := 0;
  property_name TEXT;
BEGIN
  -- Récupérer le nom de la propriété
  SELECT name INTO property_name FROM properties WHERE id = p_property_id;

  -- Créer la tâche de ménage
  INSERT INTO cleaning_tasks (
    property_id, booking_id, assigned_to,
    title, scheduled_date, status, priority
  )
  VALUES (
    p_property_id, p_booking_id, p_assigned_to,
    'Ménage — ' || property_name,
    p_scheduled_date, 'pending', 'normal'
  )
  RETURNING id INTO new_task_id;

  -- Récupérer le template par défaut de la propriété
  SELECT items INTO template_items
  FROM checklist_templates
  WHERE property_id = p_property_id AND is_default = TRUE
  LIMIT 1;

  -- Si pas de template, utiliser le template standard
  IF template_items IS NULL THEN
    template_items := '[
      "Aérer toutes les pièces",
      "Changer les draps et taies d''oreiller",
      "Changer les serviettes de bain",
      "Nettoyer la salle de bain (lavabo, douche, WC)",
      "Nettoyer la cuisine (four, plaques, réfrigérateur)",
      "Faire la vaisselle ou lancer le lave-vaisselle",
      "Aspirer et laver les sols",
      "Nettoyer les surfaces et meubles",
      "Vider les poubelles",
      "Vérifier et réapprovisionner les produits d''accueil",
      "Contrôler les équipements (TV, chauffage, WiFi)",
      "Prendre des photos de l''état du chalet",
      "Fermer toutes les fenêtres et volets",
      "Vérifier que les clés sont en place"
    ]'::JSONB;
  END IF;

  -- Créer les items de la check-list
  FOR item IN SELECT * FROM jsonb_array_elements(template_items)
  LOOP
    INSERT INTO checklist_items (
      cleaning_task_id, label, position
    )
    VALUES (
      new_task_id,
      item #>> '{}',
      position_counter
    );
    position_counter := position_counter + 1;
  END LOOP;

  RETURN new_task_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_cleaning_task(UUID, UUID, DATE, UUID) TO authenticated;

-- Marquer un item comme fait
CREATE OR REPLACE FUNCTION toggle_checklist_item(
  p_item_id UUID,
  p_is_done BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE checklist_items SET
    is_done = p_is_done,
    done_at = CASE WHEN p_is_done THEN NOW() ELSE NULL END,
    done_by = CASE WHEN p_is_done THEN auth.uid() ELSE NULL END
  WHERE id = p_item_id;

  -- Mettre à jour le statut de la tâche parente
  UPDATE cleaning_tasks SET
    status = CASE
      WHEN (
        SELECT COUNT(*) FROM checklist_items
        WHERE cleaning_task_id = (
          SELECT cleaning_task_id FROM checklist_items WHERE id = p_item_id
        ) AND is_done = FALSE
      ) = 0 THEN 'done'
      WHEN (
        SELECT COUNT(*) FROM checklist_items
        WHERE cleaning_task_id = (
          SELECT cleaning_task_id FROM checklist_items WHERE id = p_item_id
        ) AND is_done = TRUE
      ) > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_at = CASE
      WHEN (
        SELECT COUNT(*) FROM checklist_items
        WHERE cleaning_task_id = (
          SELECT cleaning_task_id FROM checklist_items WHERE id = p_item_id
        ) AND is_done = FALSE
      ) = 0 THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = (
    SELECT cleaning_task_id FROM checklist_items WHERE id = p_item_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_checklist_item(UUID, BOOLEAN) TO authenticated;

-- Insérer un template standard pour les propriétés existantes
INSERT INTO checklist_templates (property_id, name, is_default, items)
SELECT
  id,
  'Template standard',
  TRUE,
  '[
    "Aérer toutes les pièces",
    "Changer les draps et taies d''oreiller",
    "Changer les serviettes de bain",
    "Nettoyer la salle de bain (lavabo, douche, WC)",
    "Nettoyer la cuisine (four, plaques, réfrigérateur)",
    "Faire la vaisselle ou lancer le lave-vaisselle",
    "Aspirer et laver les sols",
    "Nettoyer les surfaces et meubles",
    "Vider les poubelles",
    "Vérifier et réapprovisionner les produits d''accueil",
    "Contrôler les équipements (TV, chauffage, WiFi)",
    "Prendre des photos de l''état du chalet",
    "Fermer toutes les fenêtres et volets",
    "Vérifier que les clés sont en place"
  ]'::JSONB
FROM properties
WHERE deleted_at IS NULL
ON CONFLICT DO NOTHING;
