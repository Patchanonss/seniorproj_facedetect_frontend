"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

// --- CONFIG ---
const API_URL = "http://localhost:8000";

export default function AdminPage() {
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [enrollStudentCode, setEnrollStudentCode] = useState("");
  const [enrollSubjectCode, setEnrollSubjectCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/subjects`, {
        code: subjectCode,
        name: subjectName,
      });
      alert(`Subject ${subjectCode} created!`);
      setSubjectCode("");
      setSubjectName("");
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/enroll`, {
        student_code: enrollStudentCode,
        subject_code: enrollSubjectCode,
      });
      alert(`Enrolled ${enrollStudentCode} in ${enrollSubjectCode}!`);
      setEnrollStudentCode("");
      // Keep subject code as user might enroll multiple students
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-bold text-slate-800">
            🛠️ Admin Dashboard
            </h1>
             <Link
                href="/"
                className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-lg font-semibold transition"
            >
                ← Back to Dashboard
            </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 1. CREATE SUBJECT */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-700 mb-6">
              📚 Create Subject
            </h2>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">
                  Subject Code
                </label>
                <input
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none"
                  placeholder="e.g. MATH101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">
                  Subject Name
                </label>
                <input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none"
                  placeholder="e.g. Calculus I"
                  required
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50"
              >
                Create Subject
              </button>
            </form>
          </div>

          {/* 2. ENROLL STUDENT */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-700 mb-6">
              👨‍🎓 Enroll Student
            </h2>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">
                  Student ID
                </label>
                <input
                  value={enrollStudentCode}
                  onChange={(e) => setEnrollStudentCode(e.target.value)}
                  className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-green-500 outline-none font-mono"
                  placeholder="e.g. 6401001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">
                  Subject Code
                </label>
                <input
                  value={enrollSubjectCode}
                  onChange={(e) => setEnrollSubjectCode(e.target.value)}
                  className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-green-500 outline-none"
                  placeholder="e.g. MATH101"
                  required
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50"
              >
                Enroll Student
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">
            <strong>💡 Pro Tip:</strong> Use the "Export CSV" feature on the main dashboard to download enrollment lists and check if your setup is correct.
        </div>
      </div>
    </div>
  );
}
