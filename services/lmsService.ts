
import { Course, Enrollment, AssignmentRule, CourseUnit, User } from '../types';
import { MOCK_COURSES, MOCK_ASSIGNMENT_RULES, MOCK_ENROLLMENTS } from './mockLMSData';
import { MOCK_USERS } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const lmsService = {
  // 1. Get Courses
  getAllCourses: async (): Promise<Course[]> => {
    await delay(300);
    return [...MOCK_COURSES];
  },

  getCourse: async (courseId: string): Promise<Course | undefined> => {
    await delay(200);
    return MOCK_COURSES.find(c => c.id === courseId);
  },

  // 2. Get Enrollments (My Learning)
  getUserEnrollments: async (userId: string): Promise<Enrollment[]> => {
    await delay(400);
    // Check for auto-assignments first (Simulate Trigger)
    await lmsService.triggerAutoAssignment(userId);
    return MOCK_ENROLLMENTS.filter(e => e.user_id === userId);
  },

  // 3. Auto Assignment Engine (FUNC_LMS_02)
  triggerAutoAssignment: async (userId: string): Promise<void> => {
    // This logic usually runs on backend event bus
    const user = Object.values(MOCK_USERS).find(u => u.id === userId);
    if (!user) return;

    for (const rule of MOCK_ASSIGNMENT_RULES) {
      if (!rule.is_active) continue;

      // Check Match
      const deptMatch = !rule.target_dept_id || user.department.id === rule.target_dept_id;
      const roleMatch = !rule.target_role_id || user.roles.includes(rule.target_role_id.replace('role_', '')); // simplified matching

      if (deptMatch && roleMatch) {
        // Check if already enrolled
        const exists = MOCK_ENROLLMENTS.some(e => e.user_id === userId && e.course_id === rule.assign_course_id);
        if (!exists) {
          // Assign
          const course = MOCK_COURSES.find(c => c.id === rule.assign_course_id);
          if (!course) continue;

          // Init unit progress
          const unitMap: Record<string, any> = {};
          course.units.forEach((u, idx) => {
             unitMap[u.id] = { status: idx === 0 ? 'OPEN' : 'LOCKED' };
          });

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + rule.deadline_days);

          MOCK_ENROLLMENTS.push({
            id: `enr-${Date.now()}-${rule.id}`,
            user_id: userId,
            course_id: rule.assign_course_id,
            status: 'NOT_STARTED',
            progress_percent: 0,
            source: 'ASSIGNED',
            due_date: dueDate.toISOString().split('T')[0],
            unit_progress: unitMap
          });
        }
      }
    }
  },

  // 4. Progress Tracking (FUNC_LMS_03)
  updateUnitProgress: async (enrollmentId: string, unitId: string, data: { position?: number, completed?: boolean }): Promise<void> => {
    await delay(200);
    const enrollment = MOCK_ENROLLMENTS.find(e => e.id === enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");

    const unitState = enrollment.unit_progress[unitId] || { status: 'OPEN' };
    
    if (data.position !== undefined) unitState.last_position_sec = data.position;
    if (data.completed) unitState.status = 'COMPLETED';

    enrollment.unit_progress[unitId] = unitState;
    enrollment.last_accessed_at = new Date().toISOString();

    // Recalculate Course Progress
    const course = MOCK_COURSES.find(c => c.id === enrollment.course_id);
    if (course) {
      const totalUnits = course.units.length;
      const completedUnits = Object.values(enrollment.unit_progress).filter((u: any) => u.status === 'COMPLETED').length;
      enrollment.progress_percent = Math.round((completedUnits / totalUnits) * 100);

      if (enrollment.progress_percent === 100) {
        enrollment.status = 'COMPLETED';
        enrollment.completed_at = new Date().toISOString();
      } else {
        enrollment.status = 'IN_PROGRESS';
        // Unlock next unit
        const currentUnitIdx = course.units.findIndex(u => u.id === unitId);
        if (data.completed && currentUnitIdx < totalUnits - 1) {
           const nextUnit = course.units[currentUnitIdx + 1];
           if (enrollment.unit_progress[nextUnit.id]?.status === 'LOCKED') {
               enrollment.unit_progress[nextUnit.id].status = 'OPEN';
           }
        }
      }
    }
  },

  // 5. Quiz Grading (FUNC_LMS_03 B)
  submitQuiz: async (enrollmentId: string, unitId: string, answers: Record<string, string[]>): Promise<{ score: number, passed: boolean }> => {
    await delay(500);
    const enrollment = MOCK_ENROLLMENTS.find(e => e.id === enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");
    
    const course = MOCK_COURSES.find(c => c.id === enrollment.course_id);
    const unit = course?.units.find(u => u.id === unitId);
    if (!unit || !unit.questions) throw new Error("Quiz not found");

    let totalScore = 0;
    const maxScore = unit.questions.reduce((acc, q) => acc + q.score_weight, 0);

    unit.questions.forEach(q => {
      const userAns = answers[q.id] || [];
      // Simple exact match check
      const isCorrect = 
        userAns.length === q.correct_answer.length && 
        userAns.every(val => q.correct_answer.includes(val));
      
      if (isCorrect) {
        totalScore += q.score_weight;
      }
    });

    const passed = totalScore >= 80; // Hardcoded passing score 80

    // Update Progress
    if (passed) {
      await lmsService.updateUnitProgress(enrollmentId, unitId, { completed: true });
    }
    
    // Store score (Mock update)
    if (!enrollment.unit_progress[unitId]) enrollment.unit_progress[unitId] = { status: 'OPEN' };
    enrollment.unit_progress[unitId].quiz_score = totalScore;

    return { score: totalScore, passed };
  },

  // 6. AI Course Generator (FUNC_LMS_04)
  generateCourseWithAI: async (topic: string): Promise<Course> => {
    await delay(2000); // Simulate AI processing
    
    // Mock Response
    return {
      id: 'course-ai-' + Date.now(),
      title: `AI 生成：${topic}`,
      category: 'Generated',
      description: `這是由 Nexus AI 根據主題「${topic}」自動生成的課程大綱。`,
      cover_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
      estimated_minutes: 30,
      is_published: false,
      created_at: new Date().toISOString(),
      units: [
        {
          id: 'u-ai-1', course_id: '', title: '第一章：基礎概念', type: 'ARTICLE', order_index: 1, is_required: true,
          content_text: `AI 自動生成的 ${topic} 介紹文章...`
        },
        {
          id: 'u-ai-2', course_id: '', title: '第二章：進階應用', type: 'VIDEO', order_index: 2, is_required: true,
          asset_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
        },
        {
          id: 'u-ai-3', course_id: '', title: '隨堂測驗', type: 'QUIZ', order_index: 3, is_required: true,
          questions: [
            { id: 'q1', text: `關於 ${topic} 的核心價值是？`, options: [{id:'A', text:'效率'}, {id:'B', text:'成本'}], correct_answer: ['A'], score_weight: 100 }
          ]
        }
      ]
    };
  }
};
