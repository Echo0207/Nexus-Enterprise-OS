
import { Role, Permission, User, LeaveType, LeaveRequest } from '../types';

// 1. Defined Permissions (Based on PDF examples)
export const MOCK_PERMISSIONS: Permission[] = [
  // HR Module
  { id: 'p1', slug: 'hr:view:dashboard', name: '查看 HR 儀表板', category: 'HR模組' },
  { id: 'p2', slug: 'leave:request', name: '申請請假', category: 'HR模組 > 請假' },
  { id: 'p3', slug: 'leave:approve', name: '核准請假', category: 'HR模組 > 請假' },
  { id: 'p4', slug: 'salary:view:dept', name: '查看部門薪資', category: 'HR模組 > 薪資' },
  { id: 'p5', slug: 'salary:view:all', name: '查看全公司薪資', category: 'HR模組 > 薪資' },
  { id: 'p8', slug: 'hr:manage:payroll', name: '管理薪資結算', category: 'HR模組 > 薪資' },
  
  // Admin Module
  { id: 'p6', slug: 'admin:view:roles', name: '查看角色列表', category: '系統管理 > 角色' },
  { id: 'p7', slug: 'admin:edit:roles', name: '編輯角色權限', category: '系統管理 > 角色' },
];

// 2. Defined Roles
export const MOCK_ROLES: Role[] = [
  { 
    id: 'role_admin', 
    name: 'Admin', 
    description: '系統管理員', 
    permissionIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'] 
  },
  { 
    id: 'role_hr', 
    name: 'HR Manager', 
    description: '人資經理', 
    permissionIds: ['p1', 'p2', 'p3', 'p4', 'p8'] // Has salary:view:dept but NOT salary:view:all
  },
  { 
    id: 'role_staff', 
    name: 'Staff', 
    description: '一般員工', 
    permissionIds: ['p2'] // Only leave request
  },
];

// 3. Defined Users for Login Simulation
export const MOCK_USERS: Record<string, User & { passwordHash: string }> = {
  'admin@nexus.corp': {
    id: 'uuid-000',
    name: 'System Admin',
    email: 'admin@nexus.corp',
    passwordHash: 'admin123', // Simplified for mock
    avatar: 'https://picsum.photos/200',
    roles: ['admin'],
    permissions: MOCK_PERMISSIONS.map(p => p.slug), // All permissions
    department: { id: 'dept-it', name: '資訊部' },
    // HR Data - Seniority ~ 5 years
    onboarding_date: '2020-01-01',
    base_salary: 110000,
    meal_allowance: 2400,
    position_allowance: 5000,
    salary: 117400
  },
  'alice@nexus.corp': {
    id: 'uuid-001',
    name: 'Alice (HR)',
    email: 'alice@nexus.corp',
    passwordHash: 'secret_password',
    avatar: 'https://picsum.photos/201',
    roles: ['hr_manager'],
    permissions: ['hr:view:dashboard', 'leave:request', 'leave:approve', 'salary:view:dept', 'admin:view:roles', 'admin:edit:roles', 'hr:manage:payroll'],
    department: { id: 'dept-hr', name: '人資部' },
    // HR Data - Seniority ~ 2 years
    onboarding_date: '2023-01-15',
    base_salary: 90000,
    meal_allowance: 2400,
    salary: 92400
  },
  'bob@nexus.corp': {
    id: 'uuid-002',
    name: 'Bob (Staff)',
    email: 'bob@nexus.corp',
    passwordHash: 'staff123',
    avatar: 'https://picsum.photos/202',
    roles: ['staff'],
    permissions: ['leave:request'],
    department: { id: 'dept-sales', name: '業務部' },
    // HR Data - Seniority < 1 year (Newbie)
    onboarding_date: '2024-06-01', 
    base_salary: 60000,
    meal_allowance: 2400,
    salary: 62400
  }
};

export const MOCK_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-1', name: '特別休假 (Special)', category: 'Special', pay_ratio: 1.0, min_unit_hours: 4 },
  { id: 'lt-2', name: '病假 (Sick)', category: 'Sick', pay_ratio: 0.5, min_unit_hours: 1 },
  { id: 'lt-3', name: '事假 (Personal)', category: 'Personal', pay_ratio: 0.0, min_unit_hours: 1 },
  { id: 'lt-4', name: '公假 (Official)', category: 'Official', pay_ratio: 1.0, min_unit_hours: 1 },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-1',
    user_id: 'uuid-002',
    type_id: 'lt-2', // Sick
    start_date: '2025-01-05T09:00:00',
    end_date: '2025-01-05T18:00:00',
    hours: 8,
    reason: '感冒發燒',
    status: 'Approved',
    created_at: '2025-01-04'
  },
  {
    id: 'lr-2',
    user_id: 'uuid-002',
    type_id: 'lt-1', // Special
    start_date: '2025-02-14T09:00:00',
    end_date: '2025-02-14T18:00:00',
    hours: 8,
    reason: '情人節',
    status: 'Pending',
    created_at: '2025-02-01'
  }
];
