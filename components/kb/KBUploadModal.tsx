
import React, { useState } from 'react';
import { UploadCloud, X, Lock, Globe, Check, FileText } from 'lucide-react';
import { KnowledgeCategory, Role } from '../../types';
import { MOCK_ROLES } from '../../services/mockData';

interface KBUploadModalProps {
  categories: KnowledgeCategory[];
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, meta: any) => Promise<void>;
}

export const KBUploadModal: React.FC<KBUploadModalProps> = ({ categories, isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTitle(e.target.files[0].name.split('.')[0]); // Auto-fill title
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    if (!file || !title) return;
    setIsUploading(true);
    try {
      await onUpload(file, {
        title,
        category_id: categoryId,
        is_public: isPublic,
        allowed_roles: isPublic ? [] : selectedRoles,
        allowed_dept_ids: [] // Simplified for now
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <UploadCloud size={20} /> 上傳知識文件
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Input */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center text-blue-600">
                <FileText size={32} className="mb-2" />
                <span className="font-bold">{file.name}</span>
                <span className="text-xs text-slate-500">{(file.size/1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <UploadCloud size={32} className="mb-2" />
                <span className="font-medium">點擊或拖曳檔案至此</span>
                <span className="text-xs">支援 PDF, Word, Markdown</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">文件標題</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="輸入標題..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">分類</label>
            <select 
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-3">權限設定 (Permissions)</label>
            
            <div className="flex gap-4 mb-4">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border ${isPublic ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="hidden" />
                <Globe size={16} /> 公開 (Public)
              </label>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border ${!isPublic ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="hidden" />
                <Lock size={16} /> 限制存取 (Restricted)
              </label>
            </div>

            {!isPublic && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-slate-500 mb-2">允許存取的角色：</p>
                <div className="grid grid-cols-2 gap-2">
                  {MOCK_ROLES.map(role => (
                    <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedRoles.includes(role.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                        {selectedRoles.includes(role.id) && <Check size={12} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" onChange={() => handleRoleToggle(role.id)} checked={selectedRoles.includes(role.id)} />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">取消</button>
          <button 
            onClick={handleSubmit}
            disabled={isUploading || !file || !title}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? '處理中...' : '開始上傳與向量化'}
          </button>
        </div>
      </div>
    </div>
  );
};
