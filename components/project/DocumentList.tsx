
import React, { useState, useEffect } from 'react';
import { Document, DocumentType, User } from '../../types';
import { FileText, File, ExternalLink, Bot, Download, ChevronDown, Plus, X, Save, UploadCloud, Edit3, RotateCw, Archive, Calendar, User as UserIcon, Clock, Eye } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

interface DocumentListProps {
  documents: Document[];
  users: Record<string, User>;
  projectId?: string; // For creating docs when list is empty
  hideHeader?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents: initialDocs, users, projectId, hideHeader = false }) => {
  const { user: currentUser } = useAuth();
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  
  // Update local state when props change
  useEffect(() => {
      setDocs(initialDocs);
  }, [initialDocs]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  
  // Form State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('Other');
  const [docContent, setDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
      setEditingDoc(null);
      setDocTitle('');
      setDocType('Other');
      setDocContent('');
      setIsModalOpen(true);
  };

  const openEditModal = (doc: Document) => {
      setEditingDoc(doc);
      setDocTitle(doc.name);
      setDocType(doc.type);
      setDocContent(doc.content || '');
      setIsModalOpen(true);
  };

  const openViewModal = (doc: Document) => {
      setViewingDoc(doc);
      setIsViewModalOpen(true);
  };

  const handleCategoryChange = async (docId: string, newCategory: DocumentType) => {
      if (!currentUser) return;
      
      const doc = docs.find(d => d.id === docId);
      if (!doc) return;

      setDocs(prev => prev.map(d => d.id === docId ? { ...d, type: newCategory } : d));

      try {
          const updated = await projectService.updateDocument({ 
              id: docId, 
              type: newCategory,
              last_modified_by_id: currentUser.id
          });
          setDocs(prev => prev.map(d => d.id === docId ? updated : d));
      } catch (e) {
          console.error("Failed to update doc category", e);
          setDocs(initialDocs); // Revert
      }
  };

  const handleSaveDocument = async () => {
    if (!docTitle.trim() || !currentUser) return;
    setIsSaving(true);
    
    try {
        if (editingDoc) {
            const updated = await projectService.updateDocument({
                id: editingDoc.id,
                name: docTitle,
                type: docType,
                content: docContent,
                last_modified_by_id: currentUser.id
            });
            setDocs(prev => prev.map(d => d.id === editingDoc.id ? updated : d));
        } else {
            const targetProjectId = projectId || (docs.length > 0 ? docs[0].project_id : 'proj-001'); 
            const newDoc = await projectService.createDocument({
                project_id: targetProjectId,
                name: docTitle,
                type: docType,
                content: docContent,
                author_id: currentUser.id
            });
            setDocs(prev => [newDoc, ...prev]);
        }
        
        setIsModalOpen(false);
    } catch (e) {
        console.error("Failed to save document", e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleReupload = () => {
      setDocTitle(prev => prev.includes('NEW') ? prev : prev + ' (NEW FILE)');
      alert('已模擬重新上傳檔案，儲存後版本號將會更新。');
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'Meeting': return <FileText className="text-purple-500 w-5 h-5" />;
          case 'Requirements': return <File className="text-blue-500 w-5 h-5" />;
          case 'Design': return <File className="text-pink-500 w-5 h-5" />;
          case 'Sprint Report': return <Archive className="text-orange-500 w-5 h-5" />;
          default: return <File className="text-slate-400 w-5 h-5" />;
      }
  };

  const categories: DocumentType[] = ['Requirements', 'Design', 'Meeting', 'Technical', 'Sprint Report', 'Other'];

  return (
    <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        {!hideHeader && (
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 px-2">文件列表</h3>
                <div className="flex gap-2">
                    <button 
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        <UploadCloud size={16} /> 上傳檔案
                    </button>
                    <button 
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                    >
                        <Plus size={16} /> 新增文件
                    </button>
                </div>
            </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">檔案名稱 (File Name)</th>
                            <th className="px-6 py-4">分類 (Category)</th>
                            <th className="px-6 py-4">版本 (Ver)</th>
                            <th className="px-6 py-4">撰寫人 (Author)</th>
                            <th className="px-6 py-4">最後修改 (Modified By)</th>
                            <th className="px-6 py-4">更新日期 (Updated)</th>
                            <th className="px-6 py-4 text-right">
                                {hideHeader && (
                                    <button 
                                        onClick={openCreateModal}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-auto"
                                    >
                                        <Plus size={14} /> 新增
                                    </button>
                                )}
                                {!hideHeader && '操作'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {docs.map(doc => {
                            const author = users[doc.author_id];
                            const modifier = users[doc.last_modified_by_id];

                            return (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div 
                                            className="flex items-center gap-3 group cursor-pointer select-none" 
                                            onClick={() => openViewModal(doc)}
                                        >
                                            <div className="p-2 bg-slate-100 rounded-lg shrink-0 group-hover:bg-blue-100 transition-colors shadow-sm">
                                                {getIcon(doc.type)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors underline-offset-2 group-hover:underline flex items-center gap-2">
                                                    {doc.name}
                                                </div>
                                                {doc.ai_summary && (
                                                    <div className="text-[10px] text-purple-600 flex items-center gap-1 mt-0.5 font-medium">
                                                        <Bot size={10} />
                                                        AI Summary Available
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group">
                                            <select 
                                                value={doc.type}
                                                onChange={(e) => handleCategoryChange(doc.id, e.target.value as DocumentType)}
                                                className="appearance-none bg-transparent border border-transparent hover:border-slate-300 hover:bg-white rounded pl-2 pr-6 py-1 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium"
                                            >
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200">
                                            {doc.version}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {author ? (
                                            <div className="flex items-center gap-2" title={author.name}>
                                                <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full border border-slate-200" />
                                                <span className="text-slate-600 truncate max-w-[80px]">{author.name}</span>
                                            </div>
                                        ) : <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {modifier ? (
                                            <div className="flex items-center gap-2" title={modifier.name}>
                                                <img src={modifier.avatar} alt={modifier.name} className="w-6 h-6 rounded-full border border-slate-200" />
                                                <span className="text-slate-600 truncate max-w-[80px]">{modifier.name}</span>
                                            </div>
                                        ) : <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-600">{doc.updated_at}</span>
                                            <span className="text-[10px] text-slate-400">Created: {doc.created_at}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openEditModal(doc)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" 
                                                title="Edit / Re-upload"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => openViewModal(doc)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" 
                                                title="Open View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {docs.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                    暫無文件
                </div>
            )}
        </div>

        {/* View Document Modal */}
        {isViewModalOpen && viewingDoc && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in overflow-hidden border border-slate-700">
                    {/* Toolbar */}
                    <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-md z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                {getIcon(viewingDoc.type)}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight flex items-center gap-2">
                                    {viewingDoc.name}
                                    <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded font-mono font-normal">
                                        {viewingDoc.version}
                                    </span>
                                </h2>
                                <div className="flex items-center gap-4 text-slate-400 text-xs mt-1">
                                    <span className="flex items-center gap-1"><Calendar size={12}/> Updated: {viewingDoc.updated_at}</span>
                                    <span>Author: {users[viewingDoc.author_id]?.name}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                            >
                                <Download size={16} /> 下載
                            </button>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content Viewport */}
                    <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
                        {viewingDoc.content ? (
                            // Document View (A4 Paper Style)
                            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg p-[20mm] text-slate-800 text-sm leading-relaxed">
                                <div className="mb-8 border-b border-slate-200 pb-4 flex justify-between items-end">
                                    <h1 className="text-2xl font-bold text-slate-900">{viewingDoc.name}</h1>
                                    <div className="text-right text-xs text-slate-500">
                                        <p>NEXUS ENTERPRISE OS</p>
                                        <p>Confidential Document</p>
                                    </div>
                                </div>
                                <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
                                    <pre className="whitespace-pre-wrap font-sans text-justify">
                                        {viewingDoc.content}
                                    </pre>
                                </div>
                                
                                <div className="mt-12 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
                                    Page 1 of 1 • Generated by Nexus OS
                                </div>
                            </div>
                        ) : (
                            // External File View (Simulated PDF Viewer)
                            <div className="w-full max-w-5xl h-full flex flex-col gap-4">
                                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <span className="font-bold">Preview Mode</span>
                                        <span className="text-slate-400">|</span>
                                        <span>Page 1 / 5</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white shadow-lg rounded-lg flex flex-col items-center justify-center border border-slate-300">
                                    <div className="text-center p-8">
                                        <div className="w-20 h-24 bg-slate-100 border-2 border-slate-200 rounded mx-auto mb-4 flex items-center justify-center">
                                            <span className="font-bold text-slate-300 text-xl">PDF</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 mb-2">檔案預覽模擬</h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            這是一個外部檔案 ({viewingDoc.url})。在真實系統中，這裡會嵌入 PDF Viewer 或 Office Online 預覽器。
                                        </p>
                                        <a 
                                        href={viewingDoc.url}
                                        target="_blank"
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200"
                                        >
                                            <ExternalLink size={18} /> 開啟原始檔案
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                         <div className="text-xs text-slate-400 font-mono">
                             ID: {viewingDoc.id} | SHA: {Math.random().toString(36).substring(7)}
                         </div>
                         <button 
                             onClick={() => { setIsViewModalOpen(false); openEditModal(viewingDoc); }}
                             className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                         >
                             <Edit3 size={14} /> 編輯屬性 / 更新版本
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* Create/Edit Document Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
                    <div className="flex justify-between items-center p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-blue-600" />
                            {editingDoc ? '編輯文件 / 更新版本' : '新增文件'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {editingDoc && (
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-center gap-2">
                                <RotateCw size={14} />
                                <span>您正在編輯現有文件，儲存後系統將自動升級版本號並更新日期。</span>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 space-y-2">
                                <label className="block text-sm font-bold text-slate-700">文件標題 (File Name)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium"
                                    placeholder="輸入文件名稱..."
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">文件分類</label>
                                <select 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {editingDoc && !editingDoc.content && (
                            <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3 bg-slate-50">
                                <p className="text-slate-500 text-sm">此文件為外部上傳檔案 ({editingDoc.url})</p>
                                <button 
                                    onClick={handleReupload}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium inline-flex items-center gap-2"
                                >
                                    <UploadCloud size={16} /> 重新上傳 / 取代檔案
                                </button>
                            </div>
                        )}

                        <div className="space-y-2 h-full flex flex-col">
                             <label className="block text-sm font-bold text-slate-700">
                                 內容撰寫 
                                 <span className="text-slate-400 font-normal ml-2 text-xs">(若為線上文件)</span>
                             </label>
                             <textarea 
                                className="w-full flex-1 min-h-[300px] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
                                placeholder="在此輸入文件內容... (支援 Markdown 語法)"
                                value={docContent}
                                onChange={(e) => setDocContent(e.target.value)}
                             ></textarea>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSaveDocument}
                            disabled={isSaving || !docTitle.trim()}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? '儲存中...' : <><Save size={18} /> {editingDoc ? '更新文件' : '儲存文件'}</>}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
