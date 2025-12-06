
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { Project, Task, Sprint, Document, Milestone, WeeklyReport, User } from '../types';
import { authService } from '../services/authService';

// Sub Components
import { ScrumBoard } from '../components/project/ScrumBoard';
import { ProjectKanban } from '../components/project/ProjectKanban';
import { TaskTable } from '../components/project/TaskTable';
import { DocumentRepo } from '../components/project/DocumentRepo';
import { SprintManager } from '../components/project/SprintManager';
import { TaskDetailPanel } from '../components/project/TaskDetailPanel';
import { ProjectDetailPanel } from '../components/project/ProjectDetailPanel';
import { LayoutDashboard, List, CheckSquare, FolderOpen, Timer, Loader2 } from 'lucide-react';

type Tab = 'scrum' | 'projects' | 'tasks' | 'docs' | 'sprint';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('scrum');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  
  // Side Panel Data State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);

  // UI State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const initData = async () => {
       try {
         const [p, t, s, d, u] = await Promise.all([
             projectService.getProjects(),
             projectService.getTasks(),
             projectService.getSprints(),
             projectService.getDocuments(),
             authService.getMe().catch(() => ({})), // Just to trigger mock, actually we need a user map
         ]);
         
         // Mock User Map construction for UI display
         // In real app, this comes from an API
         const mockUserMap: Record<string, any> = {
            'uuid-000': { id: 'uuid-000', name: 'System Admin', avatar: 'https://picsum.photos/200', roles: ['admin'], department: {name: 'IT'} },
            'uuid-001': { id: 'uuid-001', name: 'Alice (HR/PM)', avatar: 'https://picsum.photos/201', roles: ['hr_manager'], department: {name: 'HR'} },
            'uuid-002': { id: 'uuid-002', name: 'Bob (Dev)', avatar: 'https://picsum.photos/202', roles: ['staff'], department: {name: 'IT'} },
         };
         
         setProjects(p);
         setTasks(t);
         setSprints(s);
         setDocs(d);
         setUsersMap(mockUserMap);
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    };

  useEffect(() => {
    initData();
  }, []);

  // Update: Refresh both Sprints (for status) and Docs (for new report)
  const refreshData = async () => {
      try {
        const [s, d] = await Promise.all([
            projectService.getSprints(),
            projectService.getDocuments()
        ]);
        setSprints(s);
        setDocs(d);
      } catch (e) {
        console.error("Failed to refresh data", e);
      }
  };

  // Handlers
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
      // Optimistic Update
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t);
      setTasks(updatedTasks);
      await projectService.updateTaskStatus(taskId, newStatus as any);
  };

  const handleProjectStageChange = async (projectId: string, newStage: string) => {
      const updatedProjects = projects.map(p => p.id === projectId ? { ...p, stage: newStage as any } : p);
      setProjects(updatedProjects);
      await projectService.updateProjectStage(projectId, newStage as any);
  };

  const handleMoveTaskSprint = async (taskId: string, newSprintId: string, reason: string, blamedUserId: string) => {
      await projectService.moveTaskSprint(taskId, newSprintId, reason, blamedUserId);
      // Reload Tasks to reflect change
      const t = await projectService.getTasks();
      setTasks(t);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
      setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      setSelectedTask(updatedTask); // Update selected task in case it's still open
  };

  const handleCreateTask = async (partialTask: Partial<Task>) => {
      try {
          const newTask = await projectService.createTask(partialTask);
          setTasks(prev => [...prev, newTask]);
          setSelectedTask(newTask); // Open the newly created task
      } catch (e) {
          console.error("Failed to create task", e);
      }
  };

  const handleProjectClick = async (project: Project) => {
      setSelectedProject(project);
      try {
          // Fetch additional project details on demand
          const [m, r] = await Promise.all([
              projectService.getMilestones(project.id),
              projectService.getWeeklyReports(project.id)
          ]);
          setMilestones(m);
          setWeeklyReports(r);
      } catch (e) {
          console.error("Failed to load project details", e);
      }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
  };

  // Permission Logic
  const canManageSprints = (u: User | null) => {
      if (!u) return false;
      return u.roles.some(r => 
        r.includes('admin') || 
        r.includes('manager') || 
        r.toLowerCase().includes('pm')
      );
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-600" /></div>;

  const activeSprintId = sprints.find(s => s.status === 'Active')?.id || '';
  const showSprintTab = canManageSprints(user);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Tabs */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-1">
        <div className="flex space-x-1">
          <TabButton id="scrum" label="Scrum 戰情板" icon={<LayoutDashboard size={16}/>} active={activeTab} onClick={setActiveTab} />
          <TabButton id="projects" label="專案清單" icon={<List size={16}/>} active={activeTab} onClick={setActiveTab} />
          <TabButton id="tasks" label="任務管理" icon={<CheckSquare size={16}/>} active={activeTab} onClick={setActiveTab} />
          <TabButton id="docs" label="文件資料庫" icon={<FolderOpen size={16}/>} active={activeTab} onClick={setActiveTab} />
          {showSprintTab && (
            <TabButton id="sprint" label="Sprint 管理" icon={<Timer size={16}/>} active={activeTab} onClick={setActiveTab} />
          )}
        </div>
        <div className="text-xs text-slate-400 pb-2">
            當前 Sprint: <span className="font-semibold text-slate-600">{sprints.find(s => s.status === 'Active')?.name}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
          {activeTab === 'scrum' && (
              <ScrumBoard 
                tasks={tasks.filter(t => t.sprint_id === activeSprintId)} 
                projects={projects}
                users={usersMap}
                onStatusChange={handleTaskStatusChange}
                onTaskClick={setSelectedTask}
              />
          )}

          {activeTab === 'projects' && (
              <ProjectKanban 
                projects={projects}
                currentUser={user}
                onProjectClick={handleProjectClick}
                onStageChange={handleProjectStageChange}
              />
          )}

          {activeTab === 'tasks' && (
              <TaskTable 
                tasks={tasks} 
                sprints={sprints}
                users={usersMap as any}
                activeSprintId={activeSprintId}
                onMoveTaskSprint={handleMoveTaskSprint}
                onTaskClick={setSelectedTask}
              />
          )}

          {activeTab === 'docs' && (
              <DocumentRepo 
                documents={docs} 
                projects={projects}
                users={usersMap as any}
                currentUser={user} // Pass current user for permission checks inside Repo
              />
          )}

          {activeTab === 'sprint' && showSprintTab && (
              <SprintManager 
                sprints={sprints} 
                tasks={tasks} 
                users={usersMap as any} 
                onTaskClick={setSelectedTask}
                refreshSprints={refreshData} // Pass the new refresh function
              />
          )}
      </div>

      {/* Side Panels */}
      
      {/* Task Detail Panel (Rendered first but higher z-index in CSS) */}
      <TaskDetailPanel 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        projects={projects}
        sprints={sprints}
        users={usersMap as any}
        tasks={tasks} // Pass full tasks for relationship linking
        onTaskClick={setSelectedTask} // Allow navigation
      />

      {/* Project Detail Panel */}
      <ProjectDetailPanel
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onProjectUpdate={handleProjectUpdate}
        onTaskClick={setSelectedTask}
        onCreateTask={handleCreateTask}
        milestones={milestones}
        weeklyReports={weeklyReports}
        tasks={selectedProject ? tasks.filter(t => t.project_id === selectedProject.id) : []}
        documents={selectedProject ? docs.filter(d => d.project_id === selectedProject.id) : []}
        users={usersMap as any}
      />
    </div>
  );
};

const TabButton = ({ id, label, icon, active, onClick }: { id: Tab, label: string, icon: any, active: string, onClick: any }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
        active === id 
          ? 'bg-white text-blue-600 border-blue-600' 
          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
);
