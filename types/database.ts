// =============================================================================
// QA Copilot — Database Types
// =============================================================================

/** A registered user in the system. */
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

/** Project status options. */
export type ProjectStatus = "active" | "archived";

/** A QA project owned by a user. */
export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

/** An uploaded document (SRS, PRD, etc.) attached to a project. */
export type Document = {
  id: string;
  project_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  extracted_text: string | null;
  uploaded_at: string;
};

/** A logical module / feature area within a project. */
export type Module = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/** Priority levels for test cases and defects. */
export type TestCasePriority = "critical" | "high" | "medium" | "low";

/** Kanban board status for a test case. */
export type TestCaseStatus =
  | "open"
  | "Fixed"
  | "reopen"
  | "todiscuss"
  | "closed";

/** A single numbered step inside a test case. */
export type TestStep = {
  order: number;
  action: string;
  expected: string;
};

/** A full test case record. */
export type TestCase = {
  id: string;
  module_id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TestCasePriority;
  status: TestCaseStatus;
  steps: TestStep[];
  expected_result: string;
  actual_result: string | null;
  screenshot_url: string | null;
  notes: string | null;
  created_by: string;
  type: TestCaseType;
  created_at: string;
  updated_at: string;
};
export type TestCaseType = "functional" | "performance" | "security" | "usability";

/** Kanban board status for a RunTest execution case. */
export type RunTestStatus =
  | "open"
  | "in_progress"
  | "passed"
  | "failed"
  | "blocked"
  | "to_discuss";

/** A QA test case tracked in the RunTest module (test_cases table). */
export type RunTestCase = {
  id: string;
  module_id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TestCasePriority;
  status: RunTestStatus;
  steps: TestStep[];
  expected_result: string;
  actual_result: string | null;
  failed_reason: string | null;
  screenshot_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** A testing checklist that groups individual checklist items. */
export type Checklist = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  items: ChecklistItem[];
  created_at: string;
};

/** An individual item within a checklist. */
export type ChecklistItem = {
  id: string;
  test_case_id: string;
  title: string;
  completed: boolean;
  notes: string | null;
  blocked: boolean;
};

/** A comment left on a test case. */
export type Comment = {
  id: string;
  author_id: string;
  test_case_id: string;
  content: string;
  created_at: string;
};

/** A file attachment associated with a test case. */
export type Attachment = {
  id: string;
  test_case_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  uploaded_at: string;
};

/** A message in the AI chat. */
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

// =============================================================================
// Derived / Helper Types
// =============================================================================

/** Counts for each test case status on a project. */
export type TestCaseStatusCounts = Record<TestCaseStatus, number>;

/** A project enriched with aggregated testing statistics. */
export type ProjectWithStats = Project & {
  /** Total number of test cases across every module. */
  total_test_cases: number;
  /** Number of test cases that have passed. */
  passed_count: number;
  /** Number of test cases that have failed. */
  failed_count: number;
  /** Number of test cases still in backlog. */
  backlog_count: number;
  /** Number of test cases currently blocked. */
  blocked_count: number;
  /** Number of test cases in progress. */
  in_progress_count: number;
  /** Percentage of passed tests out of total (0-100). */
  coverage_percentage: number;
  /** Breakdown by status. */
  status_counts: Record<TestCaseStatus, number>;
  /** Number of modules in the project. */
  module_count: number;
  /** Number of documents uploaded. */
  document_count: number;
};

/** A module enriched with its test cases. */
export type ModuleWithTestCases = Module & {
  test_cases: TestCase[];
};

/** A test case enriched with related comments and attachments. */
export type TestCaseWithDetails = TestCase & {
  comments: Comment[];
  attachments: Attachment[];
  module_name: string;
};

/** A project enriched with its modules and documents. */
export type ProjectWithModules = Project & {
  modules: Module[];
  documents: Document[];
};

/** Minimal shape used for Kanban board columns. */
export type KanbanColumn = {
  id: TestCaseStatus;
  title: string;
  color: string;
};

/** A record used for displaying recent activity feeds. */
export type ActivityItem = {
  id: string;
  type: "test_created" | "test_updated" | "status_changed" | "comment_added" | "document_uploaded";
  description: string;
  timestamp: string;
  user_id: string;
  project_id: string;
  metadata: Record<string, unknown> | null;
};

// =============================================================================
// Form / Input Types (for React Hook Form + Zod)
// =============================================================================

/** Input shape when creating a new project. */
export type CreateProjectInput = {
  name: string;
  description?: string;
};

/** Input shape when updating a project. */
export type UpdateProjectInput = Partial<CreateProjectInput> & {
  status?: ProjectStatus;
};

/** Input shape when creating a new test case. */
export type CreateTestCaseInput = {
  module_id: string;
  project_id: string;
  title: string;
  description?: string;
  type: TestCaseType;
  priority: TestCasePriority;
  steps: TestStep[];
  expected_result: string;
  screenshot_url?: string;
};

/** Input shape when updating a test case. */
export type UpdateTestCaseInput = Partial<Omit<CreateTestCaseInput, "project_id">> & {
  status?: TestCaseStatus;
  actual_result?: string;
  notes?: string;
};
