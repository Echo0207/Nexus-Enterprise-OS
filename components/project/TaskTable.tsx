import React, { useState } from 'react';
import { Task, Sprint, User } from '../../types';
import { Filter, ArrowRight, AlertTriangle, Search } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  sprints: Sprint[];
  users: Record<string, User>;
  activeSprintId: string;
  onMoveTaskSprint: (taskId: string, newSprintId: string, reason: string, blamedUserId: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, sprints, users, activeSprintId, onMoveTaskSprint, onTaskClick }) => {
  const [filterSprint, setFilterSprint] = useState<string>('current'); // 'current', 'all', or sprint ID
  const [searchTerm, setSearchTerm] = useState('');
  
  // Blame Modal State
  const [moveTask, setMoveTask] = useState<Task | null>(null);
  const [targetSprintId, setTargetSprintId] = useState('');
  const [blameReason, setBlameReason] = useState('');
  const [blamedUserId, setBlamedUserId] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.key.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesSprint = true;
    
    if (filterSprint === 'current') {
        matchesSprint = task.sprint_id === activeSprintId;
    } else if (filterSprint !== 'all') {
        matchesSprint = task.sprint_id === filterSprint;
    }

    return matchesSearch && matchesSprint;
  });

  const initiateMove = (task: Task, newSprintId: string) => {
      if (newSprintId === task.sprint_id) return;
      setMoveTask(task);
      setTargetSprintId(newSprintId);
      setBlameReason('');
      setBlamedUserId(task.assignee_id || '');
  };

  const confirmMove = async () => {
    if (moveTask && targetSprintId && blameReason && blamedUserId) {
        await onMoveTaskSprint(moveTask.id, targetSprintId, blameReason, blamedUserId);
        setMoveTask(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
           <Filter size={18} className="text-slate-400" />
           <select 
             className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
             value={filterSprint}
             onChange={(e) => setFilterSprint(e.target.value)}
           >
             <option value="current">當前 Sprint</option>
             <option value="all">所有任務</option>
             <option disabled>---</option>
             {sprints.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
           </select>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
               type="text" 
               placeholder="搜尋任務..." 
               className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                <tr>
                    <th className="px-6 py-3">Key</th>
                    <th className="px-6 py-3">任務名稱</th>
                    <th className="px-6 py-3">負責人</th>
                    <th className="px-6 py-3">狀態</th>
                    <th className="px-6 py-3">Sprint</th>
                    <th className="px-6 py-3">操作</th>
                </tr>
            </thead>
            <tbody>
                {filteredTasks.map(task => (
                    <tr key={task.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono font-medium text-slate-900">{task.key}</td>
                        <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{task.title}</div>
                            {task.related_task_ids && task.related_task_ids.length > 0 && (
                                <div className="text-xs text-blue-500 mt-0.5">
                                    關聯: {task.related_task_ids.map(id => {
                                        const relTask = tasks.find(t => t.id === id);
                                        return relTask ? relTask.key : id;
                                    }).join(', ')}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {task.assignee_id ? (
                                <div className="flex items-center gap-2">
                                    <img src={users[task.assignee_id]?.avatar} className="w-6 h-6 rounded-full" />
                                    <span>{users[task.assignee_id]?.name}</span>
                                </div>
                            ) : <span className="text-slate-400">未指派</span>}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium 
                                ${task.status === 'Done' ? 'bg-green-100 text-green-700' : 
                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-slate-100 text-slate-700'}`}>
                                {task.status}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <select 
                                className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer hover:text-blue-600"
                                value={task.sprint_id}
                                onChange={(e) => initiateMove(task, e.target.value)}
                            >
                                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </td>
                        <td className="px-6 py-4">
                            <button 
                                onClick={() => onTaskClick(task)}
                                className="text-blue-600 hover:underline"
                            >
                                查看詳情
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Blame Logic Modal */}
      {moveTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                  <div className="p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
                      <div className="bg-red-100 p-2 rounded-full text-red-600">
                          <AlertTriangle size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-red-800">跨 Sprint 延遲歸屬確認</h3>
                          <p className="text-sm text-red-600 mt-1">
                              您正將任務 <span className="font-mono font-bold">{moveTask.key}</span> 從 {sprints.find(s=>s.id === moveTask.sprint_id)?.name} 移動到 {sprints.find(s=>s.id === targetSprintId)?.name}。
                              <br/>此操作將影響績效 (KPI)，請誠實填寫原因。
                          </p>
                      </div>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">為何未能在原 Sprint 完成？ (必填)</label>
                          <textarea 
                             className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                             rows={3}
                             placeholder="例如：等待外部 API 文件，或需求規格變更..."
                             value={blameReason}
                             onChange={e => setBlameReason(e.target.value)}
                          ></textarea>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">主要責任歸屬人 (KPI 扣分對象)</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={blamedUserId}
                            onChange={e => setBlamedUserId(e.target.value)}
                          >
                              <option value="">請選擇...</option>
                              {Object.values(users).map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.roles.join(',')})</option>
                              ))}
                              <option value="client">客戶/外部因素 (不扣分)</option>
                          </select>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                      <button 
                        onClick={() => setMoveTask(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm"
                      >
                          取消
                      </button>
                      <button 
                        onClick={confirmMove}
                        disabled={!blameReason || !blamedUserId}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          確認移動並記錄
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};