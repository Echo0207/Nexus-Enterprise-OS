
// Data Models based on PDF
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roles: string[]; // e.g., ["hr_manager", "staff", "admin"]
  permissions: string[]; // e.g., ["leave:approve", "salary:view:dept"]
  department: {
    id: string;
    name: string;
  };
  // HR & Payroll Fields
  onboarding_date: string; // YYYY-MM-DD
  base_salary: number;
  meal_allowance?: number;
  position_allowance?: number;
  salary?: number; // Kept for backward compatibility with Module B mock
}

export interface Permission {
  id: string;
  slug: string; // e.g., "salary:view:dept"
  name: string;
  category: string; // For grouping in UI
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
}

// --- Module C: HR & Finance ---

export type LeaveTypeCategory = 'Special' | 'Sick' | 'Personal' | 'Official';

export interface LeaveType {
  id: string;
  name: string;
  category: LeaveTypeCategory;
  pay_ratio: number; // 1.0 = Full Pay, 0.5 = Half Pay, 0.0 = No Pay
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
  start_date: string; // ISO String
  end_date: string;   // ISO String
  hours: number;
  reason: string;
  status: 'Pending' | 'Manager Approved' | 'Approved' | 'Rejected'; // Updated status
  handover_user_id?: string;
  rejection_reason?: string;
  attachments?: string[]; // New: File names or URLs
  created_at: string;
}

export interface PayrollRun {
  id: string;
  period: string; // YYYY-MM
  status: 'Draft' | 'Closed';
  total_payout: number;
  generated_at: string;
}

export interface PayslipItem {
  name: string;
  amount: number;
  type: 'earning' | 'deduction';
  note?: string; // e.g. "208 * 1.34 * 4hr"
}

export interface Payslip {
  user_id: string;
  period: string;
  base_salary: number;
  allowances: number;
  overtime_pay: number;
  leave_deduction: number;
  gross_pay: number;
  insurance_deduction: number; // Labor + Health
  net_pay: number;
  items: PayslipItem[];
}

export interface CostTransaction {
  id: string;
  project_id: string; // Used as Project Name key
  category: string; // Used as Project Name in display
  amount: number;
  date: string; // Used as Period
  description: string;
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
}

// --- Module B: Project Management Models ---

export type ProjectStage = 'Planning' | 'In Progress' | 'In Delivery' | 'In Maintenance' | 'Done';
export type TaskStatus = 'To Do' | 'In Progress' | 'Code Review' | 'In Test' | 'Done' | 'Backlog';

export interface Project {
  id: string;
  name: string;
  manager_id: string; // For budget permission check
  stage: ProjectStage;
  budget: number; // Sensitive data
  start_date: string;
  target_end_date: string;
  progress: number; // 0-100
  description: string;
  goal?: string; // New: Project Goal
  team_members?: string[]; // New: List of User IDs
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
  week: string; // e.g. "2025-W47"
  summary: string;
  completion_rate: number;
  created_at: string;
}

export interface Sprint {
  id: string;
  name: string; // e.g., "2025-W48"
  start_date: string;
  end_date: string;
  status: 'Active' | 'Planned' | 'Completed';
  goal?: string;
}

export interface SprintSettings {
  duration_weeks: number; // 1-4
  start_day: number; // 1 = Monday
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
  key: string; // e.g., "WEB-101"
  title: string;
  project_id: string;
  sprint_id: string; // Can be null if Backlog
  status: TaskStatus;
  assignee_id: string | null;
  priority: 'High' | 'Medium' | 'Low';
  story_points: number;
  description?: string;
  related_task_ids?: string[]; // Changed from related_task_id to array
  parent_task_id?: string; // New: For Sub-tasks hierarchy
  deliverable_url?: string;
  due_date?: string; // New: Deadline
  time_spent?: string; // New: e.g. "5h 30m"
  comments?: Comment[];
  report_content?: string; // New: Report content (text/image references)
  attachments?: Attachment[]; // New: File attachments
}

// For Blame Logic (FUNC_PM_02_EXT)
export interface TaskHistory {
  id: string;
  task_id: string;
  original_sprint_id: string;
  new_sprint_id: string;
  reason: string;
  blamed_user_id: string; // Who caused the delay
  created_at: string;
}

export type DocumentType = 'Requirements' | 'Design' | 'Meeting' | 'Technical' | 'Sprint Report' | 'HR_Payroll' | 'HR_CostReport' | 'HR_KPI' | 'Other';

export interface Document {
  id: string;
  project_id: string;
  name: string;
  type: DocumentType; // This serves as "Category"
  url: string;
  content?: string; // New: For internal documents created in-app
  updated_at: string;
  created_at: string;
  version: string; // e.g., "v1.0"
  author_id: string;
  last_modified_by_id: string;
  ai_summary?: string; // For Meeting notes
}

// Sprint Review & Cost Calculation Models
export interface UserPerformance {
    userId: string;
    userName: string;
    tasksAssigned: number;
    tasksCompleted: number;
    totalHoursLogged: number;
    efficiencyRate: number; // KPI
    costContribution: number; // Salary * Hours ratio
}

export interface ProjectCostBreakdown {
    projectId: string;
    projectName: string;
    cost: number;
    hours: number;
}

export interface SprintReviewReport {
    sprintId: string;
    generatedAt: string;
    totalTasks: number;
    completionRate: number;
    totalHours: number;
    totalCost: number;
    teamPerformance: UserPerformance[];
    projectBreakdown: ProjectCostBreakdown[];
}

// API Response Models
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ApiError {
  code: string; // e.g., E-AUTH-001
  message: string;
}

// State Models
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}