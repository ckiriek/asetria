-- ============================================================================
-- WORKFLOW ORCHESTRATOR SCHEMA
-- ============================================================================
-- Purpose: Pipeline orchestration with state management, audit trail, and retry logic
-- Created: 2025-11-11
-- Compliance: ICH E6(R2) - audit trail requirements
-- ============================================================================

-- ============================================================================
-- 1. WORKFLOW EXECUTIONS
-- ============================================================================
-- Tracks current state of workflow execution for each project/document
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Project context
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'ib', 'protocol', 'icf', 'csr', 'sap'
  document_id UUID, -- Optional reference to specific document
  
  -- Workflow definition
  workflow_name TEXT NOT NULL, -- 'ib-generation', 'protocol-generation', etc.
  workflow_version TEXT NOT NULL DEFAULT 'v1.0',
  
  -- Current state
  current_state TEXT NOT NULL, -- 'created', 'enriching', 'composing', 'writing', 'validating', 'assembling', 'exporting', 'completed', 'failed', 'paused'
  current_step TEXT, -- Current step name
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Checkpoint for retry
  checkpoint_data JSONB, -- Stores intermediate results for resume
  
  -- Metadata
  triggered_by UUID REFERENCES auth.users(id),
  metadata JSONB, -- Additional context (e.g., user preferences, options)
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for workflow_executions
CREATE INDEX idx_workflow_executions_project_id ON workflow_executions(project_id);
CREATE INDEX idx_workflow_executions_document_type ON workflow_executions(document_type);
CREATE INDEX idx_workflow_executions_current_state ON workflow_executions(current_state);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX idx_workflow_executions_triggered_by ON workflow_executions(triggered_by);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_executions_updated_at
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. WORKFLOW STEPS
-- ============================================================================
-- Tracks individual step execution within a workflow (audit trail)
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent execution
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  
  -- Step definition
  step_name TEXT NOT NULL, -- 'enrich', 'compose', 'write', 'validate', 'assemble', 'export'
  step_order INTEGER NOT NULL, -- Sequence number
  agent_name TEXT NOT NULL, -- 'regdata', 'composer', 'writer', 'validator', 'assembler', 'export'
  
  -- Status
  status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed', 'skipped'
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Computed: completed_at - started_at
  
  -- Input/Output
  input_data JSONB, -- Input parameters for this step
  output_data JSONB, -- Result from this step
  
  -- Error handling
  error_type TEXT, -- 'transient', 'validation', 'fatal'
  error_message TEXT,
  error_stack TEXT,
  retry_attempt INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB, -- Additional context (e.g., model used, tokens consumed)
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for workflow_steps
CREATE INDEX idx_workflow_steps_execution_id ON workflow_steps(execution_id);
CREATE INDEX idx_workflow_steps_step_name ON workflow_steps(step_name);
CREATE INDEX idx_workflow_steps_agent_name ON workflow_steps(agent_name);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX idx_workflow_steps_started_at ON workflow_steps(started_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. WORKFLOW EVENTS
-- ============================================================================
-- Audit trail for all workflow events (regulatory compliance)
CREATE TABLE IF NOT EXISTS workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent execution
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'started', 'step_completed', 'state_changed', 'paused', 'resumed', 'failed', 'completed', 'retry'
  event_data JSONB, -- Event-specific data
  
  -- Actor
  actor_id UUID REFERENCES auth.users(id), -- Who triggered this event
  actor_type TEXT, -- 'user', 'system', 'agent'
  
  -- Context
  step_id UUID REFERENCES workflow_steps(id), -- Optional reference to step
  previous_state TEXT, -- For state_changed events
  new_state TEXT, -- For state_changed events
  
  -- Metadata
  metadata JSONB, -- Additional context
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for workflow_events
CREATE INDEX idx_workflow_events_execution_id ON workflow_events(execution_id);
CREATE INDEX idx_workflow_events_event_type ON workflow_events(event_type);
CREATE INDEX idx_workflow_events_actor_id ON workflow_events(actor_id);
CREATE INDEX idx_workflow_events_created_at ON workflow_events(created_at DESC);
CREATE INDEX idx_workflow_events_step_id ON workflow_events(step_id);

-- ============================================================================
-- 4. WORKFLOW DEFINITIONS (Optional - for dynamic workflows)
-- ============================================================================
-- Stores workflow definitions (can be used for UI-based workflow builder)
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Definition
  name TEXT NOT NULL UNIQUE, -- 'ib-generation', 'protocol-generation'
  version TEXT NOT NULL DEFAULT 'v1.0',
  description TEXT,
  
  -- Configuration
  document_type TEXT NOT NULL, -- 'ib', 'protocol', 'icf', 'csr', 'sap'
  steps JSONB NOT NULL, -- Array of step definitions
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for workflow_definitions
CREATE INDEX idx_workflow_definitions_name ON workflow_definitions(name);
CREATE INDEX idx_workflow_definitions_document_type ON workflow_definitions(document_type);
CREATE INDEX idx_workflow_definitions_is_active ON workflow_definitions(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_definitions_updated_at
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;

-- workflow_executions policies
CREATE POLICY "Users can view their own workflow executions"
  ON workflow_executions FOR SELECT
  USING (
    triggered_by = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can create workflow executions for their projects"
  ON workflow_executions FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update their own workflow executions"
  ON workflow_executions FOR UPDATE
  USING (
    triggered_by = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

-- workflow_steps policies
CREATE POLICY "Users can view steps of their workflow executions"
  ON workflow_steps FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM workflow_executions WHERE
        triggered_by = auth.uid() OR
        project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "System can insert workflow steps"
  ON workflow_steps FOR INSERT
  WITH CHECK (true); -- Controlled by application logic

CREATE POLICY "System can update workflow steps"
  ON workflow_steps FOR UPDATE
  USING (true); -- Controlled by application logic

-- workflow_events policies
CREATE POLICY "Users can view events of their workflow executions"
  ON workflow_events FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM workflow_executions WHERE
        triggered_by = auth.uid() OR
        project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "System can insert workflow events"
  ON workflow_events FOR INSERT
  WITH CHECK (true); -- Controlled by application logic

-- workflow_definitions policies
CREATE POLICY "Anyone can view active workflow definitions"
  ON workflow_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage workflow definitions"
  ON workflow_definitions FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get current workflow state
CREATE OR REPLACE FUNCTION get_workflow_state(p_execution_id UUID)
RETURNS TABLE (
  execution_id UUID,
  current_state TEXT,
  current_step TEXT,
  percent_complete INTEGER,
  steps_completed INTEGER,
  steps_total INTEGER,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.current_state,
    we.current_step,
    we.percent_complete,
    COUNT(ws.id) FILTER (WHERE ws.status = 'completed')::INTEGER,
    COUNT(ws.id)::INTEGER,
    we.error_message
  FROM workflow_executions we
  LEFT JOIN workflow_steps ws ON ws.execution_id = we.id
  WHERE we.id = p_execution_id
  GROUP BY we.id, we.current_state, we.current_step, we.percent_complete, we.error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record workflow event
CREATE OR REPLACE FUNCTION record_workflow_event(
  p_execution_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_type TEXT DEFAULT 'system',
  p_step_id UUID DEFAULT NULL,
  p_previous_state TEXT DEFAULT NULL,
  p_new_state TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO workflow_events (
    execution_id,
    event_type,
    event_data,
    actor_id,
    actor_type,
    step_id,
    previous_state,
    new_state
  ) VALUES (
    p_execution_id,
    p_event_type,
    p_event_data,
    p_actor_id,
    p_actor_type,
    p_step_id,
    p_previous_state,
    p_new_state
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SEED DATA - Default Workflow Definitions
-- ============================================================================

-- IB Generation Workflow
INSERT INTO workflow_definitions (name, version, description, document_type, is_active, is_default, steps)
VALUES (
  'ib-generation',
  'v1.0',
  'Standard Investigator Brochure generation workflow',
  'ib',
  true,
  true,
  '[
    {
      "name": "enrich",
      "agent": "regdata",
      "description": "Enrich project with regulatory data from external sources",
      "parallel": false,
      "required": true,
      "timeout_minutes": 10,
      "retry_on_failure": true
    },
    {
      "name": "compose",
      "agent": "composer",
      "description": "Generate document structure from templates",
      "parallel": false,
      "required": true,
      "timeout_minutes": 5,
      "retry_on_failure": true
    },
    {
      "name": "write",
      "agent": "writer",
      "description": "Generate narrative content using AI",
      "parallel": false,
      "required": true,
      "timeout_minutes": 30,
      "retry_on_failure": true
    },
    {
      "name": "validate",
      "agent": "validator",
      "description": "Validate document against regulatory requirements",
      "parallel": false,
      "required": true,
      "timeout_minutes": 5,
      "retry_on_failure": false
    },
    {
      "name": "assemble",
      "agent": "assembler",
      "description": "Assemble final document with TOC and formatting",
      "parallel": false,
      "required": true,
      "timeout_minutes": 5,
      "retry_on_failure": true
    }
  ]'::JSONB
);

-- Protocol Generation Workflow (placeholder for future)
INSERT INTO workflow_definitions (name, version, description, document_type, is_active, is_default, steps)
VALUES (
  'protocol-generation',
  'v1.0',
  'Clinical Study Protocol generation workflow',
  'protocol',
  false,
  false,
  '[
    {
      "name": "compose",
      "agent": "composer_protocol",
      "description": "Generate protocol structure from SPIRIT template",
      "parallel": false,
      "required": true,
      "timeout_minutes": 5,
      "retry_on_failure": true
    },
    {
      "name": "write",
      "agent": "writer_protocol",
      "description": "Generate protocol narrative and tables",
      "parallel": false,
      "required": true,
      "timeout_minutes": 30,
      "retry_on_failure": true
    },
    {
      "name": "validate",
      "agent": "validator_protocol",
      "description": "Validate protocol completeness and references",
      "parallel": false,
      "required": true,
      "timeout_minutes": 5,
      "retry_on_failure": false
    },
    {
      "name": "assemble",
      "agent": "assembler_protocol",
      "description": "Format and insert tables",
      "parallel": false,
      "required": true,
      "timeout_minutes": 5,
      "retry_on_failure": true
    }
  ]'::JSONB
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: 4 (workflow_executions, workflow_steps, workflow_events, workflow_definitions)
-- Indexes created: 20+
-- Functions created: 2 (get_workflow_state, record_workflow_event)
-- RLS policies: Enabled with user-level access control
-- Seed data: 2 workflow definitions (IB, Protocol)
-- ============================================================================
