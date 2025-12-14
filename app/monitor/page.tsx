"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "@/utils/api.config";
import Cookies from "js-cookie";
import Link from "next/link";

interface StudentStatus {
    student_code: string;
    name: string;
    image_path: string;
    proof_path: string | null;
    check_in_time: string | null;
    status: "PRESENT" | "ABSENT" | "LATE";
}

export default function MonitorPage() {
  const { isLoading: authLoading } = useAuth();
  
  const [activeSession, setActiveSession] = useState<any>(null);
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll for data
  useEffect(() => {
    const fetchMonitorData = async () => {
        try {
            // 1. Find Active Session ID first
            const liveRes = await fetch(`${getApiUrl()}/attendance/live`);
            const liveData = await liveRes.json();
            
            if (liveData.status === "active" && liveData.session_id) {
                // 2. Fetch Full List
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
    const interval = setInterval(fetchMonitorData, 2000); // 2s refresh
    return () => clearInterval(interval);
  }, []);

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back</Link>
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                  Remote Monitor
                </h1>
                {activeSession && (
                    <p className="text-sm text-gray-400">
                        {activeSession.topic} ({activeSession.room})
                    </p>
                )}
            </div>
        </div>
        
        {activeSession && (
             <div className="flex gap-4 text-sm font-bold">
                <div className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg border border-green-800">
                    Present: {students.filter(s => s.status !== 'ABSENT').length}
                </div>
                <div className="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg border border-red-800">
                    Absent: {students.filter(s => s.status === 'ABSENT').length}
                </div>
                <button 
                    onClick={async () => {
                         try {
                              // AUTH REMOVED - using ID
                              const subjectId = activeSession.subject_id;
                              let exportUrl = `${getApiUrl()}/export/attendance?subject_id=${subjectId}`;
                              if (activeSession.professor_id) {
                                  exportUrl += `&professor_id=${activeSession.professor_id}`;
                              }
                              
                              const res = await fetch(exportUrl);
                              
                              if (!res.ok) throw new Error("Export failed");
                              
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `attendance_class_${subjectId}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                         } catch (e) {
                             alert("Failed to export csv");
                         }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold border border-blue-500 flex items-center gap-2 transition-colors cursor-pointer"
                >
                    📄 Export CSV
                </button>
             </div>
        )}
      </header>

      {!activeSession ? (
         <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
             <div className="text-4xl mb-4">💤</div>
             <p className="text-xl">No active class session found.</p>
             <p className="text-sm mt-2">Start a class from the Dashboard to see it here.</p>
         </div>
      ) : (
         <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            <table className="w-full text-left">
                <thead className="bg-gray-750 border-b border-gray-600 bg-gray-900/50">
                    <tr>
                        <th className="p-4 text-gray-400 font-medium">Student Code</th>
                        <th className="p-4 text-gray-400 font-medium">Name</th>
                        <th className="p-4 text-gray-400 font-medium text-center">Time</th>
                        <th className="p-4 text-gray-400 font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {students.map((student) => {
                        const isPresent = student.status !== 'ABSENT';
                        return (
                            <tr key={student.student_code} className={`transition-colors ${isPresent ? 'bg-green-900/10' : 'hover:bg-gray-750'}`}>
                                <td className="p-4 font-mono text-gray-300">{student.student_code}</td>
                                <td className="p-4 font-bold text-white flex items-center gap-3">
                                    {student.proof_path ? (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-green-500/50 shadow-sm relative group">
                                            <img src={`${getApiUrl()}${student.proof_path}`} className="w-full h-full object-cover" />
                                            {/* Hover Zoom Preview */}
                                            <div className="hidden group-hover:block absolute top-0 left-14 w-48 h-auto z-50 rounded-lg border border-green-400 shadow-2xl bg-black">
                                                 <img src={`${getApiUrl()}${student.proof_path}`} className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold ${isPresent ? 'bg-green-600' : 'bg-gray-600'}`}>
                                            {student.name[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold whitespace-nowrap">{student.name}</p>
                                    </div>
                                </td>
                                <td className="p-4 text-center text-gray-400">
                                    {student.check_in_time ? student.check_in_time.split(' ')[1] : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        isPresent 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]' 
                                        : 'bg-red-500/10 text-red-500 border border-red-500/30'
                                    }`}>
                                        {student.status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
         </div>
      )}
    </div>
  );
}
