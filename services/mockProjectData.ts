
import { Project, Task, Sprint, Document, Milestone, WeeklyReport, SprintSettings } from '../types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: '官方網站改版 (Web Revamp)',
    manager_id: 'uuid-001', // Alice is manager
    stage: 'In Progress',
    budget: 5000000,
    start_date: '2025-01-01',
    target_end_date: '2025-06-30',
    progress: 45,
    description: '企業形象官網全站重構，包含 RWD 與 CMS 系統升級。',
    goal: '提升品牌形象，將 PageSpeed 分數提升至 90+，並導入 headless CMS 增加編輯彈性。',
    team_members: ['uuid-001', 'uuid-002']
  },
  {
    id: 'proj-002',
    name: 'ERP 系統開發',
    manager_id: 'uuid-000', // Admin is manager
    stage: 'Planning',
    budget: 12000000,
    start_date: '2025-03-01',
    target_end_date: '2025-12-31',
    progress: 10,
    description: '內部資源管理系統，整合 HR、財務與進銷存模組。',
    goal: '取代舊有的 Excel 作業流程，實現數據即時同步與視覺化報表。',
    team_members: ['uuid-000', 'uuid-002']
  },
  {
    id: 'proj-003',
    name: '行動 App 維護',
    manager_id: 'uuid-002', // Bob is manager
    stage: 'In Maintenance',
    budget: 200000,
    start_date: '2024-01-01',
    target_end_date: '2025-12-31',
    progress: 100,
    description: 'iOS 與 Android App 的例行性維護與 Bug Fix。',
    goal: '維持 App Store 評分 4.5 星以上，確保崩潰率低於 0.1%。',
    team_members: ['uuid-002']
  }
];

export const MOCK_MILESTONES: Milestone[] = [
  { id: 'm1', project_id: 'proj-001', title: '專案啟動 (Kick-off)', date: '2025-01-05', status: 'Completed' },
  { id: 'm2', project_id: 'proj-001', title: '設計定稿', date: '2025-02-15', status: 'Completed' },
  { id: 'm3', project_id: 'proj-001', title: '首頁切版完成', date: '2025-11-30', status: 'Pending' },
  { id: 'm4', project_id: 'proj-001', title: '全站上線 (Go Live)', date: '2025-12-31', status: 'Pending' },
  
  { id: 'm5', project_id: 'proj-002', title: '需求訪談結束', date: '2025-03-31', status: 'Delayed' },
];

export const MOCK_WEEKLY_REPORTS: WeeklyReport[] = [
  { 
    id: 'wr-1', 
    project_id: 'proj-001', 
    week: '2025-W47', 
    summary: '完成基礎建設與環境建置，設計稿 Review 順利，無重大阻礙。', 
    completion_rate: 100,
    created_at: '2025-11-23'
  },
  { 
    id: 'wr-2', 
    project_id: 'proj-001', 
    week: '2025-W46', 
    summary: 'CMS 選型討論較久，導致進度些微落後，已於週五補齊。', 
    completion_rate: 85,
    created_at: '2025-11-16'
  }
];

export const MOCK_SPRINT_SETTINGS: SprintSettings = {
  duration_weeks: 1,
  start_day: 1 // Monday
};

export const MOCK_SPRINTS: Sprint[] = [
  {
    id: 'sprint-w47',
    name: '2025-W47',
    start_date: '2025-11-17',
    end_date: '2025-11-23',
    status: 'Completed',
    goal: '完成基礎架構搭建'
  },
  {
    id: 'sprint-w48',
    name: '2025-W48',
    start_date: '2025-11-24',
    end_date: '2025-11-30',
    status: 'Active',
    goal: '首頁切版與 API 串接'
  },
  {
    id: 'sprint-w49',
    name: '2025-W49',
    start_date: '2025-12-01',
    end_date: '2025-12-07',
    status: 'Planned',
    goal: '會員中心功能開發'
  }
];

export const MOCK_TASKS: Task[] = [
  // Project 1 Tasks (Web Revamp)
  {
    id: 't-1',
    key: 'WEB-101',
    title: '首頁切版 (Hero Section)',
    project_id: 'proj-001',
    sprint_id: 'sprint-w48',
    status: 'In Progress',
    assignee_id: 'uuid-002', // Bob
    priority: 'High',
    story_points: 5,
    description: '依據 Figma 設計稿實作首頁主視覺區塊，需支援 RWD。\n\n**驗收標準：**\n1. 寬度 1440px 時顯示完整 Layout\n2. 手機版漢堡選單功能正常\n3. Loading 時間小於 1s',
    due_date: '2025-11-28',
    time_spent: '3h 15m',
    comments: [
      { id: 'c1', user_id: 'uuid-001', content: '記得檢查 iPad Pro 的解析度', created_at: '2025-11-25 10:30' },
      { id: 'c2', user_id: 'uuid-002', content: '收到，目前已經調整好 Grid Layout', created_at: '2025-11-25 11:15' }
    ],
    report_content: '目前已完成 Desktop 版面，正在調整 Mobile Breakpoint。',
    attachments: [
      { id: 'a1', name: 'screenshot-desktop.png', url: '#', size: '1.2MB', type: 'image', created_at: '2025-11-26' }
    ]
  },
  {
    id: 't-2',
    key: 'WEB-102',
    title: 'API 串接: 最新消息',
    project_id: 'proj-001',
    sprint_id: 'sprint-w48',
    status: 'To Do',
    assignee_id: 'uuid-001', // Alice
    priority: 'Medium',
    story_points: 3,
    description: '串接 GET /api/news 接口，並渲染列表。',
    due_date: '2025-11-29',
    time_spent: '0h',
    comments: []
  },
  {
    id: 't-3',
    key: 'WEB-103',
    title: '導覽列設計',
    project_id: 'proj-001',
    sprint_id: 'sprint-w48',
    status: 'Code Review',
    assignee_id: 'uuid-002', // Bob
    priority: 'High',
    story_points: 3,
    related_task_ids: ['t-1'], // Linked to WEB-101
    description: '實作全站共用的 Header 與 Navigation Bar。',
    due_date: '2025-11-27',
    time_spent: '2h 45m',
    comments: []
  },
  // Sub-task Example
  {
    id: 't-3-1',
    key: 'WEB-103-1',
    title: 'Mobile Menu 動畫優化',
    project_id: 'proj-001',
    sprint_id: 'sprint-w48',
    status: 'To Do',
    assignee_id: 'uuid-002',
    priority: 'Low',
    story_points: 1,
    parent_task_id: 't-3', // Child of WEB-103
    description: '讓漢堡選單展開時有 Slide-in 效果。',
    comments: []
  },
  // New Sub-task
  {
    id: 't-3-2',
    key: 'WEB-103-2',
    title: '導覽列 CSS 優化',
    project_id: 'proj-001',
    sprint_id: 'sprint-w48',
    status: 'To Do',
    assignee_id: 'uuid-002', // Bob
    priority: 'Low',
    story_points: 1,
    parent_task_id: 't-3', // Child of WEB-103
    description: '調整導覽列在不同解析度下的顯示效果。',
    comments: []
  },
  {
    id: 't-4',
    key: 'WEB-104',
    title: 'Footer 實作',
    project_id: 'proj-001',
    sprint_id: 'sprint-w48',
    status: 'Done',
    assignee_id: 'uuid-002',
    priority: 'Low',
    story_points: 2,
    deliverable_url: 'https://github.com/nexus/web/pull/45',
    description: '包含版權宣告、Sitemap 連結與社群圖示。',
    due_date: '2025-11-26',
    time_spent: '1h 30m',
    comments: [],
    attachments: [
      { id: 'a2', name: 'footer-spec.pdf', url: '#', size: '500KB', type: 'file', created_at: '2025-11-20' }
    ]
  },
  
  // Project 2 Tasks (ERP)
  {
    id: 't-5',
    key: 'ERP-001',
    title: '資料庫架構設計',
    project_id: 'proj-002',
    sprint_id: 'sprint-w48',
    status: 'In Test',
    assignee_id: 'uuid-000', // Admin
    priority: 'High',
    story_points: 8,
    description: '規劃 PostgreSQL Schema，包含 Users, Roles, Permissions 表關聯。',
    due_date: '2025-11-30',
    time_spent: '12h',
    comments: []
  },
  {
    id: 't-6',
    key: 'ERP-002',
    title: '需求訪談',
    project_id: 'proj-002',
    sprint_id: 'sprint-w47', // Past sprint
    status: 'Done',
    assignee_id: 'uuid-001',
    priority: 'Medium',
    story_points: 5,
    description: '與財務部門確認報表需求。',
    due_date: '2025-11-20',
    time_spent: '8h',
    comments: []
  },
  {
    id: 't-7',
    key: 'ERP-003',
    title: '登入模組',
    project_id: 'proj-002',
    sprint_id: 'sprint-w49', // Future sprint
    status: 'To Do',
    assignee_id: 'uuid-002',
    priority: 'High',
    story_points: 5,
    description: '實作 JWT 驗證與 RBAC Middleware。',
    due_date: '2025-12-05',
    comments: []
  }
];

export const MOCK_DOCS: Document[] = [
  {
    id: 'doc-1',
    project_id: 'proj-001',
    name: '需求規格書 v1.0.pdf',
    type: 'Requirements',
    url: '#',
    created_at: '2025-01-10',
    updated_at: '2025-01-15',
    version: 'v1.0',
    author_id: 'uuid-001', // Alice
    last_modified_by_id: 'uuid-001'
  },
  {
    id: 'doc-2',
    project_id: 'proj-001',
    name: '首頁設計稿.fig',
    type: 'Design',
    url: '#',
    created_at: '2025-01-28',
    updated_at: '2025-02-01',
    version: 'v2.3',
    author_id: 'uuid-002', // Bob
    last_modified_by_id: 'uuid-001' // Alice updated
  },
  {
    id: 'doc-3',
    project_id: 'proj-001',
    name: 'W48 Sprint Planning 會議記錄',
    type: 'Meeting',
    url: '#',
    created_at: '2025-11-24',
    updated_at: '2025-11-24',
    version: 'v1.0',
    author_id: 'uuid-001',
    last_modified_by_id: 'uuid-001',
    ai_summary: '本週重點：首頁 Hero Section 務必週三前完成切版，API 規格已確認。Bob 負責切版，Alice 負責 API。'
  },
  // Initial Mock Sprint Report
  {
      id: 'doc-sprint-prev',
      project_id: 'sys-sprint-reports', // Assigned to virtual project
      name: '2025-W47 結算報表 (範例)',
      type: 'Sprint Report',
      url: '#',
      content: '# 2025-W47 Sprint Review\n\n- Completion Rate: 100%\n- Total Cost: NT$42,000',
      created_at: '2025-11-23',
      updated_at: '2025-11-23',
      version: 'v1.0',
      author_id: 'uuid-000',
      last_modified_by_id: 'uuid-000',
      ai_summary: 'Example System Generated Report'
  }
];
