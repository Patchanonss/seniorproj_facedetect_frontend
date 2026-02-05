"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/utils/api.config";
import { getToken } from "@/utils/auth";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ClassesPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    
    const [subjects, setSubjects] = useState<any[]>([]);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    useEffect(() => {
        fetchSubjects();
    }, []);
    
    const fetchSubjects = async () => {
        try {
            // Needed for Auth
            
            const token = getToken();
            const res = await fetch(`${getApiUrl()}/subjects?include_disabled=true`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            }
        } catch(e) {}
    };
    
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getToken();
            const res = await fetch(`${getApiUrl()}/subjects`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                   "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ code: newCode, name: newName })
            });
            
            if (!res.ok) {
                const d = await res.json();
                alert(d.detail);
                return;
            }
            
            setNewCode("");
            setNewName("");
            setIsCreating(false);
            fetchSubjects();
        } catch (e) { alert("Failed to create"); }
    };
    
    // NEW: Toggle Status
    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const token = getToken();
            await fetch(`${getApiUrl()}/subjects/${id}/toggle?enable=${!currentStatus}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchSubjects();
        } catch(e) { alert("Failed to update status"); }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-white p-6">
                 <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back</Link>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
                          Manage Classes
                        </h1>
                    </div>
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold transition"
                    >
                        {isCreating ? "Cancel" : "+ New Subject"}
                    </button>
                 </header>
                 
                 {isCreating && (
                     <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-green-500/30 shadow-lg">
                        <h3 className="font-bold mb-4 text-green-400">Create New Subject</h3>
                        <form onSubmit={handleCreate} className="flex gap-4">
                            <input 
                                className="bg-gray-700 p-2 rounded text-white border border-gray-600 flex-1"
                                placeholder="Code (e.g. CS101)"
                                value={newCode}
                                onChange={e => setNewCode(e.target.value)}
                                required
                            />
                             <input 
                                className="bg-gray-700 p-2 rounded text-white border border-gray-600 flex-1"
                                placeholder="Name (e.g. Intro to CS)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                            />
                            <button type="submit" className="bg-green-600 px-6 py-2 rounded font-bold">
                                Save
                            </button>
                        </form>
                     </div>
                 )}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {subjects.map((sub, i) => {
                        const isActive = sub.is_active !== 0 && sub.is_active !== false; // Handle SQLite 1/0 or boolean
                        return (
                        <div key={i} className={`p-6 rounded-xl border transition relative group overflow-hidden ${isActive ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-gray-900 border-gray-800 opacity-75'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-bold">{sub.code}</h2>
                                <button 
                                    onClick={() => toggleStatus(sub.id, isActive)}
                                    className={`px-2 py-1 rounded text-xs font-bold border ${isActive ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}
                                >
                                    {isActive ? "ACTIVE" : "DISABLED"}
                                </button>
                            </div>
                            
                            <p className="text-gray-400 mb-4">{sub.name}</p>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">
                                    ID: {sub.id}
                                </span>
                                {isActive && (
                                    <a 
                                        href={`${getApiUrl().replace(':8000', ':3000')}/register?class_code=${sub.code}`} 
                                        target="_blank"
                                        className="text-blue-400 text-sm hover:underline"
                                    >
                                        Registration Link ↗
                                    </a>
                                )}
                            </div>
                            {!isActive && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}
                        </div>
                     )})}
                     
                     {subjects.length === 0 && !isCreating && (
                         <p className="text-gray-500 col-span-full text-center py-10">
                            No classes found. Create one to get started!
                         </p>
                     )}
                 </div>
            </div>
        </ProtectedRoute>
    );
}
