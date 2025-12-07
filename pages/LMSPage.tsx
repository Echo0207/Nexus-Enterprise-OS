
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { lmsService } from '../services/lmsService';
import { Course, Enrollment } from '../types';
import { BookOpen, PlayCircle, Award, Layout, Zap, Plus, Sparkles, Loader2 } from 'lucide-react';
import { CoursePlayer } from '../components/lms/CoursePlayer';

type LMSTab = 'my-learning' | 'catalog' | 'manage';

export const LMSPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LMSTab>('my-learning');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Player State
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  // AI Generator State
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [c, e] = await Promise.all([
      lmsService.getAllCourses(),
      lmsService.getUserEnrollments(user.id)
    ]);
    setCourses(c);
    setEnrollments(e);
    setLoading(false);
  };

  const handleStartCourse = (enrollment: Enrollment) => {
      const course = courses.find(c => c.id === enrollment.course_id);
      if (course) {
          setActiveCourse(course);
          setActiveEnrollment(enrollment);
      }
  };

  const handleGenerateAI = async () => {
      setIsGenerating(true);
      const topic = prompt("請輸入想生成的課程主題：", "高效溝通技巧");
      if (topic) {
          try {
              const newCourse = await lmsService.generateCourseWithAI(topic);
              setCourses(prev => [...prev, newCourse]);
              alert('課程大綱生成完畢！');
          } catch (e) {
              alert('生成失敗');
          }
      }
      setIsGenerating(false);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-slate-200 pb-1 mb-6">
            <div className="flex space-x-1">
                <button 
                    onClick={() => setActiveTab('my-learning')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'my-learning' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                >
                    <BookOpen size={18} /> 我的課程
                </button>
                <button 
                    onClick={() => setActiveTab('catalog')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'catalog' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                >
                    <Layout size={18} /> 課程目錄
                </button>
                {(user?.roles.includes('hr_manager') || user?.roles.includes('admin')) && (
                    <button 
                        onClick={() => setActiveTab('manage')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'manage' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <Zap size={18} /> 管理後台
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {/* Tab 1: My Learning */}
            {activeTab === 'my-learning' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {enrollments.length === 0 && <div className="col-span-3 text-center text-slate-400 py-10">目前沒有進行中的課程</div>}
                    
                    {enrollments.map(enr => {
                        const course = courses.find(c => c.id === enr.course_id);
                        if (!course) return null;
                        
                        return (
                            <div key={enr.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                                <div className="h-40 bg-slate-200 relative overflow-hidden">
                                    <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${enr.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {enr.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">{course.title}</h3>
                                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${enr.progress_percent}%` }}></div>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-4 flex justify-between">
                                        <span>進度: {enr.progress_percent}%</span>
                                        {enr.due_date && <span className="text-orange-600">期限: {enr.due_date}</span>}
                                    </div>
                                    <button 
                                        onClick={() => handleStartCourse(enr)}
                                        className="mt-auto w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2"
                                    >
                                        <PlayCircle size={16} /> 
                                        {enr.status === 'NOT_STARTED' ? '開始學習' : '繼續學習'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tab 2: Catalog */}
            {activeTab === 'catalog' && (
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Categories would go here */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex gap-4 hover:border-blue-300 transition-colors cursor-pointer">
                                <img src={course.cover_image} className="w-24 h-24 rounded-lg object-cover bg-slate-200" />
                                <div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{course.category}</span>
                                    <h3 className="font-bold text-slate-800 mt-1 mb-2">{course.title}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                                    <div className="text-xs text-slate-400 mt-2">{course.estimated_minutes} min • {course.units.length} modules</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 3: Manage */}
            {activeTab === 'manage' && (
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                            <Sparkles className="absolute top-4 right-4 opacity-30 w-24 h-24" />
                            <h3 className="text-xl font-bold mb-2">AI 教材生成器</h3>
                            <p className="text-purple-100 text-sm mb-6">利用 RAG 技術，上傳文件即可自動生成課程大綱與測驗題目。</p>
                            <button 
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-50"
                            >
                                {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={16} />}
                                {isGenerating ? '生成中...' : '立即生成'}
                            </button>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">自動指派規則</h3>
                            <p className="text-slate-500 text-sm mb-6">設定新進員工或特定部門的必修課程規則。</p>
                            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-200">
                                <Plus size={16} /> 新增規則
                            </button>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-4">課程列表管理</h3>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">課程名稱</th>
                                    <th className="px-6 py-3">分類</th>
                                    <th className="px-6 py-3">狀態</th>
                                    <th className="px-6 py-3">建立日期</th>
                                    <th className="px-6 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courses.map(c => (
                                    <tr key={c.id}>
                                        <td className="px-6 py-4 font-medium">{c.title}</td>
                                        <td className="px-6 py-4">{c.category}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {c.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{c.created_at.split('T')[0]}</td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-600 hover:underline">編輯</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* Course Player Modal */}
        {activeCourse && activeEnrollment && (
            <CoursePlayer 
                course={activeCourse} 
                enrollment={activeEnrollment} 
                onClose={() => { setActiveCourse(null); setActiveEnrollment(null); }}
                onUpdate={loadData}
            />
        )}
    </div>
  );
};
