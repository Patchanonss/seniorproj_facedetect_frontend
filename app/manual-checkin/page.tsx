"use client";

import { useState } from "react";
import { getApiUrl } from "@/utils/api.config";

export default function ManualCheckInPage() {
    const [studentCode, setStudentCode] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("idle");
        setMessage("Processing...");
        
        try {
            const res = await fetch(`${getApiUrl()}/attendance/student_self_checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_code: studentCode })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setStatus("success");
                setMessage(`✅ Success! ${data.student_name} is marked present.`);
                setStudentCode("");
            } else {
                setStatus("error");
                setMessage(`❌ ${data.detail || "Failed to check in"}`);
            }
        } catch(e) {
            setStatus("error");
            setMessage("❌ Connection error");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
            <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Self Check-In
            </h1>
            
            <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2 font-bold uppercase text-xs tracking-wider">
                            Student ID
                        </label>
                        <input 
                            type="text"
                            value={studentCode}
                            onChange={e => setStudentCode(e.target.value)}
                            className="w-full bg-gray-800 text-white text-2xl font-mono p-4 rounded-lg border border-gray-700 text-center focus:border-blue-500 focus:outline-none placeholder-gray-600"
                            placeholder="6301xxxx"
                            autoFocus
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-lg font-bold text-lg transition-transform active:scale-95"
                    >
                        Check In
                    </button>
                </form>
                
                {message && (
                    <div className={`mt-6 p-4 rounded-lg text-center font-bold ${
                        status === "success" ? "bg-green-900/50 text-green-400 border border-green-800" :
                        status === "error" ? "bg-red-900/50 text-red-400 border border-red-800" :
                        "text-gray-400"
                    }`}>
                        {message}
                    </div>
                )}
            </div>
            
            <p className="mt-8 text-gray-600 text-sm">
                Only works if a class session is currently active.
            </p>
        </div>
    );
}
