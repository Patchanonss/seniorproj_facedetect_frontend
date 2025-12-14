import Link from "next/link";

interface HeaderProps {
  isSessionActive: boolean;
  topic: string;
  setTopic: (topic: string) => void;
  loading: boolean;
  handleStartClass: (subjectCode?: string) => void;
  handleEndClass: () => void;
}

export default function Header({
  isSessionActive,
  topic,
  setTopic,
  loading,
  handleStartClass,
  handleEndClass,
}: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          📸 AI Attendance System
        </h1>
        <p className="text-slate-500 text-sm">
          Status:
          <span
            className={`ml-2 font-bold ${
              isSessionActive ? "text-green-600" : "text-orange-500"
            }`}
          >
           {isSessionActive ? "LIVE SESSION" : "IDLE"}
          </span>
        </p>
      </div>

      <div className="flex gap-3 mt-4 md:mt-0">
        <Link
          href="/register"
          className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-lg font-semibold transition"
        >
           + Register
        </Link>
        
        <a
          href="http://localhost:8000/export/attendance"
          target="_blank"
          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg font-semibold transition border border-emerald-200"
        >
           📥 Export CSV
        </a>
        
        <Link
          href="/admin"
          className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg font-semibold transition"
        >
           ⚙️ Admin
        </Link>

        {!isSessionActive ? (
          <>
             <input
              type="text"
              placeholder="Subject Code (Optional)"
              className="w-32 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              id="subject-code-input"
            />
            <input
              type="text"
              placeholder="Enter Topic (e.g. Math 101)"
              className="border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              onClick={() => {
                  const el = document.getElementById('subject-code-input') as HTMLInputElement;
                  handleStartClass(el?.value);
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-md disabled:opacity-50"
            >
              {loading ? "Starting..." : "Start Class"}
            </button>
          </>
        ) : (
          <button
            onClick={handleEndClass}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition shadow-md disabled:opacity-50"
          >
            End Session
          </button>
        )}
      </div>
    </header>
  );
}
