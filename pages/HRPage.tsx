
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hrService } from '../services/hrService';
import { LeaveBalance, LeaveRequest, Payslip, CostTransaction, ProjectMonthlyDetail } from '../types';
import { Calendar, DollarSign, PieChart, Briefcase, Plus, FileText, Download, CheckCircle, Clock, AlertTriangle, X, User as UserIcon, AlertCircle, Edit2, Check, Paperclip, FolderOpen, ArrowRight, ExternalLink } from 'lucide-react';
import { MOCK_LEAVE_TYPES, MOCK_USERS } from '../services/mockData';
import { HRDocumentRepo } from '../components/hr/HRDocumentRepo';

type HRTab = 'leave' | 'payroll' | 'management' | 'docs';

export const HRPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HRTab>('leave');
  
  // Leave State
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  
  // Modals & Panels State
  const [showSpecialLeaveModal, setShowSpecialLeaveModal] = useState(false);
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  
  // Application Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [applyType, setApplyType] = useState('lt-1');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyStartTime, setApplyStartTime] = useState('09:00');
  const [applyEndDate, setApplyEndDate] = useState('');
  const [applyEndTime, setApplyEndTime] = useState('18:00');
  const [applyAllDay, setApplyAllDay] = useState(true);
  const [applyHours, setApplyHours] = useState(8);
  const [applyReason, setApplyReason] = useState('');
  const [applyHandover, setApplyHandover] = useState('');
  const [applyAttachment, setApplyAttachment] = useState<string | null>(null); // Mock attachment
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approval Action State
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Payroll State
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [isLoadingPayslip, setIsLoadingPayslip] = useState(false);

  // Management State
  const [costTrans, setCostTrans] = useState<CostTransaction[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isExportingReport, setIsExportingReport] = useState(false);
  
  // Project Detail Modal State
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectMonthlyDetail | null>(null);
  const [isLoadingProjectDetail, setIsLoadingProjectDetail] = useState(false);

  useEffect(() => {
    if (user) {
        loadLeaveData();
        loadPendingApprovals();
    }
  }, [user]);

  // Auto-Calculate Hours Effect
  useEffect(() => {
      if (applyStartDate) {
          const start = `${applyStartDate}T${applyAllDay ? '09:00:00' : applyStartTime + ':00'}`;
          const end = `${applyEndDate || applyStartDate}T${applyAllDay ? '18:00:00' : applyEndTime + ':00'}`;
          
          if (start && end) {
              const hours = hrService.calculateLeaveHours(start, end, applyAllDay);
              setApplyHours(hours);
          }
      }
  }, [applyStartDate, applyEndDate, applyStartTime, applyEndTime, applyAllDay]);

  const loadLeaveData = async () => {
      if (!user) return;
      const b = await hrService.getLeaveBalance(user.id);
      const r = await hrService.getLeaveRequests(user.id);
      setRequests(r);
      setBalance(b);
  };

  const loadPendingApprovals = async () => {
      if (!user) return;
      // Only check if user has approve permission
      if (user.permissions.includes('leave:approve')) {
          const role = user.roles.includes('hr_manager') ? 'hr' : 'manager';
          const p = await hrService.getPendingRequests(user.id, role);
          setPendingRequests(p);
      }
  };

  const handleOpenApply = (request?: LeaveRequest) => {
      if (request) {
          // Edit Mode
          setIsEditMode(true);
          setEditingRequestId(request.id);
          setApplyType(request.type_id);
          setApplyStartDate(request.start_date.split('T')[0]);
          setApplyStartTime(request.start_date.split('T')[1]?.slice(0,5) || '09:00');
          setApplyEndDate(request.end_date.split('T')[0]);
          setApplyEndTime(request.end_date.split('T')[1]?.slice(0,5) || '18:00');
          setApplyAllDay(request.hours % 8 === 0); // Simple heuristic
          setApplyHours(request.hours);
          setApplyReason(request.reason);
          setApplyHandover(request.handover_user_id || '');
          setApplyAttachment(request.attachments?.[0] || null);
      } else {
          // New Mode
          setIsEditMode(false);
          setEditingRequestId(null);
          setApplyType('lt-1');
          setApplyStartDate('');
          setApplyReason('');
          setApplyHandover('');
          setApplyAttachment(null);
      }
      setShowApplyPanel(true);
  };

  const handleSubmitLeave = async () => {
      if (!user) return;
      setIsSubmitting(true);
      try {
          const start = `${applyStartDate}T${applyAllDay ? '09:00:00' : applyStartTime + ':00'}`;
          const end = `${applyEndDate || applyStartDate}T${applyAllDay ? '18:00:00' : applyEndTime + ':00'}`;
          
          const payload: any = {
              user_id: user.id,
              type_id: applyType,
              start_date: start,
              end_date: end,
              hours: applyHours,
              reason: applyReason,
              handover_user_id: applyHandover,
              attachments: applyAttachment ? [applyAttachment] : []
          };

          if (isEditMode && editingRequestId) {
              // Logic: If Manager, reset to 'Manager Approved', else 'Pending'
              let nextStatus = 'Pending';
              if (user.roles.includes('admin') || user.roles.some(r => r.includes('manager'))) {
                  nextStatus = 'Manager Approved';
              }
              await hrService.updateLeaveRequest({ ...payload, id: editingRequestId, status: nextStatus }); 
          } else {
              await hrService.createLeaveRequest(payload);
          }
          
          await loadLeaveData();
          setShowApplyPanel(false);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleApprove = async (reqId: string) => {
      if (!user) return;
      const role = user.roles.includes('hr_manager') ? 'hr' : 'manager';
      try {
          await hrService.approveLeaveRequest(reqId, role);
          loadPendingApprovals(); // Refresh list
          loadLeaveData(); // Refresh history if it was self-approval (edge case)
      } catch (e) {
          console.error(e);
      }
  };

  const handleReject = async (reqId: string) => {
      if (!rejectReason.trim()) {
          alert("請輸入退回原因");
          return;
      }
      try {
          await hrService.rejectLeaveRequest(reqId, rejectReason);
          setRejectingId(null);
          setRejectReason('');
          loadPendingApprovals();
      } catch (e) {
          console.error(e);
      }
  };

  const handleGeneratePayslip = async () => {
      if (!user) return;
      setIsLoadingPayslip(true);
      try {
          const slip = await hrService.calculatePayroll(user.id, selectedPeriod);
          setPayslip(slip);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingPayslip(false);
      }
  };

  const handleRunBatch = async () => {
      setIsProcessingBatch(true);
      try {
          const txs = await hrService.distributeProjectCost(selectedPeriod);
          setCostTrans(txs);
          alert(`批次作業完成！\n已將 ${selectedPeriod} 薪資成本分攤至各專案。\n共產生 ${txs.length} 筆成本交易。`);
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessingBatch(false);
      }
  };

  const handleExportFullReport = async () => {
      if (!user) return;
      setIsExportingReport(true);
      try {
          const report = await hrService.generateMonthlyCostReport(selectedPeriod);
          await hrService.saveMonthlyCostReportDocument(report, user.id);
          alert("匯出成功！\n詳細報表 (包含各專案累計/月明細) 已存入文件資料庫。");
          setActiveTab('docs');
      } catch (e) {
          console.error(e);
          alert("匯出失敗");
      } finally {
          setIsExportingReport(false);
      }
  };

  const handleViewProjectDetail = async (projectName: string) => {
      setIsLoadingProjectDetail(true);
      setSelectedProjectDetail(null);
      try {
          // Reuse generator to get details (in real app, call specific API)
          const report = await hrService.generateMonthlyCostReport(selectedPeriod);
          const detail = report.projectDetails.find(p => p.projectName === projectName || p.projectId === projectName);
          if (detail) {
              setSelectedProjectDetail(detail);
          } else {
              alert("查無詳細資料");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingProjectDetail(false);
      }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(amount);
  };

  if (!user) return <div>Access Denied</div>;

  const canApprove = user.permissions.includes('leave:approve');

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200">
            <TabButton id="leave" label="假勤管理 (Leave)" icon={<Calendar size={18}/>} active={activeTab} onClick={setActiveTab} />
            <TabButton id="payroll" label="薪資單 (Payslip)" icon={<DollarSign size={18}/>} active={activeTab} onClick={setActiveTab} />
            {(user.roles.includes('hr_manager') || user.roles.includes('admin')) && (
                <>
                    <TabButton id="management" label="HR 管理後台" icon={<Briefcase size={18}/>} active={activeTab} onClick={setActiveTab} />
                    <TabButton id="docs" label="文件資料庫" icon={<FolderOpen size={18}/>} active={activeTab} onClick={setActiveTab} />
                </>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            
            {/* Tab 1: Leave Management */}
            {activeTab === 'leave' && balance && (
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Balance Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Special Leave Card - Clickable */}
                        <div 
                            onClick={() => setShowSpecialLeaveModal(true)}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden cursor-pointer transform hover:scale-[1.01] transition-all"
                        >
                             <div className="absolute top-0 right-0 p-4 opacity-20"><Calendar size={64}/></div>
                             <h3 className="text-blue-100 font-medium mb-1 flex items-center gap-2">
                                 特別休假 (Special Leave) <AlertCircle size={14} />
                             </h3>
                             <div className="text-4xl font-bold mb-2">
                                 {balance.remaining_days} <span className="text-lg font-normal">天</span>
                             </div>
                             <div className="text-xs text-blue-200 flex justify-between">
                                 <span>總額度: {balance.quota_days} 天</span>
                                 <span>已使用: {balance.used_days} 天</span>
                             </div>
                             <div className="mt-4 pt-4 border-t border-white/20 text-xs flex justify-between items-end">
                                 <span>依據勞基法第38條自動計算</span>
                                 <span className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors">點擊查看明細</span>
                             </div>
                        </div>

                        {/* Apply Button Card */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                             <button 
                                onClick={() => handleOpenApply()}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                             >
                                 <Plus size={32} />
                             </button>
                             <span className="mt-3 text-sm font-bold text-slate-700">申請請假</span>
                             <p className="text-xs text-slate-400 mt-1">病假、事假、特休皆由此申請</p>
                        </div>

                        {/* Approval Notification Card (Managers Only) */}
                        {canApprove && (
                            <div 
                                onClick={() => setShowApprovalPanel(true)}
                                className="bg-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden cursor-pointer transform hover:scale-[1.01] transition-all border border-slate-700"
                            >
                                 <div className="absolute top-0 right-0 p-4 opacity-20"><CheckCircle size={64}/></div>
                                 <h3 className="text-slate-300 font-medium mb-1">待核准申請 (Pending)</h3>
                                 <div className="flex items-center gap-3">
                                     <div className="text-4xl font-bold mb-2">{pendingRequests.length}</div>
                                     {pendingRequests.length > 0 && (
                                         <span className="bg-red-500 w-3 h-3 rounded-full animate-ping"></span>
                                     )}
                                 </div>
                                 <div className="text-xs text-slate-400">
                                     來自下屬或待 HR 複核的請求
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-slate-600 text-xs flex justify-between items-end">
                                     <span>點擊開啟核准清單</span>
                                     <span className="text-blue-300">
                                         {user.roles.includes('hr_manager') ? 'HR 複核' : '主管初核'}
                                     </span>
                                 </div>
                            </div>
                        )}
                    </div>

                    {/* Request History */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-700">請假紀錄 (All Leave History)</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">假別</th>
                                    <th className="px-6 py-3">起訖時間</th>
                                    <th className="px-6 py-3">時數</th>
                                    <th className="px-6 py-3">事由</th>
                                    <th className="px-6 py-3">狀態</th>
                                    <th className="px-6 py-3">備註</th>
                                    <th className="px-6 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {req.type_id === 'lt-1' ? '特別休假' : req.type_id === 'lt-2' ? '病假' : '事假'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {req.start_date.replace('T', ' ').slice(0, 16)} <br/> 
                                            <span className="text-xs text-slate-400">至</span> {req.end_date.replace('T', ' ').slice(0, 16)}
                                        </td>
                                        <td className="px-6 py-4">{req.hours} h</td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                req.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                                req.status.includes('Approved') ? 'bg-blue-100 text-blue-700' :
                                                req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {req.handover_user_id && <div>代: {Object.values(MOCK_USERS).find(u=>u.id===req.handover_user_id)?.name}</div>}
                                            {req.rejection_reason && <div className="text-red-500 mt-1">因: {req.rejection_reason}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(req.status === 'Pending' || req.status === 'Rejected' || req.status === 'Manager Approved') && (
                                                <button 
                                                    onClick={() => handleOpenApply(req)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                                                >
                                                    <Edit2 size={12} /> 編輯
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 2: Payroll */}
            {activeTab === 'payroll' && (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">我的薪資單</h2>
                        <div className="flex gap-2">
                            <input 
                                type="month" 
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="border border-slate-300 rounded-lg p-2 text-sm"
                            />
                            <button 
                                onClick={handleGeneratePayslip}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
                            >
                                查詢
                            </button>
                        </div>
                    </div>

                    {isLoadingPayslip && <div className="text-center py-10"><Clock className="animate-spin mx-auto text-blue-500 mb-2"/>計算中...</div>}
                    
                    {!isLoadingPayslip && payslip && (
                        <div className="bg-white shadow-xl border border-slate-200 rounded-lg overflow-hidden animate-fade-in print:shadow-none">
                             {/* Payslip Header */}
                             <div className="bg-slate-50 border-b border-slate-200 p-8 flex justify-between items-start">
                                 <div>
                                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nexus Enterprise</h1>
                                     <p className="text-slate-500 text-sm mt-1">薪資明細表 (Payslip)</p>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-sm text-slate-500">結算月份</div>
                                     <div className="text-xl font-mono font-bold text-slate-800">{payslip.period}</div>
                                 </div>
                             </div>

                             <div className="p-8">
                                 {/* Employee Info */}
                                 <div className="flex justify-between mb-8 pb-4 border-b border-slate-100">
                                     <div>
                                         <p className="text-xs text-slate-400 uppercase">員工姓名</p>
                                         <p className="font-bold text-slate-700">{user.name}</p>
                                     </div>
                                     <div>
                                         <p className="text-xs text-slate-400 uppercase">部門</p>
                                         <p className="font-bold text-slate-700">{user.department.name}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-xs text-slate-400 uppercase">職務加給</p>
                                         <p className="font-bold text-slate-700">{formatCurrency(user.position_allowance || 0)}</p>
                                     </div>
                                 </div>

                                 {/* Details Grid */}
                                 <div className="grid grid-cols-2 gap-10">
                                     {/* Earnings */}
                                     <div>
                                         <h4 className="text-sm font-bold text-green-700 uppercase mb-3 border-b border-green-200 pb-1">應發項目 (Earnings)</h4>
                                         <div className="space-y-3">
                                             {payslip.items.filter(i => i.type === 'earning').map((item, idx) => (
                                                 <div key={idx} className="flex justify-between text-sm">
                                                     <span className="text-slate-600">
                                                         {item.name}
                                                         {item.note && <span className="block text-[10px] text-slate-400">{item.note}</span>}
                                                     </span>
                                                     <span className="font-mono text-slate-800">{formatCurrency(item.amount)}</span>
                                                 </div>
                                             ))}
                                         </div>
                                         <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between font-bold">
                                             <span>應發合計</span>
                                             <span>{formatCurrency(payslip.gross_pay)}</span>
                                         </div>
                                     </div>

                                     {/* Deductions */}
                                     <div>
                                         <h4 className="text-sm font-bold text-red-700 uppercase mb-3 border-b border-red-200 pb-1">應扣項目 (Deductions)</h4>
                                         <div className="space-y-3">
                                             {payslip.items.filter(i => i.type === 'deduction').map((item, idx) => (
                                                 <div key={idx} className="flex justify-between text-sm">
                                                     <span className="text-slate-600">
                                                         {item.name}
                                                         {item.note && <span className="block text-[10px] text-slate-400">{item.note}</span>}
                                                     </span>
                                                     <span className="font-mono text-red-600">{formatCurrency(item.amount)}</span>
                                                 </div>
                                             ))}
                                         </div>
                                         <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between font-bold text-red-700">
                                             <span>應扣合計</span>
                                             <span>{formatCurrency(payslip.gross_pay - payslip.net_pay)}</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Net Pay */}
                                 <div className="mt-10 bg-slate-50 rounded-lg p-6 flex justify-between items-center border border-slate-200">
                                     <div className="text-sm text-slate-500">
                                         實發金額 (Net Pay) <br/>
                                         <span className="text-xs">轉入帳戶: 822-****-****-1234</span>
                                     </div>
                                     <div className="text-3xl font-bold text-slate-900 font-mono">
                                         {formatCurrency(payslip.net_pay)}
                                     </div>
                                 </div>

                                 <div className="mt-8 text-center">
                                     <button className="text-blue-600 text-sm hover:underline flex items-center justify-center gap-2 mx-auto">
                                         <Download size={16}/> 下載 PDF
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Management */}
            {activeTab === 'management' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold">HR 自動化排程中心</h3>
                            <p className="text-slate-400 text-sm">模擬系統每日/每月的自動化批次作業</p>
                        </div>
                        <Briefcase className="text-slate-600 w-12 h-12" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Clock size={18} className="text-blue-500"/> 每日特休計算 (Daily Cron)
                            </h4>
                            <p className="text-sm text-slate-500 mb-4">
                                掃描所有員工的到職日，若今日滿週年，自動更新 Leave_Balances 表並發送通知。
                                (LSA Art. 38)
                            </p>
                            <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors">
                                執行模擬 (Run Once)
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <PieChart size={18} className="text-green-500"/> 專案成本分攤 (Project Cost)
                            </h4>
                            <p className="text-sm text-slate-500 mb-4">
                                根據工時紀錄將薪資成本分攤至專案 P&L。
                                (FUNC_HR_03)
                            </p>
                            <button 
                                onClick={handleRunBatch}
                                disabled={isProcessingBatch}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isProcessingBatch ? '計算中...' : '執行本月分攤 (Run Batch)'}
                            </button>
                        </div>
                    </div>

                    {costTrans.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-700">成本交易預覽 (Preview)</h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        區間: {selectedPeriod}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleExportFullReport}
                                    disabled={isExportingReport}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70"
                                >
                                    {isExportingReport ? <Clock size={14} className="animate-spin"/> : <Download size={14} />}
                                    匯出成本報表
                                </button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">交易 ID</th>
                                        <th className="px-6 py-3">專案名稱 (Project)</th>
                                        <th className="px-6 py-3">計算區間 (Period)</th>
                                        <th className="px-6 py-3">摘要</th>
                                        <th className="px-6 py-3 text-right">金額</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {costTrans.map(tx => (
                                        <tr 
                                            key={tx.id} 
                                            className="hover:bg-blue-50 transition-colors"
                                        >
                                            <td className="px-6 py-3 font-mono text-xs text-blue-600">{tx.id}</td>
                                            <td className="px-6 py-3">
                                                <button 
                                                    onClick={() => handleViewProjectDetail(tx.project_id)}
                                                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    {tx.project_id}
                                                    <ExternalLink size={12} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 text-xs">{tx.date}</td>
                                            <td className="px-6 py-3 text-slate-600">{tx.description}</td>
                                            <td className="px-6 py-3 text-right font-mono">{formatCurrency(tx.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 4: HR Document Repo */}
            {activeTab === 'docs' && (
                <div className="max-w-5xl mx-auto h-full pb-4">
                    <HRDocumentRepo currentUser={user} />
                </div>
            )}

            {/* --- MODALS --- */}

            {/* Special Leave Detail Modal */}
            {showSpecialLeaveModal && balance && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden">
                        <div className="bg-blue-600 text-white p-6 relative">
                            <h3 className="text-xl font-bold">特別休假明細</h3>
                            <p className="text-blue-100 text-sm mt-1">Special Leave Details</p>
                            <button onClick={() => setShowSpecialLeaveModal(false)} className="absolute top-6 right-6 text-blue-200 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">到職日 (Onboard Date)</p>
                                    <p className="font-bold text-slate-700">{user.onboarding_date}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">目前年資 (Seniority)</p>
                                    <p className="font-bold text-slate-700">
                                        {new Date().getFullYear() - parseInt(user.onboarding_date.split('-')[0])} 年
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600">本年度總額度</span>
                                    <span className="font-bold text-slate-800">{balance.quota_days} 天</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600">已使用天數</span>
                                    <span className="font-bold text-orange-600">{balance.used_days} 天</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600">剩餘天數</span>
                                    <span className="font-bold text-blue-600 text-lg">{balance.remaining_days} 天</span>
                                </div>
                            </div>

                            <h4 className="font-bold text-sm text-slate-700 mb-3">使用明細 (History)</h4>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2">日期</th>
                                            <th className="px-3 py-2">時數</th>
                                            <th className="px-3 py-2">狀態</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.filter(r => r.type_id === 'lt-1' && r.status === 'Approved').map(r => (
                                            <tr key={r.id} className="border-t border-slate-100">
                                                <td className="px-3 py-2">{r.start_date.split('T')[0]}</td>
                                                <td className="px-3 py-2">{r.hours} h</td>
                                                <td className="px-3 py-2 text-green-600">已核准</td>
                                            </tr>
                                        ))}
                                        {requests.filter(r => r.type_id === 'lt-1' && r.status === 'Approved').length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-4 text-center text-slate-400">尚無使用紀錄</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Side Panel */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${showApprovalPanel ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
                    <div>
                        <h3 className="font-bold text-lg">假勤核准 (Approval)</h3>
                        <p className="text-xs text-slate-400">
                            {user.roles.includes('hr_manager') ? 'HR Final Approval' : 'Manager Review'}
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowApprovalPanel(false)}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">目前無待核准事項</div>
                    ) : (
                        pendingRequests.map(req => {
                            const applicant = Object.values(MOCK_USERS).find(u => u.id === req.user_id);
                            const isRejecting = rejectingId === req.id;

                            return (
                                <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                                    <div className="flex items-start gap-3 mb-3">
                                        <img src={applicant?.avatar} className="w-10 h-10 rounded-full border border-slate-200" />
                                        <div>
                                            <div className="font-bold text-slate-800">{applicant?.name}</div>
                                            <div className="text-xs text-slate-500">{applicant?.department.name}</div>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                req.status === 'Manager Approved' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">假別:</span>
                                            <span className="font-medium">
                                                {req.type_id === 'lt-1' ? '特別休假' : req.type_id === 'lt-2' ? '病假' : '事假'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">時數:</span>
                                            <span className="font-bold">{req.hours} h</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">日期:</span>
                                            <span>{req.start_date.split('T')[0]}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 mt-2">
                                            <span className="text-slate-400 block text-xs mb-1">事由:</span>
                                            <p className="text-slate-800">{req.reason}</p>
                                        </div>
                                    </div>

                                    {isRejecting ? (
                                        <div className="mt-4 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                                            <label className="block text-xs font-bold text-red-700 mb-1">退回原因:</label>
                                            <textarea 
                                                className="w-full border border-red-300 rounded p-2 text-sm focus:ring-red-500"
                                                rows={2}
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="請輸入原因..."
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button 
                                                    onClick={() => setRejectingId(null)}
                                                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                                                >
                                                    取消
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(req.id)}
                                                    className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700"
                                                >
                                                    確認退回
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 mt-4">
                                            <button 
                                                onClick={() => { setRejectingId(req.id); setRejectReason(''); }}
                                                className="flex-1 border border-slate-300 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-red-600 transition-colors"
                                            >
                                                退回
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(req.id)}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center gap-2"
                                            >
                                                <Check size={16} /> 通過
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Leave Application Slide-over Panel */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${showApplyPanel ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
                    <h3 className="font-bold text-lg">{isEditMode ? '編輯申請' : '申請請假 (Apply Leave)'}</h3>
                    <button 
                        onClick={() => setShowApplyPanel(false)}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">假別 (Type)</label>
                        <select 
                            value={applyType}
                            onChange={(e) => setApplyType(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {MOCK_LEAVE_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 flex items-center gap-2 mb-1">
                            <label className="text-sm font-bold text-slate-700">起訖時間</label>
                            <label className="flex items-center gap-2 cursor-pointer ml-auto">
                                <input 
                                    type="checkbox" 
                                    checked={applyAllDay}
                                    onChange={(e) => {
                                        setApplyAllDay(e.target.checked);
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-slate-600">全日 (All Day)</span>
                            </label>
                        </div>
                        <div>
                            <input 
                                type="date" 
                                value={applyStartDate}
                                onChange={(e) => setApplyStartDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {!applyAllDay && (
                                <input 
                                    type="time" 
                                    value={applyStartTime}
                                    onChange={(e) => setApplyStartTime(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            )}
                        </div>
                        <div className="flex flex-col justify-center items-center text-slate-400">至</div>
                        <div>
                            <input 
                                type="date" 
                                value={applyEndDate}
                                onChange={(e) => setApplyEndDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {!applyAllDay && (
                                <input 
                                    type="time" 
                                    value={applyEndTime}
                                    onChange={(e) => setApplyEndTime(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            自動計算時數 (Auto Calc)
                            {!applyAllDay && <span className="text-xs font-normal text-slate-400 ml-2">(扣除1h休息)</span>}
                        </label>
                        <input 
                            type="number" 
                            value={applyHours}
                            readOnly // Auto calculated
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-slate-100 text-slate-600 focus:ring-0 outline-none cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">職務代理人 (Handover)</label>
                        <select 
                            value={applyHandover}
                            onChange={(e) => setApplyHandover(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">請選擇...</option>
                            {Object.values(MOCK_USERS).filter(u => u.id !== user.id).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department.name})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">請假事由 (Reason)</label>
                        <textarea 
                            rows={3}
                            value={applyReason}
                            onChange={(e) => setApplyReason(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="請詳細說明請假原因..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">附件上傳 (Attachments)</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <Paperclip className="mx-auto text-slate-400 mb-1" size={20} />
                            <span className="text-xs text-slate-500">點擊上傳證明文件 (圖片/PDF)</span>
                        </div>
                        {applyAttachment && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                <Check size={12} /> 已上傳: {applyAttachment}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowApplyPanel(false)}
                        className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSubmitLeave}
                        disabled={isSubmitting || !applyStartDate || !applyType || !applyReason}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Clock size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {isEditMode ? '更新申請' : '送出申請'}
                    </button>
                </div>
            </div>

            {/* Project Cost Detail Modal */}
            {isLoadingProjectDetail && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[60] flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                        <Clock className="animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">載入專案明細中...</span>
                    </div>
                </div>
            )}

            {selectedProjectDetail && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl animate-scale-in overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-slate-900 text-white px-6 py-4 shrink-0 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{selectedProjectDetail.projectName}</h3>
                                <p className="text-blue-200 text-sm mt-1">專案月結明細 ({selectedPeriod})</p>
                            </div>
                            <button onClick={() => setSelectedProjectDetail(null)} className="text-slate-400 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">本月投入成本</p>
                                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(selectedProjectDetail.totalCost)}</p>
                                    <p className="text-xs text-blue-600 mt-1">{selectedProjectDetail.totalHours} hours</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">專案累計成本 (Mock YTD)</p>
                                    <p className="text-2xl font-bold text-slate-600">{formatCurrency(selectedProjectDetail.cumulativeCost)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Total: {selectedProjectDetail.cumulativeHours} hours</p>
                                </div>
                            </div>

                            {/* Monthly Tasks Section */}
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500" /> 
                                本月已完成任務 (Monthly Completed Tasks)
                            </h4>
                            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3">任務 (Task)</th>
                                            <th className="px-4 py-3">負責人</th>
                                            <th className="px-4 py-3 text-right">工時</th>
                                            <th className="px-4 py-3 text-right">成本</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedProjectDetail.tasks.map((task, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                    <div className="text-xs text-slate-400 font-mono mb-0.5">{task.taskId}</div>
                                                    {task.taskTitle}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{task.assigneeName}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{task.hours} h</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(task.cost)}</td>
                                            </tr>
                                        ))}
                                        {selectedProjectDetail.tasks.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">本月無完成任務</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cumulative Person Section */}
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Clock size={16} className="text-blue-500" /> 
                                專案累計明細 (Cumulative by Person)
                            </h4>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3">負責人 (Assignee)</th>
                                            <th className="px-4 py-3 text-right">累計工時 (Total Hours)</th>
                                            <th className="px-4 py-3 text-right">累計成本 (Total Cost)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedProjectDetail.cumulativePersonCosts.map((person, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                    {person.userName}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600">{person.totalHours} h</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(person.totalCost)}</td>
                                            </tr>
                                        ))}
                                        {selectedProjectDetail.cumulativePersonCosts.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">無累計數據</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                            <button 
                                onClick={() => setSelectedProjectDetail(null)}
                                className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

const TabButton = ({ id, label, icon, active, onClick }: { id: HRTab, label: string, icon: React.ReactNode, active: HRTab, onClick: (id: HRTab) => void }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
        active === id 
          ? 'bg-white text-blue-600 border-blue-600' 
          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
);
