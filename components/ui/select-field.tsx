'use client';

import { useState, useRef, useEffect } from "react";
import { SelectFieldProps } from "@/types/ui";
import styles from "@/styles/component/selectfield.module.css";
import { ChevronDown } from "lucide-react";

const SelectField = (props: SelectFieldProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = props.options.find(
        (opt) => opt.value === props.value
    );

    const filteredOptions = props.options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`${styles.formGroup} ${props.disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`} ref={containerRef}>
            <div
                className={`${styles.inputBox} ${props.className || ""}`}
                onClick={() => !props.disabled && setOpen(!open)}
            >
                <span className={`text-xs font-semibold text-gray-800 truncate pr-2 ${!selected ? "opacity-0" : ""}`}>
                    {selected?.label || ""}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180 text-[#004B29]" : ""}`} />
            </div>

            <label
                className={`${styles.floatingLabel} ${open || selected ? styles.activeLabel : ""}`}
            >
                {props.label}
            </label>

            {open && (
                <div className={styles.dropdown}>
                    {props.options.length > 5 && (
                        <input
                            type="text"
                            placeholder="Type to filter options..."
                            className={styles.searchInput}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    )}

                    {filteredOptions.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center font-medium">
                            No options available
                        </div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={`${styles.option} text-xs font-medium ${opt.value === props.value ? "bg-[#ebf5ec] text-[#004B29] font-bold" : "text-gray-700"}`}
                                onClick={() => {
                                    props.onChange?.(opt.value);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                {opt.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SelectField;