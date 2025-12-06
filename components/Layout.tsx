
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ShieldCheck, Users, Menu, FolderKanban, Briefcase } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">N</div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Nexus OS</h1>
            <p className="text-xs text-slate-400">Enterprise Edition</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-3">
            專案與協作
          </div>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <FolderKanban size={18} />
            專案總覽 (Project Hub)
          </NavLink>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">
            人員與行政
          </div>
          <NavLink 
            to="/hr" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <Briefcase size={18} />
            財務與人資中心 (HR)
          </NavLink>
          <NavLink 
            to="/dept-salary" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <Users size={18} />
            部門薪資報表 (Legacy)
          </NavLink>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">
            系統管理
          </div>
          <NavLink 
            to="/settings/roles" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <ShieldCheck size={18} />
            角色權限管理
          </NavLink>
        </nav>

        {/* User Profile */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <img src={user?.avatar} alt="User" className="w-9 h-9 rounded-full border border-slate-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 py-2 rounded-md transition-all duration-200"
          >
            <LogOut size={14} />
            登出系統
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
         <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
            <div className="flex items-center text-slate-500">
               <Menu className="w-5 h-5 mr-3 lg:hidden" />
               <h2 className="text-sm font-medium text-slate-500">
                 Nexus OS / <span className="text-slate-800 font-semibold">Enterprise Workspace</span>
               </h2>
            </div>
            <div className="flex items-center gap-4">
               <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                 {user?.department.name}
               </span>
            </div>
         </header>
         <div className="flex-1 overflow-auto p-6 bg-slate-50">
           <Outlet />
         </div>
      </main>
    </div>
  );
};
