"use client";

import { useState, useEffect, Suspense } from "react";
import { getApiUrl } from "@/utils/api.config";
import FilterMultiSelect from "../components/FilterMultiSelect";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";

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

    const [reportData, setReportData] = useState<{ columns: string[], data: any[] } | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // --- INITIAL LOAD ---
    useEffect(() => {
        // 1. Fetch Options
        fetch(`${getApiUrl()}/api/export/options`)
            .then(res => res.json())
            .then(data => {
                setOptions(data);
                setLoadingOptions(false);
            })
            .catch(err => console.error("Failed to load options", err));

        // 2. Parse URL Params (Pre-fill)
        const initFilters: any = {};
        if (searchParams.get("subject_id")) initFilters.subject_ids = [parseInt(searchParams.get("subject_id")!)];
        if (searchParams.get("room")) initFilters.rooms = [searchParams.get("room")!];
        
        // Use functional update to merge with defaults, but only if params exist
        if (Object.keys(initFilters).length > 0) {
            setFilters(prev => ({ ...prev, ...initFilters }));
            // Optional: Auto-search if coming from Monitor?
            // setTimeout(() => handleSearch(), 500); // Need to wait for options? No.
        }
    }, [searchParams]);

    // --- ACTION ---
    const handleSearch = async () => {
        setLoadingReport(true);
        setReportData(null);
        try {
            const res = await fetch(`${getApiUrl()}/api/export/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters)
            });
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
        
        const headers = reportData.columns;
        const csvContent = [
            headers.join(","),
            ...reportData.data.map(row => headers.map(fieldName => {
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
                            .map(s => ({ id: s.id, label: `${s.date} - ${s.topic}` }))}
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

                    <button 
                        onClick={handleSearch}
                        disabled={loadingReport}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-lg flex items-center gap-2"
                    >
                        {loadingReport ? "Generating..." : "🔍 Generate Report"}
                    </button>
                </div>
            </div>

            {/* --- REPORT VIEW --- */}
            {reportData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">{reportData.data.length} Results Found</h2>
                        <button 
                             onClick={handleExportCSV}
                             className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 flex items-center gap-2"
                        >
                            📥 Download CSV
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
                                    {reportData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={reportData.columns.length} className="px-6 py-10 text-center text-gray-500">
                                                No data matches your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                                {reportData.columns.map((col) => {
                                                    const val = row[col];
                                                    let displayVal = val;
                                                    let colorClass = "";

                                                    // Visual formatting for Status
                                                    if (val === "PRESENT") colorClass = "text-green-400 font-bold";
                                                    if (val === "ABSENT") colorClass = "text-red-500 font-bold";
                                                    if (val === "LATE") colorClass = "text-yellow-500 font-bold";

                                                    return (
                                                        <td key={col} className={`px-6 py-3 whitespace-nowrap ${colorClass}`}>
                                                            {displayVal}
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
