import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { Role, Permission } from '../types';
import { Users, Save, Shield, Check, Loader2, AlertCircle } from 'lucide-react';

export const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string} | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesData, permsData] = await Promise.all([
          authService.getRoles(),
          authService.getAllPermissions()
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
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

  // Toggle permission logic
  const togglePermission = (permId: string) => {
    if (!selectedRole) return;
    
    // Prevent modifying Superuser logic visually (optional UI enhancement)
    if (selectedRole.id === 'role_admin' && permId === 'p7') {
         // Optionally block editing admin permissions
    }

    const currentPerms = new Set(selectedRole.permissionIds);
    if (currentPerms.has(permId)) {
      currentPerms.delete(permId);
    } else {
      currentPerms.add(permId);
    }
    
    // Update local state optimistically
    const updatedRoles = roles.map(r => {
      if (r.id === selectedRole.id) {
        return { ...r, permissionIds: Array.from(currentPerms) };
      }
      return r;
    });
    setRoles(updatedRoles);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setFeedback(null);
    try {
      await authService.updateRolePermissions(selectedRole.id, selectedRole.permissionIds);
      setFeedback({ type: 'success', msg: '權限更新成功！緩存已清除。' });
      // Auto dismiss feedback
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', msg: '更新失敗，請稍後再試。' });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category for the Tree View
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">角色權限管理</h1>
          <p className="text-slate-500 mt-1">配置系統角色與其對應的功能權限 (RBAC)</p>
        </div>
        {feedback && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {feedback.msg}
            </div>
        )}
      </div>

      <div className="flex flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Left Column: Role List */}
        <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Users size={18} />
              角色列表
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
                   {role.id === 'role_admin' && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">System</span>}
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
                <Shield size={18} />
                權限配置
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                 正在編輯: <span className="font-bold text-blue-600">{selectedRole?.name}</span>
              </p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              儲存變更
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
             {Object.entries(groupedPermissions).map(([category, groupPerms]: [string, Permission[]]) => (
               <div key={category} className="mb-8 last:mb-0">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pl-1 border-l-4 border-blue-400">
                    {category}
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
                            <code className="text-[10px] text-slate-400 font-mono mt-0.5 block">
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
    </div>
  );
};