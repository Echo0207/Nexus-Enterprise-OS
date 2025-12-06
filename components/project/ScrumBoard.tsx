import React, { useMemo } from 'react';
import { Task, Project, User } from '../../types';
import { AlertCircle, Clock, MoreHorizontal } from 'lucide-react';

interface ScrumBoardProps {
  tasks: Task[];
  projects: Project[];
  users: Record<string, any>; // Simplified user map
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
}

const COLUMNS = ['To Do', 'In Progress', 'Code Review', 'In Test', 'Done'] as const;

export const ScrumBoard: React.FC<ScrumBoardProps> = ({ tasks, projects, users, onStatusChange, onTaskClick }) => {
  // Group tasks by Project -> Status
  const matrix = useMemo(() => {
    const map: Record<string, Record<string, Task[]>> = {};
    
    projects.forEach(p => {
      map[p.id] = {};
      COLUMNS.forEach(col => {
        map[p.id][col] = [];
      });
    });

    tasks.forEach(task => {
      if (map[task.project_id] && map[task.project_id][task.status]) {
        map[task.project_id][task.status].push(task);
      }
    });

    return map;
  }, [tasks, projects]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, projectId: string, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    // Ensure we are only moving within the same project or moving logic permits it
    // For Scrum board, we update status
    onStatusChange(taskId, status);
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-auto pb-4">
      <div className="min-w-[1000px]">
        {/* Header Row */}
        <div className="flex bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
           <div className="w-48 p-3 font-bold text-slate-700 bg-slate-100 sticky left-0 border-r border-slate-200 flex-shrink-0">
             專案 / 狀態
           </div>
           {COLUMNS.map(col => (
             <div key={col} className="flex-1 min-w-[180px] p-3 font-semibold text-slate-600 text-center uppercase text-sm tracking-wider">
               {col}
             </div>
           ))}
        </div>

        {/* Swimlanes */}
        {projects.map(project => (
          <div key={project.id} className="flex border-b border-slate-200 bg-white">
            {/* Project Header (Row Header) */}
            <div className="w-48 p-4 border-r border-slate-200 bg-slate-50 sticky left-0 flex-shrink-0 flex flex-col justify-center group">
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors cursor-pointer truncate" title={project.name}>
                {project.name}
              </h3>
              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                 <span>PM: {users[project.manager_id]?.name.split(' ')[0] || 'Unknown'}</span>
                 <span className={`${project.progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>{project.progress}%</span>
              </div>
            </div>

            {/* Status Columns */}
            {COLUMNS.map(col => (
              <div 
                key={col} 
                className="flex-1 min-w-[180px] p-2 border-r border-slate-100 min-h-[160px] bg-slate-50/20"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, project.id, col)}
              >
                <div className="flex flex-col gap-2 h-full">
                  {matrix[project.id][col].map(task => {
                    const assignee = users[task.assignee_id || ''] || null;
                    return (
                      <div 
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onTaskClick(task)}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-pointer active:cursor-grabbing transition-all border-l-4 border-l-blue-500 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-mono text-slate-400 group-hover:text-blue-500 transition-colors">{task.key}</span>
                           <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={14}/></button>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-3 leading-snug">{task.title}</p>
                        
                        <div className="flex justify-between items-center mt-auto">
                          {assignee ? (
                            <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-white shadow-sm" title={assignee.name} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">?</div>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                             <Clock size={10} />
                             {task.story_points}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};