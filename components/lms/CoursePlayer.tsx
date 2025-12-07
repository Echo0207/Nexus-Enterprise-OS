
import React, { useState, useEffect, useRef } from 'react';
import { Course, Enrollment, CourseUnit } from '../../types';
import { lmsService } from '../../services/lmsService';
import { ChevronLeft, PlayCircle, FileText, CheckCircle, Lock, AlertCircle, Check } from 'lucide-react';

interface CoursePlayerProps {
  course: Course;
  enrollment: Enrollment;
  onClose: () => void;
  onUpdate: () => void; // Trigger refresh of parent data
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, enrollment, onClose, onUpdate }) => {
  // Determine current unit (first unlocked open unit or first unit)
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
      const units = course.units;
      // Try to find first non-completed
      const firstIncomplete = units.find(u => {
          const status = enrollment.unit_progress[u.id]?.status;
          return status === 'OPEN' || status === 'COMPLETED';
      });
      return firstIncomplete ? firstIncomplete.id : units[0].id;
  });

  const activeUnit = course.units.find(u => u.id === activeUnitId);
  const unitState = enrollment.unit_progress[activeUnitId] || { status: 'LOCKED' };

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizResult, setQuizResult] = useState<{score: number, passed: boolean} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save video progress every 5 sec
  useEffect(() => {
    if (activeUnit?.type !== 'VIDEO') return;
    
    const interval = setInterval(() => {
        if (videoRef.current && !videoRef.current.paused) {
            lmsService.updateUnitProgress(enrollment.id, activeUnitId, { 
                position: Math.floor(videoRef.current.currentTime) 
            });
        }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeUnitId, enrollment.id]);

  const handleUnitClick = (unit: CourseUnit) => {
      const status = enrollment.unit_progress[unit.id]?.status || 'LOCKED';
      if (status !== 'LOCKED') {
          setActiveUnitId(unit.id);
          setQuizResult(null); // Reset quiz view
          setQuizAnswers({});
      }
  };

  const handleVideoEnded = async () => {
      await lmsService.updateUnitProgress(enrollment.id, activeUnitId, { completed: true });
      onUpdate();
  };

  const handleMarkArticleRead = async () => {
      await lmsService.updateUnitProgress(enrollment.id, activeUnitId, { completed: true });
      onUpdate();
  };

  const handleQuizSubmit = async () => {
      setIsSubmitting(true);
      try {
          const res = await lmsService.submitQuiz(enrollment.id, activeUnitId, quizAnswers);
          setQuizResult(res);
          if (res.passed) onUpdate();
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (!activeUnit) return <div>Error loading unit</div>;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-slate-900 text-white flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
                    <ChevronLeft />
                </button>
                <div>
                    <h2 className="font-bold text-lg">{course.title}</h2>
                    <p className="text-xs text-slate-400">
                        進度: {enrollment.progress_percent}% • 目前單元: {activeUnit.title}
                    </p>
                </div>
            </div>
            {enrollment.status === 'COMPLETED' && (
                <div className="bg-green-600 px-3 py-1 rounded text-sm font-bold flex items-center gap-2">
                    <CheckCircle size={16} /> 已完課
                </div>
            )}
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar (Curriculum) */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto flex flex-col shrink-0">
                <div className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">課程章節</div>
                <div className="flex-1">
                    {course.units.map((unit, idx) => {
                        const status = enrollment.unit_progress[unit.id]?.status || 'LOCKED';
                        const isActive = unit.id === activeUnitId;
                        const isLocked = status === 'LOCKED';
                        const isCompleted = status === 'COMPLETED';

                        return (
                            <div 
                                key={unit.id}
                                onClick={() => handleUnitClick(unit)}
                                className={`p-4 border-b border-slate-100 flex items-start gap-3 cursor-pointer transition-colors
                                    ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-100'}
                                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="mt-0.5">
                                    {isLocked ? <Lock size={16} /> : 
                                     isCompleted ? <CheckCircle size={16} className="text-green-600" /> :
                                     unit.type === 'VIDEO' ? <PlayCircle size={16} /> : 
                                     unit.type === 'QUIZ' ? <AlertCircle size={16} /> :
                                     <FileText size={16} />
                                    }
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {idx + 1}. {unit.title}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {unit.type === 'VIDEO' && unit.video_duration && `${Math.floor(unit.video_duration/60)} min`}
                                        {unit.type === 'QUIZ' && '測驗'}
                                        {unit.type === 'ARTICLE' && '文章'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-black flex flex-col items-center justify-center relative overflow-y-auto">
                {activeUnit.type === 'VIDEO' && (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <video 
                            ref={videoRef}
                            src={activeUnit.asset_url} 
                            controls 
                            className="max-h-full max-w-full"
                            onEnded={handleVideoEnded}
                            // Mock resume logic
                            onLoadedMetadata={(e) => {
                                const lastPos = enrollment.unit_progress[activeUnitId]?.last_position_sec || 0;
                                if(lastPos > 0) e.currentTarget.currentTime = lastPos;
                            }}
                        />
                    </div>
                )}

                {activeUnit.type === 'ARTICLE' && (
                    <div className="w-full h-full bg-white overflow-y-auto p-12">
                        <div className="max-w-3xl mx-auto">
                            <h1 className="text-3xl font-bold text-slate-900 mb-6">{activeUnit.title}</h1>
                            <div className="prose prose-lg text-slate-700 leading-relaxed mb-10">
                                {activeUnit.content_text}
                            </div>
                            {unitState.status !== 'COMPLETED' && (
                                <button 
                                    onClick={handleMarkArticleRead}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors w-full"
                                >
                                    我已閱讀完畢
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeUnit.type === 'QUIZ' && (
                    <div className="w-full h-full bg-slate-50 overflow-y-auto p-12">
                        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">{activeUnit.title}</h1>
                            <p className="text-slate-500 mb-8">請回答以下問題，需達 80 分以上才算通過。</p>

                            {quizResult ? (
                                <div className="text-center py-10">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${quizResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {quizResult.passed ? <CheckCircle size={40}/> : <AlertCircle size={40}/>}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">得分: {quizResult.score}</h3>
                                    <p className={`mb-6 ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                                        {quizResult.passed ? '恭喜通過！' : '未通過，請重新測驗。'}
                                    </p>
                                    {!quizResult.passed && (
                                        <button 
                                            onClick={() => setQuizResult(null)}
                                            className="bg-slate-800 text-white px-6 py-2 rounded-lg"
                                        >
                                            重試
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {activeUnit.questions?.map((q, idx) => (
                                        <div key={q.id}>
                                            <p className="font-bold text-slate-800 mb-3">{idx + 1}. {q.text}</p>
                                            <div className="space-y-2">
                                                {q.options.map(opt => (
                                                    <label key={opt.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name={q.id} 
                                                            checked={(quizAnswers[q.id] || []).includes(opt.id)}
                                                            onChange={() => setQuizAnswers({...quizAnswers, [q.id]: [opt.id]})}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <span>{opt.text}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={handleQuizSubmit}
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 mt-4"
                                    >
                                        提交答案
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
