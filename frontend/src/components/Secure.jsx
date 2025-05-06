import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Secure = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4">
      <div className="bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl p-10 max-w-xl text-center">
        <div className="flex flex-col items-center space-y-4">
          <ShieldCheck size={48} className="text-green-400" />
          <h1 className="text-3xl font-bold">Dummy Secured Area</h1>
          <p className="text-gray-400">
            Access granted. This page contains <span className="text-red-500 font-semibold">confidential information</span> and is available only to authenticated users.
          </p>
          <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4 w-full text-left">
            <h2 className="text-lg font-semibold text-green-300 mb-2">🛡️ Critical System Logs</h2>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• API token last rotated: <span className="text-white">2 hours ago</span></li>
              <li>• Active sessions: <span className="text-white">3 devices</span></li>
              <li>• Failed login attempts: <span className="text-white">1 from unknown IP</span></li>
              <li>• Admin alerts: <span className="text-red-400">2 unresolved</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Secure;
