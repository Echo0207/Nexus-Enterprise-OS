

import React, { useState, useEffect } from 'react';
import { Task, Project, Sprint, User, Comment, TaskStatus, Attachment } from '../../types';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, User as UserIcon, Tag, Clock, Folder, MessageSquare, Save, Edit3, Send, AlertCircle, CheckCircle, FileText, Image as ImageIcon, Paperclip, Trash2, UploadCloud, Link as LinkIcon, Plus } from 'lucide-react';

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  projects: Project[];
  sprints: Sprint[];
  users: Record<string, User>;
  tasks: Task[]; // Need full task list for related tasks selection
  onTaskClick: (task: Task) => void; // For navigation
}

type Tab = 'details' | 'comments';

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, isOpen, onClose, onUpdate, projects, sprints, users, tasks, onTaskClick }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask(JSON.parse(JSON.stringify(task))); // Deep copy
      setActiveTab('details');
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const project = projects.find(p => p.id === editedTask.project_id);
  
  const handleSave = async () => {
    if (!editedTask) return;
    setIsSaving(true);
    try {
      const updated = await projectService.updateTask(editedTask);
      onUpdate(updated);
      // Optional: show success toast
    } catch (e) {
      console.error(e);
      alert('儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    setIsSendingComment(true);
    try {
      const addedComment = await projectService.addComment(editedTask.id, newComment, currentUser.id);
      
      const updatedComments = [...(editedTask.comments || []), addedComment];
      const updatedTask = { ...editedTask, comments: updatedComments };
      
      setEditedTask(updatedTask);
      onUpdate(updatedTask);
      setNewComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleAddMockAttachment = () => {
    const newFile: Attachment = {
      id: 'att_' + Date.now(),
      name: `Mock_Upload_File_${Date.now()}.png`,
      url: '#',
      size: '1.5MB',
      type: 'image',
      created_at: new Date().toISOString().split('T')[0]
    };
    setEditedTask(prev => prev ? {
      ...prev,
      attachments: [...(prev.attachments || []), newFile]
    } : null);
  };

  const handleRemoveAttachment = (id: string) => {
    setEditedTask(prev => prev ? {
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id)
    } : null);
  };

  const handleAddRelatedTask = (targetId: string) => {
      if (!targetId || targetId === editedTask.id) return;
      const currentIds = editedTask.related_task_ids || [];
      if (!currentIds.includes(targetId)) {
          setEditedTask({ ...editedTask, related_task_ids: [...currentIds, targetId] });
      }
  };

  const handleRemoveRelatedTask = (targetId: string) => {
      const currentIds = editedTask.related_task_ids || [];
      setEditedTask({ ...editedTask, related_task_ids: currentIds.filter(id => id !== targetId) });
  };

  const handleRelatedTaskClick = (id: string) => {
      const targetTask = tasks.find(t => t.id === id);
      if (targetTask) {
          onTaskClick(targetTask);
      }
  };

  // Render Helpers
  const renderPriorityBadge = (p: string) => {
     const colors = {
       High: 'text-red-700 bg-red-50 border-red-200',
       Medium: 'text-orange-700 bg-orange-50 border-orange-200',
       Low: 'text-blue-700 bg-blue-50 border-blue-200'
     };
     return colors[p as keyof typeof colors] || 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const statusColors: Record<string, string> = {
    'Done': 'bg-green-100 text-green-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'To Do': 'bg-slate-100 text-slate-700',
    'Code Review': 'bg-purple-100 text-purple-700',
    'In Test': 'bg-orange-100 text-orange-700',
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[55] transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Side Drawer - Increased Z-Index to 60 to overlay ProjectPanel (z-50) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header: Enterprise Style (Solid Color) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
             <div className="px-2 py-1 bg-slate-700 rounded text-xs font-mono font-bold tracking-wider text-slate-200 border border-slate-600">
               {editedTask.key}
             </div>
             <div className="h-4 w-[1px] bg-slate-700"></div>
             <div className="flex items-center gap-2 text-sm text-slate-300">
               <Folder size={14} />
               <span>{project?.name}</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Edit3 size={16} /> 詳細內容
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'comments' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <MessageSquare size={16} /> 討論留言
            {editedTask.comments && editedTask.comments.length > 0 && (
              <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">
                {editedTask.comments.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Main Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">任務名稱</label>
                <input 
                  type="text" 
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                  className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none py-1 transition-colors bg-transparent placeholder-slate-300"
                />
              </div>

              {/* Field Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <Tag size={12} /> 狀態 (Status)
                      </label>
                      <select 
                        value={editedTask.status}
                        onChange={(e) => setEditedTask({...editedTask, status: e.target.value as TaskStatus})}
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                         <option value="To Do">To Do</option>
                         <option value="In Progress">In Progress</option>
                         <option value="Code Review">Code Review</option>
                         <option value="In Test">In Test</option>
                         <option value="Done">Done</option>
                         <option value="Backlog">Backlog</option>
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <AlertCircle size={12} /> 優先級 (Priority)
                      </label>
                      <select 
                        value={editedTask.priority}
                        onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as any})}
                        className={`w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                      >
                         <option value="High">High</option>
                         <option value="Medium">Medium</option>
                         <option value="Low">Low</option>
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <UserIcon size={12} /> 指派對象 (Assignee)
                      </label>
                      <select 
                        value={editedTask.assignee_id || ''}
                        onChange={(e) => setEditedTask({...editedTask, assignee_id: e.target.value || null})}
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                         <option value="">未指派 (Unassigned)</option>
                         {Object.values(users).map(u => (
                           <option key={u.id} value={u.id}>{u.name}</option>
                         ))}
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <Calendar size={12} /> 截止日期 (Due Date)
                      </label>
                      <input 
                        type="date"
                        value={editedTask.due_date || ''}
                        onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>
                  
                  <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <Clock size={12} /> 投入工時 (Time Spent)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 2h 30m"
                        value={editedTask.time_spent || ''}
                        onChange={(e) => setEditedTask({...editedTask, time_spent: e.target.value})}
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                  </div>

                   <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <Tag size={12} /> Sprint
                      </label>
                      <select 
                        value={editedTask.sprint_id || ''}
                        onChange={(e) => setEditedTask({...editedTask, sprint_id: e.target.value})}
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                         <option value="">Backlog</option>
                         {sprints.map(s => (
                           <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                         ))}
                      </select>
                  </div>

                  {/* Related Tasks Section (Full width in grid) */}
                  <div className="col-span-2 space-y-1 border-t border-slate-200 pt-3 mt-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                        <LinkIcon size={12} /> 關聯任務 (Related Tasks)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                          {editedTask.related_task_ids && editedTask.related_task_ids.map(id => {
                              const related = tasks.find(t => t.id === id);
                              if (!related) return null;
                              return (
                                  <div key={id} className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm text-sm group">
                                      <span 
                                        className="font-mono font-bold text-blue-600 cursor-pointer hover:underline"
                                        onClick={() => handleRelatedTaskClick(id)}
                                      >
                                          {related.key}
                                      </span>
                                      <span className="text-slate-600 truncate max-w-[150px]">{related.title}</span>
                                      <div className={`w-2 h-2 rounded-full ${statusColors[related.status] || 'bg-slate-300'}`}></div>
                                      <button 
                                        onClick={() => handleRemoveRelatedTask(id)}
                                        className="text-slate-300 hover:text-red-500 ml-1"
                                      >
                                          <X size={12} />
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                      <div className="relative">
                          <select 
                            className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) => {
                                handleAddRelatedTask(e.target.value);
                                e.target.value = '';
                            }}
                          >
                             <option value="">+ 新增關聯任務...</option>
                             {tasks
                                .filter(t => t.id !== editedTask.id && !(editedTask.related_task_ids || []).includes(t.id))
                                .map(t => (
                                   <option key={t.id} value={t.id}>
                                       {t.key} - {t.title}
                                   </option>
                             ))}
                          </select>
                      </div>
                  </div>
              </div>

              {/* Description */}
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">任務描述與內容</label>
                 <textarea 
                    rows={6}
                    className="w-full p-4 border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    placeholder="輸入詳細的任務描述、驗收標準..."
                 ></textarea>
              </div>

              {/* Deliverables Link */}
               <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">成果連結 (URL)</label>
                 <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={editedTask.deliverable_url || ''}
                      onChange={(e) => setEditedTask({...editedTask, deliverable_url: e.target.value})}
                      placeholder="https://github.com/..."
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                   {editedTask.deliverable_url && (
                     <a 
                       href={editedTask.deliverable_url} 
                       target="_blank" 
                       rel="noreferrer"
                       className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center"
                     >
                       <span className="text-xs font-bold">開啟</span>
                     </a>
                   )}
                 </div>
              </div>

              {/* Report Section */}
              <div>
                <div className="flex justify-between items-end mb-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">回報 (Report)</label>
                   <button 
                     onClick={() => setEditedTask(prev => prev ? {...prev, report_content: (prev.report_content || '') + '\n[Image Placeholder]'} : null)}
                     className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                   >
                     <ImageIcon size={12} /> 插入圖片
                   </button>
                </div>
                <textarea 
                    rows={4}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                    value={editedTask.report_content || ''}
                    onChange={(e) => setEditedTask({...editedTask, report_content: e.target.value})}
                    placeholder="輸入進度回報、備註或貼上圖片..."
                 ></textarea>
              </div>

              {/* Attachments Section */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">附件 (Attachments)</label>
                
                <div className="space-y-3 mb-3">
                   {editedTask.attachments && editedTask.attachments.map(file => (
                     <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 rounded text-slate-500">
                              {file.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-slate-400">{file.size} • {file.created_at}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveAttachment(file.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   ))}
                </div>

                <div 
                   onClick={handleAddMockAttachment}
                   className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer bg-slate-50"
                >
                   <UploadCloud size={24} className="mb-2" />
                   <span className="text-sm font-medium">點擊上傳新附件</span>
                   <span className="text-xs mt-1 text-slate-400">支援拖曳上傳</span>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'comments' && (
             <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-4">
                  {(!editedTask.comments || editedTask.comments.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                       <MessageSquare size={32} className="mb-2 opacity-20" />
                       <p className="text-sm">尚無留言，開始討論吧！</p>
                    </div>
                  ) : (
                    editedTask.comments.map(comment => {
                      const commentUser = users[comment.user_id];
                      return (
                        <div key={comment.id} className="flex gap-3">
                           <img 
                             src={commentUser?.avatar || 'https://via.placeholder.com/32'} 
                             alt={commentUser?.name} 
                             className="w-8 h-8 rounded-full border border-slate-200 mt-1"
                           />
                           <div className="flex-1">
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3 relative">
                                  <div className="flex justify-between items-baseline mb-1">
                                     <span className="text-xs font-bold text-slate-700">{commentUser?.name || 'Unknown User'}</span>
                                     <span className="text-[10px] text-slate-400">{comment.created_at}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 leading-snug">{comment.content}</p>
                              </div>
                           </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Input */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                       placeholder="輸入留言內容..."
                       className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                     <button 
                       onClick={handleSendComment}
                       disabled={isSendingComment || !newComment.trim()}
                       className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-50 transition-colors"
                     >
                       {isSendingComment ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                     </button>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Footer Actions (Only for details tab) */}
        {activeTab === 'details' && (
           <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={onClose}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                   <Clock size={16} className="animate-spin" /> 儲存中...
                  </>
                ) : (
                  <>
                   <Save size={16} /> 儲存變更
                  </>
                )}
              </button>
           </div>
        )}
      </div>
    </>
  );
};