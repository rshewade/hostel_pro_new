-- =============================================================================
-- Hostel Pro — Custom Triggers
-- Apply manually after Drizzle schema push:
--   docker exec -i <container> psql -U db_user1 -d hostel_pro < drizzle/custom/triggers.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Auto-update updated_at timestamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'students', 'applications', 'documents', 'rooms', 'room_allocations',
    'fees', 'payments', 'leave_requests', 'renewals', 'interviews', 'interview_slots',
    'exit_requests', 'clearances', 'clearance_items', 'notification_rules',
    'leave_types', 'blackout_dates'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;
       CREATE TRIGGER trigger_update_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Application status transition validation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_application_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status = NEW.current_status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.current_status = 'DRAFT'      AND NEW.current_status IN ('SUBMITTED')) OR
    (OLD.current_status = 'SUBMITTED'  AND NEW.current_status IN ('REVIEW', 'REJECTED')) OR
    (OLD.current_status = 'REVIEW'     AND NEW.current_status IN ('INTERVIEW', 'APPROVED', 'REJECTED')) OR
    (OLD.current_status = 'INTERVIEW'  AND NEW.current_status IN ('APPROVED', 'REJECTED')) OR
    (OLD.current_status = 'APPROVED'   AND NEW.current_status IN ('ARCHIVED')) OR
    (OLD.current_status = 'REJECTED'   AND NEW.current_status IN ('ARCHIVED'))
  ) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.current_status, NEW.current_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_status_transition_guard ON applications;
CREATE TRIGGER applications_status_transition_guard
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION validate_application_status_transition();

-- ---------------------------------------------------------------------------
-- 3. Room occupancy management
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
  room_cap INTEGER;
BEGIN
  -- Determine which room to update
  IF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO active_count FROM room_allocations
      WHERE room_id = OLD.room_id AND status = 'ACTIVE';
    SELECT capacity INTO room_cap FROM rooms WHERE id = OLD.room_id;
    UPDATE rooms SET
      occupied_count = active_count,
      status = CASE WHEN active_count >= room_cap THEN 'OCCUPIED' ELSE 'AVAILABLE' END
    WHERE id = OLD.room_id;
  ELSE
    SELECT COUNT(*) INTO active_count FROM room_allocations
      WHERE room_id = NEW.room_id AND status = 'ACTIVE';
    SELECT capacity INTO room_cap FROM rooms WHERE id = NEW.room_id;
    UPDATE rooms SET
      occupied_count = active_count,
      status = CASE WHEN active_count >= room_cap THEN 'OCCUPIED' ELSE 'AVAILABLE' END
    WHERE id = NEW.room_id;

    -- If room changed, also update old room
    IF TG_OP = 'UPDATE' AND OLD.room_id IS DISTINCT FROM NEW.room_id THEN
      SELECT COUNT(*) INTO active_count FROM room_allocations
        WHERE room_id = OLD.room_id AND status = 'ACTIVE';
      SELECT capacity INTO room_cap FROM rooms WHERE id = OLD.room_id;
      UPDATE rooms SET
        occupied_count = active_count,
        status = CASE WHEN active_count >= room_cap THEN 'OCCUPIED' ELSE 'AVAILABLE' END
      WHERE id = OLD.room_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS room_allocations_occupancy_trigger ON room_allocations;
CREATE TRIGGER room_allocations_occupancy_trigger
  AFTER INSERT OR UPDATE OR DELETE ON room_allocations
  FOR EACH ROW EXECUTE FUNCTION update_room_occupancy();

-- ---------------------------------------------------------------------------
-- 4. Leave status transition validation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_leave_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'PENDING'   AND NEW.status IN ('APPROVED', 'REJECTED', 'CANCELLED')) OR
    (OLD.status = 'APPROVED'  AND NEW.status IN ('COMPLETED', 'CANCELLED'))
  ) THEN
    RAISE EXCEPTION 'Invalid leave status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_requests_status_transition_guard ON leave_requests;
CREATE TRIGGER leave_requests_status_transition_guard
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION validate_leave_status_transition();

-- ---------------------------------------------------------------------------
-- 5. Auto-update fee status when payment is made
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_fee_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PAID' AND NEW.fee_id IS NOT NULL THEN
    UPDATE fees SET
      status = 'PAID',
      paid_at = COALESCE(NEW.paid_at, NOW())
    WHERE id = NEW.fee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_update_fee_trigger ON payments;
CREATE TRIGGER payments_update_fee_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_fee_on_payment();

-- ---------------------------------------------------------------------------
-- 6. Auto-generate application tracking number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  seq INTEGER;
BEGIN
  IF NEW.tracking_number IS NOT NULL AND NEW.tracking_number != '' THEN
    RETURN NEW;
  END IF;

  prefix := CASE NEW.vertical
    WHEN 'BOYS' THEN 'BH'
    WHEN 'BOYS_HOSTEL' THEN 'BH'
    WHEN 'GIRLS' THEN 'GA'
    WHEN 'GIRLS_ASHRAM' THEN 'GA'
    WHEN 'DHARAMSHALA' THEN 'DH'
    ELSE 'HP'
  END;

  year_str := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(tracking_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO seq
  FROM applications
  WHERE tracking_number LIKE prefix || '-' || year_str || '-%';

  NEW.tracking_number := prefix || '-' || year_str || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_generate_tracking_number ON applications;
CREATE TRIGGER applications_generate_tracking_number
  BEFORE INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_number();

-- ---------------------------------------------------------------------------
-- 7. Prevent users from changing their own role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Role changes are not allowed via direct update';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_prevent_role_change ON users;
CREATE TRIGGER users_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- ---------------------------------------------------------------------------
-- 8. Prevent audit log modification (immutable)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_audit_logs_update ON audit_logs;
CREATE TRIGGER prevent_audit_logs_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_audit_logs_delete ON audit_logs;
CREATE TRIGGER prevent_audit_logs_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
