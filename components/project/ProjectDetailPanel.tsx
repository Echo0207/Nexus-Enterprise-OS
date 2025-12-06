
import React, { useState, useEffect } from 'react';
import { Project, Milestone, WeeklyReport, Task, Document, User } from '../../types';
import { X, Calendar, Flag, FileText, CheckSquare, FolderOpen, Target, Users, Clock, ChevronRight, ChevronDown, Edit2, Save, Plus, PlusCircle, MoreHorizontal } from 'lucide-react';
import { DocumentRepo } from './DocumentRepo';
import { DocumentList } from './DocumentList';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

interface ProjectDetailPanelProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  milestones: Milestone[];
  weeklyReports: WeeklyReport[];
  tasks: Task[];
  documents: Document[];
  users: Record<string, User>;
  onProjectUpdate?: (project: Project) => void;
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (task: Partial<Task>) => void;
}

type Tab = 'about' | 'milestones' | 'reports' | 'tasks' | 'docs';

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ 
  project, 
  isOpen, 
  onClose, 
  milestones: initialMilestones, 
  weeklyReports, 
  tasks, 
  documents,
  users,
  onProjectUpdate,
  onTaskClick,
  onCreateTask
}) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('about');
  
  // Local State for Edits
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (project) {
      setEditedProject(JSON.parse(JSON.stringify(project)));
    }
    setLocalMilestones(initialMilestones);
  }, [project, initialMilestones]);

  if (!project || !editedProject) return null;

  // Permission Logic
  const canViewSensitiveDocs = (u: User | null) => {
      if (!u) return false;
      return u.roles.some(r => 
        r.includes('admin') || 
        r.includes('manager') || 
        r.toLowerCase().includes('pm')
      );
  };
  const isManager = canViewSensitiveDocs(currentUser);

  // Filter documents here to prevent non-managers seeing restricted docs in this panel
  const filteredDocuments = documents.filter(d => {
      if (d.type === 'Sprint Report' && !isManager) return false;
      return true;
  });

  const handleSaveAbout = async () => {
      try {
          await projectService.updateProject(editedProject);
          if (onProjectUpdate) onProjectUpdate(editedProject);
          setIsEditingAbout(false);
      } catch (e) {
          console.error("Failed to update project", e);
      }
  };

  const handleMilestoneChange = (id: string, field: keyof Milestone, value: string) => {
      setLocalMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } as Milestone : m));
      // In a real app, you might want to auto-save or have a save button for the list
      // For this mock, we just update local state, ideally we call API
      const m = localMilestones.find(m => m.id === id);
      if (m) {
          projectService.updateMilestone({ ...m, [field]: value } as Milestone);
      }
  };

  const handleAddMilestone = async () => {
      const newMilestone: Milestone = {
          id: 'new_' + Date.now(),
          project_id: project.id,
          title: '新里程碑',
          date: new Date().toISOString().split('T')[0],
          status: 'Pending'
      };
      await projectService.addMilestone(newMilestone);
      setLocalMilestones([...localMilestones, newMilestone]);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         {/* Header */}
         <div className="bg-slate-900 text-white px-6 py-6 shrink-0 flex justify-between items-start relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full opacity-10 transform translate-x-1/3 -translate-y-1/2 blur-3xl"></div>
             
             <div className="z-10">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="px-2 py-0.5 bg-blue-600/30 border border-blue-500/50 rounded text-xs font-mono text-blue-100">
                        {project.id}
                     </div>
                     <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                        {project.stage}
                     </span>
                 </div>
                 <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
                 <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                    <Calendar size={14} />
                    {project.start_date} ~ {project.target_end_date}
                 </p>
             </div>
             
             <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
                 <X size={20} className="text-white" />
             </button>
         </div>

         {/* Navigation Tabs */}
         <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
             {[
                 { id: 'about', label: 'About This Project', icon: <Target size={16}/> },
                 { id: 'milestones', label: 'Milestones', icon: <Flag size={16}/> },
                 { id: 'reports', label: 'Weekly Report', icon: <FileText size={16}/> },
                 { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16}/> },
                 { id: 'docs', label: 'Documents', icon: <FolderOpen size={16}/> }
             ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'border-blue-600 text-blue-700 bg-white' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                 >
                     {tab.icon}
                     {tab.label}
                 </button>
             ))}
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8">
             {activeTab === 'about' && (
                 <div className="space-y-6 max-w-3xl mx-auto">
                     <div className="flex justify-end">
                         {isEditingAbout ? (
                             <button 
                                onClick={handleSaveAbout}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                             >
                                 <Save size={16} /> 儲存設定
                             </button>
                         ) : (
                             <button 
                                onClick={() => setIsEditingAbout(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                             >
                                 <Edit2 size={16} /> 編輯專案資訊
                             </button>
                         )}
                     </div>

                     <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <FileText size={20} className="text-blue-500" /> 專案描述
                         </h3>
                         {isEditingAbout ? (
                             <textarea 
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={4}
                                value={editedProject.description}
                                onChange={(e) => setEditedProject({...editedProject, description: e.target.value})}
                             />
                         ) : (
                             <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                 {editedProject.description}
                             </p>
                         )}
                     </section>

                     <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <Target size={20} className="text-red-500" /> 專案目標
                         </h3>
                         {isEditingAbout ? (
                             <textarea 
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={2}
                                value={editedProject.goal || ''}
                                onChange={(e) => setEditedProject({...editedProject, goal: e.target.value})}
                             />
                         ) : (
                             <p className="text-slate-600 leading-relaxed bg-red-50/50 p-4 rounded-lg border border-red-100">
                                 {editedProject.goal || '尚無設定目標'}
                             </p>
                         )}
                     </section>

                     <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <Users size={20} className="text-purple-500" /> 成員清單
                         </h3>
                         {isEditingAbout ? (
                             <div className="space-y-2">
                                 <p className="text-xs text-slate-400 mb-2">勾選參與此專案的成員：</p>
                                 <div className="grid grid-cols-2 gap-2">
                                    {Object.values(users).map(u => (
                                        <label key={u.id} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={editedProject.team_members?.includes(u.id)}
                                                onChange={(e) => {
                                                    const current = editedProject.team_members || [];
                                                    const updated = e.target.checked 
                                                        ? [...current, u.id]
                                                        : current.filter(id => id !== u.id);
                                                    setEditedProject({...editedProject, team_members: updated});
                                                }}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{u.name}</span>
                                        </label>
                                    ))}
                                 </div>
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {editedProject.team_members?.map(uid => {
                                     const member = users[uid];
                                     if (!member) return null;
                                     return (
                                         <div key={uid} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                             <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                                             <div>
                                                 <div className="font-semibold text-slate-800">{member.name}</div>
                                                 <div className="text-xs text-slate-500">{member.department.name} • {member.roles.join(', ')}</div>
                                             </div>
                                         </div>
                                     );
                                 })}
                                 {!editedProject.team_members && <p className="text-slate-400">未設定成員</p>}
                             </div>
                         )}
                     </section>
                 </div>
             )}

             {activeTab === 'milestones' && (
                 <div className="max-w-3xl mx-auto space-y-4">
                     <div className="flex justify-end mb-4">
                         <button 
                           onClick={handleAddMilestone}
                           className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                         >
                             <PlusCircle size={16} /> 新增里程碑
                         </button>
                     </div>
                     <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-4">
                         {localMilestones.map((ms) => (
                             <div key={ms.id} className="relative pl-8 group">
                                 <div className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 bg-white ${
                                     ms.status === 'Completed' ? 'border-green-500 bg-green-500' : 
                                     ms.status === 'Delayed' ? 'border-red-500 bg-red-500' : 'border-slate-300'
                                 }`}></div>
                                 
                                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-3 gap-4">
                                         <input 
                                            type="text" 
                                            value={ms.title}
                                            onChange={(e) => handleMilestoneChange(ms.id, 'title', e.target.value)}
                                            className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none flex-1"
                                         />
                                         <select 
                                            value={ms.status}
                                            onChange={(e) => handleMilestoneChange(ms.id, 'status', e.target.value)}
                                            className={`px-2 py-1 rounded text-xs font-medium border-none focus:ring-0 cursor-pointer ${
                                                ms.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                ms.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                            }`}
                                         >
                                             <option value="Pending">Pending</option>
                                             <option value="Completed">Completed</option>
                                             <option value="Delayed">Delayed</option>
                                         </select>
                                     </div>
                                     <div className="text-sm text-slate-500 flex items-center gap-2">
                                         <Calendar size={14} />
                                         <input 
                                            type="date"
                                            value={ms.date}
                                            onChange={(e) => handleMilestoneChange(ms.id, 'date', e.target.value)}
                                            className="bg-transparent border-none p-0 text-slate-500 text-sm focus:ring-0"
                                         />
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {activeTab === 'reports' && (
                 <div className="max-w-3xl mx-auto space-y-4">
                     <div className="flex justify-end">
                         <button className="flex items-center gap-1 text-sm bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700">
                             <Plus size={16} /> 產生週報
                         </button>
                     </div>
                     {weeklyReports.map(report => (
                         <div key={report.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <h4 className="font-bold text-lg text-slate-800">{report.week} Report</h4>
                                     <p className="text-xs text-slate-400">Created: {report.created_at}</p>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-2xl font-bold text-blue-600">{report.completion_rate}%</div>
                                     <div className="text-xs text-slate-500">Completion Rate</div>
                                 </div>
                             </div>
                             
                             <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed border border-slate-100">
                                 {report.summary}
                             </div>
                         </div>
                     ))}
                     {weeklyReports.length === 0 && (
                         <div className="text-center py-10 text-slate-400">
                             <FileText size={48} className="mx-auto mb-2 opacity-20" />
                             <p>尚無週報記錄</p>
                         </div>
                     )}
                 </div>
             )}

             {activeTab === 'tasks' && (
                 <div className="max-w-4xl mx-auto">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-700">專案任務清單</h3>
                        <button 
                           onClick={() => onCreateTask && onCreateTask({ project_id: project.id })}
                           className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                        >
                             <Plus size={16} /> 新增任務
                        </button>
                     </div>
                     
                     {/* Notion-like Tree View */}
                     <div className="space-y-2">
                         <TaskTree 
                            tasks={tasks} 
                            users={users} 
                            onTaskClick={onTaskClick || (() => {})}
                            onCreateTask={onCreateTask}
                            projectId={project.id}
                         />
                     </div>
                 </div>
             )}

             {activeTab === 'docs' && (
                 <div className="max-w-5xl mx-auto">
                     <DocumentList documents={filteredDocuments} users={users} />
                 </div>
             )}
         </div>
      </div>
    </>
  );
};

// --- Helper Components for Task Tree ---

const TaskTree = ({ tasks, users, onTaskClick, onCreateTask, projectId }: { tasks: Task[], users: Record<string, User>, onTaskClick: (t: Task) => void, onCreateTask?: (t: Partial<Task>) => void, projectId: string }) => {
    // 1. Identify Root Tasks (No parent)
    const rootTasks = tasks.filter(t => !t.parent_task_id);

    return (
        <div className="flex flex-col gap-2">
            {rootTasks.map(task => (
                <TaskItem 
                    key={task.id} 
                    task={task} 
                    allTasks={tasks} 
                    users={users}
                    onTaskClick={onTaskClick}
                    onCreateTask={onCreateTask}
                />
            ))}
            {rootTasks.length === 0 && <div className="text-slate-400 text-center py-4">暫無任務</div>}
        </div>
    );
};

const TaskItem = ({ task, allTasks, users, onTaskClick, onCreateTask }: { task: Task, allTasks: Task[], users: Record<string, User>, onTaskClick: (t: Task) => void, onCreateTask?: (t: Partial<Task>) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Find children
    const children = allTasks.filter(t => t.parent_task_id === task.id);
    const hasChildren = children.length > 0;
    const assignee = task.assignee_id ? users[task.assignee_id] : null;

    const statusColors: Record<string, string> = {
        'Done': 'bg-green-100 text-green-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'To Do': 'bg-slate-100 text-slate-700',
        'Code Review': 'bg-purple-100 text-purple-700',
        'In Test': 'bg-orange-100 text-orange-700',
        'Backlog': 'bg-slate-100 text-slate-400',
    };

    const priorityColors: Record<string, string> = {
        'High': 'text-red-500',
        'Medium': 'text-orange-500',
        'Low': 'text-blue-500',
    };

    return (
        <div className="group">
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors group">
                {/* Toggle Button */}
                <button 
                   onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                   className={`p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Task Card Content (Mini version of Scrum Card) */}
                <div 
                    onClick={() => onTaskClick(task)}
                    className="flex-1 flex items-center justify-between cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                         <span className="text-xs font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">{task.key}</span>
                         <span className="font-medium text-slate-700 text-sm">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Priority Dot */}
                        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || 'bg-slate-300'}`} title={`Priority: ${task.priority}`}></div>
                        
                        {/* Status Badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[task.status] || 'bg-slate-100'}`}>
                            {task.status}
                        </span>

                        {/* Assignee Avatar */}
                        {assignee ? (
                            <img src={assignee.avatar} className="w-5 h-5 rounded-full border border-slate-200" title={assignee.name} />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-500">?</div>
                        )}

                        {/* Add Subtask Button */}
                        <button 
                            className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Add Sub-task"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (onCreateTask) onCreateTask({ project_id: task.project_id, parent_task_id: task.id, title: '新子任務' });
                                setIsExpanded(true); // Auto expand to show new child
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Nested Children */}
            {isExpanded && hasChildren && (
                <div className="pl-6 ml-3 border-l border-slate-200 mt-1 space-y-1">
                    {children.map(child => (
                        <TaskItem 
                            key={child.id} 
                            task={child} 
                            allTasks={allTasks} 
                            users={users} 
                            onTaskClick={onTaskClick}
                            onCreateTask={onCreateTask}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
