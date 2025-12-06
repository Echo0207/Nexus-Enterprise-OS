import React from 'react';

export const SalaryTestPage: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
        <div>
           <h1 className="text-2xl font-bold text-slate-800">部門薪資報表</h1>
           <p className="text-slate-500">敏感資料區域 (Protected Resource)</p>
        </div>
      </div>
      
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm mb-6">
         <strong>權限驗證成功：</strong> 您能看到此頁面，代表您擁有 <code>salary:view:dept</code> 或 <code>salary:view:all</code> 權限。
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                    <th className="px-6 py-3">員工 ID</th>
                    <th className="px-6 py-3">姓名</th>
                    <th className="px-6 py-3">職稱</th>
                    <th className="px-6 py-3 text-right">薪資 (TWD)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                <tr>
                    <td className="px-6 py-3">E001</td>
                    <td className="px-6 py-3">王大明</td>
                    <td className="px-6 py-3">資深工程師</td>
                    <td className="px-6 py-3 text-right font-mono">95,000</td>
                </tr>
                 <tr>
                    <td className="px-6 py-3">E002</td>
                    <td className="px-6 py-3">李小美</td>
                    <td className="px-6 py-3">產品經理</td>
                    <td className="px-6 py-3 text-right font-mono">88,000</td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
};