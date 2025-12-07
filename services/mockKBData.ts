
import { KnowledgeCategory, KnowledgeDocument, KnowledgeChunk } from '../types';

export const MOCK_KB_CATEGORIES: KnowledgeCategory[] = [
  { id: 'cat-company', name: '公司規章 (General)', description: '員工手冊、行為準則、福利政策' },
  { id: 'cat-hr', name: '人資與薪酬 (HR & Finance)', description: '薪資結構、績效考核、請假規則' },
  { id: 'cat-tech', name: '技術文件 (Engineering)', description: 'API 文件、架構設計、開發規範' },
  { id: 'cat-sales', name: '業務資源 (Sales)', description: '報價單模板、客戶案例、產品簡報' },
];

export const MOCK_KB_DOCS: KnowledgeDocument[] = [
  {
    id: 'kb-doc-1',
    title: '2025 員工手冊.pdf',
    category_id: 'cat-company',
    file_type: 'pdf',
    size: '2.4MB',
    uploaded_at: '2025-01-01',
    uploaded_by: 'admin',
    is_public: true, // Visible to everyone
    allowed_roles: [],
    allowed_dept_ids: [],
    status: 'Indexed'
  },
  {
    id: 'kb-doc-2',
    title: '2025 年度薪資職級表.xlsx',
    category_id: 'cat-hr',
    file_type: 'docx',
    size: '500KB',
    uploaded_at: '2025-01-05',
    uploaded_by: 'hr_manager',
    is_public: false, // Restricted
    allowed_roles: ['hr_manager', 'admin'],
    allowed_dept_ids: ['dept-hr'],
    status: 'Indexed'
  },
  {
    id: 'kb-doc-3',
    title: '請假規則與全勤獎金辦法.md',
    category_id: 'cat-hr',
    file_type: 'md',
    size: '12KB',
    uploaded_at: '2025-01-10',
    uploaded_by: 'hr_manager',
    is_public: true, // Visible to everyone
    allowed_roles: [],
    allowed_dept_ids: [],
    status: 'Indexed'
  },
  {
    id: 'kb-doc-4',
    title: 'Backend API V2 Spec',
    category_id: 'cat-tech',
    file_type: 'notion',
    size: 'Online',
    uploaded_at: '2025-02-01',
    uploaded_by: 'staff',
    is_public: false,
    allowed_roles: ['staff', 'admin'], // Assuming staff implies engineering for this mock
    allowed_dept_ids: ['dept-it'],
    status: 'Indexed'
  }
];

// Mock Vector Database Content
export const MOCK_KB_CHUNKS: KnowledgeChunk[] = [
  // Chunks from Employee Handbook (Public)
  {
    id: 'chk-1-1',
    document_id: 'kb-doc-1',
    content_text: 'Nexus 公司核心價值為創新、誠信與協作。上班時間為 09:00 至 18:00，午休時間為 12:00 至 13:00。',
    meta_is_public: true,
    meta_allowed_roles: [],
    meta_allowed_dept_ids: []
  },
  {
    id: 'chk-1-2',
    document_id: 'kb-doc-1',
    content_text: '公司提供免費零食櫃與每週五下午茶。每位員工配備 MacBook Pro 與 27 吋螢幕。',
    meta_is_public: true,
    meta_allowed_roles: [],
    meta_allowed_dept_ids: []
  },
  
  // Chunks from Salary Structure (Restricted: HR Only)
  {
    id: 'chk-2-1',
    document_id: 'kb-doc-2',
    content_text: '職級 P1 (Junior) 起薪範圍 50k-70k。P2 (Senior) 起薪範圍 80k-120k。P3 (Manager) 起薪 130k 以上。',
    meta_is_public: false,
    meta_allowed_roles: ['hr_manager', 'admin'],
    meta_allowed_dept_ids: ['dept-hr']
  },
  {
    id: 'chk-2-2',
    document_id: 'kb-doc-2',
    content_text: '年終獎金計算公式：(個人KPI係數 x 公司營收係數 x 月薪)。通常為 2-4 個月。',
    meta_is_public: false,
    meta_allowed_roles: ['hr_manager', 'admin'],
    meta_allowed_dept_ids: ['dept-hr']
  },

  // Chunks from Leave Rules (Public)
  {
    id: 'chk-3-1',
    document_id: 'kb-doc-3',
    content_text: '病假需附上就醫證明，一年內未超過30日部分，工資折半發給。事假期間不給薪。',
    meta_is_public: true,
    meta_allowed_roles: [],
    meta_allowed_dept_ids: []
  },
  {
    id: 'chk-3-2',
    document_id: 'kb-doc-3',
    content_text: '全勤獎金：當月無遲到、早退、曠職及請事病假者，加發 3000 元全勤獎金。',
    meta_is_public: true,
    meta_allowed_roles: [],
    meta_allowed_dept_ids: []
  },

  // Chunks from API Spec (IT Only)
  {
    id: 'chk-4-1',
    document_id: 'kb-doc-4',
    content_text: 'Auth API 使用 Bearer Token 驗證。Refresh Token 有效期為 7 天。登入 API 路徑為 POST /api/v1/auth/login。',
    meta_is_public: false,
    meta_allowed_roles: ['staff', 'admin'],
    meta_allowed_dept_ids: ['dept-it']
  }
];
