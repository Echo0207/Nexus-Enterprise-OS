
import { Project, Task, Sprint, Document, TaskStatus, ProjectStage, Comment, Milestone, WeeklyReport, SprintSettings, SprintReviewReport, User } from '../types';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_SPRINTS, MOCK_DOCS, MOCK_MILESTONES, MOCK_WEEKLY_REPORTS, MOCK_SPRINT_SETTINGS } from './mockProjectData';
import { MOCK_USERS } from './mockData';

// Simulate delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    await delay(500);
    return [...MOCK_PROJECTS];
  },

  updateProject: async (project: Project): Promise<Project> => {
    await delay(500);
    const index = MOCK_PROJECTS.findIndex(p => p.id === project.id);
    if (index !== -1) {
      MOCK_PROJECTS[index] = { ...project };
      return MOCK_PROJECTS[index];
    }
    throw new Error('Project not found');
  },

  getTasks: async (): Promise<Task[]> => {
    await delay(500);
    return JSON.parse(JSON.stringify(MOCK_TASKS)); // Deep copy to allow mutation in mock
  },

  // Create new task or subtask
  createTask: async (partialTask: Partial<Task>): Promise<Task> => {
    await delay(300);
    const newTask: Task = {
      id: 't-' + Date.now(),
      key: 'NEW-' + Math.floor(Math.random() * 1000),
      title: partialTask.title || '新任務',
      project_id: partialTask.project_id || '',
      sprint_id: partialTask.sprint_id || '',
      status: 'To Do',
      assignee_id: null,
      priority: 'Medium',
      story_points: 0,
      description: '',
      comments: [],
      related_task_ids: [],
      ...partialTask
    } as Task;
    MOCK_TASKS.push(newTask);
    return newTask;
  },

  // Sprints Management
  getSprints: async (): Promise<Sprint[]> => {
    await delay(300);
    // Ensure buffer is maintained whenever sprints are fetched
    projectService.ensureFutureSprintBuffer();
    return [...MOCK_SPRINTS];
  },
  
  getSprintSettings: async (): Promise<SprintSettings> => {
      await delay(200);
      return { ...MOCK_SPRINT_SETTINGS };
  },

  updateSprintSettings: async (settings: SprintSettings): Promise<void> => {
      await delay(400);
      MOCK_SPRINT_SETTINGS.duration_weeks = settings.duration_weeks;
      // Re-generate buffer immediately based on new settings
      projectService.ensureFutureSprintBuffer(true);
  },

  // Auto-generation Logic (Rule 2 & 3)
  ensureFutureSprintBuffer: (forceRegen: boolean = false) => {
      // 1 week -> 53, 2 weeks -> 27, 3 weeks -> 18, 4 weeks -> 14
      const WEEKS_IN_YEAR = 53;
      const duration = MOCK_SPRINT_SETTINGS.duration_weeks;
      const bufferSize = Math.ceil(WEEKS_IN_YEAR / duration);

      // Clean up existing planned sprints if forcing regen (e.g. changing duration)
      if (forceRegen) {
          const activeIndex = MOCK_SPRINTS.findIndex(s => s.status === 'Active');
          if (activeIndex !== -1) {
              // Remove all planned sprints after active
              MOCK_SPRINTS.splice(activeIndex + 1);
          }
      }

      const lastSprint = MOCK_SPRINTS[MOCK_SPRINTS.length - 1];
      let startDate = new Date(lastSprint.end_date);
      startDate.setDate(startDate.getDate() + 1); // Start next day

      const currentCount = MOCK_SPRINTS.filter(s => s.status === 'Planned').length;
      const needed = bufferSize - currentCount;

      for (let i = 0; i < needed; i++) {
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + (duration * 7) - 1);
          
          // Generate Name: e.g. 2025-W50
          // Simple mock name generation based on date
          // In a real app, this would calculate the actual week number
          const name = `2025-W${50 + i}`; 

          MOCK_SPRINTS.push({
              id: 'sprint-auto-' + Date.now() + i,
              name: name,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              status: 'Planned',
              goal: '待規劃'
          });

          // Next iteration start
          startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() + 1);
      }
  },

  // Helper: Parse time spent string "2h 30m" to decimal hours
  parseTimeSpent: (timeStr?: string): number => {
    if (!timeStr) return 0;
    let hours = 0;
    const hMatch = timeStr.match(/(\d+)h/);
    const mMatch = timeStr.match(/(\d+)m/);
    if (hMatch) hours += parseInt(hMatch[1]);
    if (mMatch) hours += parseInt(mMatch[1]) / 60;
    return hours;
  },

  // Logic: Check if Active sprint is overdue
  checkSprintHealth: async (): Promise<{ hasUnclosedSprint: boolean, sprint?: Sprint }> => {
      const activeSprint = MOCK_SPRINTS.find(s => s.status === 'Active');
      if (!activeSprint) return { hasUnclosedSprint: false };

      const today = new Date().toISOString().split('T')[0];
      // If today > end_date, it's overdue
      if (today > activeSprint.end_date) {
          return { hasUnclosedSprint: true, sprint: activeSprint };
      }
      return { hasUnclosedSprint: false };
  },

  // Logic: Generate Sprint Review Report
  generateSprintReview: async (sprintId: string): Promise<SprintReviewReport> => {
      await delay(800);
      const sprintTasks = MOCK_TASKS.filter(t => t.sprint_id === sprintId);
      const totalTasks = sprintTasks.length;
      const completedTasks = sprintTasks.filter(t => t.status === 'Done').length;
      
      let totalHours = 0;
      let totalCost = 0;

      // User Performance Stats
      const userStatsMap: Record<string, any> = {};
      // Project Cost Stats
      const projectCostMap: Record<string, {cost: number, hours: number}> = {};

      sprintTasks.forEach(task => {
          const hours = projectService.parseTimeSpent(task.time_spent);
          totalHours += hours;

          // Cost Calculation
          let taskCost = 0;
          if (task.assignee_id) {
              // Find user salary (mocked in MOCK_USERS, which is mapped from mockData.ts)
              // In real code we'd fetch user from DB. Here we use the MOCK_USERS object directly for calculation
              // Assuming MOCK_USERS keys are emails, but tasks use UUIDs.
              // We need to look up by ID.
              const userEmail = Object.keys(MOCK_USERS).find(email => MOCK_USERS[email].id === task.assignee_id);
              const user = userEmail ? MOCK_USERS[userEmail] : null;
              
              if (user && user.salary) {
                  const hourlyRate = user.salary / 160; // Approx 160h work hours/month
                  taskCost = hours * hourlyRate;
              }

              // Update User Stats
              if (!userStatsMap[task.assignee_id]) {
                  userStatsMap[task.assignee_id] = {
                      userId: task.assignee_id,
                      userName: user ? user.name : 'Unknown',
                      tasksAssigned: 0,
                      tasksCompleted: 0,
                      totalHoursLogged: 0,
                      costContribution: 0
                  };
              }
              userStatsMap[task.assignee_id].tasksAssigned += 1;
              if (task.status === 'Done') userStatsMap[task.assignee_id].tasksCompleted += 1;
              userStatsMap[task.assignee_id].totalHoursLogged += hours;
              userStatsMap[task.assignee_id].costContribution += taskCost;
          }
          
          totalCost += taskCost;

          // Update Project Stats
          if (!projectCostMap[task.project_id]) {
              const project = MOCK_PROJECTS.find(p => p.id === task.project_id);
              projectCostMap[task.project_id] = { cost: 0, hours: 0, name: project?.name || 'Unknown' } as any;
          }
          projectCostMap[task.project_id].cost += taskCost;
          projectCostMap[task.project_id].hours += hours;
      });

      const userPerformance = Object.values(userStatsMap).map((u: any) => ({
          ...u,
          efficiencyRate: u.tasksAssigned > 0 ? Math.round((u.tasksCompleted / u.tasksAssigned) * 100) : 0
      }));

      const projectBreakdown = Object.entries(projectCostMap).map(([pid, data]: [string, any]) => ({
          projectId: pid,
          projectName: data.name,
          cost: data.cost,
          hours: data.hours
      }));

      return {
          sprintId,
          generatedAt: new Date().toLocaleString(),
          totalTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          totalHours,
          totalCost,
          teamPerformance: userPerformance,
          projectBreakdown
      };
  },

  // Close sprint and save report
  closeSprint: async (sprintId: string, reviewReport: SprintReviewReport, authorId: string): Promise<void> => {
      await delay(1000);

      // 1. Update Current Sprint Status
      const sprintIndex = MOCK_SPRINTS.findIndex(s => s.id === sprintId);
      if (sprintIndex === -1) throw new Error("Sprint not found");
      MOCK_SPRINTS[sprintIndex].status = 'Completed';

      // 2. Activate Next Planned Sprint
      // Find the first Planned sprint sorted by date (mock list is already sorted)
      const nextSprint = MOCK_SPRINTS.find(s => s.status === 'Planned');
      if (nextSprint) {
          nextSprint.status = 'Active';
      }

      // 3. Generate Document Content (Markdown)
      const sprintName = MOCK_SPRINTS[sprintIndex].name;
      const formatCurrency = (n: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n);

      let content = `# Sprint Review Report: ${sprintName}\n\n`;
      content += `> 此報表包含敏感財務與績效資訊，僅供管理層查閱。\n\n`;
      content += `**生成時間:** ${reviewReport.generatedAt}\n\n`;
      
      content += `## 1. 總覽 (Overview)\n`;
      content += `- **總投入工時:** ${reviewReport.totalHours.toFixed(1)} h\n`;
      content += `- **任務完成率:** ${reviewReport.completionRate}%\n`;
      content += `- **本週專案人力成本累計:** ${formatCurrency(reviewReport.totalCost)}\n\n`;
      
      content += `## 2. 專案成本佔比 (Project Cost Breakdown)\n`;
      content += `| 專案名稱 | 工時 (h) | 成本 (TWD) | 佔比 |\n|---|---|---|---|\n`;
      reviewReport.projectBreakdown.forEach(p => {
          const percent = reviewReport.totalCost > 0 ? ((p.cost / reviewReport.totalCost) * 100).toFixed(1) : '0';
          content += `| **${p.projectName}** | ${p.hours}h | ${formatCurrency(p.cost)} | ${percent}% |\n`;
      });
      content += `\n`;

      content += `## 3. 團隊績效與工作量 KPI (Team Performance)\n`;
      content += `| 成員 (Member) | 工時 (Hours) | 任務數 (Done/Total) | 達成率 (KPI Rate) | 成本貢獻 (Cost) |\n|---|---|---|---|---|\n`;
      reviewReport.teamPerformance.forEach(u => {
          content += `| ${u.userName} | ${u.totalHoursLogged} | ${u.tasksCompleted} / ${u.tasksAssigned} | **${u.efficiencyRate}%** | ${formatCurrency(u.costContribution)} |\n`;
      });

      // 4. Save to Document Repo
      // Assign to Project 1 default or generic
      const projectId = reviewReport.projectBreakdown.length > 0 ? reviewReport.projectBreakdown[0].projectId : 'proj-001';
      
      const newDoc: Document = {
          id: 'doc-sprint-report-' + Date.now(),
          project_id: projectId, // Attach to the primary project of this sprint or the first one
          name: `${sprintName} 結算報表`,
          type: 'Sprint Report',
          url: '#',
          content: content,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          version: 'v1.0',
          author_id: authorId,
          last_modified_by_id: authorId,
          ai_summary: 'System generated sprint review report.'
      };
      
      MOCK_DOCS.push(newDoc);
  },

  getDocuments: async (projectId?: string): Promise<Document[]> => {
      await delay(300);
      if (projectId) {
          return MOCK_DOCS.filter(d => d.project_id === projectId);
      }
      return [...MOCK_DOCS];
  },

  updateDocument: async (document: Partial<Document> & { id: string, last_modified_by_id: string }): Promise<Document> => {
    await delay(400);
    const index = MOCK_DOCS.findIndex(d => d.id === document.id);
    if (index !== -1) {
      const oldDoc = MOCK_DOCS[index];
      
      // Calculate new version (simple increment logic: v1.0 -> v1.1)
      let newVersion = oldDoc.version;
      try {
        const currentVerNum = parseFloat(oldDoc.version.replace(/[^0-9.]/g, ''));
        if (!isNaN(currentVerNum)) {
             newVersion = `v${(currentVerNum + 0.1).toFixed(1)}`;
        }
      } catch (e) {
        newVersion = oldDoc.version + '.1';
      }

      const now = new Date().toISOString().split('T')[0];

      const updatedDoc = {
        ...oldDoc,
        ...document,
        version: newVersion,
        updated_at: now,
        // Ensure strictly these fields are updated logically
        last_modified_by_id: document.last_modified_by_id
      };
      
      MOCK_DOCS[index] = updatedDoc;
      return updatedDoc;
    }
    throw new Error('Document not found');
  },

  createDocument: async (doc: Partial<Document> & { project_id: string, author_id: string }): Promise<Document> => {
      await delay(400);
      const now = new Date().toISOString().split('T')[0];
      const newDoc: Document = {
          id: 'doc-' + Date.now(),
          project_id: doc.project_id,
          name: doc.name || '未命名文件',
          type: doc.type || 'Other',
          url: doc.url || '#',
          content: doc.content || '',
          version: 'v1.0',
          created_at: now,
          updated_at: now,
          author_id: doc.author_id,
          last_modified_by_id: doc.author_id,
          ai_summary: ''
      };
      MOCK_DOCS.push(newDoc);
      return newDoc;
  },

  getMilestones: async (projectId: string): Promise<Milestone[]> => {
      await delay(200);
      return MOCK_MILESTONES.filter(m => m.project_id === projectId);
  },

  addMilestone: async (milestone: Milestone): Promise<Milestone> => {
    await delay(300);
    MOCK_MILESTONES.push(milestone);
    return milestone;
  },

  updateMilestone: async (milestone: Milestone): Promise<Milestone> => {
    await delay(300);
    const index = MOCK_MILESTONES.findIndex(m => m.id === milestone.id);
    if (index !== -1) {
      MOCK_MILESTONES[index] = milestone;
      return milestone;
    }
    throw new Error('Milestone not found');
  },

  getWeeklyReports: async (projectId: string): Promise<WeeklyReport[]> => {
      await delay(200);
      return MOCK_WEEKLY_REPORTS.filter(r => r.project_id === projectId);
  },

  updateTaskStatus: async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    await delay(300);
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
    }
  },

  // Generic update for edits
  updateTask: async (updatedTask: Task): Promise<Task> => {
    await delay(400);
    const index = MOCK_TASKS.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      MOCK_TASKS[index] = { ...updatedTask };
      return MOCK_TASKS[index];
    }
    throw new Error('Task not found');
  },

  updateProjectStage: async (projectId: string, newStage: ProjectStage): Promise<void> => {
      await delay(300);
      const proj = MOCK_PROJECTS.find(p => p.id === projectId);
      if (proj) {
          proj.stage = newStage;
      }
  },

  // FUNC_PM_02_EXT: Move task to new sprint with Blame Logic
  moveTaskSprint: async (taskId: string, newSprintId: string, reason: string, blamedUserId: string): Promise<void> => {
    await delay(600);
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (task) {
      // In a real app, we would log to a task_history table here
      console.log(`[Audit] Task ${task.key} moved to ${newSprintId}. Reason: ${reason}, Blame: ${blamedUserId}`);
      task.sprint_id = newSprintId;
    }
  },

  addComment: async (taskId: string, content: string, userId: string): Promise<Comment> => {
    await delay(300);
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (!task) throw new Error("Task not found");
    
    const newComment: Comment = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      content,
      created_at: new Date().toLocaleString('zh-TW', { hour12: false })
    } as any; // Type casting for simplicity in mock

    if (!task.comments) task.comments = [];
    task.comments.push(newComment);
    return newComment;
  }
};
