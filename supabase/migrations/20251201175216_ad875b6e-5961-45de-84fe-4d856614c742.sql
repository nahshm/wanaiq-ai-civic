-- Fix SECURITY DEFINER views by recreating with security_invoker = true

-- 1. Drop and recreate contractor_contacts view
DROP VIEW IF EXISTS public.contractor_contacts;
CREATE VIEW public.contractor_contacts
WITH (security_invoker = true)
AS SELECT 
    id,
    name,
    email,
    phone,
    contact_person,
    website,
    registration_number,
    company_type,
    specialization,
    created_at
FROM contractors;

-- 2. Drop and recreate public_contractors view
DROP VIEW IF EXISTS public.public_contractors;
CREATE VIEW public.public_contractors
WITH (security_invoker = true)
AS SELECT 
    id,
    name,
    company_type,
    specialization,
    years_experience,
    total_projects_completed,
    average_rating,
    total_ratings,
    is_verified,
    verification_date,
    blacklisted,
    blacklist_reason,
    created_at,
    updated_at,
    NULL::character varying AS email,
    NULL::character varying AS phone,
    NULL::character varying AS contact_person,
    NULL::character varying AS website,
    NULL::character varying AS registration_number
FROM contractors;

-- 3. Drop and recreate civic_action_analytics view
DROP VIEW IF EXISTS public.civic_action_analytics;
CREATE VIEW public.civic_action_analytics
WITH (security_invoker = true)
AS SELECT 
    ward_id,
    constituency_id,
    county_id,
    category,
    status,
    count(*) AS issue_count,
    avg(
        CASE
            WHEN status = 'resolved'::text AND updated_at > created_at 
            THEN EXTRACT(epoch FROM updated_at - created_at) / 86400::numeric
            ELSE NULL::numeric
        END
    ) AS avg_days_to_resolve
FROM civic_actions
GROUP BY ward_id, constituency_id, county_id, category, status;

-- 4. Drop and recreate communities_with_stats view
DROP VIEW IF EXISTS public.communities_with_stats;
CREATE VIEW public.communities_with_stats
WITH (security_invoker = true)
AS SELECT 
    c.id,
    c.name,
    c.display_name,
    c.description,
    c.description_html,
    c.category,
    c.banner_url,
    c.avatar_url,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.visibility_type,
    c.is_verified,
    c.is_mature,
    COALESCE(cm.member_count, 0) AS member_count,
    COALESCE(get_online_member_count(c.id), 0) AS online_count
FROM communities c
LEFT JOIN (
    SELECT 
        community_id,
        count(*)::integer AS member_count
    FROM community_members
    GROUP BY community_id
) cm ON c.id = cm.community_id;