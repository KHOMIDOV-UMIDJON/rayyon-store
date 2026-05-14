// MIRRORED FROM rayyon-admin/src/components/orders/DateFilterDropdown.tsx
// Keep behavior in sync with admin.

import { useEffect, useRef, useState } from 'react'
import { Calendar, Check, ChevronDown } from 'lucide-react'
import type { OrderDateRange, DatePreset } from './dateFilter'
import { rangeForPreset, PRESET_LABELS } from './dateFilter'

interface Props {
    value:    OrderDateRange
    onChange: (range: OrderDateRange) => void
}

const PRESETS: DatePreset[] = ['today', 'yesterday', 'last3', 'last7', 'last30', 'all']

export default function DateFilterDropdown({ value, onChange }: Props) {
    const [open, setOpen]               = useState(false)
    const [customFrom, setCustomFrom]   = useState(value.from ?? '')
    const [customTo, setCustomTo]       = useState(value.to ?? '')
    const wrapperRef                    = useRef<HTMLDivElement>(null)

    // Reset custom inputs when the parent value changes externally (e.g. Clear all)
    useEffect(() => {
        setCustomFrom(value.from ?? '')
        setCustomTo(value.to ?? '')
    }, [value.from, value.to])

    // Close on outside click
    useEffect(() => {
        if (!open) return
        function handle(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        function handle(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handle)
        return () => document.removeEventListener('keydown', handle)
    }, [open])

    const isActive = value.preset !== 'last7'   // default — anything else is "active"

    const triggerLabel =
        value.preset === 'custom' && value.from && value.to
            ? `${value.from} – ${value.to}`
            : PRESET_LABELS[value.preset]

    const handlePresetClick = (preset: DatePreset) => {
        onChange(rangeForPreset(preset))
        setOpen(false)
    }

    const handleApplyCustom = () => {
        if (!customFrom || !customTo) return
        if (customFrom > customTo) return
        onChange({ preset: 'custom', from: customFrom, to: customTo })
        setOpen(false)
    }

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                    isActive
                        ? 'bg-green-50 border-green-200 text-brand font-medium'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
            >
                <Calendar size={13} className={isActive ? 'text-brand' : 'text-gray-400'} />
                <span>{triggerLabel}</span>
                <ChevronDown size={11} className={isActive ? 'text-brand' : 'text-gray-400'} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 z-20 w-[260px] bg-white border border-gray-200 rounded-xl shadow-lg p-2">

                    {/* Presets */}
                    <div className="flex flex-col">
                        {PRESETS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handlePresetClick(p)}
                                className="flex items-center justify-between px-3 py-2 text-[13px] text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                <span>{PRESET_LABELS[p]}</span>
                                {value.preset === p && <Check size={13} className="text-brand" />}
                            </button>
                        ))}
                    </div>

                    {/* Custom range */}
                    <div className="border-t border-gray-100 mt-2 pt-3 px-2">
                        <p className="text-[9px] font-bold text-gray-400 tracking-[0.4px] uppercase mb-2">
                            Custom range
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] text-gray-500 w-10">From</label>
                                <input
                                    type="date"
                                    value={customFrom}
                                    max={customTo || undefined}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="flex-1 px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand focus:bg-white"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] text-gray-500 w-10">To</label>
                                <input
                                    type="date"
                                    value={customTo}
                                    min={customFrom || undefined}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="flex-1 px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand focus:bg-white"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleApplyCustom}
                            disabled={!customFrom || !customTo || customFrom > customTo}
                            className="w-full mt-3 py-1.5 text-[12px] font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}