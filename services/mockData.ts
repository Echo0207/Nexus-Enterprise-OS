
import { Role, Permission, User, LeaveType, LeaveRequest, ProjectRoleDefinition, Delegation } from '../types';

// 1. Permissions (Seed Data Strategy from PDF Page 11)
export const MOCK_PERMISSIONS: Permission[] = [
  // HR Module
  { id: 'p1', slug: 'leave:apply:own', name: '申請請假', module: 'HR', description: '允許使用者提交請假單' },
  { id: 'p2', slug: 'leave:approve:dept', name: '核准部門假單', module: 'HR', description: '允許核准自己管轄部門的假單' },
  
  // Finance Module
  { id: 'p3', slug: 'salary:view:own', name: '查看個人薪資', module: 'FINANCE', description: '只能看自己的薪資條' },
  { id: 'p4', slug: 'salary:view:dept', name: '查看部門薪資', module: 'FINANCE', description: '可查看本部門及子部門薪資' },
  { id: 'p5', slug: 'salary:view:all', name: '查看全公司薪資', module: 'FINANCE', description: '財務長或老闆專用' },
  
  // Project Module
  { id: 'p6', slug: 'project:create', name: '建立專案', module: 'PM', description: '允許發起新專案' },
  
  // Wiki Module
  { id: 'p7', slug: 'kb:read:internal', name: '閱讀內部文件', module: 'WIKI', description: '可閱讀標記為 Internal 的知識庫文章' },
  { id: 'p8', slug: 'kb:upload', name: '上傳文件', module: 'WIKI', description: '上傳文件到知識庫' },

  // Admin Module
  { id: 'p9', slug: 'admin:edit:roles', name: '編輯角色權限', module: 'SYSTEM', description: '系統管理員專用' }
];

// 2. Global Roles (Seed Data from PDF Page 11)
export const MOCK_ROLES: Role[] = [
  { 
    id: 'role_admin', 
    key: 'admin', 
    name: '系統管理員 (Admin)', 
    description: '擁有所有系統設定權限', 
    permissionIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'] 
  },
  { 
    id: 'role_hr', 
    key: 'hr_manager', 
    name: '人資經理 (HR Manager)', 
    description: '擁有 HR 模組權限，可看全公司出勤，不可看全公司薪資', 
    permissionIds: ['p1', 'p2', 'p3', 'p4', 'p7', 'p8'] // No salary:view:all
  },
  { 
    id: 'role_staff', 
    key: 'staff', 
    name: '一般員工 (Staff)', 
    description: '基本的請假、打卡、查看自己專案', 
    permissionIds: ['p1', 'p3', 'p7'] // Only own salary, internal docs
  },
];

// 3. Project Role Definitions (Project Scope Roles from PDF Page 11)
export const MOCK_PROJECT_ROLE_DEFINITIONS: ProjectRoleDefinition[] = [
  {
    id: 'pr_owner',
    key: 'p_owner',
    name: '專案負責人 (Owner)',
    capabilities: {
      edit_project: true,
      view_cost: true,
      manage_members: true
    }
  },
  {
    id: 'pr_member',
    key: 'p_member',
    name: '專案成員 (Member)',
    capabilities: {
      edit_project: false,
      view_cost: false,
      edit_tasks: true
    }
  }
];

// 4. Delegations (Advanced Scenario from PDF Page 10)
export const MOCK_DELEGATIONS: Delegation[] = [
  {
    id: 'del-001',
    from_user_id: 'uuid-001', // Alice (HR Manager)
    to_user_id: 'uuid-002',   // Bob (Staff)
    role_key: 'hr_manager',
    start_at: '2025-05-01',
    end_at: '2025-05-30',
    reason: '產假代理',
    is_active: false // Inactive for initial demo state
  }
];

// 5. Users
export const MOCK_USERS: Record<string, User & { passwordHash: string }> = {
  'admin@nexus.corp': {
    id: 'uuid-000',
    name: 'System Admin',
    email: 'admin@nexus.corp',
    passwordHash: 'admin123',
    avatar: 'https://picsum.photos/200',
    roles: ['admin'],
    department: { id: 'dept-it', name: '資訊部' },
    onboarding_date: '2020-01-01',
    base_salary: 110000,
    salary: 117400,
    project_roles: {
      'proj-002': 'p_owner' // Owner of ERP Project
    }
  },
  'alice@nexus.corp': {
    id: 'uuid-001',
    name: 'Alice (HR)',
    email: 'alice@nexus.corp',
    passwordHash: 'secret_password',
    avatar: 'https://picsum.photos/201',
    roles: ['hr_manager'],
    department: { id: 'dept-hr', name: '人資部' },
    onboarding_date: '2023-01-15',
    base_salary: 90000,
    salary: 92400,
    project_roles: {
      'proj-001': 'p_owner' // Owner of Web Revamp
    }
  },
  'bob@nexus.corp': {
    id: 'uuid-002',
    name: 'Bob (Staff)',
    email: 'bob@nexus.corp',
    passwordHash: 'staff123',
    avatar: 'https://picsum.photos/202',
    roles: ['staff'],
    department: { id: 'dept-sales', name: '業務部' },
    onboarding_date: '2024-06-01', 
    base_salary: 60000,
    salary: 62400,
    project_roles: {
      'proj-001': 'p_member', // Member of Web Revamp
      'proj-003': 'p_owner'   // Owner of App Maint
    }
  }
};

export const MOCK_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-1', name: '特別休假 (Special)', category: 'Special', pay_ratio: 1.0, min_unit_hours: 4 },
  { id: 'lt-2', name: '病假 (Sick)', category: 'Sick', pay_ratio: 0.5, min_unit_hours: 1 },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
