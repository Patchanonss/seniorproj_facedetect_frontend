import { Log } from "../../types";

interface AttendanceLogProps {
  logs: Log[];
}

export default function AttendanceLog({ logs }: AttendanceLogProps) {
  const formatTimestamp = (ts: string) => {
      if (!ts) return "";
      try {
          const [datePart, timePart] = ts.split(" ");
          const [y, m, d] = datePart.split("-");
          return `${d}/${m}/${y} ${timePart}`;
      } catch (e) { return ts; }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden max-h-[80vh]">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700">Attendance Log</h2>
        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
          Total: {logs.length}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-xs font-bold text-slate-500 border-b">
              <th className="p-3">Time</th>
              <th className="p-3">Name</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-8 text-center text-slate-400 text-sm italic"
                >
                  Waiting for students...
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="p-3 text-xs font-mono text-slate-500">
                    {formatTimestamp(log.check_in_time)}
                  </td>
                  <td className="p-3 text-sm font-medium text-slate-800">
                    {log.name}
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                        log.status === "PRESENT"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-orange-50 text-orange-600 border-orange-200"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
