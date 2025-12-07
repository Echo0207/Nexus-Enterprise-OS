
import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { permissionService } from '../services/permissionService';
import { Role, Permission, Delegation, User } from '../types';
import { Users, Save, Shield, Check, Loader2, AlertCircle, UserPlus, Clock, X } from 'lucide-react';
import { MOCK_USERS } from '../services/mockData';

export const RoleManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'delegation'>('roles');
  
  // Roles Tab State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  
  // Delegation Tab State
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string} | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesData, permsData, delData] = await Promise.all([
          authService.getRoles(),
          authService.getAllPermissions(),
          permissionService.getDelegations()
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
        setDelegations(delData);
        if (rolesData.length > 0) {
          setSelectedRoleId(rolesData[0].id);
        }
      } catch (err) {
        console.error("Failed to load RBAC data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Role Logic
  const togglePermission = (permId: string) => {
    if (!selectedRole) return;
    const currentPerms = new Set(selectedRole.permissionIds);
    if (currentPerms.has(permId)) {
      currentPerms.delete(permId);
    } else {
      currentPerms.add(permId);
    }
    const updatedRoles = roles.map(r => {
      if (r.id === selectedRole.id) {
        return { ...r, permissionIds: Array.from(currentPerms) };
      }
      return r;
    });
    setRoles(updatedRoles);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await authService.updateRolePermissions(selectedRole.id, selectedRole.permissionIds);
      setFeedback({ type: 'success', msg: '權限更新成功！' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', msg: '更新失敗' });
    } finally {
      setSaving(false);
    }
  };

  // Delegation Logic
  const handleToggleDelegation = async (id: string, currentStatus: boolean) => {
      if (currentStatus) {
          await permissionService.revokeDelegation(id);
      } else {
          // Re-activate not implemented in mock service properly but simulating toggle for UI
      }
      const updated = await permissionService.getDelegations();
      setDelegations(updated);
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const mod = perm.module || 'OTHER';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-end border-b border-slate-200 pb-1">
        <div className="flex space-x-1">
            <button 
                onClick={() => setActiveTab('roles')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${activeTab === 'roles' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
                <Shield size={16}/> 角色權限矩陣
            </button>
            <button 
                onClick={() => setActiveTab('delegation')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${activeTab === 'delegation' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
                <UserPlus size={16}/> 職務代理監控
            </button>
        </div>
        {feedback && (
            <div className={`px-4 py-2 mb-2 rounded-lg text-sm font-medium flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {feedback.msg}
            </div>
        )}
      </div>

      {activeTab === 'roles' && (
        <div className="flex flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Left Column: Role List */}
            <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Users size={18} /> 全域角色 (Global Roles)
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {(roles as Role[]).map(role => (
                <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedRoleId === role.id 
                        ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-100' 
                        : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                >
                    <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold ${selectedRoleId === role.id ? 'text-blue-700' : 'text-slate-800'}`}>
                        {role.name}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">{role.key}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{role.description}</p>
                </button>
                ))}
            </div>
            </div>

            {/* Right Column: Permission Matrix */}
            <div className="w-2/3 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Shield size={18} /> 權限配置
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    正在編輯: <span className="font-bold text-blue-600">{selectedRole?.name}</span>
                </p>
                </div>
                <button 
                onClick={handleSaveRole}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                儲存變更
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {Object.entries(groupedPermissions).map(([moduleName, groupPerms]: [string, Permission[]]) => (
                <div key={moduleName} className="mb-8 last:mb-0">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pl-1 border-l-4 border-blue-400">
                        {moduleName} 模組
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupPerms.map(perm => {
                        const isChecked = selectedRole?.permissionIds.includes(perm.id);
                        return (
                            <label 
                            key={perm.id} 
                            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                                isChecked 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                            >
                            <div className="flex items-center h-5">
                                <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.id)}
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <span className={`font-medium block ${isChecked ? 'text-blue-800' : 'text-slate-700'}`}>
                                {perm.name}
                                </span>
                                <span className="text-xs text-slate-500 block mt-0.5">{perm.description}</span>
                                <code className="text-[10px] text-slate-400 font-mono mt-1 block bg-slate-100 w-fit px-1 rounded">
                                {perm.slug}
                                </code>
                            </div>
                            </label>
                        );
                        })}
                    </div>
                </div>
                ))}
            </div>
            </div>
        </div>
      )}

      {activeTab === 'delegation' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-lg font-bold text-slate-800">職務代理監控 (Delegation Monitor)</h2>
                      <p className="text-sm text-slate-500">檢視系統內目前生效的權限轉移紀錄。</p>
                  </div>
                  <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-700">
                      <PlusIcon /> 新增代理
                  </button>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-4">授權人 (From)</th>
                              <th className="px-6 py-4">被授權人 (To)</th>
                              <th className="px-6 py-4">轉移角色 (Role)</th>
                              <th className="px-6 py-4">有效期間 (Period)</th>
                              <th className="px-6 py-4">原因</th>
                              <th className="px-6 py-4">狀態</th>
                              <th className="px-6 py-4 text-right">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {delegations.map(del => {
                              const fromUser = Object.values(MOCK_USERS).find(u => u.id === del.from_user_id);
                              const toUser = Object.values(MOCK_USERS).find(u => u.id === del.to_user_id);
                              const roleName = roles.find(r => r.key === del.role_key)?.name || del.role_key;
                              const isActive = del.is_active;

                              return (
                                  <tr key={del.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 flex items-center gap-2">
                                          <img src={fromUser?.avatar} className="w-6 h-6 rounded-full"/>
                                          {fromUser?.name}
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                            <img src={toUser?.avatar} className="w-6 h-6 rounded-full"/>
                                            {toUser?.name}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 rounded">
                                          {roleName}
                                      </td>
                                      <td className="px-6 py-4 text-slate-500">
                                          <div className="flex items-center gap-1">
                                              <Clock size={12}/>
                                              {del.start_at} ~ {del.end_at}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-slate-600">{del.reason}</td>
                                      <td className="px-6 py-4">
                                          {isActive ? (
                                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                                          ) : (
                                              <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">Inactive</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          {isActive && (
                                              <button 
                                                onClick={() => handleToggleDelegation(del.id, true)}
                                                className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-xs font-bold border border-red-200"
                                              >
                                                  終止授權
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
