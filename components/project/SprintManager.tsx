
import React, { useState, useEffect } from 'react';
import { Sprint, Task, User, SprintSettings, SprintReviewReport } from '../../types';
import { Calendar, PlayCircle, CheckCircle, PieChart, ChevronDown, ChevronUp, AlertCircle, Clock, AlertTriangle, TrendingUp, DollarSign, Activity, Loader2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

interface SprintManagerProps {
  sprints: Sprint[];
  tasks: Task[];
  users: Record<string, User>;
  onTaskClick: (task: Task) => void;
  refreshSprints: () => void;
}

export const SprintManager: React.FC<SprintManagerProps> = ({ sprints, tasks, users, onTaskClick, refreshSprints }) => {
  const { user: currentUser } = useAuth();
  const [activeStatFilter, setActiveStatFilter] = useState<'all' | 'done' | 'pending' | null>(null);
  const [settings, setSettings] = useState<SprintSettings | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  
  // Alert State
  const [overdueSprint, setOverdueSprint] = useState<Sprint | null>(null);
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReport, setReviewReport] = useState<SprintReviewReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isClosingSprint, setIsClosingSprint] = useState(false);

  useEffect(() => {
    projectService.getSprintSettings().then(setSettings);
    // Check for unclosed sprints
    projectService.checkSprintHealth().then(res => {
        if (res.hasUnclosedSprint && res.sprint) {
            setOverdueSprint(res.sprint);
        } else {
            setOverdueSprint(null);
        }
    });
  }, [sprints]);

  const handleDurationChange = async (weeks: number) => {
      if (!settings) return;
      const newSettings = { ...settings, duration_weeks: weeks };
      setSettings(newSettings); // Optimistic UI
      setIsUpdatingSettings(true);
      try {
          await projectService.updateSprintSettings(newSettings);
          refreshSprints(); // Reload sprints to see the new auto-generated ones
      } catch (e) {
          console.error(e);
      } finally {
          setIsUpdatingSettings(false);
      }
  };

  const handleOpenReview = async () => {
      const activeSprint = sprints.find(s => s.status === 'Active');
      if (!activeSprint) return;
      
      setShowReviewModal(true);
      setIsGeneratingReport(true);
      try {
          const report = await projectService.generateSprintReview(activeSprint.id);
          setReviewReport(report);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingReport(false);
      }
  };

  const handleCloseSprint = async () => {
      if (!reviewReport || !currentUser || !sprints) return;
      const activeSprint = sprints.find(s => s.status === 'Active');
      if (!activeSprint) return;

      setIsClosingSprint(true);
      try {
          // 1. Call Service to close sprint, active next, and save doc
          await projectService.closeSprint(activeSprint.id, reviewReport, currentUser.id);
          
          alert(`Sprint ${activeSprint.name} 已結算完成！\n報表已存入「文件資料庫 > Sprint Report」。\n系統已自動切換至下一個 Sprint。`);
          
          setShowReviewModal(false);
          refreshSprints(); // Update Dashboard state
      } catch (e) {
          console.error("Failed to close sprint", e);
          alert("結算失敗，請稍後再試");
      } finally {
          setIsClosingSprint(false);
      }
  };

  const activeSprint = sprints.find(s => s.status === 'Active');
  
  // Calculate stats for active sprint
  const activeTasks = tasks.filter(t => t.sprint_id === activeSprint?.id);
  const completedTasks = activeTasks.filter(t => t.status === 'Done');
  const pendingTasks = activeTasks.filter(t => t.status !== 'Done');
  const completionRate = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;

  // Filter for Drill-down list
  const drillDownTasks = activeStatFilter === 'all' ? activeTasks :
                         activeStatFilter === 'done' ? completedTasks :
                         activeStatFilter === 'pending' ? pendingTasks : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Alert Banner for Overdue Sprint */}
      {overdueSprint && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start justify-between shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 mt-0.5" />
                  <div>
                      <h4 className="font-bold text-red-800">Sprint 結算提醒</h4>
                      <p className="text-sm text-red-700 mt-1">
                          當前 Sprint ({overdueSprint.name}) 的結束日期 ({overdueSprint.end_date}) 已過，但狀態尚未更新為「已完成」。
                          <br />請盡速進行 Sprint Review 並結算，以利系統自動切換至下一週期的 Sprint。
                      </p>
                  </div>
              </div>
              <button 
                onClick={handleOpenReview}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                  立即結算
              </button>
          </div>
      )}

      {/* Active Sprint Control */}
      {activeSprint ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold">{activeSprint.name}</h2>
                        <span className="bg-blue-500 text-blue-50 text-xs px-2 py-1 rounded border border-blue-400 animate-pulse">進行中 (Active)</span>
                    </div>
                    <p className="text-blue-100 text-sm flex items-center gap-2">
                        <Calendar size={14} />
                        {activeSprint.start_date} ~ {activeSprint.end_date}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">完成率</p>
                    <div className="text-4xl font-bold">{completionRate}%</div>
                </div>
            </div>
            
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Sprint 目標</h3>
                    <p className="text-slate-800 text-lg font-medium">{activeSprint.goal}</p>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-4 mb-6">
                    <div className="bg-blue-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                    <button 
                        onClick={() => setActiveStatFilter(activeStatFilter === 'all' ? null : 'all')}
                        className={`text-center p-2 rounded-lg transition-colors ${activeStatFilter === 'all' ? 'bg-slate-100 ring-2 ring-slate-200' : 'hover:bg-slate-50'}`}
                    >
                        <div className="text-2xl font-bold text-slate-700">{activeTasks.length}</div>
                        <div className="text-xs text-slate-500 uppercase flex items-center justify-center gap-1">
                            總任務 {activeStatFilter === 'all' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveStatFilter(activeStatFilter === 'done' ? null : 'done')}
                        className={`text-center p-2 rounded-lg transition-colors ${activeStatFilter === 'done' ? 'bg-green-50 ring-2 ring-green-100' : 'hover:bg-slate-50'}`}
                    >
                        <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                        <div className="text-xs text-slate-500 uppercase flex items-center justify-center gap-1">
                            已完成 {activeStatFilter === 'done' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveStatFilter(activeStatFilter === 'pending' ? null : 'pending')}
                        className={`text-center p-2 rounded-lg transition-colors ${activeStatFilter === 'pending' ? 'bg-orange-50 ring-2 ring-orange-100' : 'hover:bg-slate-50'}`}
                    >
                        <div className="text-2xl font-bold text-orange-500">{activeTasks.length - completedTasks.length}</div>
                        <div className="text-xs text-slate-500 uppercase flex items-center justify-center gap-1">
                            待辦/進行中 {activeStatFilter === 'pending' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </div>
                    </button>
                </div>

                {/* Drill Down List */}
                {activeStatFilter && (
                    <div className="mt-6 border-t border-slate-100 pt-4 animate-fade-in">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                             {activeStatFilter === 'all' && '所有任務清單'}
                             {activeStatFilter === 'done' && '已完成任務'}
                             {activeStatFilter === 'pending' && '待辦任務'}
                             <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 rounded-full">{drillDownTasks.length}</span>
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {drillDownTasks.map(task => (
                                <div 
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-200 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                        <span className="font-mono text-xs text-slate-500">{task.key}</span>
                                        <span className="text-sm text-slate-700 font-medium">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.assignee_id && users[task.assignee_id] && (
                                            <img src={users[task.assignee_id].avatar} className="w-5 h-5 rounded-full" />
                                        )}
                                        <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">{task.status}</span>
                                    </div>
                                </div>
                            ))}
                            {drillDownTasks.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-sm">此分類下無任務</div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                     <button 
                        onClick={handleOpenReview}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                         <CheckCircle size={18} />
                         結算 Sprint (Review)
                     </button>
                </div>
            </div>
        </div>
      ) : (
          <div className="p-8 text-center bg-slate-100 rounded-xl">尚無進行中的 Sprint</div>
      )}

      {/* Future Sprints */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" />
              Sprint 規劃
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {sprints.filter(s => s.status === 'Planned').map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                          <h4 className="font-semibold text-slate-700">{s.name}</h4>
                          <p className="text-xs text-slate-500">{s.start_date} ~ {s.end_date}</p>
                      </div>
                      <div className="text-right">
                           <span className="text-xs text-slate-500 block mb-1">目標</span>
                           <span className="text-sm text-slate-800">{s.goal || '尚未設定'}</span>
                      </div>
                      <button className="text-blue-600 text-sm hover:underline flex items-center gap-1 font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                          <PlayCircle size={14} /> 啟動
                      </button>
                  </div>
              ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
             <div className="flex items-start gap-6 bg-slate-50 p-4 rounded-xl">
                 <div className="flex-1">
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Sprint 週期預設 (週)</label>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                            {settings?.duration_weeks} 週
                        </span>
                     </div>
                     <input 
                        type="range" 
                        min="1" 
                        max="4" 
                        step="1" 
                        value={settings?.duration_weeks || 1}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                        disabled={isUpdatingSettings}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                     />
                     <div className="flex justify-between text-xs text-slate-400 px-1 mt-1">
                         <span>1週 (快)</span><span>4週 (穩)</span>
                     </div>
                     <p className="text-xs text-slate-500 mt-2">
                        調整後系統將自動重新生成未來一年的預排 Sprint (Buffer)。
                        {isUpdatingSettings && <span className="text-blue-600 ml-1 inline-flex items-center gap-1"><Clock size={10} className="animate-spin"/> 更新中...</span>}
                     </p>
                 </div>
                 <div className="border-l border-slate-200 pl-6">
                     <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-100 shadow-sm whitespace-nowrap">
                         + 建立新 Sprint
                     </button>
                 </div>
             </div>
          </div>
      </div>

      {/* Sprint Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
                <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Sprint 結算報表 (Review)</h2>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {activeSprint?.name} • 生成時間: {reviewReport?.generatedAt || 'Generating...'}
                        </p>
                    </div>
                    <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                        <CheckCircle size={24} className="hidden" /> {/* Placeholder */}
                    </button>
                </div>

                {isGeneratingReport || !reviewReport ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-500">
                        <Clock className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                        <p>正在計算 KPI 與 成本數據...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                        {/* 1. Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">總投入工時</p>
                                <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <Clock size={20} className="text-blue-500" />
                                    {reviewReport.totalHours.toFixed(1)} h
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">任務完成率</p>
                                <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <Activity size={20} className={reviewReport.completionRate >= 80 ? 'text-green-500' : 'text-orange-500'} />
                                    {reviewReport.completionRate}%
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">本週專案人力成本累計</p>
                                <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <DollarSign size={20} className="text-yellow-600" />
                                    {formatCurrency(reviewReport.totalCost)}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    (工時 × 員工時薪)
                                </p>
                            </div>
                        </div>

                        {/* 2. Project Cost Breakdown */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <PieChart size={16} /> 專案成本佔比
                            </h3>
                            <div className="space-y-4">
                                {reviewReport.projectBreakdown.map(p => (
                                    <div key={p.projectId}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{p.projectName}</span>
                                            <span className="text-slate-500 font-mono">{formatCurrency(p.cost)} ({p.hours}h)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div 
                                                className="bg-blue-500 h-2 rounded-full" 
                                                style={{ width: `${reviewReport.totalCost > 0 ? (p.cost / reviewReport.totalCost) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Team Performance Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                             <div className="px-6 py-4 border-b border-slate-100">
                                 <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <TrendingUp size={16} /> 團隊績效與工作量 (KPI)
                                 </h3>
                             </div>
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                     <tr>
                                         <th className="px-6 py-3">成員</th>
                                         <th className="px-6 py-3 text-center">工時 (h)</th>
                                         <th className="px-6 py-3 text-center">任務數 (完/總)</th>
                                         <th className="px-6 py-3 text-center">達成率 (KPI)</th>
                                         <th className="px-6 py-3 text-right">成本貢獻</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {reviewReport.teamPerformance.map(u => (
                                         <tr key={u.userId} className="hover:bg-slate-50">
                                             <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                                                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold">
                                                     {u.userName.charAt(0)}
                                                 </div>
                                                 {u.userName}
                                             </td>
                                             <td className="px-6 py-4 text-center">{u.totalHoursLogged}</td>
                                             <td className="px-6 py-4 text-center text-slate-500">
                                                 <span className="text-green-600 font-bold">{u.tasksCompleted}</span> / {u.tasksAssigned}
                                             </td>
                                             <td className="px-6 py-4 text-center">
                                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                     u.efficiencyRate >= 80 ? 'bg-green-100 text-green-700' : 
                                                     u.efficiencyRate >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                                 }`}>
                                                     {u.efficiencyRate}%
                                                 </span>
                                             </td>
                                             <td className="px-6 py-4 text-right font-mono text-slate-600">
                                                 {formatCurrency(u.costContribution)}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>
                    </div>
                )}

                <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button 
                        onClick={() => setShowReviewModal(false)}
                        className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        稍後處理
                    </button>
                    <button 
                        onClick={handleCloseSprint}
                        disabled={isGeneratingReport || isClosingSprint}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isClosingSprint ? (
                            <><Loader2 size={18} className="animate-spin" /> 處理中...</>
                        ) : (
                            <><CheckCircle size={18} /> 確認結算 (Close Sprint)</>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
