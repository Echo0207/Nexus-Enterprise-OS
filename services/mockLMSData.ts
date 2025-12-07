
import { Course, Enrollment, AssignmentRule } from '../types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-001',
    title: '新進員工資安意識訓練',
    category: 'Onboarding',
    description: '所有新進員工必修的資訊安全基礎課程，包含密碼原則、釣魚信件識別等。',
    cover_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80',
    estimated_minutes: 45,
    is_published: true,
    created_at: '2025-01-01',
    units: [
      {
        id: 'unit-1-1',
        course_id: 'course-001',
        title: '資訊安全政策概論',
        type: 'VIDEO',
        asset_url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Mock video
        video_duration: 600, // 10 mins
        order_index: 1,
        is_required: true
      },
      {
        id: 'unit-1-2',
        course_id: 'course-001',
        title: '如何辨識社交工程攻擊',
        type: 'ARTICLE',
        content_text: '社交工程（Social Engineering）是利用人性的弱點（如好奇心、恐懼、貪婪等）來操縱受害者，使其洩漏機密資訊或執行惡意操作...',
        order_index: 2,
        is_required: true
      },
      {
        id: 'unit-1-3',
        course_id: 'course-001',
        title: '資安知識隨堂測驗',
        type: 'QUIZ',
        order_index: 3,
        is_required: true,
        questions: [
          {
            id: 'q-1',
            text: '收到一封來自「IT 部門」要求重設密碼的 Email，連結網址卻是 http://nexus-secure-login.fake.com，你應該？',
            options: [
              { id: 'A', text: '立刻點擊重設密碼以免帳號被鎖' },
              { id: 'B', text: '轉寄給同事確認' },
              { id: 'C', text: '不點擊連結，並向真正的 IT 部門求證' },
              { id: 'D', text: '回信詢問對方是誰' }
            ],
            correct_answer: ['C'],
            score_weight: 50
          },
          {
            id: 'q-2',
            text: '離開座位時，電腦螢幕應該？',
            options: [
              { id: 'A', text: '保持原樣' },
              { id: 'B', text: '登出或鎖定螢幕 (Win+L)' },
              { id: 'C', text: '關閉螢幕電源' }
            ],
            correct_answer: ['B'],
            score_weight: 50
          }
        ]
      }
    ]
  },
  {
    id: 'course-002',
    title: '2025 年度業務銷售技巧',
    category: 'Skill',
    description: '針對業務部門設計的高階談判與客戶關係管理課程。',
    cover_image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    estimated_minutes: 120,
    is_published: true,
    created_at: '2025-02-15',
    units: [
      {
        id: 'unit-2-1',
        course_id: 'course-002',
        title: '破冰技巧與建立信任',
        type: 'VIDEO',
        asset_url: 'https://www.w3schools.com/html/movie.mp4',
        video_duration: 1800, // 30 mins
        order_index: 1,
        is_required: true
      }
    ]
  }
];

export const MOCK_ASSIGNMENT_RULES: AssignmentRule[] = [
  {
    id: 'rule-001',
    title: '全公司新進人員必修',
    target_dept_id: null, // All depts
    target_role_id: null, // All roles
    assign_course_id: 'course-001',
    deadline_days: 14,
    is_active: true
  },
  {
    id: 'rule-002',
    title: '業務部進階培訓',
    target_dept_id: 'dept-sales',
    target_role_id: null,
    assign_course_id: 'course-002',
    deadline_days: 30,
    is_active: true
  }
];

// Initial Enrollment for Demo
export const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 'enr-001',
    user_id: 'uuid-002', // Bob
    course_id: 'course-001',
    status: 'IN_PROGRESS',
    progress_percent: 33,
    source: 'ASSIGNED',
    due_date: '2025-12-31',
    last_accessed_at: '2025-10-01',
    unit_progress: {
      'unit-1-1': { status: 'COMPLETED', last_position_sec: 600 },
      'unit-1-2': { status: 'OPEN' },
      'unit-1-3': { status: 'LOCKED' }
    }
  }
];
