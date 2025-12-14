"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import LiveFeed from "../components/dashboard/LiveFeed"; // Reuse existing
import AttendanceLog from "../components/dashboard/AttendanceLog"; // Reuse existing
import { getApiUrl } from "@/utils/api.config";

interface Subject {
  id: number;
  code: string;
  name: string;
  student_count?: number;
}

export default function CheckNamePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [step, setStep] = useState<"SETUP" | "ACTIVE">("SETUP");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [room, setRoom] = useState("");
  
  // Session State
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [logs, setLogs] = useState([]);
  
  // Load Subjects on Mount
  useEffect(() => {
    const fetchSubjects = async () => {
        try {
            const token = document.cookie.split("access_token=")[1]?.split(";")[0];
            const res = await fetch(`${getApiUrl()}/subjects`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
               const data = await res.json();
               setSubjects(data);
            }
        } catch(e) {}
    };
    fetchSubjects();
  }, []);

  const handleStartClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = document.cookie.split("access_token=")[1]?.split(";")[0]; // Quick hack
    
    try {
      const res = await fetch(`${getApiUrl()}/start_class`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: sessionTopic,
          subject_code: selectedSubject,
          room: room
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      setActiveSessionId(data.session_id);
      setStep("ACTIVE");
    } catch (err) {
      alert("Failed to start class: " + err);
    }
  };
  
  // Polling for Logs
  useEffect(() => {
    if (step !== "ACTIVE") return;
    
    const interval = setInterval(async () => {
       try {
         const res = await fetch(`${getApiUrl()}/attendance/live`);
         const data = await res.json();
         if (data.status === "active") {
             setLogs(data.logs);
         }
       } catch (e) {
         console.error(e);
       }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [step]);
  
  const handleEndClass = async () => {
      // API call to end
      const token = document.cookie.split("access_token=")[1]?.split(";")[0];
      await fetch(`${getApiUrl()}/end_class`, { 
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
      });
      setStep("SETUP");
      setLogs([]);
      setActiveSessionId(null);
  };


  // Registration Toggle
  const [isRegOpen, setIsRegOpen] = useState(false);
  
  const toggleRegistration = async () => {
    try {
        const newState = !isRegOpen;
        await fetch(`${getApiUrl()}/session/toggle_registration?enable=${newState}`, { method: "POST" });
        setIsRegOpen(newState);
    } catch(e) { alert("Error toggling registration"); }
  };
  
  const copyLink = () => {
      const url = `http://localhost:3000/register?class_id=${subjects.find(s=>s.code===selectedSubject)?.id}`; // Assuming we had ID map
      // For MVP, if we don't have ID map handy in state, just generic.
      // But we do! subjects has ID.
      // Wait, subjects state is [{id...}].
      const sid = subjects.find(s=>s.code===selectedSubject)?.id || "";
      const base = window.location.origin; // Dynamically get http://ip:3000
      const fullUrl = `${base}/register?class_id=${sid}`;
      navigator.clipboard.writeText(fullUrl);
      alert("Link copied: " + fullUrl);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {step === "SETUP" ? (
         // ... existing setup form ...
         <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl mt-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-400">Start Attendance Check</h1>
            <button
               onClick={() => router.push("/dashboard")}
               className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to Dashboard
            </button>
          </div>
          
          <form onSubmit={handleStartClass} className="space-y-6">
            <div>
              <label className="block text-gray-400 mb-2">Select Class</label>
              <select 
                className="w-full bg-gray-700 p-3 rounded text-white border border-gray-600"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                required
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Session Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-700 p-3 rounded text-white border border-gray-600"
                    placeholder="e.g. Week 1 Lecture"
                    value={sessionTopic}
                    onChange={e => setSessionTopic(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Room Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-700 p-3 rounded text-white border border-gray-600"
                    placeholder="e.g. 404"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    required
                  />
                </div>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded font-bold text-lg">
              Start Class
            </button>
            
          </form>
        </div>
      ) : (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-blue-400">{selectedSubject}: {sessionTopic}</h2>
                        <p className="text-gray-400">Room: {room}</p>
                    </div>
                    
                    {/* REMOTE TOGGLES */}
                    <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Registration</span>
                            <button 
                                onClick={toggleRegistration}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${isRegOpen ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`h-4 w-4 bg-white rounded-full transition-transform ${isRegOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="w-px h-8 bg-gray-700" />
                        <button onClick={copyLink} className="text-blue-400 hover:text-blue-300 text-sm font-bold flex flex-col items-center">
                            <span>🔗</span>
                            <span>Copy Link</span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <a 
                        href={`${getApiUrl()}/export/attendance${(() => {
                            const sid = subjects.find(s => s.code === selectedSubject)?.id;
                            return sid ? `?subject_id=${sid}` : "";
                        })()}`}
                        target="_blank"
                        className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold flex items-center gap-2"
                    >
                        📄 Export CSV
                    </a>
                    <button onClick={handleEndClass} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-bold">
                        End Class
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                {/* LIVE FEED */}
                <div className="lg:col-span-8 bg-black rounded-xl overflow-hidden relative shadow-lg aspect-video flex items-center justify-center">
                   {/* We reuse the existing LiveFeed logic but simplified for embedding */}
                    <img 
                      src={`${getApiUrl()}/video_feed`} 
                      className="w-full h-full object-cover"
                      alt="Live Feed"
                    />
                    
                    {/* OVERLAY STATS */}
                    <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded backdrop-blur">
                        <span className="text-green-400 font-bold">● Active</span>
                    </div>
                </div>
                
                {/* LOGS */}
                <div className="lg:col-span-4 bg-gray-800 rounded-xl p-4 flex flex-col h-[600px]">
                    <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2 flex justify-between">
                        <span>Attendance Log</span>
                        <span className="text-green-400">{logs.length} / {subjects.find(s=>s.code===selectedSubject)?.student_count || "-"}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2">
                         {logs.map((log: any, i) => (
                             <div key={i} className="flex justify-between items-center p-3 bg-gray-700/50 rounded hover:bg-gray-700 transition border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold relative overflow-hidden">
                                        {/* If we have an image, show it? For check name, user asked for "Latest Name Top". */}
                                        {log.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{log.name}</p>
                                        <p className="text-xs text-gray-400">{log.student_code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {/* Removed Status Text as requested */}
                                    <p className="text-xs text-gray-400 font-mono">{log.check_in_time.split(" ")[1]}</p>
                                </div>
                             </div>
                         ))}
                         {logs.length === 0 && <p className="text-center text-gray-500 mt-10">Waiting for students...</p>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
