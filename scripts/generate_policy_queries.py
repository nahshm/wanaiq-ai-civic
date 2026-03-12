
import json

tables_json = """
[{"tablename":"admin_notifications"},{"tablename":"administrative_divisions"},{"tablename":"anonymous_reports"},{"tablename":"campaign_promises"},{"tablename":"challenge_submissions"},{"tablename":"challenge_votes"},{"tablename":"channels"},{"tablename":"chat_messages"},{"tablename":"chat_participants"},{"tablename":"chat_rooms"},{"tablename":"civic_action_supporters"},{"tablename":"civic_action_updates"},{"tablename":"civic_actions"},{"tablename":"civic_clip_variants"},{"tablename":"civic_clip_views"},{"tablename":"civic_clips"},{"tablename":"civic_impact_scores"},{"tablename":"civic_interests"},{"tablename":"comment_award_assignments"},{"tablename":"comment_awards"},{"tablename":"comment_flairs"},{"tablename":"comment_media"},{"tablename":"comment_media_processing_log"},{"tablename":"comment_moderation_log"},{"tablename":"comment_notifications"},{"tablename":"comment_references"},{"tablename":"comments"},{"tablename":"communities"},{"tablename":"community_active_members"},{"tablename":"community_bookmarks"},{"tablename":"community_events"},{"tablename":"community_flairs"},{"tablename":"community_members"},{"tablename":"community_moderators"},{"tablename":"community_poll_votes"},{"tablename":"community_polls"},{"tablename":"community_rules"},{"tablename":"community_visits"},{"tablename":"contractor_ratings"},{"tablename":"contractors"},{"tablename":"country_governance_templates"},{"tablename":"crisis_reports"},{"tablename":"election_cycles"},{"tablename":"expertise_endorsements"},{"tablename":"feature_flags"},{"tablename":"forum_replies"},{"tablename":"forum_reply_reactions"},{"tablename":"forum_thread_reactions"},{"tablename":"forum_threads"},{"tablename":"government_institutions"},{"tablename":"government_projects"},{"tablename":"hidden_items"},{"tablename":"message_reactions"},{"tablename":"mod_mail_messages"},{"tablename":"mod_mail_threads"},{"tablename":"ngo_partners"},{"tablename":"office_holders"},{"tablename":"official_contacts"},{"tablename":"onboarding_progress"},{"tablename":"post_media"},{"tablename":"posts"},{"tablename":"profile_customizations"},{"tablename":"profiles"},{"tablename":"project_collaborating_institutions"},{"tablename":"project_collaborating_officials"},{"tablename":"project_comments"},{"tablename":"project_updates"},{"tablename":"project_verifications"},{"tablename":"project_views"},{"tablename":"promise_updates"},{"tablename":"promise_verifications"},{"tablename":"rate_limits"},{"tablename":"saved_items"},{"tablename":"sentiment_votes"},{"tablename":"skill_endorsements"},{"tablename":"system_audit_log"},{"tablename":"user_achievements"},{"tablename":"user_actions"},{"tablename":"user_activities"},{"tablename":"user_activity_log"},{"tablename":"user_expertise"},{"tablename":"user_interests"},{"tablename":"user_privacy_settings"},{"tablename":"user_quests"},{"tablename":"user_roles"},{"tablename":"user_skills"},{"tablename":"verification_votes"},{"tablename":"votes"}]
"""

tables = [t['tablename'] for t in json.loads(tables_json)]
batch_size = 18
batches = [tables[i:i + batch_size] for i in range(0, len(tables), batch_size)]

queries = []
for batch in batches:
    tables_list = "', '".join(batch)
    query = f"""
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('{tables_list}')
  AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' OR qual LIKE '%auth.role()%'
       OR with_check LIKE '%auth.uid()%' OR with_check LIKE '%auth.jwt()%' OR with_check LIKE '%auth.role()%')
ORDER BY tablename, policyname
"""
    queries.append(query.strip())

with open('scripts/batch_policy_queries.json', 'w') as f:
    json.dump(queries, f, indent=2)

print(f"Generated {len(queries)} queries.")
