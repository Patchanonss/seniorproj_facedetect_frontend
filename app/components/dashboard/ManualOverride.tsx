interface ManualOverrideProps {
  manualName: string;
  setManualName: (name: string) => void;
  manualStatus: string;
  setManualStatus: (status: string) => void;
  handleManualSubmit: (e: React.FormEvent) => void;
}

export default function ManualOverride({
  manualName,
  setManualName,
  manualStatus,
  setManualStatus,
  handleManualSubmit,
}: ManualOverrideProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-700 mb-4">
        🛠 Manual Override
      </h3>
      <form onSubmit={handleManualSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Student Name (Exact Match)
          </label>
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full border p-2 rounded-lg"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Status
          </label>
          <select
            value={manualStatus}
            onChange={(e) => setManualStatus(e.target.value)}
            className="w-full border p-2 rounded-lg bg-white"
          >
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-slate-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-black transition"
        >
          Fix
        </button>
      </form>
    </div>
  );
}
