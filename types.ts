
// Data Models based on Permission Architecture 2.0

// 1. Users & Global Roles
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roles: string[]; // Global Roles keys e.g., ["hr_manager", "staff"]
  department: {
    id: string;
    name: string;
  };
  // HR & Payroll Fields
  onboarding_date: string;
  base_salary: number;
  meal_allowance?: number;
  position_allowance?: number;
  salary?: number;
  
  // Project Scope Roles (User -> Project -> Role)
  project_roles: Record<string, string>; // { "proj-001": "p_owner" }
}

export interface Permission {
  id: string;
  slug: string; // Resource:Action:Scope e.g., "salary:view:dept"
  name: string;
  module: string; // HR, PROJECT, FINANCE, WIKI
  description: string;
}

export interface Role {
  id: string; // e.g. "role_hr"
  key: string; // e.g. "hr_manager"
  name: string;
  description: string;
  permissionIds: string[]; // List of permission IDs
}

// 2. Project Scope Roles
export interface ProjectRoleDefinition {
  id: string;
  key: string; // e.g., "p_owner", "p_member"
  name: string;
  capabilities: Record<string, boolean>; // JSONB in DB: { "view_cost": true }
}

// 3. Delegation (Advanced)
export interface Delegation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  role_key: string; // The Global Role being delegated temporarily
  start_at: string;
  end_at: string;
  reason: string;
  is_active: boolean;
}

// --- Module C: HR & Finance ---

export type LeaveTypeCategory = 'Special' | 'Sick' | 'Personal' | 'Official';

export interface LeaveType {
  id: string;
  name: string;
  category: LeaveTypeCategory;
  pay_ratio: number;
  min_unit_hours: number;
}

export interface LeaveBalance {
  user_id: string;
  year: number;
  quota_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  type_id: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
  status: 'Pending' | 'Manager Approved' | 'Approved' | 'Rejected';
  handover_user_id?: string;
  rejection_reason?: string;
  attachments?: string[];
  created_at: string;
}

export interface PayslipItem {
  name: string;
  amount: number;
  type: 'earning' | 'deduction';
  note?: string;
}

export interface Payslip {
  user_id: string;
  period: string;
  base_salary: number;
  allowances: number;
  overtime_pay: number;
  leave_deduction: number;
  gross_pay: number;
  insurance_deduction: number;
  net_pay: number;
  items: PayslipItem[];
}

export interface CostTransaction {
  id: string;
  project_id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface ProjectTaskCost {
    taskId: string;
    taskTitle: string;
    assigneeName: string;
    hours: number;
    cost: number;
}

export interface ProjectPersonCost {
    userId: string;
    userName: string;
    totalHours: number;
    totalCost: number;
    efficiencyRate: number;
}

export interface ProjectMonthlyDetail {
    projectId: string;
    projectName: string;
    totalCost: number;
    totalHours: number;
    tasks: ProjectTaskCost[];
    cumulativeCost: number;
    cumulativeHours: number;
    cumulativePersonCosts: ProjectPersonCost[];
}

export interface MonthlyCostReport {
    period: string;
    generatedAt: string;
    totalCost: number;
    projectBreakdown: {
        projectName: string;
        cost: number;
        percentage: number;
    }[];
    teamPerformance: {
        userId: string;
        userName: string;
        totalHours: number;
        tasksCompleted: number;
        tasksTotal: number;
        efficiencyRate: number;
        costContribution: number;
    }[];
    projectDetails: ProjectMonthlyDetail[];
}

// --- Module B: Project Management ---

export type ProjectStage = 'Planning' | 'In Progress' | 'In Delivery' | 'In Maintenance' | 'Done';
export type TaskStatus = 'To Do' | 'In Progress' | 'Code Review' | 'In Test' | 'Done' | 'Backlog';

export interface Project {
  id: string;
  name: string;
  manager_id: string;
  stage: ProjectStage;
  budget: number;
  start_date: string;
  target_end_date: string;
  progress: number;
  description: string;
  goal?: string;
  team_members?: string[];
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Delayed';
}

export interface WeeklyReport {
  id: string;
  project_id: string;
  week: string;
  summary: string;
  completion_rate: number;
  created_at: string;
}

export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Planned' | 'Completed';
  goal?: string;
}

export interface SprintSettings {
  duration_weeks: number;
  start_day: number;
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'image' | 'file';
  created_at: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  project_id: string;
  sprint_id: string;
  status: TaskStatus;
  assignee_id: string | null;
  priority: 'High' | 'Medium' | 'Low';
  story_points: number;
  description?: string;
  related_task_ids?: string[];
  parent_task_id?: string;
  deliverable_url?: string;
  due_date?: string;
  time_spent?: string;
  comments?: Comment[];
  report_content?: string;
  attachments?: Attachment[];
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  type: DocumentType;
  url: string;
  content?: string;
  updated_at: string;
  created_at: string;
  version: string;
  author_id: string;
  last_modified_by_id: string;
  ai_summary?: string;
}

export type DocumentType = 'Requirements' | 'Design' | 'Meeting' | 'Technical' | 'Sprint Report' | 'HR_Payroll' | 'HR_CostReport' | 'HR_KPI' | 'Other';

export interface SprintReviewReport {
    sprintId: string;
    generatedAt: string;
    totalTasks: number;
    completionRate: number;
    totalHours: number;
    totalCost: number;
    teamPerformance: any[];
    projectBreakdown: any[];
}

// --- Module D: Knowledge Base ---

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category_id: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'md' | 'notion';
  size: string;
  uploaded_at: string;
  uploaded_by: string;
  is_public: boolean;
  allowed_roles: string[];
  allowed_dept_ids: string[];
  status: 'Processing' | 'Indexed' | 'Error';
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  content_text: string;
  meta_allowed_roles: string[];
  meta_allowed_dept_ids: string[];
  meta_is_public: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: {
    doc_id: string;
    doc_title: string;
    snippet: string;
  }[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// --- Module E: Education & Training Center (LMS) ---

export type CourseUnitType = 'VIDEO' | 'ARTICLE' | 'QUIZ';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correct_answer: string[]; // Supports multiple choice
  score_weight: number;
}

export interface CourseUnit {
  id: string;
  course_id: string;
  title: string;
  type: CourseUnitType;
  content_text?: string; // For Article
  asset_url?: string;    // For Video
  video_duration?: number; // In seconds
  questions?: QuizQuestion[]; // For Quiz
  order_index: number;
  is_required: boolean;
}

export interface Course {
  id: string;
  title: string;
  category: string; // e.g. "Onboarding", "Security", "Skill"
  description: string;
  cover_image: string;
  estimated_minutes: number;
  units: CourseUnit[];
  is_published: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress_percent: number;
  source: 'ASSIGNED' | 'SELF_ENROLLED';
  assigned_by?: string; // System or Manager
  due_date?: string;
  completed_at?: string;
  last_accessed_at?: string;
  // Progress tracking per unit
  unit_progress: Record<string, {
    status: 'LOCKED' | 'OPEN' | 'COMPLETED';
    last_position_sec?: number;
    quiz_score?: number;
  }>;
}

export interface AssignmentRule {
  id: string;
  title: string;
  target_dept_id?: string | null;
  target_role_id?: string | null;
  assign_course_id: string;
  deadline_days: number;
  is_active: boolean;
}
