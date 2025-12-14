"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { getApiUrl } from "@/utils/api.config";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <div className="p-10 text-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
        <div>
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
             Smart Attendance System
           </h1>
           <p className="text-gray-400 text-sm">Welcome, {user?.name}</p>
        </div>
        <button 
          onClick={logout}
          className="bg-red-500/20 text-red-400 px-4 py-2 rounded hover:bg-red-500/30"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: CHECK NAME */}
        <Link href="/check-name" className="group">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-700 hover:border-blue-500 h-full flex flex-col items-center text-center">
            <div className="bg-blue-500/20 p-4 rounded-full mb-4 group-hover:bg-blue-500/40 transition">
               📸
            </div>
            <h2 className="text-xl font-bold mb-2">Check Name</h2>
            <p className="text-gray-400 text-sm">Start a class, facial recognition, and live attendance.</p>
          </div>
        </Link>
        
        {/* CARD 2: REMOTE MONITOR */}
        <Link href="/monitor" className="group">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-700 hover:border-purple-500 h-full flex flex-col items-center text-center">
            <div className="bg-purple-500/20 p-4 rounded-full mb-4 group-hover:bg-purple-500/40 transition">
               🖥️
            </div>
            <h2 className="text-xl font-bold mb-2">Remote Monitor</h2>
            <p className="text-gray-400 text-sm">View live attendance from another device.</p>
          </div>
        </Link>
        
        
        {/* CARD 2.5: REMOTE LINK */}
        <Link href="/remote-link" className="group">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-700 hover:border-orange-500 h-full flex flex-col items-center text-center">
            <div className="bg-orange-500/20 p-4 rounded-full mb-4 group-hover:bg-orange-500/40 transition">
               🔗
            </div>
            <h2 className="text-xl font-bold mb-2">Remote Link</h2>
            <p className="text-gray-400 text-sm">Generate QR codes for student registration.</p>
          </div>
        </Link>

        {/* CARD 3: MANAGE CLASSES */}
         <Link href="/classes" className="group">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-700 hover:border-green-500 h-full flex flex-col items-center text-center">
            <div className="bg-green-500/20 p-4 rounded-full mb-4 group-hover:bg-green-500/40 transition">
               📚
            </div>
            <h2 className="text-xl font-bold mb-2">Manage Classes</h2>
            <p className="text-gray-400 text-sm">Create subjects, enroll students, and view reports.</p>
          </div>
        </Link>
        
        {/* CARD 4: REPORTS */}
        <button onClick={() => setShowExportModal(true)} className="group w-full text-left">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-700 hover:border-yellow-500 h-full flex flex-col items-center text-center">
            <div className="bg-yellow-500/20 p-4 rounded-full mb-4 group-hover:bg-yellow-500/40 transition">
               📄
            </div>
            <h2 className="text-xl font-bold mb-2">Attendance Reports</h2>
            <p className="text-gray-400 text-sm">Download full semester CSV exports by class.</p>
          </div>
        </button>
        
      </div>

      {/* MODAL: EXPORT REPORT */}
      <ExportReportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </div>
  );
}

function ExportReportModal({ isOpen, onClose, professorId }: { isOpen: boolean; onClose: () => void; professorId?: number }) {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Attempt to fetch subjects using stored token if available
            // This populates the dropdown.
            const token = Cookies.get("access_token") || "";
            fetch(`${getApiUrl()}/subjects`, {
                 headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSubjects(data);
                else setSubjects([]);
            })
            .catch(err => console.error(err));
        }
    }, [isOpen]);

    const handleExport = async () => {
        setLoading(true);
        try {
            // EXPORT: Tokenless logic enabled by passing professor_id
            let url = selectedSubject 
                ? `${getApiUrl()}/export/attendance?subject_id=${selectedSubject}` 
                : `${getApiUrl()}/export/attendance?all=true`; 
            
            if (professorId) {
                url += `&professor_id=${professorId}`;
            }

            // Standard fetch without Auth header (relies on query param)
            const res = await fetch(url);
            
            if (!res.ok) throw new Error("Export failed");
            
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = selectedSubject ? `attendance_subject_${selectedSubject}.csv` : "attendance_all_classes.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            onClose();
        } catch (e) {
            alert("Failed to download report");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">📄 Export Attendance Report</h2>
                <p className="text-gray-400 mb-4 text-sm">Select a class to download its full attendance matrix.</p>
                
                <div className="mb-6">
                    <label className="block text-sm font-bold mb-2 text-gray-300">Select Class</label>
                    <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                    >
                        <option value="">-- All Classes --</option>
                        {Array.isArray(subjects) && subjects.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.code} - {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button 
                        onClick={handleExport}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold disabled:opacity-50"
                    >
                        {loading ? "Downloading..." : "Download CSV"}
                    </button>
                </div>
            </div>
        </div>
    );
}
