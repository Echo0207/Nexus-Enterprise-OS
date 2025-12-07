
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { kbService } from '../services/kbService';
import { KnowledgeCategory, KnowledgeDocument } from '../types';
import { Search, Filter, UploadCloud, Folder, FileText, Lock, Globe, RefreshCcw, MoreHorizontal, Bot } from 'lucide-react';
import { KBUploadModal } from '../components/kb/KBUploadModal';
import { AIChatWindow } from '../components/kb/AIChatWindow';

export const KnowledgeBasePage: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, docs] = await Promise.all([
        kbService.getCategories(),
        kbService.getDocuments()
      ]);
      setCategories(cats);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (file: File, meta: any) => {
    if (!user) return;
    await kbService.uploadDocument(file, meta, user);
    await loadData();
  };

  const filteredDocs = documents.filter(doc => {
    const matchCat = selectedCategory === 'all' || doc.category_id === selectedCategory;
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!user) return null;

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            知識庫與 AI 檢索 <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">Beta</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">集中管理企業資產，透過 RAG 技術實現權限分立的智能問答。</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors text-sm font-medium">
            <RefreshCcw size={16} /> Notion 同步
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-colors text-sm font-medium"
          >
            <UploadCloud size={16} /> 上傳文件
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar: Categories */}
        <div className="w-64 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
            <Folder size={18} /> 分類目錄
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center ${selectedCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>所有文件</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border">{documents.length}</span>
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center group ${selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="truncate pr-2">{cat.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${selectedCategory === cat.id ? 'bg-white' : 'bg-slate-100 group-hover:bg-white'}`}>
                  {documents.filter(d => d.category_id === cat.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content: Document List */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="搜尋文件標題..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter size={16} /> 排序: 更新時間
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">文件名稱</th>
                  <th className="px-6 py-3">權限狀態</th>
                  <th className="px-6 py-3">大小 / 類型</th>
                  <th className="px-6 py-3">上傳者</th>
                  <th className="px-6 py-3">上傳日期</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-blue-600">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{doc.title}</div>
                          <div className="text-xs text-slate-400">ID: {doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {doc.is_public ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                          <Globe size={12} /> 公開
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-200 w-fit">
                            <Lock size={12} /> 受限
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {doc.allowed_roles.length > 0 ? `Roles: ${doc.allowed_roles.join(', ')}` : 'Dept Only'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-slate-600 uppercase">{doc.file_type}</div>
                      <div className="text-xs text-slate-400">{doc.size}</div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{doc.uploaded_by}</td>
                    <td className="px-6 py-3 text-slate-600">{doc.uploaded_at}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      沒有找到符合的文件
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <KBUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        categories={categories}
        onUpload={handleUpload}
      />

      {/* Floating AI Chat */}
      <AIChatWindow currentUser={user} />
    </div>
  );
};
