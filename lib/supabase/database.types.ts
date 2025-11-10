export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          billing_plan: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          billing_plan?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          billing_plan?: string | null
          created_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'admin' | 'medical_writer' | 'reviewer' | 'viewer'
          org_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role: 'admin' | 'medical_writer' | 'reviewer' | 'viewer'
          org_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'medical_writer' | 'reviewer' | 'viewer'
          org_id?: string | null
          created_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          org_id: string | null
          title: string
          phase: string | null
          indication: string | null
          countries: string[] | null
          design_json: Json | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          title: string
          phase?: string | null
          indication?: string | null
          countries?: string[] | null
          design_json?: Json | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          title?: string
          phase?: string | null
          indication?: string | null
          countries?: string[] | null
          design_json?: Json | null
          created_by?: string | null
          created_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string | null
          type: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
          version: number | null
          status: 'draft' | 'review' | 'approved' | 'outdated' | null
          path: string | null
          checksum: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          type: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
          version?: number | null
          status?: 'draft' | 'review' | 'approved' | 'outdated' | null
          path?: string | null
          checksum?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          type?: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
          version?: number | null
          status?: 'draft' | 'review' | 'approved' | 'outdated' | null
          path?: string | null
          checksum?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      evidence_sources: {
        Row: {
          id: string
          project_id: string | null
          source: 'ClinicalTrials.gov' | 'PubMed' | 'openFDA' | 'WHO_ICTRP' | 'manual'
          external_id: string | null
          payload_json: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          source: 'ClinicalTrials.gov' | 'PubMed' | 'openFDA' | 'WHO_ICTRP' | 'manual'
          external_id?: string | null
          payload_json?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          source?: 'ClinicalTrials.gov' | 'PubMed' | 'openFDA' | 'WHO_ICTRP' | 'manual'
          external_id?: string | null
          payload_json?: Json | null
          created_at?: string | null
        }
      }
      audit_log: {
        Row: {
          id: string
          project_id: string | null
          document_id: string | null
          action: string
          diff_json: Json | null
          actor_user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          document_id?: string | null
          action: string
          diff_json?: Json | null
          actor_user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          document_id?: string | null
          action?: string
          diff_json?: Json | null
          actor_user_id?: string | null
          created_at?: string | null
        }
      }
      integrations: {
        Row: {
          id: string
          org_id: string | null
          api_type: 'openFDA' | 'Azure_OpenAI' | 'EMA_SPOR'
          api_key_meta: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          api_type: 'openFDA' | 'Azure_OpenAI' | 'EMA_SPOR'
          api_key_meta?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          api_type?: 'openFDA' | 'Azure_OpenAI' | 'EMA_SPOR'
          api_key_meta?: Json | null
          created_at?: string | null
        }
      }
      entities_corpus: {
        Row: {
          id: string
          project_id: string | null
          entity_type: string
          entity_key: string
          entity_value: Json
          source_document: string | null
          last_modified: string | null
          modified_by: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          entity_type: string
          entity_key: string
          entity_value: Json
          source_document?: string | null
          last_modified?: string | null
          modified_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          entity_type?: string
          entity_key?: string
          entity_value?: Json
          source_document?: string | null
          last_modified?: string | null
          modified_by?: string | null
        }
      }
      document_links: {
        Row: {
          id: string
          source_doc_id: string | null
          target_doc_id: string | null
          linked_entities: string[] | null
          sync_enabled: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          source_doc_id?: string | null
          target_doc_id?: string | null
          linked_entities?: string[] | null
          sync_enabled?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          source_doc_id?: string | null
          target_doc_id?: string | null
          linked_entities?: string[] | null
          sync_enabled?: boolean | null
          created_at?: string | null
        }
      }
      validation_rules: {
        Row: {
          id: string
          document_type: string
          rule_name: string
          rule_description: string | null
          section_ref: string | null
          check_type: 'required' | 'format' | 'completeness' | 'consistency' | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          document_type: string
          rule_name: string
          rule_description?: string | null
          section_ref?: string | null
          check_type?: 'required' | 'format' | 'completeness' | 'consistency' | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          document_type?: string
          rule_name?: string
          rule_description?: string | null
          section_ref?: string | null
          check_type?: 'required' | 'format' | 'completeness' | 'consistency' | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      term_ontology: {
        Row: {
          id: string
          term: string
          source: 'openFDA' | 'MedDRA' | 'WHODrug'
          code: string | null
          parent_code: string | null
          level: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          term: string
          source: 'openFDA' | 'MedDRA' | 'WHODrug'
          code?: string | null
          parent_code?: string | null
          level?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          term?: string
          source?: 'openFDA' | 'MedDRA' | 'WHODrug'
          code?: string | null
          parent_code?: string | null
          level?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
