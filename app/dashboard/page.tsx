"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
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
          <Link href="/export" className="group">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-700 hover:border-yellow-500 h-full flex flex-col items-center text-center">
              <div className="bg-yellow-500/20 p-4 rounded-full mb-4 group-hover:bg-yellow-500/40 transition">
                📄
              </div>
              <h2 className="text-xl font-bold mb-2">Attendance Reports</h2>
              <p className="text-gray-400 text-sm">Download full semester CSV exports by class.</p>
            </div>
          </Link>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
