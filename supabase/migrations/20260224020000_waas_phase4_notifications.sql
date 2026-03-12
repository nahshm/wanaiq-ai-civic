-- Migration: waas_phase4_notifications
-- Phase 4.3: Wire agent system events into the in-app notification tables
--
-- Schema facts (verified):
--   comment_notifications: id, comment_id (uuid NOT NULL), recipient_id, notification_type (text),
--                          title, message, is_read, action_url, metadata (jsonb), created_at
--   admin_notifications:   id, recipient_role (text NOT NULL), title, message, severity,
--                          action_url, is_read, read_by (array), created_at
--   user_warnings:         id, user_id, issued_by, reason, severity, content_ref, content_type,
--                          expires_at, acknowledged, created_at
--
-- Changes:
--   1. Allow NULL comment_id on comment_notifications (system notifications have no comment)
--   2. Trigger: user_warnings INSERT → comment_notifications (warning banner for the user)
--   3. Trigger: accountability_alerts INSERT (is_public=true) → comment_notifications per county
--   4. Trigger: agent_drafts UPDATE to 'approved' → admin_notifications for 'admin' role

-- ─── 1. Allow NULL comment_id ─────────────────────────────────────────────────
ALTER TABLE public.comment_notifications
  ALTER COLUMN comment_id DROP NOT NULL;

-- ─── 2. user_warnings → comment_notifications ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_user_warning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.comment_notifications (
    comment_id,
    recipient_id,
    notification_type,
    title,
    message,
    action_url,
    is_read,
    created_at
  ) VALUES (
    NULL,
    NEW.user_id,
    'agent_warning',
    CASE NEW.severity
      WHEN 'info'          THEN 'Community Guideline Notice'
      WHEN 'warning'       THEN 'Content Warning Issued'
      WHEN 'strike'        THEN 'Strike on Your Account'
      WHEN 'temp_ban'      THEN 'Temporary Account Restriction'
      WHEN 'permanent_ban' THEN 'Account Permanently Restricted'
      ELSE                      'Account Notice'
    END,
    LEFT(NEW.reason, 300),
    '/profile/warnings',
    false,
    NOW()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_warning ON public.user_warnings;
CREATE TRIGGER trg_notify_user_warning
  AFTER INSERT ON public.user_warnings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_warning();

-- ─── 3. accountability_alerts → comment_notifications (county fan-out) ─────────
CREATE OR REPLACE FUNCTION public.notify_accountability_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_row RECORD;
  v_title         TEXT;
  v_message       TEXT;
BEGIN
  IF NEW.is_public = false THEN
    RETURN NEW;
  END IF;

  v_title   := 'Civic Alert: ' || LEFT(COALESCE(NEW.subject_name, 'Unknown'), 60);
  v_message := LEFT(COALESCE(NEW.summary, 'A new accountability alert has been issued for your area.'), 280);

  -- Fan out to county-matched users (max 50 to avoid overload)
  FOR v_recipient_row IN
    SELECT p.id
    FROM public.profiles p
    WHERE (NEW.county IS NULL OR p.county = NEW.county)
      AND p.id IS NOT NULL
    ORDER BY p.created_at DESC
    LIMIT 50
  LOOP
    INSERT INTO public.comment_notifications (
      comment_id,
      recipient_id,
      notification_type,
      title,
      message,
      action_url,
      is_read,
      metadata,
      created_at
    ) VALUES (
      NULL,
      v_recipient_row.id,
      'civic_alert',
      v_title,
      v_message,
      '/feed?alert=' || NEW.id::text,
      false,
      jsonb_build_object('alert_id', NEW.id, 'severity', NEW.severity, 'county', NEW.county),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_accountability_alert ON public.accountability_alerts;
CREATE TRIGGER trg_notify_accountability_alert
  AFTER INSERT ON public.accountability_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_accountability_alert();

-- ─── 4. agent_drafts → admin_notifications on approval ────────────────────────
-- admin_notifications uses recipient_role (text), not recipient_id.
-- We insert for role='admin' so all admins see approved Quill drafts.

CREATE OR REPLACE FUNCTION public.notify_quill_draft_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes TO 'approved'
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (
    recipient_role,
    title,
    message,
    severity,
    action_url,
    is_read,
    created_at
  ) VALUES (
    'admin',
    'Quill Draft Approved: ' || LEFT(COALESCE(NEW.title, 'Untitled'), 80),
    'The ' || COALESCE(NEW.draft_type, 'draft') || ' from ' || COALESCE(NEW.agent_name, 'agent') || ' has been approved and is ready to publish.',
    'info',
    '/admin?tab=agent-control',
    false,
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_quill_draft_approved ON public.agent_drafts;
CREATE TRIGGER trg_notify_quill_draft_approved
  AFTER UPDATE ON public.agent_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_quill_draft_approved();
