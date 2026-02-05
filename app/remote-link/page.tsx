"use client";

import { useState, useEffect } from "react";
import { getApiUrl } from "@/utils/api.config";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react"; // Check if installed, if not fallback to simple display or install
import { getToken } from "@/utils/auth";
import ProtectedRoute from "../components/ProtectedRoute";

export default function RemoteLinkPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    // isRegOpen now derived from subject logic, but we keep state for local optimistic update
    // Actually, we should find the subject object.
    const activeSubject = subjects.find(s => s.code === selectedSubject);
    const isRegOpen = activeSubject ? activeSubject.is_registration_open : false;

    const [baseUrl, setBaseUrl] = useState("");
    
    // 0. Auto-Select from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("subject_code");
        if (code) setSelectedSubject(code);
    }, []);

    useEffect(() => {
        // 1. Fetch Subjects
            const fetchSubjects = async () => {
                 try {
                    const token = getToken();
                    const res = await fetch(`${getApiUrl()}/subjects`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                if (res.ok) setSubjects(await res.json());
            } catch(e) {}
        };
        fetchSubjects();

        // 2. Fetch Status (Removed global fetch, relying on subjects list)
        // We might want to refresh subjects strictly?
        // Let's keep fetchSubjects as the source of truth.
        
        // 3. Dynamic IP Detection (Auto-detect LAN IP)
        const fetchSystemIP = async () => {
             // If we are already on a public/LAN network (not localhost), use current origin
             if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
                 setBaseUrl(window.location.origin);
                 return;
             }
             
             try {
                // Ask Backend for the Machine's LAN IP
                const res = await fetch(`${getApiUrl()}/system/ip`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.ip) {
                        setBaseUrl(`http://${data.ip}:3000`); // Assume Frontend is always on port 3000
                        return;
                    }
                }
             } catch (e) {
                 console.error("Failed to fetch system IP", e);
             }
             
             // Fallback if backend is unreachable
             setBaseUrl(window.location.origin);
        };
        fetchSystemIP();
    }, []);

    const toggleRegistration = async (enable: boolean) => {
        if (!activeSubject) return;
        try {
            const token = getToken();
            await fetch(`${getApiUrl()}/session/toggle_registration?enable=${enable}&subject_id=${activeSubject.id}`, { 
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            // Optimistic Update
            setSubjects(prev => prev.map(s => 
                s.id === activeSubject.id ? { ...s, is_registration_open: enable } : s
            ));
        } catch(e) { alert("Error toggling"); }
    };
    
    const getLink = () => {
        if (!selectedSubject) return "";
        // Use code directly as it is selectedSubject value
        return `${baseUrl}/register?class_code=${selectedSubject}`;
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <header className="mb-8">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500">
                        Remote Registration Link
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* 1. CONTROLS */}
                    <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                        <div className="mb-6">
                            <label className="block text-gray-400 mb-2 font-bold uppercase text-xs tracking-wider">
                                Select Class to Enroll
                            </label>
                            <select 
                                className="w-full bg-gray-900 p-4 rounded-lg text-white border border-gray-600 focus:border-orange-500 outline-none text-lg"
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                            >
                                <option value="">-- Choose Subject --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">Registration Status</h3>
                                <p className={`text-sm ${isRegOpen ? "text-green-400" : "text-gray-500"}`}>
                                    {isRegOpen ? "● OPEN - Accepting new faces" : "● CLOSED"}
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => toggleRegistration(!isRegOpen)}
                                className={`w-16 h-8 rounded-full p-1 transition-colors relative ${isRegOpen ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`h-6 w-6 bg-white rounded-full transition-transform shadow-md ${isRegOpen ? 'translate-x-8' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* 2. LINK / QR DISPLAY */}
                    <div className={`bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center min-h-[400px] transition-opacity ${selectedSubject ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        {selectedSubject ? (
                            <>
                                <h3 className="font-bold text-xl mb-6 text-center">Scan to Register for <span className="text-orange-400">{selectedSubject}</span></h3>
                                
                                {/* QR CODE Placeholder or Lib */}
                                <div className="bg-white p-4 rounded-xl mb-6">
                                    <QRCodeSVG value={getLink()} size={200} />
                                </div>
                                
                                <div className="w-full bg-gray-900 p-4 rounded flex items-center justify-between border border-gray-600">
                                    <code className="text-xs text-green-400 truncate flex-1 mr-4">{getLink()}</code>
                                    <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(getLink());
                                        alert("Copied!");
                                    }}
                                    className="text-sm font-bold bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-600"
                                    >
                                    Copy
                                    </button>
                                </div>
                                
                                {isRegOpen && (
                                    <p className="mt-4 text-green-400 text-sm animate-pulse">
                                        Ready for students!
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500 text-lg">Select a class to generate link.</p>
                        )}
                    </div>
                </div>
                
                <div className="mt-10 text-center text-gray-500 text-sm max-w-2xl mx-auto">
                    <p>💡 Tip: Open this link on a tablet or second monitor at the classroom entrance.</p>
                    <p>Make sure "Registration Status" is ON when students are registering.</p>
                </div>
            </div>
        </ProtectedRoute>
    );
}
