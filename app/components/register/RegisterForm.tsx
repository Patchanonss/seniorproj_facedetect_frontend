import Link from "next/link";

interface RegisterFormProps {
  name: string;
  setName: (name: string) => void;
  studentCode: string;
  setStudentCode: (code: string) => void;
  loading: boolean;
  registrationToken: string | null;
  handleConfirm: () => void;
}

export default function RegisterForm({
  name,
  setName,
  studentCode,
  setStudentCode,
  loading,
  registrationToken,
  handleConfirm,
}: RegisterFormProps) {
  return (
    <div className="flex-1 max-w-md flex flex-col justify-center gap-6 p-4">
      <h1 className="text-4xl font-extrabold text-slate-800 mb-4">
        🆕 Register
      </h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-500 mb-1">
            Student ID
          </label>
          <input
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            className="w-full border-2 border-slate-200 p-4 rounded-xl text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition font-mono"
            placeholder="e.g. 64012345"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-500 mb-1">
            Full Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-slate-200 p-4 rounded-xl text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition"
            placeholder="e.g. Chanon S."
          />
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading || !registrationToken}
        className={`w-full p-6 rounded-2xl font-bold text-xl transition-all shadow-xl transform active:scale-95 ${
          registrationToken
            ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer hover:shadow-green-500/30"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Saving..." : "Confirm Application"}
      </button>

      {!registrationToken && (
        <p className="text-center text-sm text-orange-500 font-medium bg-orange-50 p-2 rounded-lg border border-orange-100">
          * Please validate face photo first
        </p>
      )}

      <Link
        href="/"
        className="block w-full text-center text-slate-400 hover:text-slate-600 font-bold mt-auto pt-8 transition"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
