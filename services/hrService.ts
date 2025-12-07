

import { User, LeaveBalance, Payslip, LeaveType, LeaveRequest, PayslipItem, CostTransaction, Document, MonthlyCostReport, ProjectMonthlyDetail, ProjectTaskCost, ProjectPersonCost } from '../types';
import { MOCK_USERS, MOCK_LEAVE_TYPES, MOCK_LEAVE_REQUESTS } from './mockData';
import { MOCK_PROJECTS, MOCK_DOCS, MOCK_TASKS } from './mockProjectData';
import { projectService } from './projectService';

// Helper: Calculate diff in months
const getDiffMonths = (d1: Date, d2: Date) => {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const hrService = {
  // --- FUNC_HR_01: Special Leave Engine ---
  
  // Logic: Calculate quota based on LSA Art. 38
  calculateSpecialLeaveQuota: (onboardingDateStr: string): number => {
    const now = new Date();
    const onboard = new Date(onboardingDateStr);
    const months = getDiffMonths(onboard, now);
    const years = months / 12;

    // LSA Art 38 Logic
    if (months >= 6 && months < 12) {
        return 3;
    } else if (years >= 1 && years < 2) {
        return 7;
    } else if (years >= 2 && years < 3) {
        return 10;
    } else if (years >= 3 && years < 5) {
        return 14;
    } else if (years >= 5 && years < 10) {
        return 15;
    } else if (years >= 10) {
        const extra = Math.floor(years - 10);
        const quota = 15 + extra;
        return quota > 30 ? 30 : quota; // Max 30 days
    }
    return 0; // Less than 6 months
  },

  // Calculate Leave Hours based on LSA (break deduction)
  calculateLeaveHours: (startStr: string, endStr: string, allDay: boolean): number => {
      if (allDay) {
          const startDate = new Date(startStr.split('T')[0]);
          const endDate = new Date(endStr.split('T')[0]);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
          return diffDays * 8;
      }

      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffMs = end.getTime() - start.getTime();
      let diffHours = diffMs / (1000 * 60 * 60);

      // Rule: If spanning within a single day and duration > 4 hours, deduct 1 hour break
      const isSameDay = start.getDate() === end.getDate();
      if (isSameDay && diffHours > 4) {
          diffHours -= 1;
      }

      return parseFloat(diffHours.toFixed(1));
  },

  // Get Balance (Mocked logic to return calculated balance)
  getLeaveBalance: async (userId: string): Promise<LeaveBalance> => {
    await delay(300);
    // In real app, we fetch from DB. Here we calculate on fly.
    const user = Object.values(MOCK_USERS).find(u => u.id === userId);
    if (!user) throw new Error("User not found");

    const quota = hrService.calculateSpecialLeaveQuota(user.onboarding_date);
    
    // Calculate used days (Mock) based on 'Approved' status only
    const usedDays = MOCK_LEAVE_REQUESTS
        .filter(r => r.user_id === userId && r.type_id === 'lt-1' && r.status === 'Approved')
        .reduce((acc, curr) => acc + (curr.hours / 8), 0);

    return {
        user_id: userId,
        year: new Date().getFullYear(),
        quota_days: quota,
        used_days: parseFloat(usedDays.toFixed(1)),
        remaining_days: parseFloat((quota - usedDays).toFixed(1))
    };
  },

  getLeaveRequests: async (userId?: string): Promise<LeaveRequest[]> => {
      await delay(300);
      if (userId) {
          return MOCK_LEAVE_REQUESTS.filter(r => r.user_id === userId);
      }
      return MOCK_LEAVE_REQUESTS;
  },

  // Get Pending Requests for Approver (Mock: Return all except own)
  getPendingRequests: async (approverId: string, role: string): Promise<LeaveRequest[]> => {
      await delay(400);
      return MOCK_LEAVE_REQUESTS.filter(r => {
          // If HR, see 'Manager Approved' (or Pending if they want to skip level, but let's stick to flow)
          // For simplicty in mock:
          // Staff -> Pending -> Manager Approved -> Approved
          
          if (role.includes('hr')) {
              // HR sees 'Manager Approved' tasks (final step)
              // If a Manager applied, their task starts at 'Manager Approved', so HR sees it.
              return r.status === 'Manager Approved'; 
          }
          // Manager sees 'Pending'
          return r.status === 'Pending' && r.user_id !== approverId; 
      });
  },

  createLeaveRequest: async (req: Partial<LeaveRequest>): Promise<LeaveRequest> => {
      await delay(500);
      
      // Workflow Logic: Check applicant role
      // If Manager/Admin applies, skip direct manager approval -> "Manager Approved" (Goes to HR)
      const applicant = Object.values(MOCK_USERS).find(u => u.id === req.user_id);
      let initialStatus: 'Pending' | 'Manager Approved' = 'Pending';

      if (applicant) {
          const isManager = applicant.roles.some(r => r.includes('manager') || r === 'admin');
          if (isManager) {
              initialStatus = 'Manager Approved';
          }
      }

      const newReq: LeaveRequest = {
          id: 'lr-' + Date.now(),
          user_id: req.user_id!,
          type_id: req.type_id!,
          start_date: req.start_date!,
          end_date: req.end_date!,
          hours: req.hours!,
          reason: req.reason || '',
          status: initialStatus,
          handover_user_id: req.handover_user_id,
          rejection_reason: '',
          attachments: req.attachments || [],
          created_at: new Date().toISOString().split('T')[0]
      };
      MOCK_LEAVE_REQUESTS.push(newReq);
      return newReq;
  },

  updateLeaveRequest: async (req: LeaveRequest): Promise<LeaveRequest> => {
      await delay(400);
      const index = MOCK_LEAVE_REQUESTS.findIndex(r => r.id === req.id);
      if (index !== -1) {
          // If the request was rejected and is now being updated, clear rejection reason.
          // The new status is passed in the `req` object from the UI logic.
          if (MOCK_LEAVE_REQUESTS[index].status === 'Rejected') {
              req.rejection_reason = ''; 
          }
          MOCK_LEAVE_REQUESTS[index] = req;
          return req;
      }
      throw new Error("Request not found");
  },

  approveLeaveRequest: async (requestId: string, role: string): Promise<LeaveRequest> => {
      await delay(500);
      const req = MOCK_LEAVE_REQUESTS.find(r => r.id === requestId);
      if (!req) throw new Error("Request not found");

      // Workflow Logic
      if (role.includes('hr')) {
          // HR Approval -> Final
          req.status = 'Approved';
      } else {
          // Manager Approval -> Next Stage
          req.status = 'Manager Approved';
      }
      return req;
  },

  rejectLeaveRequest: async (requestId: string, reason: string): Promise<LeaveRequest> => {
      await delay(500);
      const req = MOCK_LEAVE_REQUESTS.find(r => r.id === requestId);
      if (!req) throw new Error("Request not found");
      
      req.status = 'Rejected';
      req.rejection_reason = reason;
      return req;
  },

  // --- FUNC_HR_02: Payroll Engine ---

  // Logic: Calculate Monthly Payroll (Payslip)
  calculatePayroll: async (userId: string, period: string): Promise<Payslip> => {
      await delay(800);
      const user = Object.values(MOCK_USERS).find(u => u.id === userId);
      if (!user) throw new Error("User not found");

      const items: PayslipItem[] = [];

      // 1. Basic Pay
      const baseSalary = user.base_salary;
      const meal = user.meal_allowance || 0;
      const position = user.position_allowance || 0;
      const grossBase = baseSalary + meal + position;

      items.push({ name: '本薪 (Base Salary)', amount: baseSalary, type: 'earning' });
      if (meal > 0) items.push({ name: '伙食津貼 (Meal)', amount: meal, type: 'earning' });
      if (position > 0) items.push({ name: '職務津貼 (Position)', amount: position, type: 'earning' });

      // 2. Overtime Calc (LSA Art. 24)
      // Mocking 4 hours of weekday overtime for demonstration
      const hourlyRate = Math.round(baseSalary / 30 / 8);
      const otHours = 4; // Mock
      let otPay = 0;
      
      if (otHours > 0) {
          // First 2 hours * 1.34
          const tier1 = Math.min(otHours, 2) * hourlyRate * 1.34;
          // Next 2 hours * 1.67
          const tier2 = Math.max(0, otHours - 2) * hourlyRate * 1.67;
          otPay = Math.round(tier1 + tier2);
          items.push({ name: '加班費 (Overtime)', amount: otPay, type: 'earning', note: `平日加班 ${otHours}hr (前2h*1.34, 後2h*1.67)` });
      }

      // 3. Leave Deduction (LSA Art. 43)
      // Mock: 1 day of Sick Leave (Half pay)
      const sickLeaveHours = 8;
      const sickDeduction = Math.round(sickLeaveHours * hourlyRate * 0.5); // 0.5 deduction
      if (sickDeduction > 0) {
          items.push({ name: '病假扣款 (Sick Leave)', amount: -sickDeduction, type: 'deduction', note: '半薪扣除' });
      }

      // 4. Insurance (Mock Rates)
      const laborIns = Math.round(baseSalary * 0.02); // Mock 2%
      const healthIns = Math.round(baseSalary * 0.015); // Mock 1.5%
      items.push({ name: '勞保自付額', amount: -laborIns, type: 'deduction' });
      items.push({ name: '健保自付額', amount: -healthIns, type: 'deduction' });

      // Final Calc
      const totalEarnings = items.filter(i => i.type === 'earning').reduce((acc, c) => acc + c.amount, 0);
      const totalDeductions = items.filter(i => i.type === 'deduction').reduce((acc, c) => acc + c.amount, 0); // negative values

      return {
          user_id: userId,
          period,
          base_salary: baseSalary,
          allowances: meal + position,
          overtime_pay: otPay,
          leave_deduction: sickDeduction,
          gross_pay: totalEarnings,
          insurance_deduction: Math.abs(laborIns + healthIns),
          net_pay: totalEarnings + totalDeductions,
          items
      };
  },

  // --- FUNC_HR_03: Project Cost Accounting & Reporting ---
  
  // Logic: Generate Aggregate Monthly Report (Full Detail)
  generateMonthlyCostReport: async (period: string): Promise<MonthlyCostReport> => {
      await delay(1200); // Simulate heavier calculation
      
      let totalCost = 0;
      const projectCostMap: Record<string, number> = {};
      const userStatsMap: Record<string, any> = {};
      
      // Detailed Map for Drill-down
      const projectDetailMap: Record<string, {
          projectId: string;
          projectName: string;
          totalCost: number;
          totalHours: number;
          tasks: ProjectTaskCost[]; // Monthly
          cumulativePersonMap: Record<string, ProjectPersonCost>; // Helper map
          cumulativeCost: number;
          cumulativeHours: number;
      }> = {};

      // Mock Iteration: Go through tasks to simulate "Work Log" data
      MOCK_TASKS.forEach(task => {
          if (task.assignee_id && task.status === 'Done') {
              const hours = projectService.parseTimeSpent(task.time_spent);
              
              // Find User Salary
              const userEmail = Object.keys(MOCK_USERS).find(email => MOCK_USERS[email].id === task.assignee_id);
              const user = userEmail ? MOCK_USERS[userEmail] : null;
              
              let cost = 0;
              if (user && user.salary) {
                  const hourlyRate = user.salary / 160; 
                  cost = hours * hourlyRate;
              }

              // Init Project Map Entry
              if (!projectDetailMap[task.project_id]) {
                  const project = MOCK_PROJECTS.find(p => p.id === task.project_id);
                  projectDetailMap[task.project_id] = {
                      projectId: task.project_id,
                      projectName: project ? project.name : task.project_id,
                      totalCost: 0,
                      totalHours: 0,
                      tasks: [],
                      cumulativePersonMap: {},
                      cumulativeCost: 0,
                      cumulativeHours: 0
                  };
              }

              // 1. Add to Cumulative Person Data (Simulate all Done tasks as history)
              const assigneeId = task.assignee_id!;
              const assigneeName = user ? user.name : 'Unknown';
              const pDetail = projectDetailMap[task.project_id];

              pDetail.cumulativeCost += cost;
              pDetail.cumulativeHours += hours;

              if (!pDetail.cumulativePersonMap[assigneeId]) {
                  pDetail.cumulativePersonMap[assigneeId] = {
                      userId: assigneeId,
                      userName: assigneeName,
                      totalHours: 0,
                      totalCost: 0,
                      efficiencyRate: 100
                  };
              }
              pDetail.cumulativePersonMap[assigneeId].totalHours += hours;
              pDetail.cumulativePersonMap[assigneeId].totalCost += cost;

              // 2. Add to Monthly Lists (Mock Logic: Treat all done tasks as monthly for this demo, 
              // or filter a subset. For "Total Cost" consistency in report, let's use all.)
              
              // 3. Aggregate Monthly Summary
              if (!projectCostMap[task.project_id]) projectCostMap[task.project_id] = 0;
              projectCostMap[task.project_id] += cost;
              totalCost += cost;

              // 4. Aggregate User Stats (KPI)
              if (!userStatsMap[task.assignee_id]) {
                  userStatsMap[task.assignee_id] = {
                      userId: task.assignee_id,
                      userName: user ? user.name : 'Unknown',
                      totalHours: 0,
                      tasksCompleted: 0,
                      tasksTotal: 0,
                      costContribution: 0
                  };
              }
              userStatsMap[task.assignee_id].totalHours += hours;
              userStatsMap[task.assignee_id].tasksCompleted += 1;
              userStatsMap[task.assignee_id].tasksTotal += 1; 
              userStatsMap[task.assignee_id].costContribution += cost;

              // 5. Add to Monthly Detailed List
              pDetail.totalCost += cost;
              pDetail.totalHours += hours;
              pDetail.tasks.push({
                  taskId: task.key,
                  taskTitle: task.title,
                  assigneeName: user ? user.name : 'Unknown',
                  hours: hours,
                  cost: Math.round(cost)
              });
          }
      });

      // Enhance Cumulative with Mock Historical Data
      Object.values(projectDetailMap).forEach(pd => {
          // Generate dummy historical data grouped by a Legacy User
          const legacyUserId = 'legacy-user-001';
          const mockCost = 150000; // Large amount for history
          const mockHours = 300;

          pd.cumulativeCost += mockCost;
          pd.cumulativeHours += mockHours;

          if (!pd.cumulativePersonMap[legacyUserId]) {
              pd.cumulativePersonMap[legacyUserId] = {
                  userId: legacyUserId,
                  userName: 'Legacy Contributor (Previous Phases)',
                  totalHours: 0,
                  totalCost: 0,
                  efficiencyRate: 100
              };
          }
          pd.cumulativePersonMap[legacyUserId].totalHours += mockHours;
          pd.cumulativePersonMap[legacyUserId].totalCost += mockCost;
      });

      // Prepare Breakdown Arrays
      const projectBreakdown = Object.entries(projectCostMap).map(([pid, cost]) => {
          const project = MOCK_PROJECTS.find(p => p.id === pid);
          return {
              projectName: project ? project.name : pid,
              cost: Math.round(cost),
              percentage: totalCost > 0 ? parseFloat(((cost / totalCost) * 100).toFixed(1)) : 0
          };
      });

      const teamPerformance = Object.values(userStatsMap).map((u: any) => ({
          ...u,
          efficiencyRate: 100, // Mock
          costContribution: Math.round(u.costContribution)
      }));

      // Prepare Detailed Array with Person grouping
      const projectDetails: ProjectMonthlyDetail[] = Object.values(projectDetailMap).map(pd => ({
          projectId: pd.projectId,
          projectName: pd.projectName,
          totalCost: Math.round(pd.totalCost),
          totalHours: parseFloat(pd.totalHours.toFixed(1)),
          tasks: pd.tasks,
          cumulativeCost: Math.round(pd.cumulativeCost),
          cumulativeHours: parseFloat(pd.cumulativeHours.toFixed(1)),
          cumulativePersonCosts: Object.values(pd.cumulativePersonMap) // Convert map to array
      }));

      return {
          period,
          generatedAt: new Date().toLocaleString(),
          totalCost: Math.round(totalCost),
          projectBreakdown,
          teamPerformance,
          projectDetails
      };
  },

  // Logic: Distribute Salary Costs to Projects (High Level Transactions for Preview)
  distributeProjectCost: async (period: string): Promise<CostTransaction[]> => {
      // Reuse the report generator to get the data
      const report = await hrService.generateMonthlyCostReport(period);
      
      const [year, month] = period.split('-');
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const periodStr = `${year}/${month}/01 ~ ${year}/${month}/${lastDay}`;

      // Convert Breakdown to Transaction Entries
      return report.projectBreakdown.map((pb, index) => ({
          id: `ctx-${period}-${index + 1}`,
          project_id: pb.projectName, // Requirement: "Project Name"
          category: pb.projectName,   // UI uses category as name display
          amount: pb.cost,
          date: periodStr,            // Requirement: "Calculation Period"
          description: `Month End Allocation (${pb.percentage}%)`
      }));
  },

  // Logic: Save Report as Document
  saveMonthlyCostReportDocument: async (report: MonthlyCostReport, userId: string): Promise<Document> => {
      await delay(800);
      const now = new Date().toISOString().split('T')[0];
      const formatCurrency = (n: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n);

      let content = `# 專案成本分攤月報表 (Project Cost Report)\n\n`;
      content += `> 此報表包含敏感財務資訊，請密件處理。\n\n`;
      content += `**計算區間 (Period):** ${report.period}\n`;
      content += `**生成時間 (Generated):** ${report.generatedAt}\n\n`;
      
      content += `## 1. 專案成本佔比 (Cost Breakdown)\n\n`;
      content += `| 專案名稱 (Project) | 分攤成本 (Allocated Cost) | 佔比 (%) |\n|---|---|---|\n`;
      report.projectBreakdown.forEach(p => {
          content += `| **${p.projectName}** | ${formatCurrency(p.cost)} | ${p.percentage}% |\n`;
      });
      content += `| **總計 (Total)** | **${formatCurrency(report.totalCost)}** | **100%** |\n\n`;

      content += `## 2. 團隊績效與工作量 (Team KPI)\n\n`;
      content += `| 成員 (Member) | 工時 (Hours) | 任務數 (Tasks) | 達成率 (KPI) | 成本貢獻 (Cost) |\n|---|---|---|---|---|\n`;
      report.teamPerformance.forEach(u => {
          content += `| ${u.userName} | ${u.totalHours.toFixed(1)} h | ${u.tasksCompleted} | ${u.efficiencyRate}% | ${formatCurrency(u.costContribution)} |\n`;
      });
      content += `\n`;

      content += `## 3. 各專案月明細與累計 (Monthly & Cumulative Details)\n\n`;
      
      report.projectDetails.forEach(pd => {
          content += `### 📂 ${pd.projectName}\n`;
          content += `- **本月成本:** ${formatCurrency(pd.totalCost)} (${pd.totalHours} h)\n`;
          content += `- **累計成本 (YTD):** ${formatCurrency(pd.cumulativeCost)} (${pd.cumulativeHours} h)\n\n`;
          
          content += `#### 本月任務明細 (Monthly Tasks):\n`;
          content += `| 任務 (Task) | 負責人 (Assignee) | 工時 | 成本 |\n|---|---|---|---|\n`;
          pd.tasks.forEach(t => {
              content += `| ${t.taskId} ${t.taskTitle} | ${t.assigneeName} | ${t.hours}h | ${formatCurrency(t.cost)} |\n`;
          });
          
          content += `\n#### 專案累計明細 (Cumulative by Person):\n`;
          content += `| 負責人 (Assignee) | 累計工時 (Total Hours) | 累計成本 (Total Cost) |\n|---|---|---|\n`;
          pd.cumulativePersonCosts.forEach(p => {
              content += `| ${p.userName} | ${p.totalHours}h | ${formatCurrency(p.totalCost)} |\n`;
          });

          content += `\n---\n\n`;
      });

      const newDoc: Document = {
          id: 'hr-doc-cost-' + Date.now(),
          project_id: 'sys-hr-center', 
          name: `專案成本分攤報表 - ${report.period}`,
          type: 'HR_CostReport',
          url: '#',
          content: content,
          version: 'v1.0',
          created_at: now,
          updated_at: now,
          author_id: userId,
          last_modified_by_id: userId,
          ai_summary: 'System Generated Monthly Cost Allocation Report including detailed breakdown.'
      };
      MOCK_DOCS.push(newDoc);
      return newDoc;
  },

  // --- HR Document Management ---
  
  getHRDocuments: async (): Promise<Document[]> => {
      await delay(400);
      // Filter for HR types in the global doc repo
      return MOCK_DOCS.filter(d => 
          d.type.startsWith('HR_') || d.type === 'Other' // Include 'Other' if associated with HR logic? better to strict filter
          && d.project_id === 'sys-hr-center' // Virtual Project for HR
      );
  },

  saveCostReport: async (transaction: CostTransaction, userId: string): Promise<Document> => {
      // Legacy method kept for interface compatibility if needed, but we prefer saveMonthlyCostReportDocument
      return hrService.saveMonthlyCostReportDocument({
          period: transaction.date,
          generatedAt: new Date().toLocaleString(),
          totalCost: transaction.amount,
          projectBreakdown: [],
          teamPerformance: [],
          projectDetails: []
      }, userId);
  }
};