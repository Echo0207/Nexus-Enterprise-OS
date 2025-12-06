
import React, { useState, useEffect } from 'react';
import { Document, User } from '../../types';
import { DocumentList } from '../project/DocumentList';
import { hrService } from '../../services/hrService';
import { MOCK_DOCS } from '../../services/mockProjectData';
import { Folder, ChevronRight, FileText, Loader2 } from 'lucide-react';

interface HRDocumentRepoProps {
  currentUser: User | null;
}

export const HRDocumentRepo: React.FC<HRDocumentRepoProps> = ({ currentUser }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
      'HR_Payroll': true,
      'HR_CostReport': true,
      'HR_KPI': true
  });

  const categories = [
      { id: 'HR_Payroll', name: '各部門薪資單管理', icon: <FileText size={18}/> },
      { id: 'HR_CostReport', name: '專案成本分攤報表', icon: <FileText size={18}/> },
      { id: 'HR_KPI', name: 'KPI 數據管理', icon: <FileText size={18}/> }
  ];

  const refreshDocs = async () => {
      // In mock, MOCK_DOCS is global, so we filter it manually to simulate fetch
      // In real app, we call API
      const allDocs = MOCK_DOCS.filter(d => d.project_id === 'sys-hr-center' || d.type.startsWith('HR_'));
      setDocs(allDocs);
      setLoading(false);
  };

  useEffect(() => {
      refreshDocs();
  }, []);

  const toggleCategory = (catId: string) => {
      setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="h-full flex flex-col">
       <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Folder className="text-blue-600" /> 財務與人資文件中心
           </h2>
           <p className="text-sm text-slate-500 mt-1">集中管理薪資單、成本報表與績效數據文件。</p>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
           {categories.map(cat => {
               const catDocs = docs.filter(d => d.type === cat.id);
               const isExpanded = expandedCategories[cat.id];

               return (
                   <div key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                       <div 
                           onClick={() => toggleCategory(cat.id)}
                           className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200"
                       >
                           <div className="flex items-center gap-3">
                               <span className={`text-slate-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                   <ChevronRight size={20} />
                               </span>
                               <div className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600 shadow-sm">
                                   {cat.icon}
                               </div>
                               <div>
                                   <h4 className="font-bold text-slate-800 text-lg">{cat.name}</h4>
                                   <div className="text-xs text-slate-500 mt-1">
                                       {catDocs.length} 份文件
                                   </div>
                               </div>
                           </div>
                       </div>

                       {isExpanded && (
                           <div className="p-4 bg-white animate-fade-in">
                               <DocumentList 
                                   documents={catDocs} 
                                   // Mock user map for now, ideally passed from parent
                                   users={{ [currentUser?.id || '']: currentUser! }} 
                                   projectId="sys-hr-center"
                                   hideHeader={true} 
                               />
                           </div>
                       )}
                   </div>
               );
           })}
       </div>
    </div>
  );
};
