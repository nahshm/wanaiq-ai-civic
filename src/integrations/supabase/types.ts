export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accountability_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          constituency: string | null
          county: string | null
          created_at: string
          details: Json
          id: string
          is_public: boolean
          quill_draft_id: string | null
          severity: number
          subject_id: string
          subject_name: string | null
          subject_type: string
          summary: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          constituency?: string | null
          county?: string | null
          created_at?: string
          details?: Json
          id?: string
          is_public?: boolean
          quill_draft_id?: string | null
          severity?: number
          subject_id: string
          subject_name?: string | null
          subject_type: string
          summary: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          constituency?: string | null
          county?: string | null
          created_at?: string
          details?: Json
          id?: string
          is_public?: boolean
          quill_draft_id?: string | null
          severity?: number
          subject_id?: string
          subject_name?: string | null
          subject_type?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountability_alerts_quill_draft_id_fkey"
            columns: ["quill_draft_id"]
            isOneToOne: false
            referencedRelation: "agent_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_by: string[] | null
          recipient_role: string
          severity: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_by?: string[] | null
          recipient_role: string
          severity?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_by?: string[] | null
          recipient_role?: string
          severity?: string | null
          title?: string
        }
        Relationships: []
      }
      administrative_divisions: {
        Row: {
          area_sq_km: number | null
          country_code: string
          created_at: string | null
          division_code: string | null
          governance_level: string
          id: string
          level_index: number
          metadata: Json | null
          name: string
          name_local: string | null
          parent_id: string | null
          population: number | null
          updated_at: string | null
        }
        Insert: {
          area_sq_km?: number | null
          country_code: string
          created_at?: string | null
          division_code?: string | null
          governance_level: string
          id?: string
          level_index: number
          metadata?: Json | null
          name: string
          name_local?: string | null
          parent_id?: string | null
          population?: number | null
          updated_at?: string | null
        }
        Update: {
          area_sq_km?: number | null
          country_code?: string
          created_at?: string | null
          division_code?: string | null
          governance_level?: string
          id?: string
          level_index?: number
          metadata?: Json | null
          name?: string
          name_local?: string | null
          parent_id?: string | null
          population?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_divisions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "country_governance_templates"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "administrative_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_drafts: {
        Row: {
          agent_name: string
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          draft_type: string
          id: string
          language: string
          metadata: Json
          sent_at: string | null
          source_event: string | null
          status: string
          target_id: string | null
          target_type: string | null
          title: string | null
        }
        Insert: {
          agent_name?: string
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          draft_type: string
          id?: string
          language?: string
          metadata?: Json
          sent_at?: string | null
          source_event?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          title?: string | null
        }
        Update: {
          agent_name?: string
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          draft_type?: string
          id?: string
          language?: string
          metadata?: Json
          sent_at?: string | null
          source_event?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "agent_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_drafts_source_event_fkey"
            columns: ["source_event"]
            isOneToOne: false
            referencedRelation: "agent_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_events: {
        Row: {
          created_at: string
          error_detail: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          source_agent: string
          status: string
          target_agent: string | null
        }
        Insert: {
          created_at?: string
          error_detail?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source_agent: string
          status?: string
          target_agent?: string | null
        }
        Update: {
          created_at?: string
          error_detail?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source_agent?: string
          status?: string
          target_agent?: string | null
        }
        Relationships: []
      }
      agent_feedback: {
        Row: {
          agent_name: string
          created_at: string
          id: string
          notes: string | null
          proposal_id: string | null
          rating: string
          reviewer_id: string
          run_id: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string
          id?: string
          notes?: string | null
          proposal_id?: string | null
          rating: string
          reviewer_id: string
          run_id?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          proposal_id?: string | null
          rating?: string
          reviewer_id?: string
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_feedback_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "agent_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_feedback_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_proposals: {
        Row: {
          action_taken: string | null
          agent_name: string
          confidence: number | null
          created_at: string
          evidence: Json
          expires_at: string
          id: string
          proposal_type: string
          reasoning: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          action_taken?: string | null
          agent_name: string
          confidence?: number | null
          created_at?: string
          evidence?: Json
          expires_at?: string
          id?: string
          proposal_type: string
          reasoning: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          action_taken?: string | null
          agent_name?: string
          confidence?: number | null
          created_at?: string
          evidence?: Json
          expires_at?: string
          id?: string
          proposal_type?: string
          reasoning?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent_name: string
          created_at: string
          duration_ms: number | null
          error_summary: string | null
          id: string
          items_actioned: number
          items_failed: number
          items_scanned: number
          metadata: Json
          status: string
          trigger_type: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          duration_ms?: number | null
          error_summary?: string | null
          id?: string
          items_actioned?: number
          items_failed?: number
          items_scanned?: number
          metadata?: Json
          status: string
          trigger_type: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          duration_ms?: number | null
          error_summary?: string | null
          id?: string
          items_actioned?: number
          items_failed?: number
          items_scanned?: number
          metadata?: Json
          status?: string
          trigger_type?: string
        }
        Relationships: []
      }
      agent_state: {
        Row: {
          agent_name: string
          description: string | null
          id: string
          state_key: string
          state_value: Json
          updated_at: string
        }
        Insert: {
          agent_name: string
          description?: string | null
          id?: string
          state_key: string
          state_value: Json
          updated_at?: string
        }
        Update: {
          agent_name?: string
          description?: string | null
          id?: string
          state_key?: string
          state_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ai_configurations: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          models: Json
          provider_slug: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          models?: Json
          provider_slug: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          models?: Json
          provider_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      anonymous_reports: {
        Row: {
          assigned_to: string | null
          category: string
          constituency_id: string | null
          county_id: string | null
          created_at: string | null
          encrypted_content: string
          escalated_at: string | null
          escalated_to: string[] | null
          evidence_count: number | null
          id: string
          is_identity_protected: boolean | null
          location_text: string | null
          report_id: string
          risk_score: number | null
          severity: string
          status: string
          title: string | null
          updated_at: string | null
          ward_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          encrypted_content: string
          escalated_at?: string | null
          escalated_to?: string[] | null
          evidence_count?: number | null
          id?: string
          is_identity_protected?: boolean | null
          location_text?: string | null
          report_id: string
          risk_score?: number | null
          severity?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          ward_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          encrypted_content?: string
          escalated_at?: string | null
          escalated_to?: string[] | null
          evidence_count?: number | null
          id?: string
          is_identity_protected?: boolean | null
          location_text?: string | null
          report_id?: string
          risk_score?: number | null
          severity?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          ward_id?: string | null
        }
        Relationships: []
      }
      api_metrics: {
        Row: {
          created_at: string | null
          duration_ms: number
          id: string
          operation: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms: number
          id?: string
          operation: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number
          id?: string
          operation?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          requirements: Json
          tier: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          requirements: Json
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          requirements?: Json
          tier?: string
        }
        Relationships: []
      }
      baraza_spaces: {
        Row: {
          created_at: string | null
          description: string | null
          host_user_id: string
          is_live: boolean | null
          participant_count: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          space_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          host_user_id: string
          is_live?: boolean | null
          participant_count?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          space_id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          host_user_id?: string
          is_live?: boolean | null
          participant_count?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          space_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baraza_spaces_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_promises: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          politician_id: string
          politician_name: string | null
          sentiment_id: string | null
          status: string
          submitted_by: string
          title: string
          updated_at: string | null
          verification_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          politician_id: string
          politician_name?: string | null
          sentiment_id?: string | null
          status?: string
          submitted_by: string
          title: string
          updated_at?: string | null
          verification_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          politician_id?: string
          politician_name?: string | null
          sentiment_id?: string | null
          status?: string
          submitted_by?: string
          title?: string
          updated_at?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_promises_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_promises_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_promises_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_submissions: {
        Row: {
          challenge_id: string
          id: string
          rank: number | null
          status: string | null
          submission: Json
          submitted_at: string | null
          user_id: string
          votes: number | null
        }
        Insert: {
          challenge_id: string
          id?: string
          rank?: number | null
          status?: string | null
          submission: Json
          submitted_at?: string | null
          user_id: string
          votes?: number | null
        }
        Update: {
          challenge_id?: string
          id?: string
          rank?: number | null
          status?: string | null
          submission?: Json
          submitted_at?: string | null
          user_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_votes: {
        Row: {
          id: string
          submission_id: string
          user_id: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "challenge_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          banner_url: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          reward_description: string | null
          reward_points: number | null
          rules: Json | null
          start_date: string
          status: string | null
          title: string
          voting_end_date: string | null
        }
        Insert: {
          banner_url?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          reward_description?: string | null
          reward_points?: number | null
          rules?: Json | null
          start_date: string
          status?: string | null
          title: string
          voting_end_date?: string | null
        }
        Update: {
          banner_url?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          reward_description?: string | null
          reward_points?: number | null
          rules?: Json | null
          start_date?: string
          status?: string | null
          title?: string
          voting_end_date?: string | null
        }
        Relationships: []
      }
      channel_analytics: {
        Row: {
          active_users: number | null
          channel_id: string
          created_at: string | null
          date: string
          message_count: number | null
          post_count: number | null
          updated_at: string | null
        }
        Insert: {
          active_users?: number | null
          channel_id: string
          created_at?: string | null
          date?: string
          message_count?: number | null
          post_count?: number | null
          updated_at?: string | null
        }
        Update: {
          active_users?: number | null
          channel_id?: string
          created_at?: string | null
          date?: string
          message_count?: number | null
          post_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_analytics_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          category: string | null
          community_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          emoji_prefix: string | null
          id: string
          is_locked: boolean | null
          is_private: boolean | null
          name: string
          position: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          community_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emoji_prefix?: string | null
          id?: string
          is_locked?: boolean | null
          is_private?: boolean | null
          name: string
          position?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emoji_prefix?: string | null
          id?: string
          is_locked?: boolean | null
          is_private?: boolean | null
          name?: string
          position?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          media_type: string | null
          media_urls: string[] | null
          reply_to_id: string | null
          room_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          joined_at: string | null
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      civic_action_supporters: {
        Row: {
          action_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_action_supporters_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_action_supporters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_action_updates: {
        Row: {
          action_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          new_status: string | null
          previous_status: string | null
          user_id: string | null
        }
        Insert: {
          action_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          user_id?: string | null
        }
        Update: {
          action_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_action_updates_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_action_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_actions: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_level: string
          action_type: string
          assigned_to: string | null
          case_number: string | null
          category: string
          comment_count: number | null
          constituency_id: string | null
          county_id: string | null
          created_at: string | null
          description: string | null
          formal_letter: string | null
          id: string
          institution_id: string | null
          is_public: boolean | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          media_urls: string[] | null
          status: string | null
          support_count: number | null
          title: string
          updated_at: string | null
          upvotes: number | null
          urgency: string | null
          user_id: string | null
          ward_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_level?: string
          action_type?: string
          assigned_to?: string | null
          case_number?: string | null
          category: string
          comment_count?: number | null
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          description?: string | null
          formal_letter?: string | null
          id?: string
          institution_id?: string | null
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          status?: string | null
          support_count?: number | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          urgency?: string | null
          user_id?: string | null
          ward_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_level?: string
          action_type?: string
          assigned_to?: string | null
          case_number?: string | null
          category?: string
          comment_count?: number | null
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          description?: string | null
          formal_letter?: string | null
          id?: string
          institution_id?: string | null
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          status?: string | null
          support_count?: number | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          urgency?: string | null
          user_id?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_actions_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_clip_variants: {
        Row: {
          bitrate: number | null
          clip_id: string | null
          created_at: string | null
          file_size: number | null
          id: string
          quality: string
          video_url: string
        }
        Insert: {
          bitrate?: number | null
          clip_id?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          quality: string
          video_url: string
        }
        Update: {
          bitrate?: number | null
          clip_id?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          quality?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_clip_variants_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "civic_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_clip_views: {
        Row: {
          clip_id: string | null
          completed: boolean | null
          device_type: string | null
          id: string
          user_id: string | null
          viewed_at: string | null
          watch_duration: number
          watch_percentage: number | null
        }
        Insert: {
          clip_id?: string | null
          completed?: boolean | null
          device_type?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
          watch_duration: number
          watch_percentage?: number | null
        }
        Update: {
          clip_id?: string | null
          completed?: boolean | null
          device_type?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
          watch_duration?: number
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_clip_views_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "civic_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_clip_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_clips: {
        Row: {
          aspect_ratio: string | null
          average_watch_percentage: number | null
          captions_url: string | null
          category: string | null
          civic_reference_id: string | null
          civic_type: string | null
          created_at: string | null
          duration: number | null
          fact_check_status: string | null
          featured_at: string | null
          featured_by: string | null
          file_size: number | null
          format: string | null
          hashtags: string[] | null
          height: number | null
          id: string
          is_featured: boolean | null
          official_response: string | null
          post_id: string | null
          processing_error: string | null
          processing_status: string | null
          quality: string | null
          source_citation_url: string | null
          thumbnail_url: string | null
          transcript: string | null
          updated_at: string | null
          video_url: string
          views_count: number | null
          watch_time_total: number | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          average_watch_percentage?: number | null
          captions_url?: string | null
          category?: string | null
          civic_reference_id?: string | null
          civic_type?: string | null
          created_at?: string | null
          duration?: number | null
          fact_check_status?: string | null
          featured_at?: string | null
          featured_by?: string | null
          file_size?: number | null
          format?: string | null
          hashtags?: string[] | null
          height?: number | null
          id?: string
          is_featured?: boolean | null
          official_response?: string | null
          post_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          quality?: string | null
          source_citation_url?: string | null
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string | null
          video_url: string
          views_count?: number | null
          watch_time_total?: number | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          average_watch_percentage?: number | null
          captions_url?: string | null
          category?: string | null
          civic_reference_id?: string | null
          civic_type?: string | null
          created_at?: string | null
          duration?: number | null
          fact_check_status?: string | null
          featured_at?: string | null
          featured_by?: string | null
          file_size?: number | null
          format?: string | null
          hashtags?: string[] | null
          height?: number | null
          id?: string
          is_featured?: boolean | null
          official_response?: string | null
          post_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          quality?: string | null
          source_citation_url?: string | null
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string | null
          video_url?: string
          views_count?: number | null
          watch_time_total?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_clips_featured_by_fkey"
            columns: ["featured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_clips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_clips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_impact_scores: {
        Row: {
          actions_score: number | null
          calculated_at: string | null
          community_score: number | null
          created_at: string | null
          goat_level: number | null
          goat_title: string | null
          goat_xp: number | null
          impact_rating: number | null
          reliability_score: number | null
          resolution_score: number | null
          trust_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions_score?: number | null
          calculated_at?: string | null
          community_score?: number | null
          created_at?: string | null
          goat_level?: number | null
          goat_title?: string | null
          goat_xp?: number | null
          impact_rating?: number | null
          reliability_score?: number | null
          resolution_score?: number | null
          trust_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions_score?: number | null
          calculated_at?: string | null
          community_score?: number | null
          created_at?: string | null
          goat_level?: number | null
          goat_title?: string | null
          goat_xp?: number | null
          impact_rating?: number | null
          reliability_score?: number | null
          resolution_score?: number | null
          trust_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_impact_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_interests: {
        Row: {
          category: string | null
          created_at: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      civic_issue_comments: {
        Row: {
          action_id: string
          comment: string
          created_at: string | null
          id: string
          media_urls: string[] | null
          user_id: string
        }
        Insert: {
          action_id: string
          comment: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          user_id: string
        }
        Update: {
          action_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_issue_comments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_issue_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_award_assignments: {
        Row: {
          award_id: string
          awarded_at: string
          awarded_by: string
          comment_id: string
          id: string
        }
        Insert: {
          award_id: string
          awarded_at?: string
          awarded_by: string
          comment_id: string
          id?: string
        }
        Update: {
          award_id?: string
          awarded_at?: string
          awarded_by?: string
          comment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_award_assignments_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "comment_awards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_award_assignments_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_award_assignments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_awards: {
        Row: {
          background_color: string
          category: string
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_enabled: boolean | null
          name: string
          points: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          category: string
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          points?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          points?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      comment_flairs: {
        Row: {
          background_color: string
          category: string
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_enabled: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          category: string
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      comment_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          comment_id: string
          content_moderation_score: number | null
          created_at: string
          duration: number | null
          file_height: number | null
          file_path: string
          file_size: number
          file_type: string
          file_width: number | null
          filename: string
          id: string
          is_nsfw: boolean | null
          mime_type: string
          original_filename: string
          processing_error: string | null
          processing_status: string | null
          sort_order: number | null
          thumbnail_path: string | null
          updated_at: string
          upload_source: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          comment_id: string
          content_moderation_score?: number | null
          created_at?: string
          duration?: number | null
          file_height?: number | null
          file_path: string
          file_size: number
          file_type: string
          file_width?: number | null
          filename: string
          id?: string
          is_nsfw?: boolean | null
          mime_type: string
          original_filename: string
          processing_error?: string | null
          processing_status?: string | null
          sort_order?: number | null
          thumbnail_path?: string | null
          updated_at?: string
          upload_source?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          comment_id?: string
          content_moderation_score?: number | null
          created_at?: string
          duration?: number | null
          file_height?: number | null
          file_path?: string
          file_size?: number
          file_type?: string
          file_width?: number | null
          filename?: string
          id?: string
          is_nsfw?: boolean | null
          mime_type?: string
          original_filename?: string
          processing_error?: string | null
          processing_status?: string | null
          sort_order?: number | null
          thumbnail_path?: string | null
          updated_at?: string
          upload_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_media_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_media_processing_log: {
        Row: {
          action: string
          created_at: string
          id: string
          media_id: string
          message: string | null
          metadata: Json | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          media_id: string
          message?: string | null
          metadata?: Json | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          media_id?: string
          message?: string | null
          metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_media_processing_log_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "comment_media"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_moderation_log: {
        Row: {
          action: string
          comment_id: string
          created_at: string
          id: string
          metadata: Json | null
          moderator_id: string
          new_status: string | null
          previous_status: string | null
          reason: string | null
          toxicity_score: number | null
        }
        Insert: {
          action: string
          comment_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id: string
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
          toxicity_score?: number | null
        }
        Update: {
          action?: string
          comment_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id?: string
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
          toxicity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_moderation_log_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_moderation_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_notifications: {
        Row: {
          action_url: string | null
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          recipient_id: string
          title: string
        }
        Insert: {
          action_url?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_id: string
          title: string
        }
        Update: {
          action_url?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_references: {
        Row: {
          comment_id: string
          context: string | null
          created_at: string
          id: string
          reference_id: string
          reference_title: string | null
          reference_type: string
          reference_url: string | null
        }
        Insert: {
          comment_id: string
          context?: string | null
          created_at?: string
          id?: string
          reference_id: string
          reference_title?: string | null
          reference_type: string
          reference_url?: string | null
        }
        Update: {
          comment_id?: string
          context?: string | null
          created_at?: string
          id?: string
          reference_id?: string
          reference_title?: string | null
          reference_type?: string
          reference_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_references_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          agent_flags: Json
          appeal_status: string | null
          author_id: string
          civic_tags: string[] | null
          content: string
          content_warnings: string[] | null
          created_at: string
          depth: number | null
          discussion_type: string | null
          downvotes: number | null
          fact_check_notes: string | null
          fact_check_status: string | null
          fact_check_timestamp: string | null
          fact_checker_id: string | null
          flair_id: string | null
          hidden_by_agent: string | null
          hidden_reason: string | null
          id: string
          is_collapsed: boolean | null
          is_deleted: boolean
          is_hidden: boolean | null
          is_official_response: boolean | null
          moderation_reason: string | null
          moderation_status: string | null
          moderation_timestamp: string | null
          moderator_id: string | null
          official_verification_id: string | null
          parent_comment_id: string | null
          parent_id: string | null
          post_id: string | null
          priority_level: string | null
          referenced_project_id: string | null
          referenced_promise_id: string | null
          search_vector: unknown
          sentiment_id: string | null
          toxicity_score: number | null
          updated_at: string
          upvotes: number | null
          verification_id: string | null
        }
        Insert: {
          agent_flags?: Json
          appeal_status?: string | null
          author_id: string
          civic_tags?: string[] | null
          content: string
          content_warnings?: string[] | null
          created_at?: string
          depth?: number | null
          discussion_type?: string | null
          downvotes?: number | null
          fact_check_notes?: string | null
          fact_check_status?: string | null
          fact_check_timestamp?: string | null
          fact_checker_id?: string | null
          flair_id?: string | null
          hidden_by_agent?: string | null
          hidden_reason?: string | null
          id?: string
          is_collapsed?: boolean | null
          is_deleted?: boolean
          is_hidden?: boolean | null
          is_official_response?: boolean | null
          moderation_reason?: string | null
          moderation_status?: string | null
          moderation_timestamp?: string | null
          moderator_id?: string | null
          official_verification_id?: string | null
          parent_comment_id?: string | null
          parent_id?: string | null
          post_id?: string | null
          priority_level?: string | null
          referenced_project_id?: string | null
          referenced_promise_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          toxicity_score?: number | null
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
        }
        Update: {
          agent_flags?: Json
          appeal_status?: string | null
          author_id?: string
          civic_tags?: string[] | null
          content?: string
          content_warnings?: string[] | null
          created_at?: string
          depth?: number | null
          discussion_type?: string | null
          downvotes?: number | null
          fact_check_notes?: string | null
          fact_check_status?: string | null
          fact_check_timestamp?: string | null
          fact_checker_id?: string | null
          flair_id?: string | null
          hidden_by_agent?: string | null
          hidden_reason?: string | null
          id?: string
          is_collapsed?: boolean | null
          is_deleted?: boolean
          is_hidden?: boolean | null
          is_official_response?: boolean | null
          moderation_reason?: string | null
          moderation_status?: string | null
          moderation_timestamp?: string | null
          moderator_id?: string | null
          official_verification_id?: string | null
          parent_comment_id?: string | null
          parent_id?: string | null
          post_id?: string | null
          priority_level?: string | null
          referenced_project_id?: string | null
          referenced_promise_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          toxicity_score?: number | null
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_fact_checker_id_fkey"
            columns: ["fact_checker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_flair_id_fkey"
            columns: ["flair_id"]
            isOneToOne: false
            referencedRelation: "comment_flairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_official_verification_id_fkey"
            columns: ["official_verification_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_referenced_project_id_fkey"
            columns: ["referenced_project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_referenced_promise_id_fkey"
            columns: ["referenced_promise_id"]
            isOneToOne: false
            referencedRelation: "development_promises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          allow_post_flairs: boolean | null
          allow_user_flairs: boolean | null
          auto_moderate: boolean | null
          avatar_url: string | null
          banner_url: string | null
          category: string
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_html: string | null
          display_name: string
          id: string
          is_mature: boolean | null
          is_nsfw: boolean | null
          is_verified: boolean | null
          location_type: string | null
          location_value: string | null
          member_count: number | null
          minimum_karma_to_post: number | null
          name: string
          region_type: string | null
          search_vector: unknown
          sensitivity_level: string | null
          sidebar_content: string | null
          submission_rules: string | null
          theme_color: string | null
          type: string | null
          updated_at: string
          visibility_type: string | null
        }
        Insert: {
          allow_post_flairs?: boolean | null
          allow_user_flairs?: boolean | null
          auto_moderate?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          category: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_html?: string | null
          display_name: string
          id?: string
          is_mature?: boolean | null
          is_nsfw?: boolean | null
          is_verified?: boolean | null
          location_type?: string | null
          location_value?: string | null
          member_count?: number | null
          minimum_karma_to_post?: number | null
          name: string
          region_type?: string | null
          search_vector?: unknown
          sensitivity_level?: string | null
          sidebar_content?: string | null
          submission_rules?: string | null
          theme_color?: string | null
          type?: string | null
          updated_at?: string
          visibility_type?: string | null
        }
        Update: {
          allow_post_flairs?: boolean | null
          allow_user_flairs?: boolean | null
          auto_moderate?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          category?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_html?: string | null
          display_name?: string
          id?: string
          is_mature?: boolean | null
          is_nsfw?: boolean | null
          is_verified?: boolean | null
          location_type?: string | null
          location_value?: string | null
          member_count?: number | null
          minimum_karma_to_post?: number | null
          name?: string
          region_type?: string | null
          search_vector?: unknown
          sensitivity_level?: string | null
          sidebar_content?: string | null
          submission_rules?: string | null
          theme_color?: string | null
          type?: string | null
          updated_at?: string
          visibility_type?: string | null
        }
        Relationships: []
      }
      community_active_members: {
        Row: {
          community_id: string
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_active_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_active_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_active_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_bookmarks: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          label: string
          position: number | null
          url: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          label: string
          position?: number | null
          url: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          label?: string
          position?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_bookmarks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_bookmarks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_bookmarks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_bookmarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          location_data: Json | null
          location_type: string | null
          start_time: string
          title: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location_data?: Json | null
          location_type?: string | null
          start_time: string
          title: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location_data?: Json | null
          location_type?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_flairs: {
        Row: {
          background_color: string | null
          community_id: string
          created_at: string | null
          created_by: string | null
          flair_type: string | null
          id: string
          is_enabled: boolean | null
          name: string
          text_color: string | null
        }
        Insert: {
          background_color?: string | null
          community_id: string
          created_at?: string | null
          created_by?: string | null
          flair_type?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          text_color?: string | null
        }
        Update: {
          background_color?: string | null
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          flair_type?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          text_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_flairs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_flairs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_flairs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_flairs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_institutions: {
        Row: {
          community_id: string
          created_at: string | null
          institution_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          institution_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_institutions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_institutions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_institutions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string | null
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id?: string | null
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string | null
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_moderators: {
        Row: {
          added_at: string | null
          added_by: string | null
          community_id: string
          id: string
          is_temporary: boolean | null
          permissions: Json | null
          role: string | null
          term_expires_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          community_id: string
          id?: string
          is_temporary?: boolean | null
          permissions?: Json | null
          role?: string | null
          term_expires_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          community_id?: string
          id?: string
          is_temporary?: boolean | null
          permissions?: Json | null
          role?: string | null
          term_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_polls_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_polls_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_polls_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_rules: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          priority: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          priority?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          priority?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_visits: {
        Row: {
          community_id: string
          id: string
          user_id: string
          visit_date: string
          visited_at: string | null
        }
        Insert: {
          community_id: string
          id?: string
          user_id: string
          visit_date?: string
          visited_at?: string | null
        }
        Update: {
          community_id?: string
          id?: string
          user_id?: string
          visit_date?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_visits_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_visits_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_visits_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          comment_id: string | null
          created_at: string | null
          flagged_by_ai: boolean | null
          id: string
          post_id: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          verdict: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          flagged_by_ai?: boolean | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          verdict: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          flagged_by_ai?: boolean | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_ratings: {
        Row: {
          communication_rating: number | null
          contractor_id: string
          created_at: string | null
          id: string
          overall_rating: number
          professionalism_rating: number | null
          project_id: string | null
          quality_rating: number | null
          rater_id: string | null
          rater_name: string | null
          recommend: boolean | null
          review_text: string | null
          timeliness_rating: number | null
          updated_at: string | null
        }
        Insert: {
          communication_rating?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          overall_rating: number
          professionalism_rating?: number | null
          project_id?: string | null
          quality_rating?: number | null
          rater_id?: string | null
          rater_name?: string | null
          recommend?: boolean | null
          review_text?: string | null
          timeliness_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          communication_rating?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          overall_rating?: number
          professionalism_rating?: number | null
          project_id?: string | null
          quality_rating?: number | null
          rater_id?: string | null
          rater_name?: string | null
          recommend?: boolean | null
          review_text?: string | null
          timeliness_rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_ratings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_ratings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_ratings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "public_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          average_rating: number | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          name: string
          phone: string | null
          registration_number: string | null
          specialization: string[] | null
          total_projects_completed: number | null
          total_ratings: number | null
          updated_at: string | null
          verification_date: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      country_governance_templates: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          flag_emoji: string | null
          governance_system: Json
          id: string
          is_verified: boolean | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          flag_emoji?: string | null
          governance_system: Json
          id?: string
          is_verified?: boolean | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          flag_emoji?: string | null
          governance_system?: Json
          id?: string
          is_verified?: boolean | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_governance_templates_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_reports: {
        Row: {
          anonymous_report_id: string | null
          created_at: string | null
          crisis_type: string
          description: string | null
          escalated_to_ngo: string[] | null
          evidence_urls: string[] | null
          id: string
          latitude: number | null
          location_text: string | null
          longitude: number | null
          report_id: string
          resolved_at: string | null
          resolved_by: string | null
          response_actions: Json | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          anonymous_report_id?: string | null
          created_at?: string | null
          crisis_type: string
          description?: string | null
          escalated_to_ngo?: string[] | null
          evidence_urls?: string[] | null
          id?: string
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          report_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: Json | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          anonymous_report_id?: string | null
          created_at?: string | null
          crisis_type?: string
          description?: string | null
          escalated_to_ngo?: string[] | null
          evidence_urls?: string[] | null
          id?: string
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          report_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: Json | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crisis_reports_anonymous_report_id_fkey"
            columns: ["anonymous_report_id"]
            isOneToOne: false
            referencedRelation: "anonymous_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      development_promises: {
        Row: {
          actual_completion_date: string | null
          beneficiaries_count: number | null
          budget_allocated: number | null
          budget_used: number | null
          category: string | null
          contractor: string | null
          created_at: string
          description: string | null
          expected_completion_date: string | null
          funding_source: string | null
          id: string
          location: string | null
          office_holder_id: string | null
          official_id: string
          progress_percentage: number | null
          search_vector: unknown
          start_date: string | null
          status: Database["public"]["Enums"]["promise_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          beneficiaries_count?: number | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          contractor?: string | null
          created_at?: string
          description?: string | null
          expected_completion_date?: string | null
          funding_source?: string | null
          id?: string
          location?: string | null
          office_holder_id?: string | null
          official_id: string
          progress_percentage?: number | null
          search_vector?: unknown
          start_date?: string | null
          status?: Database["public"]["Enums"]["promise_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          beneficiaries_count?: number | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          contractor?: string | null
          created_at?: string
          description?: string | null
          expected_completion_date?: string | null
          funding_source?: string | null
          id?: string
          location?: string | null
          office_holder_id?: string | null
          official_id?: string
          progress_percentage?: number | null
          search_vector?: unknown
          start_date?: string | null
          status?: Database["public"]["Enums"]["promise_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_promises_office_holder_id_fkey"
            columns: ["office_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_promises_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      education_content: {
        Row: {
          assigned_to: string | null
          assignment_notes: string | null
          author_id: string | null
          category: string
          content: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_featured: boolean | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assignment_notes?: string | null
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_featured?: boolean | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assignment_notes?: string | null
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_featured?: boolean | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_content_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      election_cycles: {
        Row: {
          created_at: string | null
          declared_candidates: Json | null
          election_date: string
          election_type: string | null
          id: string
          position_id: string | null
          results_certified: boolean | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          declared_candidates?: Json | null
          election_date: string
          election_type?: string | null
          id?: string
          position_id?: string | null
          results_certified?: boolean | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          declared_candidates?: Json | null
          election_date?: string
          election_type?: string | null
          id?: string
          position_id?: string | null
          results_certified?: boolean | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "election_cycles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_cycles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "election_cycles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_cycles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "election_cycles_winner_user_id_fkey"
            columns: ["winner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          page_url: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          page_url?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          page_url?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expertise_endorsements: {
        Row: {
          created_at: string | null
          endorser_id: string
          expertise_id: string
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string | null
          endorser_id: string
          expertise_id: string
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string | null
          endorser_id?: string
          expertise_id?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expertise_endorsements_endorser_id_fkey"
            columns: ["endorser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expertise_endorsements_expertise_id_fkey"
            columns: ["expertise_id"]
            isOneToOne: false
            referencedRelation: "user_expertise"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          parent_reply_id: string | null
          thread_id: string
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          thread_id: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          thread_id?: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reply_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_reactions_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_reactions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          channel_id: string
          community_id: string
          content: string | null
          created_at: string | null
          id: string
          last_reply_at: string | null
          locked: boolean | null
          pinned: boolean | null
          reply_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          channel_id: string
          community_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          last_reply_at?: string | null
          locked?: boolean | null
          pinned?: boolean | null
          reply_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          channel_id?: string
          community_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          last_reply_at?: string | null
          locked?: boolean | null
          pinned?: boolean | null
          reply_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      goat_levels: {
        Row: {
          badge_color: string | null
          description: string | null
          level: number
          title: string
          xp_required: number
        }
        Insert: {
          badge_color?: string | null
          description?: string | null
          level: number
          title: string
          xp_required: number
        }
        Update: {
          badge_color?: string | null
          description?: string | null
          level?: number
          title?: string
          xp_required?: number
        }
        Relationships: []
      }
      governance_hierarchies: {
        Row: {
          country: string
          created_at: string | null
          id: string
          level_1_name: string | null
          level_2_name: string | null
          level_3_name: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          level_1_name?: string | null
          level_2_name?: string | null
          level_3_name?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          level_1_name?: string | null
          level_2_name?: string | null
          level_3_name?: string | null
        }
        Relationships: []
      }
      government_institutions: {
        Row: {
          acronym: string | null
          banner_url: string | null
          contact_email: string | null
          contact_phone: string | null
          country_code: string
          created_at: string | null
          created_by: string | null
          custom_avatar_url: string | null
          description: string | null
          division_id: string | null
          established_date: string | null
          id: string
          institution_type: string
          is_active: boolean | null
          jurisdiction_name: string | null
          jurisdiction_type: string
          name: string
          parent_institution_id: string | null
          physical_address: string | null
          position_id: string | null
          reporting_level: number | null
          slug: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          acronym?: string | null
          banner_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          custom_avatar_url?: string | null
          description?: string | null
          division_id?: string | null
          established_date?: string | null
          id?: string
          institution_type: string
          is_active?: boolean | null
          jurisdiction_name?: string | null
          jurisdiction_type: string
          name: string
          parent_institution_id?: string | null
          physical_address?: string | null
          position_id?: string | null
          reporting_level?: number | null
          slug?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          acronym?: string | null
          banner_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          custom_avatar_url?: string | null
          description?: string | null
          division_id?: string | null
          established_date?: string | null
          id?: string
          institution_type?: string
          is_active?: boolean | null
          jurisdiction_name?: string | null
          jurisdiction_type?: string
          name?: string
          parent_institution_id?: string | null
          physical_address?: string | null
          position_id?: string | null
          reporting_level?: number | null
          slug?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "government_institutions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "country_governance_templates"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "government_institutions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "administrative_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_parent_institution_id_fkey"
            columns: ["parent_institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "government_institutions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_institutions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
        ]
      }
      government_positions: {
        Row: {
          authority_level: number | null
          banner_url: string | null
          budget_info: Json | null
          country_code: string
          created_at: string | null
          custom_avatar_url: string | null
          description: string | null
          election_type: string | null
          governance_level: string
          id: string
          is_elected: boolean | null
          jurisdiction_code: string | null
          jurisdiction_name: string
          next_election_date: string | null
          position_code: string
          resolutions: Json | null
          responsibilities: string | null
          term_limit: number | null
          term_years: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          authority_level?: number | null
          banner_url?: string | null
          budget_info?: Json | null
          country_code: string
          created_at?: string | null
          custom_avatar_url?: string | null
          description?: string | null
          election_type?: string | null
          governance_level: string
          id?: string
          is_elected?: boolean | null
          jurisdiction_code?: string | null
          jurisdiction_name: string
          next_election_date?: string | null
          position_code: string
          resolutions?: Json | null
          responsibilities?: string | null
          term_limit?: number | null
          term_years?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          authority_level?: number | null
          banner_url?: string | null
          budget_info?: Json | null
          country_code?: string
          created_at?: string | null
          custom_avatar_url?: string | null
          description?: string | null
          election_type?: string | null
          governance_level?: string
          id?: string
          is_elected?: boolean | null
          jurisdiction_code?: string | null
          jurisdiction_name?: string
          next_election_date?: string | null
          position_code?: string
          resolutions?: Json | null
          responsibilities?: string | null
          term_limit?: number | null
          term_years?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      government_projects: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          budget_allocated: number | null
          budget_used: number | null
          category: string | null
          community_confidence: number | null
          completion_notes: string | null
          constituency: string | null
          county: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          documents_urls: string[] | null
          funding_source: string | null
          funding_type: string | null
          id: string
          is_verified: boolean | null
          last_updated_by: string | null
          latitude: number | null
          lead_contractor_id: string | null
          location: string | null
          longitude: number | null
          media_urls: string[] | null
          office_holder_id: string | null
          official_id: string | null
          planned_completion_date: string | null
          planned_start_date: string | null
          primary_institution_id: string | null
          primary_official_id: string | null
          primary_responsible_type: string | null
          priority: string | null
          progress_percentage: number | null
          project_level: string | null
          search_vector: unknown
          sentiment_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          verification_count: number | null
          verification_id: string | null
          ward: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          community_confidence?: number | null
          completion_notes?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documents_urls?: string[] | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_updated_by?: string | null
          latitude?: number | null
          lead_contractor_id?: string | null
          location?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          office_holder_id?: string | null
          official_id?: string | null
          planned_completion_date?: string | null
          planned_start_date?: string | null
          primary_institution_id?: string | null
          primary_official_id?: string | null
          primary_responsible_type?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_level?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          verification_count?: number | null
          verification_id?: string | null
          ward?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          community_confidence?: number | null
          completion_notes?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documents_urls?: string[] | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_updated_by?: string | null
          latitude?: number | null
          lead_contractor_id?: string | null
          location?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          office_holder_id?: string | null
          official_id?: string | null
          planned_completion_date?: string | null
          planned_start_date?: string | null
          primary_institution_id?: string | null
          primary_official_id?: string | null
          primary_responsible_type?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_level?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          verification_count?: number | null
          verification_id?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_contractor"
            columns: ["lead_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_contractor"
            columns: ["lead_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_contractor"
            columns: ["lead_contractor_id"]
            isOneToOne: false
            referencedRelation: "public_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_office_holder_id_fkey"
            columns: ["office_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_primary_institution_id_fkey"
            columns: ["primary_institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_primary_official_id_fkey"
            columns: ["primary_official_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_primary_official_id_fkey"
            columns: ["primary_official_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "government_projects_primary_official_id_fkey"
            columns: ["primary_official_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_primary_official_id_fkey"
            columns: ["primary_official_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "government_projects_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_handlers: {
        Row: {
          approved_by: string | null
          created_at: string
          granted_by_holder_id: string | null
          id: string
          institution_id: string
          rejection_reason: string | null
          request_message: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          granted_by_holder_id?: string | null
          id?: string
          institution_id: string
          rejection_reason?: string | null
          request_message?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          granted_by_holder_id?: string | null
          id?: string
          institution_id?: string
          rejection_reason?: string | null
          request_message?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_handlers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_handlers_granted_by_holder_id_fkey"
            columns: ["granted_by_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_handlers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_handlers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_updates: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          institution_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          institution_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          institution_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_updates_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_scores: {
        Row: {
          computed_at: string | null
          id: string
          location_type: string | null
          location_value: string | null
          period: string
          rank: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          computed_at?: string | null
          id?: string
          location_type?: string | null
          location_value?: string | null
          period: string
          rank?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          computed_at?: string | null
          id?: string
          location_type?: string | null
          location_value?: string | null
          period?: string
          rank?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_scores_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_mail_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_mail_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "mod_mail_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_mail_threads: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_mail_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_mail_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_mail_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          flag_id: string | null
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          flag_id?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          flag_id?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "content_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          ai_confidence: number | null
          content_preview: string | null
          content_type: string
          created_at: string
          id: string
          model_used: string | null
          processing_time_ms: number | null
          reason: string | null
          user_id: string | null
          verdict: string
        }
        Insert: {
          ai_confidence?: number | null
          content_preview?: string | null
          content_type: string
          created_at?: string
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          reason?: string | null
          user_id?: string | null
          verdict: string
        }
        Update: {
          ai_confidence?: number | null
          content_preview?: string | null
          content_type?: string
          created_at?: string
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          reason?: string | null
          user_id?: string | null
          verdict?: string
        }
        Relationships: []
      }
      ngo_partners: {
        Row: {
          avg_response_hours: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          hotline: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          reports_received: number | null
          sla_hours: number | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avg_response_hours?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          hotline?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          reports_received?: number | null
          sla_hours?: number | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avg_response_hours?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          hotline?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          reports_received?: number | null
          sla_hours?: number | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      office_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          office_holder_id: string
          reference_id: string | null
          reference_type: string | null
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          office_holder_id: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          office_holder_id?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_activity_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_activity_log_office_holder_id_fkey"
            columns: ["office_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
        ]
      }
      office_holders: {
        Row: {
          claimed_at: string | null
          id: string
          is_active: boolean | null
          is_historical: boolean | null
          position_id: string | null
          proof_documents: Json | null
          rejection_notes: string | null
          term_end: string
          term_start: string
          user_id: string | null
          verification_method: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          is_active?: boolean | null
          is_historical?: boolean | null
          position_id?: string | null
          proof_documents?: Json | null
          rejection_notes?: string | null
          term_end: string
          term_start: string
          user_id?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          claimed_at?: string | null
          id?: string
          is_active?: boolean | null
          is_historical?: boolean | null
          position_id?: string | null
          proof_documents?: Json | null
          rejection_notes?: string | null
          term_end?: string
          term_start?: string
          user_id?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_holders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_holders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "office_holders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_holders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "office_holders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_holders_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_manifestos: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          is_pinned: boolean | null
          is_verified: boolean | null
          office_holder_id: string | null
          office_id: string | null
          position_id: string | null
          title: string
          uploaded_by: string
          year: number | null
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          is_pinned?: boolean | null
          is_verified?: boolean | null
          office_holder_id?: string | null
          office_id?: string | null
          position_id?: string | null
          title: string
          uploaded_by: string
          year?: number | null
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          is_pinned?: boolean | null
          is_verified?: boolean | null
          office_holder_id?: string | null
          office_id?: string | null
          position_id?: string | null
          title?: string
          uploaded_by?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "office_manifestos_office_holder_id_fkey"
            columns: ["office_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_manifestos_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_manifestos_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "office_manifestos_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_manifestos_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "office_manifestos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_promises: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          office_holder_id: string
          progress: number
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          office_holder_id: string
          progress?: number
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          office_holder_id?: string
          progress?: number
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_promises_office_holder_id_fkey"
            columns: ["office_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
        ]
      }
      office_proposals: {
        Row: {
          category: string | null
          created_at: string
          description: string
          holder_response: string | null
          id: string
          office_id: string | null
          position_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          holder_response?: string | null
          id?: string
          office_id?: string | null
          position_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          holder_response?: string | null
          id?: string
          office_id?: string | null
          position_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_proposals_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_proposals_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "office_proposals_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_proposals_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "office_proposals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_proposals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          asked_at: string | null
          asked_by: string
          id: string
          is_pinned: boolean | null
          office_holder_id: string
          question: string
          upvotes: number | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_at?: string | null
          asked_by: string
          id?: string
          is_pinned?: boolean | null
          office_holder_id: string
          question: string
          upvotes?: number | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_at?: string | null
          asked_by?: string
          id?: string
          is_pinned?: boolean | null
          office_holder_id?: string
          question?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "office_questions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_questions_asked_by_fkey"
            columns: ["asked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_questions_office_holder_id_fkey"
            columns: ["office_holder_id"]
            isOneToOne: false
            referencedRelation: "office_holders"
            referencedColumns: ["id"]
          },
        ]
      }
      official_contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string
          id: string
          is_public: boolean
          official_id: string
          updated_at: string
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string
          id?: string
          is_public?: boolean
          official_id: string
          updated_at?: string
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string
          id?: string
          is_public?: boolean
          official_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_contacts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      official_responses: {
        Row: {
          action_id: string | null
          created_at: string | null
          evidence_urls: string[] | null
          id: string
          new_status: string | null
          official_id: string | null
          response_text: string | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          new_status?: string | null
          official_id?: string | null
          response_text?: string | null
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          new_status?: string | null
          official_id?: string | null
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_responses_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_responses_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      official_scorecards: {
        Row: {
          attendance_percent: number | null
          attendance_sessions_present: number | null
          attendance_sessions_total: number | null
          avg_response_hours: number | null
          created_at: string | null
          last_calculated: string | null
          overall_grade: string | null
          projects_active: number | null
          projects_cancelled: number | null
          projects_completed: number | null
          projects_stalled: number | null
          projects_total: number | null
          promise_kept_percent: number | null
          promises_broken: number | null
          promises_in_progress: number | null
          promises_kept: number | null
          promises_total: number | null
          queries_responded: number | null
          total_citizen_queries: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendance_percent?: number | null
          attendance_sessions_present?: number | null
          attendance_sessions_total?: number | null
          avg_response_hours?: number | null
          created_at?: string | null
          last_calculated?: string | null
          overall_grade?: string | null
          projects_active?: number | null
          projects_cancelled?: number | null
          projects_completed?: number | null
          projects_stalled?: number | null
          projects_total?: number | null
          promise_kept_percent?: number | null
          promises_broken?: number | null
          promises_in_progress?: number | null
          promises_kept?: number | null
          promises_total?: number | null
          queries_responded?: number | null
          total_citizen_queries?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendance_percent?: number | null
          attendance_sessions_present?: number | null
          attendance_sessions_total?: number | null
          avg_response_hours?: number | null
          created_at?: string | null
          last_calculated?: string | null
          overall_grade?: string | null
          projects_active?: number | null
          projects_cancelled?: number | null
          projects_completed?: number | null
          projects_stalled?: number | null
          projects_total?: number | null
          promise_kept_percent?: number | null
          promises_broken?: number | null
          promises_in_progress?: number | null
          promises_kept?: number | null
          promises_total?: number | null
          queries_responded?: number | null
          total_citizen_queries?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_scorecards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          bio: string | null
          committees: Json | null
          constituency: string | null
          constituency_id: string | null
          county: string | null
          county_id: string | null
          created_at: string
          deprecated_at: string | null
          education: Json | null
          experience: Json | null
          id: string
          level: Database["public"]["Enums"]["official_level"]
          manifesto_url: string | null
          migration_note: string | null
          name: string
          party: string | null
          photo_url: string | null
          position: string
          search_vector: unknown
          updated_at: string
          ward: string | null
          ward_id: string | null
        }
        Insert: {
          bio?: string | null
          committees?: Json | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          deprecated_at?: string | null
          education?: Json | null
          experience?: Json | null
          id?: string
          level: Database["public"]["Enums"]["official_level"]
          manifesto_url?: string | null
          migration_note?: string | null
          name: string
          party?: string | null
          photo_url?: string | null
          position: string
          search_vector?: unknown
          updated_at?: string
          ward?: string | null
          ward_id?: string | null
        }
        Update: {
          bio?: string | null
          committees?: Json | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          deprecated_at?: string | null
          education?: Json | null
          experience?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["official_level"]
          manifesto_url?: string | null
          migration_note?: string | null
          name?: string
          party?: string | null
          photo_url?: string | null
          position?: string
          search_vector?: unknown
          updated_at?: string
          ward?: string | null
          ward_id?: string | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          communities_joined: number | null
          completed_at: string | null
          created_at: string | null
          first_comment: boolean | null
          first_post: boolean | null
          id: string
          interests_set: boolean | null
          location_set: boolean | null
          persona_set: boolean | null
          step_completed: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          communities_joined?: number | null
          completed_at?: string | null
          created_at?: string | null
          first_comment?: boolean | null
          first_post?: boolean | null
          id?: string
          interests_set?: boolean | null
          location_set?: boolean | null
          persona_set?: boolean | null
          step_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          communities_joined?: number | null
          completed_at?: string | null
          created_at?: string | null
          first_comment?: boolean | null
          first_post?: boolean | null
          id?: string
          interests_set?: boolean | null
          location_set?: boolean | null
          persona_set?: boolean | null
          step_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          page_url: string | null
          rating: string | null
          user_agent: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          page_url?: string | null
          rating?: string | null
          user_agent?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          page_url?: string | null
          rating?: string | null
          user_agent?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      position_communities: {
        Row: {
          access_level: string | null
          auto_moderation: boolean | null
          community_id: string | null
          id: string
          position_id: string | null
        }
        Insert: {
          access_level?: string | null
          auto_moderation?: boolean | null
          community_id?: string | null
          id?: string
          position_id?: string | null
        }
        Update: {
          access_level?: string | null
          auto_moderation?: boolean | null
          community_id?: string | null
          id?: string
          position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "position_communities_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
        ]
      }
      post_media: {
        Row: {
          file_path: string
          file_size: number | null
          file_type: string
          filename: string
          id: string
          post_id: string
          uploaded_at: string
        }
        Insert: {
          file_path: string
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          post_id: string
          uploaded_at?: string
        }
        Update: {
          file_path?: string
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          post_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          agent_flags: Json
          author_id: string
          comment_count: number | null
          community_id: string | null
          content: string
          content_sensitivity: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          downvotes: number | null
          hidden_by_agent: string | null
          hidden_reason: string | null
          id: string
          is_hidden: boolean
          is_ngo_verified: boolean | null
          link_description: string | null
          link_image: string | null
          link_title: string | null
          link_url: string | null
          official_id: string | null
          search_vector: unknown
          sentiment_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
          verification_id: string | null
          verification_source: string | null
          verification_status: string | null
          video_data: Json | null
        }
        Insert: {
          agent_flags?: Json
          author_id: string
          comment_count?: number | null
          community_id?: string | null
          content: string
          content_sensitivity?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          downvotes?: number | null
          hidden_by_agent?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          is_ngo_verified?: boolean | null
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          official_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
          verification_source?: string | null
          verification_status?: string | null
          video_data?: Json | null
        }
        Update: {
          agent_flags?: Json
          author_id?: string
          comment_count?: number | null
          community_id?: string | null
          content?: string
          content_sensitivity?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          downvotes?: number | null
          hidden_by_agent?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          is_ngo_verified?: boolean | null
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          official_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
          verification_source?: string | null
          verification_status?: string | null
          video_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_customizations: {
        Row: {
          accent_color: string | null
          banner_animation_url: string | null
          created_at: string | null
          frame_animation: string | null
          has_premium_features: boolean | null
          premium_until: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
          walkout_sound_url: string | null
        }
        Insert: {
          accent_color?: string | null
          banner_animation_url?: string | null
          created_at?: string | null
          frame_animation?: string | null
          has_premium_features?: boolean | null
          premium_until?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          walkout_sound_url?: string | null
        }
        Update: {
          accent_color?: string | null
          banner_animation_url?: string | null
          created_at?: string | null
          frame_animation?: string | null
          has_premium_features?: boolean | null
          premium_until?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          walkout_sound_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_customizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_stats: Json | null
          avatar_url: string | null
          badges: string[] | null
          banner_url: string | null
          bio: string | null
          comment_karma: number | null
          constituency: string | null
          constituency_id: string | null
          county: string | null
          county_id: string | null
          created_at: string
          display_name: string | null
          expertise: string[] | null
          id: string
          is_platform_admin: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          join_date: string | null
          karma: number | null
          last_activity: string | null
          location: string | null
          notification_settings: Json | null
          official_position: string | null
          official_position_id: string | null
          onboarding_completed: boolean | null
          persona: Database["public"]["Enums"]["user_persona"] | null
          post_karma: number | null
          privacy_settings: Json | null
          role: string | null
          search_vector: unknown
          social_links: Json | null
          title: string | null
          updated_at: string
          user_flair: string | null
          username: string | null
          ward: string | null
          ward_id: string | null
          website: string | null
        }
        Insert: {
          activity_stats?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          banner_url?: string | null
          bio?: string | null
          comment_karma?: number | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          display_name?: string | null
          expertise?: string[] | null
          id: string
          is_platform_admin?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          join_date?: string | null
          karma?: number | null
          last_activity?: string | null
          location?: string | null
          notification_settings?: Json | null
          official_position?: string | null
          official_position_id?: string | null
          onboarding_completed?: boolean | null
          persona?: Database["public"]["Enums"]["user_persona"] | null
          post_karma?: number | null
          privacy_settings?: Json | null
          role?: string | null
          search_vector?: unknown
          social_links?: Json | null
          title?: string | null
          updated_at?: string
          user_flair?: string | null
          username?: string | null
          ward?: string | null
          ward_id?: string | null
          website?: string | null
        }
        Update: {
          activity_stats?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          banner_url?: string | null
          bio?: string | null
          comment_karma?: number | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          display_name?: string | null
          expertise?: string[] | null
          id?: string
          is_platform_admin?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          join_date?: string | null
          karma?: number | null
          last_activity?: string | null
          location?: string | null
          notification_settings?: Json | null
          official_position?: string | null
          official_position_id?: string | null
          onboarding_completed?: boolean | null
          persona?: Database["public"]["Enums"]["user_persona"] | null
          post_karma?: number | null
          privacy_settings?: Json | null
          role?: string | null
          search_vector?: unknown
          social_links?: Json | null
          title?: string | null
          updated_at?: string
          user_flair?: string | null
          username?: string | null
          ward?: string | null
          ward_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_official_position_id_fkey"
            columns: ["official_position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_official_position_id_fkey"
            columns: ["official_position_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "profiles_official_position_id_fkey"
            columns: ["official_position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_official_position_id_fkey"
            columns: ["official_position_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
        ]
      }
      project_collaborating_institutions: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          project_id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          project_id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborating_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborating_institutions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_collaborating_officials: {
        Row: {
          created_at: string | null
          id: string
          official_id: string
          project_id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          official_id: string
          project_id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          official_id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborating_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborating_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "office_dashboard_snapshot"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "project_collaborating_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborating_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "project_collaborating_officials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contractors: {
        Row: {
          contract_end_date: string | null
          contract_start_date: string | null
          contract_value: number | null
          contractor_id: string
          created_at: string | null
          id: string
          notes: string | null
          performance_rating: number | null
          project_id: string
          role: string | null
        }
        Insert: {
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          performance_rating?: number | null
          project_id: string
          role?: string | null
        }
        Update: {
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          performance_rating?: number | null
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "public_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          community_verified: boolean | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          media_urls: string[] | null
          project_id: string
          title: string
          update_type: string
          updated_at: string | null
        }
        Insert: {
          community_verified?: boolean | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          media_urls?: string[] | null
          project_id: string
          title: string
          update_type?: string
          updated_at?: string | null
        }
        Update: {
          community_verified?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          media_urls?: string[] | null
          project_id?: string
          title?: string
          update_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_verifications: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          media_urls: string[] | null
          project_id: string
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          media_urls?: string[] | null
          project_id: string
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          media_urls?: string[] | null
          project_id?: string
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_verifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_views: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      promise_updates: {
        Row: {
          amount_spent: number | null
          created_at: string
          created_by: string | null
          description: string | null
          documents: Json | null
          id: string
          photos: Json | null
          progress_percentage: number | null
          promise_id: string
          title: string
          update_date: string
        }
        Insert: {
          amount_spent?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          photos?: Json | null
          progress_percentage?: number | null
          promise_id: string
          title: string
          update_date?: string
        }
        Update: {
          amount_spent?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          photos?: Json | null
          progress_percentage?: number | null
          promise_id?: string
          title?: string
          update_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "promise_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promise_updates_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "development_promises"
            referencedColumns: ["id"]
          },
        ]
      }
      promise_verifications: {
        Row: {
          actual_progress: number | null
          claimed_progress: number | null
          community_confidence: number | null
          created_at: string | null
          description: string
          documents: string[] | null
          downvotes: number | null
          id: string
          issues_identified: string | null
          photos: string[] | null
          promise_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string | null
          upvotes: number | null
          verification_type: string
          verifier_id: string | null
          verifier_name: string | null
          videos: string[] | null
        }
        Insert: {
          actual_progress?: number | null
          claimed_progress?: number | null
          community_confidence?: number | null
          created_at?: string | null
          description: string
          documents?: string[] | null
          downvotes?: number | null
          id?: string
          issues_identified?: string | null
          photos?: string[] | null
          promise_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          verification_type: string
          verifier_id?: string | null
          verifier_name?: string | null
          videos?: string[] | null
        }
        Update: {
          actual_progress?: number | null
          claimed_progress?: number | null
          community_confidence?: number | null
          created_at?: string | null
          description?: string
          documents?: string[] | null
          downvotes?: number | null
          id?: string
          issues_identified?: string | null
          photos?: string[] | null
          promise_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          verification_type?: string
          verifier_id?: string | null
          verifier_name?: string | null
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "promise_verifications_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "development_promises"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          points: number
          requirements: Json | null
          title: string
          updated_at: string | null
          verification_type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          requirements?: Json | null
          title: string
          updated_at?: string | null
          verification_type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          requirements?: Json | null
          title?: string
          updated_at?: string | null
          verification_type?: string
        }
        Relationships: []
      }
      rag_chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          model_used: string | null
          role: string
          session_id: string
          sources: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model_used?: string | null
          role: string
          session_id: string
          sources?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model_used?: string | null
          role?: string
          session_id?: string
          sources?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          action: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          action?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      routing_logs: {
        Row: {
          confidence: number | null
          created_at: string
          department_name: string | null
          department_slug: string | null
          id: string
          issue_description: string
          issue_type: string | null
          location: string | null
          model_used: string | null
          processing_time_ms: number | null
          recommended_actions: Json | null
          severity: number | null
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          department_name?: string | null
          department_slug?: string | null
          id?: string
          issue_description: string
          issue_type?: string | null
          location?: string | null
          model_used?: string | null
          processing_time_ms?: number | null
          recommended_actions?: Json | null
          severity?: number | null
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          department_name?: string | null
          department_slug?: string | null
          id?: string
          issue_description?: string
          issue_type?: string | null
          location?: string | null
          model_used?: string | null
          processing_time_ms?: number | null
          recommended_actions?: Json | null
          severity?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_findings: {
        Row: {
          category: string | null
          county: string | null
          created_at: string
          embedded: boolean
          id: string
          processed: boolean
          raw_content: string | null
          related_id: string | null
          related_name: string | null
          related_to: string | null
          relevance_score: number | null
          source_type: string | null
          source_url: string | null
          summary: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          county?: string | null
          created_at?: string
          embedded?: boolean
          id?: string
          processed?: boolean
          raw_content?: string | null
          related_id?: string | null
          related_name?: string | null
          related_to?: string | null
          relevance_score?: number | null
          source_type?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          county?: string | null
          created_at?: string
          embedded?: boolean
          id?: string
          processed?: boolean
          raw_content?: string | null
          related_id?: string | null
          related_name?: string | null
          related_to?: string | null
          relevance_score?: number | null
          source_type?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string | null
        }
        Relationships: []
      }
      sentiment_scores: {
        Row: {
          content_id: string
          content_type: string
          id: string
          negative_count: number | null
          neutral_count: number | null
          positive_count: number | null
          total_count: number | null
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          negative_count?: number | null
          neutral_count?: number | null
          positive_count?: number | null
          total_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          negative_count?: number | null
          neutral_count?: number | null
          positive_count?: number | null
          total_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sentiment_votes: {
        Row: {
          created_at: string | null
          id: string
          sentiment_id: string
          sentiment_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sentiment_id: string
          sentiment_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sentiment_id?: string
          sentiment_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_votes_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_endorsements: {
        Row: {
          endorsed_at: string | null
          endorsed_by: string
          endorsement_note: string | null
          id: string
          user_skill_id: string
          weight: number | null
        }
        Insert: {
          endorsed_at?: string | null
          endorsed_by: string
          endorsement_note?: string | null
          id?: string
          user_skill_id: string
          weight?: number | null
        }
        Update: {
          endorsed_at?: string | null
          endorsed_by?: string
          endorsement_note?: string | null
          id?: string
          user_skill_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_endorsements_user_skill_id_fkey"
            columns: ["user_skill_id"]
            isOneToOne: false
            referencedRelation: "user_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      system_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string | null
          achievement_type: string
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_name?: string | null
          achievement_type: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string | null
          achievement_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions: {
        Row: {
          action_type: string
          action_value: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          action_value?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          action_value?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          entity_id: string
          entity_title: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          entity_id: string
          entity_title?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          entity_id?: string
          entity_title?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_expertise: {
        Row: {
          created_at: string | null
          endorsement_count: number | null
          expertise_type: string
          id: string
          is_verified: boolean | null
          updated_at: string | null
          user_id: string
          verified_actions_count: number | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          endorsement_count?: number | null
          expertise_type: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          user_id: string
          verified_actions_count?: number | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          endorsement_count?: number | null
          expertise_type?: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
          verified_actions_count?: number | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_expertise_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          id: string
          interest_id: string | null
          selected_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          interest_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          interest_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "civic_interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_privacy_settings: {
        Row: {
          activity_visibility: string | null
          allow_messages: string | null
          contact_visibility: string | null
          created_at: string | null
          data_sharing: boolean | null
          id: string
          profile_visibility: string | null
          show_online_status: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_visibility?: string | null
          allow_messages?: string | null
          contact_visibility?: string | null
          created_at?: string | null
          data_sharing?: boolean | null
          id?: string
          profile_visibility?: string | null
          show_online_status?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_visibility?: string | null
          allow_messages?: string | null
          contact_visibility?: string | null
          created_at?: string | null
          data_sharing?: boolean | null
          id?: string
          profile_visibility?: string | null
          show_online_status?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          completed_at: string | null
          evidence: Json | null
          id: string
          progress: number | null
          quest_id: string
          rejection_reason: string | null
          started_at: string | null
          status: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          completed_at?: string | null
          evidence?: Json | null
          id?: string
          progress?: number | null
          quest_id: string
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completed_at?: string | null
          evidence?: Json | null
          id?: string
          progress?: number | null
          quest_id?: string
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          claimed_at: string | null
          credibility_score: number | null
          endorsement_count: number | null
          id: string
          skill_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          credibility_score?: number | null
          endorsement_count?: number | null
          id?: string
          skill_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          credibility_score?: number | null
          endorsement_count?: number | null
          id?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          content_ref: string | null
          content_type: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_by: string
          reason: string
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          content_ref?: string | null
          content_type?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string
          reason: string
          severity?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          content_ref?: string | null
          content_type?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string
          reason?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      vectors: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          title?: string | null
        }
        Relationships: []
      }
      verification_votes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          verification_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          verification_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          verification_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_votes_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          status: string
          total_votes: number | null
          truth_score: number | null
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          status?: string
          total_votes?: number | null
          truth_score?: number | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          status?: string
          total_votes?: number | null
          truth_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      civic_action_analytics: {
        Row: {
          avg_days_to_resolve: number | null
          category: string | null
          constituency_id: string | null
          county_id: string | null
          issue_count: number | null
          status: string | null
          ward_id: string | null
        }
        Relationships: []
      }
      communities_with_stats: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_html: string | null
          display_name: string | null
          id: string | null
          is_mature: boolean | null
          is_verified: boolean | null
          member_count: number | null
          name: string | null
          online_count: number | null
          updated_at: string | null
          visibility_type: string | null
        }
        Relationships: []
      }
      constituencies: {
        Row: {
          counties: Json | null
          county_id: string | null
          created_at: string | null
          id: string | null
          name: string | null
          population: number | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "administrative_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_contacts: {
        Row: {
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          registration_number: string | null
          specialization: string[] | null
          website: string | null
        }
        Insert: {
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          website?: string | null
        }
        Update: {
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      counties: {
        Row: {
          country: string | null
          created_at: string | null
          id: string | null
          name: string | null
          population: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          population?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          population?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_divisions_country_code_fkey"
            columns: ["country"]
            isOneToOne: false
            referencedRelation: "country_governance_templates"
            referencedColumns: ["country_code"]
          },
        ]
      }
      office_dashboard_snapshot: {
        Row: {
          activity_last_30d: number | null
          governance_level: string | null
          jurisdiction_name: string | null
          position_code: string | null
          position_id: string | null
          projects_total: number | null
          promises_completed: number | null
          promises_total: number | null
          questions_answered: number | null
          questions_total: number | null
          refreshed_at: string | null
        }
        Relationships: []
      }
      offices: {
        Row: {
          budget_info: Json | null
          country_code: string | null
          created_at: string | null
          governance_level: string | null
          id: string | null
          jurisdiction_name: string | null
          position_code: string | null
          position_id: string | null
          resolutions: Json | null
          updated_at: string | null
        }
        Insert: {
          budget_info?: Json | null
          country_code?: string | null
          created_at?: string | null
          governance_level?: string | null
          id?: string | null
          jurisdiction_name?: string | null
          position_code?: string | null
          position_id?: string | null
          resolutions?: Json | null
          updated_at?: string | null
        }
        Update: {
          budget_info?: Json | null
          country_code?: string | null
          created_at?: string | null
          governance_level?: string | null
          id?: string | null
          jurisdiction_name?: string | null
          position_code?: string | null
          position_id?: string | null
          resolutions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      popular_communities: {
        Row: {
          activity_score: number | null
          category: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string | null
          member_count: number | null
          name: string | null
        }
        Relationships: []
      }
      public_community_moderators: {
        Row: {
          added_at: string | null
          avatar_url: string | null
          community_id: string | null
          display_name: string | null
          id: string | null
          role: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_contractors: {
        Row: {
          average_rating: number | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_verified: boolean | null
          name: string | null
          phone: string | null
          registration_number: string | null
          specialization: string[] | null
          total_projects_completed: number | null
          total_ratings: number | null
          updated_at: string | null
          verification_date: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: never
          created_at?: string | null
          email?: never
          id?: string | null
          is_verified?: boolean | null
          name?: string | null
          phone?: never
          registration_number?: never
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: never
          years_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: never
          created_at?: string | null
          email?: never
          id?: string | null
          is_verified?: boolean | null
          name?: string | null
          phone?: never
          registration_number?: never
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: never
          years_experience?: number | null
        }
        Relationships: []
      }
      rate_limit_stats: {
        Row: {
          action: string | null
          avg_requests_per_user: number | null
          earliest_window: string | null
          latest_window: string | null
          max_requests: number | null
          total_requests: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      trending_posts: {
        Row: {
          author_id: string | null
          comment_count: number | null
          community_id: string | null
          created_at: string | null
          downvotes: number | null
          hot_score: number | null
          id: string | null
          rising_score: number | null
          title: string | null
          upvotes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "popular_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          constituencies: Json | null
          constituency_id: string | null
          created_at: string | null
          id: string | null
          name: string | null
          population: number | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "administrative_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_divisions_parent_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acknowledge_warning: {
        Args: { p_warning_id: string }
        Returns: undefined
      }
      agent_hide_comment: {
        Args: { p_agent: string; p_comment_id: string; p_reason: string }
        Returns: undefined
      }
      agent_hide_post: {
        Args: { p_agent: string; p_post_id: string; p_reason: string }
        Returns: undefined
      }
      calculate_comment_karma: { Args: { user_uuid: string }; Returns: number }
      calculate_goat_level: {
        Args: { p_xp: number }
        Returns: {
          level: number
          title: string
        }[]
      }
      calculate_impact_rating: { Args: { p_user_id: string }; Returns: number }
      calculate_post_karma: { Args: { user_uuid: string }; Returns: number }
      calculate_user_karma: { Args: { user_uuid: string }; Returns: number }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_stale_active_members: { Args: never; Returns: number }
      compute_leaderboard_scores: { Args: never; Returns: undefined }
      create_comment_ratelimited: {
        Args: { p_content: string; p_parent_id?: string; p_post_id: string }
        Returns: string
      }
      create_community_ratelimited:
        | {
            Args: {
              p_category: string
              p_description: string
              p_display_name: string
              p_name: string
            }
            Returns: string
          }
        | {
            Args: {
              p_category: string
              p_description: string
              p_display_name: string
              p_is_mature?: boolean
              p_name: string
              p_visibility_type?: string
            }
            Returns: string
          }
      create_community_with_channels:
        | {
            Args: {
              p_category: string
              p_description: string
              p_display_name: string
              p_name: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_category: string
              p_description: string
              p_display_name: string
              p_is_mature?: boolean
              p_name: string
              p_user_id: string
              p_visibility_type?: string
            }
            Returns: string
          }
      create_post_ratelimited: {
        Args: {
          p_community_id: string
          p_content: string
          p_tags?: string[]
          p_title: string
        }
        Returns: string
      }
      get_agent_threshold: {
        Args: { p_agent: string; p_key: string }
        Returns: number
      }
      get_channel_analytics: {
        Args: { p_channel_id: string }
        Returns: {
          avg_daily_activity: number
          most_active_day: string
          total_messages: number
          total_posts: number
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_online_member_count: {
        Args: { community_uuid: string }
        Returns: number
      }
      get_personalized_feed: {
        Args: { p_limit_count?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          data: Json
          id: string
          relevance_score: number
          type: string
          user_id: string
          username: string
        }[]
      }
      get_posts_with_votes: {
        Args: {
          limit_param?: number
          offset_param?: number
          sort_by?: string
          user_id_param?: string
        }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_id: string
          author_is_verified: boolean
          author_official_position: string
          author_role: string
          author_username: string
          comment_count: number
          community_category: string
          community_description: string
          community_display_name: string
          community_id: string
          community_member_count: number
          community_name: string
          content: string
          content_sensitivity: string
          created_at: string
          downvotes: number
          id: string
          is_ngo_verified: boolean
          tags: string[]
          title: string
          upvotes: number
          user_vote: string
        }[]
      }
      get_profile_with_privacy: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          is_verified: boolean
          privacy_settings: Json
          role: string
          updated_at: string
          username: string
        }[]
      }
      get_rate_limit_status: {
        Args: { p_action?: string }
        Returns: {
          action: string
          request_count: number
          time_until_reset: number
          window_start: string
        }[]
      }
      get_unified_feed: {
        Args: {
          p_community_id?: string
          p_limit_count?: number
          p_offset_count?: number
          p_sort_by?: string
          p_user_id?: string
        }
        Returns: {
          avatar_url: string
          created_at: string
          data: Json
          id: string
          type: string
          user_id: string
          username: string
        }[]
      }
      get_user_warning_count: { Args: { p_user_id: string }; Returns: number }
      get_weekly_contributions: {
        Args: { community_uuid: string }
        Returns: number
      }
      get_weekly_visitors: { Args: { community_uuid: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_channel_metric: {
        Args: { p_channel_id: string; p_metric: string }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_community_visit: {
        Args: { p_community_id: string }
        Returns: undefined
      }
      log_feed_activity: {
        Args: {
          p_activity_type: string
          p_is_public?: boolean
          p_metadata?: Json
          p_target_id?: string
          p_target_type?: string
          p_user_id: string
        }
        Returns: string
      }
      match_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_fts: {
        Args: { match_count?: number; search_query: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      profile_allows_community_visibility: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      recommend_communities: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          description: string
          display_name: string
          id: string
          member_count: number
          name: string
          recommendation_reason: string
          recommendation_score: number
          weekly_contributions: number
          weekly_visitors: number
        }[]
      }
      refresh_office_dashboard_snapshot: { Args: never; Returns: undefined }
      route_issue_to_institution: {
        Args: {
          p_action_id: string
          p_formal_letter?: string
          p_institution_id: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_all_karma: { Args: never; Returns: undefined }
      update_community_active_status: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      update_profile_ratelimited: {
        Args: {
          p_avatar_url?: string
          p_banner_url?: string
          p_bio?: string
          p_display_name?: string
        }
        Returns: boolean
      }
      user_is_room_participant: {
        Args: { room_uuid: string; user_uuid: string }
        Returns: boolean
      }
      vote_ratelimited: {
        Args: {
          p_target_id: string
          p_target_type: string
          p_vote_type: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type_enum:
        | "post_created"
        | "project_submitted"
        | "project_verified"
        | "promise_tracked"
        | "promise_updated"
        | "quest_completed"
        | "community_joined"
        | "community_created"
        | "clip_uploaded"
        | "issue_reported"
        | "official_claimed"
        | "achievement_earned"
        | "comment_created"
        | "vote_cast"
      app_role:
        | "admin"
        | "moderator"
        | "official"
        | "expert"
        | "journalist"
        | "citizen"
        | "super_admin"
      content_type: "text" | "video" | "image" | "poll" | "live"
      official_level:
        | "executive"
        | "governor"
        | "senator"
        | "mp"
        | "women_rep"
        | "mca"
      promise_status: "completed" | "ongoing" | "not_started" | "cancelled"
      user_persona:
        | "active_citizen"
        | "community_organizer"
        | "civic_learner"
        | "government_watcher"
        | "professional"
        | "youth_leader"
        | "ngo_worker"
        | "journalist"
        | "business_owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type_enum: [
        "post_created",
        "project_submitted",
        "project_verified",
        "promise_tracked",
        "promise_updated",
        "quest_completed",
        "community_joined",
        "community_created",
        "clip_uploaded",
        "issue_reported",
        "official_claimed",
        "achievement_earned",
        "comment_created",
        "vote_cast",
      ],
      app_role: [
        "admin",
        "moderator",
        "official",
        "expert",
        "journalist",
        "citizen",
        "super_admin",
      ],
      content_type: ["text", "video", "image", "poll", "live"],
      official_level: [
        "executive",
        "governor",
        "senator",
        "mp",
        "women_rep",
        "mca",
      ],
      promise_status: ["completed", "ongoing", "not_started", "cancelled"],
      user_persona: [
        "active_citizen",
        "community_organizer",
        "civic_learner",
        "government_watcher",
        "professional",
        "youth_leader",
        "ngo_worker",
        "journalist",
        "business_owner",
      ],
    },
  },
} as const
