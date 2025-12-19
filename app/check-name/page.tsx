"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LiveFeed from "../components/dashboard/LiveFeed"; // Reuse existing
import AttendanceLog from "../components/dashboard/AttendanceLog"; // Reuse existing
import { getApiUrl } from "@/utils/api.config";
import ProtectedRoute from "../components/ProtectedRoute";

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
  const [recentSessions, setRecentSessions] = useState<any[]>([]); // New State
  
  // Session State
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSessionUuid, setActiveSessionUuid] = useState<string | null>(null); // New State
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

    // Check Active Session
    const checkActive = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/attendance/live`);
            const data = await res.json();
            if (data.status === "active") {
                // RESTORE STATE
                setActiveSessionId(data.session_id);
                setActiveSessionUuid(data.session_uuid);
                setSessionTopic(data.topic);
                setRoom(data.room);
                setSelectedSubject(data.subject_code);
                setLogs(data.logs);
                setStep("ACTIVE");
            }
        } catch (e) {
            console.error("Failed to check active session", e);
        }
    };

    fetchSubjects();
    checkActive();
  }, []);

  // Fetch Recent Sessions when Subject Changes
  useEffect(() => {
     if (!selectedSubject) {
         setRecentSessions([]);
         return;
     }
     
     const subj = subjects.find(s => s.code === selectedSubject);
     if (subj) {
         fetch(`${getApiUrl()}/api/sessions/recent?subject_id=${subj.id}`)
            .then(res => res.json())
            .then(data => setRecentSessions(data.slice(0, 5))) // Limit to 5
            .catch(err => console.error(err));
     }
  }, [selectedSubject, subjects]);

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
      setActiveSessionUuid(data.session_uuid);
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white font-sans p-6 md:p-12">
        {step === "SETUP" ? (
           <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-10">
            
            {/* LEFT: FORM */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
              <div className="mb-8">
                  <Link href="/dashboard" className="text-gray-500 hover:text-white mb-4 block">← Back</Link>
                  <h1 className="text-3xl font-bold text-white mb-2">New Session</h1>
                  <p className="text-gray-400">Configure attendance settings for this class.</p>
              </div>
              
              <form onSubmit={handleStartClass} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Class / Subject</label>
                  <select 
                    className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition"
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
                
                <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Session Topic</label>
                      <input 
                        type="text" 
                        className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition"
                        placeholder="e.g. Lab 01: Python Basics"
                        value={sessionTopic}
                        onChange={e => setSessionTopic(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Room</label>
                      <input 
                        type="text" 
                        className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white focus:border-blue-500 outline-none transition"
                        placeholder="e.g. 505"
                        value={room}
                        onChange={e => setRoom(e.target.value)}
                        required
                      />
                    </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02]"
                >
                  Start / Resume Session
                </button>
              </form>
            </div>

            {/* RIGHT: RECENT SESSIONS (Popup/List Requirement) */}
            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-6">Recent Active Sessions</h2>
                <div className="space-y-4">
                    
                    {recentSessions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                             {recentSessions.map((sess, i) => (
                                 <button 
                                   key={i}
                                   type="button"
                                   onClick={() => {
                                       setSessionTopic(sess.topic);
                                   }}
                                   className="text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition flex justify-between items-center group"
                                 >
                                     <div>
                                         <p className="font-bold text-white">{sess.topic}</p>
                                         <p className="text-xs text-gray-400">{sess.date} • {sess.start_time}</p>
                                     </div>
                                     <span className="text-blue-400 opacity-0 group-hover:opacity-100 text-sm">Use →</span>
                                 </button>
                             ))}
                        </div>
                    ) : (
                         <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 opacity-60">
                             <p className="text-sm text-gray-400">
                                  {selectedSubject 
                                      ? "No recent sessions found for this class." 
                                      : "Select a subject to see recent sessions..."
                                  }
                             </p>
                         </div>
                    )}
                     
                     {/* Hint */}
                     <div className="mt-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                         <p className="text-sm text-blue-400">
                             ℹ️ <strong>Auto-Resume:</strong> If you enter the same Session Name for the selected Class, 
                             the system will automatically resume the existing session.
                         </p>
                     </div>
                </div>
            </div>
            
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-6xl mx-auto mt-6">
              <header className="flex justify-between items-center mb-8 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
                  <div>
                      <span className="text-xs font-bold text-green-500 uppercase tracking-widest">● Active Session</span>
                      <h2 className="text-3xl font-bold text-white mt-1">{sessionTopic}</h2>
                      <p className="text-gray-400">{selectedSubject} • Room {room}</p>
                  </div>
                  
                  <div className="flex gap-4">
                       {/* End Class */}
                      <button onClick={handleEndClass} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-6 py-3 rounded-xl font-bold transition-colors">
                          End Session
                      </button>
                  </div>
              </header>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* CONTROLS CARD */}
                  <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 space-y-6">
                      <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-4">Session Controls</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                           {/* VIEW MONITOR */}
                           <Link 
                              href="/monitor" 
                              target="_blank"
                              className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold text-center transition shadow-lg shadow-purple-900/20 block"
                           >
                               🖥️ Open Monitor
                           </Link>
                           
                           {/* LIVE VIEW PROJECTOR */}
                           {activeSessionUuid ? (
                               <a 
                                  href={`/live-view/${activeSessionUuid}`} 
                                  target="_blank"
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-bold text-center transition shadow-lg shadow-indigo-900/20 block"
                               >
                                   📽️ Projector View
                               </a>
                           ) : (
                               <button disabled className="bg-gray-700 text-gray-500 p-4 rounded-xl font-bold cursor-not-allowed">
                                   📽️ Projector View (Loading...)
                               </button>
                           )}
                      </div>

                      <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                               <span className="font-bold text-gray-300">Registration Mode</span>
                               <div className={`w-3 h-3 rounded-full ${isRegOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                          </div>
                          <button 
                             onClick={toggleRegistration}
                             className={`w-full py-2 rounded-lg font-bold border ${isRegOpen ? 'bg-green-900/20 text-green-400 border-green-900' : 'bg-gray-700 text-gray-400 border-gray-600'}`}
                          >
                              {isRegOpen ? "OPEN (Accepting Faces)" : "LOCKED"}
                          </button>
                      </div>

                      <button onClick={copyLink} className="w-full py-4 text-blue-400 border border-blue-900/30 hover:bg-blue-900/10 rounded-xl font-bold transition">
                          🔗 Copy Register Link
                      </button>
                  </div>

                  {/* MINI LOG PREVIEW */}
                  <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 flex flex-col h-[500px]">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white">Live Log</h3>
                          <span className="text-green-500 font-mono bg-green-900/20 px-2 py-1 rounded text-xs">{logs.length} Checked In</span>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                           {logs.map((log: any, i) => (
                               <div key={i} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                                  <div className="flex items-center gap-3">
                                     {/* Registered Photo Avatar */}
                                     <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600 bg-gray-700">
                                         <img 
                                            src={`${getApiUrl()}/${log.image_path}`} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.target as HTMLImageElement).src="https://ui-avatars.com/api/?name="+log.name}
                                         />
                                     </div>
                                      <span className="font-bold text-white">{log.name}</span>
                                  </div>
                                  <span className="font-mono text-gray-400 text-sm">{log.check_in_time.split(" ")[1]}</span>
                               </div>
                           ))}
                           {logs.length === 0 && <div className="text-center text-gray-600 py-10">Waiting for students...</div>}
                       </div>
                  </div>
              </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
