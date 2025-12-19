"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "@/utils/api.config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";

// --- TYPES ---
interface StudentData {
    student_code: string;
    name: string;
    image_path: string; // Registered Photo
    proof_path: string | null; // Last detection snapshot
    check_in_time: string | null;
    status: "PRESENT" | "ABSENT" | "LATE";
    detection_count?: number; // New field
}

interface SessionInfo {
    topic: string;
    room: string;
    subject_id: number;
    professor_id: number;
}


export default function MonitorPage() {
  const router = useRouter();
  
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- SORTING STATE ---
  type SortMode = "TIME_ASC" | "TIME_DESC" | "NAME_ASC" | "CODE_ASC";
  const [sortMode, setSortMode] = useState<SortMode>("TIME_DESC");

  // --- POLLING ---
  useEffect(() => {
    const fetchMonitorData = async () => {
        try {
            const liveRes = await fetch(`${getApiUrl()}/attendance/live`);
            const liveData = await liveRes.json();
            
            if (liveData.status === "active" && liveData.session_id) {
                const listRes = await fetch(`${getApiUrl()}/session/monitor?session_id=${liveData.session_id}`);
                if (listRes.ok) {
                    const listData = await listRes.json();
                    setActiveSession(listData.session_info);
                    setStudents(listData.students);
                }
            } else {
                setActiveSession(null);
                setStudents([]);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 2000); 
    return () => clearInterval(interval);
  }, []);

  // --- SORTING LOGIC ---
  const getSortedStudents = () => {
      const sorted = [...students];
      switch(sortMode) {
          case "TIME_ASC": // Earliest First
             sorted.sort((a,b) => {
                 if(!a.check_in_time) return 1;
                 if(!b.check_in_time) return -1;
                 return a.check_in_time.localeCompare(b.check_in_time);
             });
             break;
          case "TIME_DESC": // Latest First (Default)
             sorted.sort((a,b) => {
                 if(!a.check_in_time) return 1; // Absents at bottom
                 if(!b.check_in_time) return -1;
                 return b.check_in_time.localeCompare(a.check_in_time);
             });
             break;
          case "NAME_ASC":
             sorted.sort((a,b) => a.name.localeCompare(b.name));
             break;
          case "CODE_ASC":
             sorted.sort((a,b) => a.student_code.localeCompare(b.student_code));
             break;
      }
      return sorted;
  };

  // --- STATS ---
  const total = students.length;
  const present = students.filter(s => s.status !== "ABSENT").length;
  const absent = total - present;


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white p-6">
        {/* --- HEADER --- */}
        <header className="mb-8 border-b border-gray-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                      ←
                  </Link>
                  <div>
                     <h1 className="text-3xl font-bold text-white tracking-tight">Monitor Class</h1>
                     {activeSession ? (
                         <p className="text-gray-400 font-mono mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                            {activeSession.topic} <span className="text-gray-600">|</span> Room {activeSession.room}
                         </p>
                     ) : (
                         <p className="text-gray-500">No active session</p>
                     )}
                  </div>
              </div>

              {/* ACTION BAR */}
              {activeSession && (
                  <div className="flex flex-wrap items-center gap-3">
                     {/* STATS GROUP */}
                     <div className="flex rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
                         <div className="px-4 py-2 border-r border-gray-800">
                             <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                             <p className="text-xl font-mono font-bold text-white">{total}</p>
                         </div>
                         <div className="px-4 py-2 border-r border-gray-800 bg-green-900/10">
                             <p className="text-xs text-green-500 uppercase font-bold">Present</p>
                             <p className="text-xl font-mono font-bold text-green-400">{present}</p>
                         </div>
                         <div className="px-4 py-2 bg-red-900/10">
                             <p className="text-xs text-red-500 uppercase font-bold">Absent</p>
                             <p className="text-xl font-mono font-bold text-red-400">{absent}</p>
                         </div>
                     </div>
                     
                     {/* EXPORT BUTTON */}
                     <Link 
                       href={`/export?subject_id=${activeSession.subject_id}&room=${activeSession.room}`} 
                       className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
                     >
                         📄 Export CSV
                     </Link>
                  </div>
              )}
          </div>
        </header>
        
        {/* --- CONTENT --- */}
        {!activeSession ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-600">
                <div className="text-6xl mb-4 opacity-50">📡</div>
                <h2 className="text-2xl font-bold text-gray-500">Waiting for class...</h2>
                <p>Start a session from Dashboard.</p>
            </div>
        ) : (
            <div>
                {/* SORT TOOLBAR */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                   {[
                      {id: "TIME_DESC", label: "Latest First"},
                      {id: "TIME_ASC", label: "Earliest First"},
                      {id: "NAME_ASC", label: "Name A-Z"},
                      {id: "CODE_ASC", label: "Code 0-9"}
                   ].map((opt) => (
                       <button
                          key={opt.id}
                          onClick={() => setSortMode(opt.id as SortMode)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              sortMode === opt.id 
                              ? "bg-white text-black border-white" 
                              : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-600"
                          }`}
                       >
                          {opt.label}
                       </button>
                   ))}
                </div>
            
                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {getSortedStudents().map((student) => {
                       const isPresent = student.status !== "ABSENT";
                       
                       return (
                           <div 
                               key={student.student_code} 
                               className={`
                                  relative group overflow-hidden rounded-xl border transition-all duration-300
                                  ${isPresent 
                                      ? "bg-gray-900 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:border-green-500/60" 
                                      : "bg-gray-900/50 border-gray-800 opacity-70 hover:opacity-100 hover:border-gray-600"
                                  }
                               `}
                           >
                               <div className="flex h-64">
                                   {/* LEFT COL: LIVE SNAPSHOT (Strict) */}
                                   <div className="w-1/2 h-full relative border-r border-gray-800 bg-black">
                                       <img 
                                          src={(isPresent && student.proof_path) 
                                              ? `${getApiUrl()}${student.proof_path.startsWith('/') ? '' : '/'}${student.proof_path}` 
                                              : "https://placehold.co/400x600/000000/333333?text=No+Img"} 
                                          className={`w-full h-full object-cover transition ${isPresent ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                          alt="Student"
                                       />
                                       {/* Detection Count Badge */}
                                       {isPresent && (
                                           <div className="absolute top-1 left-1 right-1 bg-black/60 backdrop-blur text-[10px] text-center text-green-400 py-0.5 rounded border border-green-900/50">
                                               Seen: <span className="font-bold text-white">{student.detection_count || 0}</span>
                                           </div>
                                       )}
                                   </div>
                                   
                                   {/* RIGHT COL: INFO */}
                                   <div className="w-1/2 p-4 flex flex-col justify-between relative">
                                       {/* TOP INFO */}
                                       <div>
                                           <p className="text-xs font-mono text-gray-500 mb-0.5">#{student.student_code}</p>
                                           <h3 className="font-bold text-white text-lg leading-tight line-clamp-2" title={student.name}>
                                               {student.name}
                                           </h3>
                                       </div>
                                       
                                       {/* BOTTOM STATUS */}
                                       <div>
                                           {isPresent ? (
                                               <div className="flex items-center justify-between">
                                                  <div className="flex flex-col">
                                                      <span className="text-[10px] text-gray-500 uppercase font-bold">Last Seen</span>
                                                      <span className="font-mono text-sm text-green-400">
                                                          {student.check_in_time?.split(" ")[1].slice(0,5)}
                                                      </span>
                                                  </div>
                                                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"/>
                                               </div>
                                           ) : (
                                                <span className="inline-block px-2 py-1 bg-gray-800 text-gray-500 text-xs font-bold rounded">
                                                    ABSENT
                                                </span>
                                           )}
                                       </div>
                                   </div>
                               </div>
                               
                               {/* OVERLAY: VIEW SNAPSHOT */}
                               {student.proof_path && (
                                   <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                       {/* Just a visual indication that they can see details if we added a modal. 
                                           For now, just simpler UI as requested. 
                                           Or we can show the SNAPSHOT on hover?
                                        */}
                                   </div>
                               )}
                               
                               {/* Hover Effect: Show Snapshot instead of Registered Image? 
                                   User said: "Pic separate column... Large...". 
                                   Let's keep registered image as main because it's cleaner.
                               */}
                           </div>
                       );
                   })}
                </div>
            </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
