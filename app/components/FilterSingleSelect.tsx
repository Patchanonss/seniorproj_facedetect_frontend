"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
    id: string | number;
    label: string;
}

interface FilterSingleSelectProps {
    label: string;
    options: Option[];
    selectedId: string | number;
    onChange: (id: string | number) => void;
}

export default function FilterSingleSelect({ label, options, selectedId, onChange }: FilterSingleSelectProps) {
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

    const handleSelect = (id: string | number) => {
        onChange(id);
        setIsOpen(false);
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
                    ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700'}
                `}
            >
                <span className="text-sm text-gray-300 truncate">
                    {getLabel(selectedId)}
                </span>
                <span className="text-gray-500 text-xs">▼</span>
            </div>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {options.map((opt) => {
                        const isSelected = opt.id === selectedId;
                        return (
                            <div 
                                key={opt.id}
                                onClick={() => handleSelect(opt.id)}
                                className={`
                                    px-4 py-2 text-sm cursor-pointer flex items-center gap-2
                                    ${isSelected ? 'bg-blue-900/20 text-blue-400' : 'text-gray-300 hover:bg-gray-800'}
                                `}
                            >
                                <div className={`
                                    w-4 h-4 rounded-full border flex items-center justify-center
                                    ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-600'}
                                `}>
                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span>{opt.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
