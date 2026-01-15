-- ============================================
-- PRICE DROP ALERTS TABLE
-- ============================================
-- This table allows users to set alerts for price drops on PG listings
-- They can specify their desired price and get notified when rent drops

CREATE TABLE IF NOT EXISTS public.price_drop_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  
  -- Alert configuration
  target_price INTEGER NOT NULL, -- User's desired price
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notification settings
  notify_email BOOLEAN DEFAULT TRUE,
  notify_in_app BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ, -- When the alert was triggered (NULL if not triggered)
  
  -- Constraints
  CONSTRAINT price_drop_alerts_target_price_positive CHECK (target_price > 0),
  CONSTRAINT price_drop_alerts_unique_user_pg UNIQUE(user_id, pg_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_user_id ON public.price_drop_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_pg_id ON public.price_drop_alerts(pg_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_enabled ON public.price_drop_alerts(is_enabled) WHERE is_enabled = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.price_drop_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own price alerts"
  ON public.price_drop_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own alerts
CREATE POLICY "Users can create price alerts"
  ON public.price_drop_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update their own price alerts"
  ON public.price_drop_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete their own price alerts"
  ON public.price_drop_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FUNCTION: Notify users of price drops
-- ============================================
CREATE OR REPLACE FUNCTION notify_price_drop_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- If rent has decreased
  IF NEW.rent < OLD.rent THEN
    -- Find all active alerts where target price is now met
    -- Excludes owner to prevent self-notifications
    INSERT INTO notifications (user_id, type, title, message, payload)
    SELECT
      pda.user_id,
      'price_drop',
      'Price Drop Alert!',
      'The rent at ' || NEW.name || ' dropped from ₹' || OLD.rent || ' to ₹' || NEW.rent,
      jsonb_build_object(
        'pg_id', NEW.id,
        'old_price', OLD.rent,
        'new_price', NEW.rent
      )
    FROM price_drop_alerts pda
    WHERE pda.pg_id = NEW.id
      AND pda.is_enabled = TRUE
      AND pda.triggered_at IS NULL
      AND NEW.rent <= pda.target_price
      AND pda.user_id <> NEW.owner_id;
    
    -- Mark alerts as triggered
    UPDATE price_drop_alerts
    SET triggered_at = NOW()
    WHERE pg_id = NEW.id
      AND is_enabled = TRUE
      AND triggered_at IS NULL
      AND NEW.rent <= target_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS price_drop_alert_trigger ON pg_listings;

CREATE TRIGGER price_drop_alert_trigger
  AFTER UPDATE OF rent ON pg_listings
  FOR EACH ROW
  WHEN (NEW.rent < OLD.rent)
  EXECUTE FUNCTION notify_price_drop_alerts();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.price_drop_alerts IS 'User alerts for PG price drops';
COMMENT ON COLUMN public.price_drop_alerts.target_price IS 'Desired price at which user wants to be notified';
COMMENT ON COLUMN public.price_drop_alerts.triggered_at IS 'Timestamp when the alert was triggered (price dropped to target)';
COMMENT ON COLUMN public.price_drop_alerts.is_enabled IS 'Whether the alert is active';
