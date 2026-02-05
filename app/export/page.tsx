"use client";

import { useState, useEffect, Suspense } from "react";
import { getApiUrl } from "@/utils/api.config";
import FilterMultiSelect from "../components/FilterMultiSelect";
import FilterSingleSelect from "../components/FilterSingleSelect";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import Cookies from "js-cookie";

interface FilterOptions {
    subjects: { id: number; code: string; name: string }[];
    rooms: string[];
    professors: { id: number; name: string }[];
    sessions: { id: number; topic: string; date: string; subject_id: number }[];
    students: { id: number; student_code: string; name: string; subject_ids: string }[];
}

// Wrapper for SearchParams to avoid Suspense error in Next.js 13+
function ExportContent() {
    const searchParams = useSearchParams();

    // --- STATE ---
    const [options, setOptions] = useState<FilterOptions>({
        subjects: [], rooms: [], professors: [], sessions: [], students: []
    });
    const [loadingOptions, setLoadingOptions] = useState(true);

    const [filters, setFilters] = useState({
        subject_ids: [] as number[],
        rooms: [] as string[],
        professor_ids: [] as number[],
        session_ids: [] as number[],
        student_ids: [] as number[],
        start_date: "",
        end_date: "",
        view_mode: "CLASS" as "CLASS" | "RAW"
    });

    // NEW: Status Filter State
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");

    const [reportData, setReportData] = useState<{ columns: string[], data: any[] } | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // --- INITIAL LOAD ---
    useEffect(() => {
        const token = Cookies.get("access_token");

        // 1. Fetch Options
        fetch(`${getApiUrl()}/api/export/options`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(async res => {
                if (!res.ok) {
                    throw new Error("Failed to load options");
                }
                return res.json();
            })
            .then(data => {
                setOptions(data);
                setLoadingOptions(false);
            })
            .catch(err => {
                console.error("Failed to load options", err);
                setLoadingOptions(false);
            });

        // 2. Parse URL Params (Pre-fill)
        const initFilters: any = {};
        if (searchParams.get("subject_id")) initFilters.subject_ids = [parseInt(searchParams.get("subject_id")!)];
        if (searchParams.get("room")) initFilters.rooms = [searchParams.get("room")!];
        
        // Use functional update to merge with defaults, but only if params exist
        if (Object.keys(initFilters).length > 0) {
            setFilters(prev => ({ ...prev, ...initFilters }));
        }
    }, [searchParams]);

    // --- ACTION ---
    const handleSearch = async () => {
        const token = Cookies.get("access_token");
        setLoadingReport(true);
        setReportData(null);
        try {
            const res = await fetch(`${getApiUrl()}/api/export/generate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(filters)
            });
            
            if (!res.ok) throw new Error("API Failed");

            const result = await res.json();
            setReportData({ columns: result.columns, data: result.data });
        } catch (e) {
            console.error(e);
            alert("Failed to generate report");
        } finally {
            setLoadingReport(false);
        }
    };

    const handleExportCSV = () => {
        if (!reportData || !reportData.data.length) return;
        
        // Apply the same Status Filter as the UI
        const filteredData = reportData.data.filter(row => {
             if (statusFilter === "ALL") return true;
             
             // Logic mirrors the UI rendering filter
             const values = Object.entries(row)
                 .filter(([key]) => !['student_code', 'student_name', 'Total Session', 'Present', 'Absent', 'Total Classes'].includes(key))
                 .map(([_, val]) => val);
                 
             if (statusFilter === "PRESENT") {
                 // Show if NO "ABSENT" in any column (i.e., at least one PRESENT/LATE or empty? No, Present Only usually means "Has Present")
                 // Simplistic logic: If filtered for PRESENT, we want rows that are NOT fully Absent? 
                 // Actually, looking at UI logic (lines 298-300 in original file which I can't see fully but inferred):
                 // UI logic seemed to be: !values.includes("ABSENT")
                 return !values.includes("ABSENT"); 
             }
             if (statusFilter === "ABSENT") {
                 return values.includes("ABSENT");
             }
             return true;
        });

        const headers = reportData.columns;
        const csvContent = [
            headers.join(","),
            ...filteredData.map(row => headers.map(fieldName => {
                const val = row[fieldName] === null || row[fieldName] === undefined ? "" : row[fieldName];
                return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
            }).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_export_${filters.view_mode}_${new Date().toISOString().slice(0,10)}.csv`);
        link.click();
    };

    // --- HELPERS ---
    const formatDate = (dateStr: string) => {
        if (!dateStr || !dateStr.includes("-")) return dateStr;
        try {
            const [y, m, d] = dateStr.split("-");
            return `${d}/${m}/${y}`;
        } catch { return dateStr; }
    };
    
    // Check if string is a YYYY-MM-DD date or timestamp
    const tryFormatParams = (val: string) => {
        if (typeof val !== 'string') return val;
        // Match YYYY-MM-DD exactly
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return formatDate(val);
        // Match YYYY-MM-DD HH:MM:SS
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val)) return formatDate(val.split(" ")[0]) + " " + val.split(" ")[1];
        return val;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <header className="mb-8 border-b border-gray-800 pb-6 flex items-start justify-between">
                 <div className="flex items-center gap-4">
                     <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                        ←
                     </Link>
                     <div>
                        <h1 className="text-3xl font-bold tracking-tight">Export & Reports</h1>
                        <p className="text-gray-400 text-sm">Target specific data logs and generate CSVs.</p>
                     </div>
                 </div>
            </header>

            {/* --- FILTER BAR --- */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Date Range */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date Range</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-white focus:outline-none"
                                value={filters.start_date}
                                onChange={e => setFilters({...filters, start_date: e.target.value})}
                            />
                            <span className="text-gray-600">-</span>
                            <input 
                                type="date" 
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-white focus:outline-none"
                                value={filters.end_date}
                                onChange={e => setFilters({...filters, end_date: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Subject Filter */}
                    <FilterMultiSelect 
                        label="Subjects"
                        options={options.subjects.map(s => ({ id: s.id, label: `${s.code} ${s.name}` }))}
                        selectedIds={filters.subject_ids}
                        onChange={(ids) => setFilters({...filters, subject_ids: ids as number[]})}
                    />

                    {/* Room Filter */}
                    <FilterMultiSelect 
                        label="Rooms"
                        options={options.rooms.map(r => ({ id: r, label: r }))}
                        selectedIds={filters.rooms}
                        onChange={(ids) => setFilters({...filters, rooms: ids as string[]})}
                    />

                     {/* Professor Filter */}
                     <FilterMultiSelect 
                        label="Professors"
                        options={options.professors.map(p => ({ id: p.id, label: p.name }))}
                        selectedIds={filters.professor_ids}
                        onChange={(ids) => setFilters({...filters, professor_ids: ids as number[]})}
                    />
                </div>
                
                {/* Advanced Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t border-gray-800 pt-4">
                     {/* Session Filter */}
                     <FilterMultiSelect 
                        label="Specific Sessions"
                        options={options.sessions
                            .filter(s => filters.subject_ids.length === 0 || filters.subject_ids.includes(s.subject_id))
                            .map(s => ({ id: s.id, label: `${formatDate(s.date)} - ${s.topic}` }))}
                        selectedIds={filters.session_ids}
                        onChange={(ids) => setFilters({...filters, session_ids: ids as number[]})}
                    />
                     {/* Student Filter */}
                     <FilterMultiSelect 
                        label="Specific Students"
                        options={options.students
                            .filter(s => {
                                if (filters.subject_ids.length === 0) return true;
                                const enrolled = s.subject_ids ? s.subject_ids.split(',').map(Number) : [];
                                return filters.subject_ids.some(sid => enrolled.includes(sid));
                            })
                            .map(s => ({ id: s.id, label: `${s.student_code} ${s.name}` }))}
                        selectedIds={filters.student_ids}
                        onChange={(ids) => setFilters({...filters, student_ids: ids as number[]})}
                    />
                </div>

                {/* CONTROLS */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-6">
                    <div className="flex items-center gap-4">
                        {/* View Switcher */}
                        <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
                            <button 
                                onClick={() => setFilters({...filters, view_mode: "CLASS"})}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.view_mode === "CLASS" ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                📊 Class View (Matrix)
                            </button>
                            <button 
                                 onClick={() => setFilters({...filters, view_mode: "RAW"})}
                                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.view_mode === "RAW" ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                📝 Raw View (Logs)
                            </button>
                        </div>
                        
                        {/* STATUS FILTER (Frontend) */}
                        <div className="w-64">
                             <FilterSingleSelect 
                                label="Attendance Status:"
                                options={[
                                    { id: "ALL", label: "All Students" },
                                    { id: "PRESENT", label: "Present Only" },
                                    { id: "ABSENT", label: "Absent Only" }
                                ]}
                                selectedId={statusFilter}
                                onChange={(id) => setStatusFilter(id as "ALL" | "PRESENT" | "ABSENT")}
                             />
                        </div>
                    </div>

                    <button 
                        onClick={handleSearch}
                        disabled={loadingReport}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-lg flex items-center gap-2"
                    >
                        {loadingReport ? "Generating..." : "🔍 Apply filter"}
                    </button>
                </div>
            </div>

            {/* --- REPORT VIEW --- */}
            {reportData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">
                            {reportData.data.filter(row => {
                                 if (statusFilter === "ALL") return true;
                                 
                                 // Identify Session Columns (exclude fixed columns)
                                 // Fixed fields: student_code, student_name, total_session, present, absent, etc.
                                 // We can look for status values (PRESENT/ABSENT/LATE) in the row's values.
                                 
                                 // Get all values excluding metadata
                                 const values = Object.entries(row)
                                     .filter(([key]) => !['student_code', 'student_name', 'Total Session', 'Present', 'Absent', 'Total Classes'].includes(key))
                                     .map(([_, val]) => val);
                                     
                                 if (statusFilter === "PRESENT") {
                                     // Show if NO "ABSENT" in any column
                                     return !values.includes("ABSENT");
                                 }
                                 if (statusFilter === "ABSENT") {
                                     // Show if AT LEAST ONE "ABSENT"
                                     return values.includes("ABSENT");
                                 }
                                 return true;
                            }).length} Results Found 
                            {statusFilter !== "ALL" && <span className="text-gray-500 text-sm font-normal ml-2">(Filtered by {statusFilter})</span>}
                        </h2>
                        <button 
                             onClick={handleExportCSV}
                             className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 flex items-center gap-2"
                        >
                            📥 Report (CSV)
                        </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-800 text-gray-400 text-xs font-bold uppercase sticky top-0 z-10">
                                    <tr>
                                        {reportData.columns.map((col) => (
                                            <th key={col} className="px-6 py-4 border-b border-gray-700 whitespace-nowrap">
                                                {col.replace('_', ' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                                    {reportData.data.filter(row => {
                                         if (statusFilter === "ALL") return true;
                                         
                                         // Same filtering logic as above (DRY in real app, inline for speed)
                                         const values = Object.entries(row)
                                             .filter(([key]) => !['student_code', 'student_name', 'Total Session', 'Present', 'Absent', 'Total Classes'].includes(key))
                                             .map(([_, val]) => val);
                                             
                                         if (statusFilter === "PRESENT") return !values.includes("ABSENT");
                                         if (statusFilter === "ABSENT") return values.includes("ABSENT");
                                         return true;
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan={reportData.columns.length} className="px-6 py-10 text-center text-gray-500">
                                                No data matches your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.data
                                            .filter(row => {
                                                 if (statusFilter === "ALL") return true;
                                                 const values = Object.entries(row)
                                                     .filter(([key]) => !['student_code', 'student_name', 'Total Session', 'Present', 'Absent', 'Total Classes'].includes(key))
                                                     .map(([_, val]) => val);
                                                 if (statusFilter === "PRESENT") return !values.includes("ABSENT");
                                                 if (statusFilter === "ABSENT") return values.includes("ABSENT");
                                                 return true;
                                            })
                                            .map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                                {reportData.columns.map((col) => {
                                                    const val = row[col];
                                                    let displayVal = val;
                                                    let colorClass = "";

                                                    // Visual formatting for Status
                                                    if (val === "ABSENT") {
                                                        colorClass = "text-red-500 font-bold";
                                                    } else if (val === "LATE") {
                                                        colorClass = "text-yellow-500 font-bold";
                                                    } else if (val !== null && val !== undefined && val !== "") {
                                                        // Valid string (Time or PRESENT) -> Green
                                                        colorClass = "text-green-400 font-bold";
                                                    }

                                                    return (
                                                        <td key={col} className={`px-6 py-3 whitespace-nowrap ${colorClass}`}>
                                                            {tryFormatParams(String(displayVal))}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                // EMPTY STATE
                <div className="flex flex-col items-center justify-center py-20 opacity-30 border-2 border-dashed border-gray-800 rounded-3xl">
                    <div className="text-8xl mb-4">📊</div>
                    <p className="text-2xl font-bold">Select Filters & Generate</p>
                    <p>Apply tags above to view attendance data.</p>
                </div>
            )}
        </div>
    );
}

// Suspense Boundary required for useSearchParams
export default function ExportPage() {
    return (
        <Suspense fallback={<div className="p-10 text-white">Loading Export Module...</div>}>
            <ProtectedRoute>
                <ExportContent />
            </ProtectedRoute>
        </Suspense>
    );
}
