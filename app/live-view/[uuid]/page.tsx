"use client";

import { useState, useEffect, use } from "react";
import { getApiUrl } from "@/utils/api.config";

export default function LiveViewPage({ params }: { params: Promise<{ uuid: string }> }) {
  // Unwrap params using React.use()
  const { uuid } = use(params);

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Polling for Sidebar Logs
  useEffect(() => {
    let isMounted = true;
    
    // Initial Fetch
    const fetchLogs = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/session/${uuid}/logs`);
            if (!res.ok) {
                 if (res.status === 404) setError("Session not found");
                 return;
            }
            const data = await res.json();
            if (isMounted) {
                setLogs(data);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    fetchLogs();
    
    // Poll every 2s
    const interval = setInterval(fetchLogs, 2000);
    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [uuid]);

  if (error) {
      return (
          <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
              <h1 className="text-3xl font-bold">{error}</h1>
          </div>
      );
  }

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* LEFT: FULLSCREEN CAMERA */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {/* We use the cleaner video feed endpoint */}
        <img 
            src={`${getApiUrl()}/video_feed`}  
            className="w-full h-full object-contain"
            alt="Live Feed"
        />
        
        {/* STATUS INDICATOR */}
        <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
            <span className="font-bold tracking-wide text-sm font-mono">LIVE ATTENDANCE</span>
        </div>
      </div>

      {/* RIGHT: SIDEBAR LOG */}
      <div className="w-[400px] bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl z-10">
         {/* HEADER */}
         <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
             <h2 className="text-xl font-bold text-white mb-1">Recent Check-ins</h2>
             <p className="text-gray-400 text-sm">Real-time attendance log</p>
         </div>

         {/* LOG LIST */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {logs.map((log, i) => (
                <div 
                    key={`${log.student_code}-${i}`} 
                    className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all animate-in slide-in-from-right-4 fade-in duration-300"
                >
                    {/* AVATAR: REGISTERED PHOTO */}
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-500/50 shadow-lg bg-gray-700">
                             {/* Correctly constructing the gallery URL */}
                             <img 
                                src={`${getApiUrl()}/${log.image_path}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if image fails
                                    (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + log.name;
                                }}
                                alt={log.name} 
                             />
                        </div>
                        {/* TIMESTAMP BADGE */}
                         <div className="absolute -bottom-1 -right-1 bg-gray-900 text-xs font-mono text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                            {log.check_in_time.split(" ")[1].slice(0,5)}
                         </div>
                    </div>
                    
                    {/* TEXT INFO */}
                    <div className="min-w-0">
                        <h3 className="font-bold text-white text-lg truncate leading-tight">{log.name}</h3>
                        <p className="text-blue-400 font-mono text-sm">{log.student_code}</p>
                    </div>
                </div>
            ))}
            
            {logs.length === 0 && !loading && (
                <div className="text-center py-20 opacity-50">
                    <div className="text-4xl mb-4">📷</div>
                    <p>Waiting for students...</p>
                </div>
            )}
         </div>
         
         {/* FOOTER STATS */}
         <div className="p-4 border-t border-gray-800 bg-gray-900">
             <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                 <span className="text-gray-400 text-sm">Total Detected</span>
                 <span className="text-xl font-bold text-green-400">{logs.length}</span>
             </div>
         </div>
      </div>
    </div>
  );
}
