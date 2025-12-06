
import React from 'react';
import { Project, User } from '../../types';
import { Calendar, ChevronRight, Lock } from 'lucide-react';

interface ProjectKanbanProps {
  projects: Project[];
  currentUser: User | null;
  onProjectClick: (project: Project) => void;
  onStageChange: (projectId: string, newStage: string) => void;
}

const STAGES = ['Planning', 'In Progress', 'In Delivery', 'In Maintenance', 'Done'];

export const ProjectKanban: React.FC<ProjectKanbanProps> = ({ projects, currentUser, onProjectClick, onStageChange }) => {

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    onStageChange(projectId, stage);
  };

  const canViewBudget = (project: Project) => {
    if (!currentUser) return false;
    return currentUser.roles.includes('admin') || currentUser.id === project.manager_id;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="h-full overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-[1200px] h-full">
        {STAGES.map(stage => (
          <div 
            key={stage} 
            className="flex-1 min-w-[280px] bg-slate-100 rounded-xl flex flex-col max-h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="p-3 border-b border-slate-200/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">{stage}</h3>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {projects.filter(p => p.stage === stage).length}
              </span>
            </div>
            
            <div className="p-3 space-y-3 overflow-y-auto flex-1">
              {projects.filter(p => p.stage === stage).map(project => (
                <div 
                  key={project.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  onClick={() => onProjectClick(project)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all group"
                >
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{project.name}</h4>
                     <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                   </div>
                   
                   <p className="text-xs text-slate-500 mb-4 line-clamp-2 h-8">{project.description}</p>
                   
                   <div className="space-y-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <Calendar size={12} className="mr-1.5" />
                        {project.start_date} ~ {project.target_end_date}
                      </div>
                      
                      {/* Budget Logic: Field Level Security */}
                      <div className="flex items-center text-xs text-slate-500">
                        {canViewBudget(project) ? (
                            <>
                                <span className="font-mono text-slate-700 font-medium">{formatCurrency(project.budget)}</span>
                            </>
                        ) : (
                            <span className="flex items-center text-slate-400 italic">
                                <Lock size={10} className="mr-1" />
                                預算權限受限
                            </span>
                        )}
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                         <div 
                           className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                           style={{ width: `${project.progress}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
