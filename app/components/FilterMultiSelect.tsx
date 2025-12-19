"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
    id: string | number;
    label: string;
}

interface FilterMultiSelectProps {
    label: string;
    options: Option[];
    selectedIds: (string | number)[];
    onChange: (ids: (string | number)[]) => void;
}

export default function FilterMultiSelect({ label, options, selectedIds, onChange }: FilterMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleSelection = (id: string | number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((sid) => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const getLabel = (id: string | number) => {
        return options.find(o => o.id === id)?.label || id;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
            
            {/* TRIGGER BUTTON */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-2 bg-gray-900 border rounded-lg cursor-pointer flex items-center justify-between
                    hover:border-gray-500 transition-colors
                    ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-700'}
                `}
            >
                <span className="text-sm text-gray-300">
                    {selectedIds.length > 0 
                        ? `${selectedIds.length} selected` 
                        : `Select ${label}...`}
                </span>
                <span className="text-gray-500 text-xs">▼</span>
            </div>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50">
                    {options.length === 0 ? (
                         <div className="p-3 text-xs text-gray-500 text-center">No options</div>
                    ) : (
                        options.map((opt) => {
                            const isSelected = selectedIds.includes(opt.id);
                            return (
                                <div 
                                    key={opt.id}
                                    onClick={() => toggleSelection(opt.id)}
                                    className={`
                                        px-4 py-2 text-sm cursor-pointer flex items-center gap-2
                                        ${isSelected ? 'bg-primary-900/20 text-primary-400' : 'text-gray-300 hover:bg-gray-800'}
                                    `}
                                >
                                    <div className={`
                                        w-4 h-4 rounded border flex items-center justify-center
                                        ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-600'}
                                    `}>
                                        {isSelected && <span className="text-white text-[10px]">✓</span>}
                                    </div>
                                    <span>{opt.label}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* SELECTED TAGS AREA */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIds.map((id) => (
                        <span 
                            key={id} 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-300"
                        >
                            {getLabel(id)}
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleSelection(id); }}
                                className="ml-1 w-4 h-4 rounded-full hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-white"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
