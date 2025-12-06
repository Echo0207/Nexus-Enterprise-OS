
import React, { useState, useEffect } from 'react';
import { Document, Project, User } from '../../types';
import { Filter, ChevronRight, Folder, FileText } from 'lucide-react';
import { DocumentList } from './DocumentList';

interface DocumentRepoProps {
  documents: Document[];
  projects: Project[];
  users: Record<string, User>;
  currentUser: User | null;
}

export const DocumentRepo: React.FC<DocumentRepoProps> = ({ documents, projects, users, currentUser }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Virtual Project Definition for Sprint Reports
  // This project exists only in DocumentRepo context, not in global projects
  const sprintReportsProject: Project = {
      id: 'sys-sprint-reports',
      name: 'Sprints 結算報表 (System)',
      stage: 'In Progress',
      manager_id: 'system',
      budget: 0,
      start_date: '2025-01-01',
      target_end_date: '2099-12-31',
      progress: 100,
      description: 'System generated sprint review reports repository.',
      team_members: []
  };

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

  // Toggle Collapse
  const toggleProject = (projectId: string) => {
      setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  // 1. Filter Projects based on Status
  const filteredProjects = projects.filter(p => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return ['Planning', 'In Progress', 'In Delivery'].includes(p.stage);
      if (statusFilter === 'done') return ['Done', 'In Maintenance'].includes(p.stage);
      return p.stage === statusFilter;
  });

  // Check if Virtual Project matches filters
  // It is considered "In Progress" (Active) and contains "Sprint Report" types
  // SECURITY: Only show if user is manager
  const showVirtualProject = 
      isManager &&
      (statusFilter === 'all' || statusFilter === 'active' || statusFilter === 'In Progress') && 
      (typeFilter === 'all' || typeFilter === 'Sprint Report');

  // Filter for Sprint Reports explicitly
  // SECURITY: If not manager, this array should be empty
  const sprintReports = isManager ? documents.filter(d => d.type === 'Sprint Report') : [];

  // Init expanded state
  useEffect(() => {
      const initial: Record<string, boolean> = { [sprintReportsProject.id]: true };
      projects.forEach(p => initial[p.id] = true);
      setExpandedProjects(prev => ({ ...prev, ...initial }));
  }, [projects.length]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-center shrink-0">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <Filter size={20} />
                 </div>
                 <h3 className="font-bold text-slate-700">文件篩選</h3>
             </div>
             
             <div className="h-8 w-[1px] bg-slate-200"></div>

             <div className="flex items-center gap-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">專案狀態</label>
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none"
                 >
                     <option value="all">顯示全部 (All Stages)</option>
                     <option value="active">進行中 (Active)</option>
                     <option value="done">已完成 (Done/Maintenance)</option>
                 </select>
             </div>

             <div className="flex items-center gap-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">文件種類</label>
                 <select 
                   value={typeFilter}
                   onChange={(e) => setTypeFilter(e.target.value)}
                   className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none"
                 >
                     <option value="all">所有種類 (All Types)</option>
                     <option value="Requirements">需求規格 (Requirements)</option>
                     <option value="Design">設計稿 (Design)</option>
                     <option value="Meeting">會議記錄 (Meeting)</option>
                     <option value="Technical">技術文件 (Technical)</option>
                     {isManager && <option value="Sprint Report">Sprint 報表</option>}
                     <option value="Other">其他 (Other)</option>
                 </select>
             </div>
        </div>

        {/* Project Groups List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
            
            {/* Virtual Project: Sprint Reports */}
            {showVirtualProject && (
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    {/* Header - Styled EXACTLY like other projects */}
                    <div 
                        onClick={() => toggleProject(sprintReportsProject.id)}
                        className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-slate-400 transform transition-transform ${expandedProjects[sprintReportsProject.id] ? 'rotate-90' : ''}`}>
                                <ChevronRight size={20} />
                            </span>
                            <div className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600 shadow-sm">
                                <Folder size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">{sprintReportsProject.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="px-2 py-0.5 rounded font-medium border bg-blue-50 text-blue-700 border-blue-100">
                                        In Progress
                                    </span>
                                    <span>• {sprintReports.length} 份文件</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Content */}
                    {expandedProjects[sprintReportsProject.id] && (
                        <div className="p-4 bg-white animate-fade-in">
                             <DocumentList 
                                documents={sprintReports} 
                                users={users} 
                                projectId={sprintReportsProject.id} 
                                hideHeader={true} 
                            />
                        </div>
                    )}
                 </div>
            )}

            {filteredProjects.map(project => {
                // Filter docs for this project AND by type
                const projectDocs = documents.filter(d => {
                    const matchProject = d.project_id === project.id;
                    const matchType = typeFilter === 'all' || d.type === typeFilter;
                    // Exclude sprint reports from regular folders if we are showing them in the virtual folder
                    // SECURITY: Also strictly exclude Sprint Report if not manager
                    const isNotReport = d.type !== 'Sprint Report' || isManager;
                    const isReportInVirtual = d.type === 'Sprint Report';
                    
                    return matchProject && matchType && isNotReport && !isReportInVirtual;
                });

                if (projectDocs.length === 0 && typeFilter !== 'all') return null; // Hide empty projects if filtering

                const isExpanded = expandedProjects[project.id];

                return (
                    <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                        {/* Project Header */}
                        <div 
                          onClick={() => toggleProject(project.id)}
                          className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-slate-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={20} />
                                </span>
                                <div className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600 shadow-sm">
                                    <Folder size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{project.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span className={`px-2 py-0.5 rounded font-medium border ${
                                            project.stage === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            project.stage === 'Done' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {project.stage}
                                        </span>
                                        <span>• {projectDocs.length} 份文件</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                            <div className="p-4 bg-white animate-fade-in">
                                <DocumentList 
                                    documents={projectDocs} 
                                    users={users} 
                                    projectId={project.id} 
                                    hideHeader={true} 
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            
            {filteredProjects.length === 0 && !showVirtualProject && (
                <div className="text-center py-10 text-slate-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    <p>沒有符合條件的專案或文件</p>
                </div>
            )}
        </div>
    </div>
  );
};
