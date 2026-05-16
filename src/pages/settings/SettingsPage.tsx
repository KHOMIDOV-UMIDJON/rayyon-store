import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, AlertCircle, Check } from 'lucide-react'

import { settingsApi } from '../../api'
import type { StoreSettings } from '../../types'

// ─────────────────────────────────────────────────────────────
// SETTINGS PAGE
//
// One card today: Live board reset time. Built as a stacked-card
// layout so future settings (urgency thresholds, operating
// hours, etc) can be appended without restructuring.
// ─────────────────────────────────────────────────────────────

interface Preset {
    hour:   number
    minute: number
    label:  string
    desc:   string
}

const PRESETS: Preset[] = [
    { hour: 0,  minute: 0, label: '00:00', desc: 'Midnight'      },
    { hour: 3,  minute: 0, label: '03:00', desc: 'Early morning' },
    { hour: 6,  minute: 0, label: '06:00', desc: 'Pre-open'      },
    { hour: 9,  minute: 0, label: '09:00', desc: 'Shift start'   },
]

export default function SettingsPage() {
    const queryClient = useQueryClient()

    // ── Server state ─────────────────────────────────────
    const { data: saved, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['store-settings'],
        queryFn:  settingsApi.get,
    })

    // ── Local draft state (only flushed to server on Save) ─
    //
    // Pattern: store last-seen server snapshot in useState alongside
    // the draft. When server data changes (initial load or after save),
    // detect it by reference comparison and reset draft in one
    // render-time setState batch. React batches these and re-renders
    // once. See: https://react.dev/reference/react/useState#storing-information-from-previous-renders
    //
    // This is the official "derive state from props" pattern — passes
    // both react-hooks/refs and react-hooks/set-state-in-effect lints.
    const [lastSyncedSaved, setLastSyncedSaved] = useState<StoreSettings | null>(null)
    const [draftHour,       setDraftHour]       = useState<number>(0)
    const [draftMinute,     setDraftMinute]     = useState<number>(0)

    if (saved && lastSyncedSaved !== saved) {
        setLastSyncedSaved(saved)
        setDraftHour(saved.liveBoardResetHour)
        setDraftMinute(saved.liveBoardResetMinute)
    }

    // ── Save mutation ────────────────────────────────────
    const [showSuccess, setShowSuccess] = useState(false)

    const mutation = useMutation({
        mutationFn: (payload: StoreSettings) => settingsApi.update(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(['store-settings'], data)
            // Live board uses different query key; refetch so cutoff
            // updates immediately on the Live board after a save.
            queryClient.invalidateQueries({ queryKey: ['store-orders'] })
            // Inline confirmation — auto-dismiss after 3s
            setShowSuccess(true)
        },
    })

    // Auto-dismiss the success banner
    useEffect(() => {
        if (!showSuccess) return
        const t = setTimeout(() => setShowSuccess(false), 3000)
        return () => clearTimeout(t)
    }, [showSuccess])

    // ── Derived state ────────────────────────────────────
    const isDirty = saved
        ? saved.liveBoardResetHour !== draftHour || saved.liveBoardResetMinute !== draftMinute
        : false

    const handleCancel = () => {
        if (!saved) return
        setDraftHour(saved.liveBoardResetHour)
        setDraftMinute(saved.liveBoardResetMinute)
    }

    const handleSave = () => {
        if (!isDirty) return
        mutation.mutate({
            liveBoardResetHour:   draftHour,
            liveBoardResetMinute: draftMinute,
        })
    }

    // ── Next-reset preview (recomputes every minute) ─────
    const [, forceTick] = useState(0)
    useEffect(() => {
        const t = setInterval(() => forceTick((n) => n + 1), 60_000)
        return () => clearInterval(t)
    }, [])

    const nextResetText = useMemo(
        () => formatNextReset(draftHour, draftMinute),
        // forceTick re-runs this when the minute changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [draftHour, draftMinute],
    )

    // ── Render ───────────────────────────────────────────
    return (
        <div className="h-full flex flex-col bg-gray-50">

            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white border-b border-gray-100">
                <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                    Settings
                </h1>
                <p className="text-[12px] text-gray-400 mt-0.5">
                    Configure how your store's Live board behaves
                </p>
            </div>

            {/* Scrollable card area */}
            <div className="flex-1 overflow-auto px-6 py-5">
                <div className="max-w-2xl mx-auto space-y-4">

                    {/* ── Live Board Reset Card ─────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                        {/* Card header */}
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-[14px] font-semibold text-gray-900">
                                Live board reset time
                            </h2>
                            <p className="text-[12px] text-gray-500 mt-0.5">
                                When delivered orders are cleared from the Live board every day.
                                Orders are never deleted — find them on the Orders page.
                            </p>
                        </div>

                        {/* Card body */}
                        <div className="px-5 py-5">

                            {isLoading ? (
                                <SkeletonBody />
                            ) : isError ? (
                                <ErrorBody
                                    message={error instanceof Error ? error.message : 'Failed to load settings'}
                                    onRetry={() => refetch()}
                                />
                            ) : (
                                <>
                                    {/* Preset grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                                        {PRESETS.map((p) => {
                                            const isSelected = p.hour === draftHour && p.minute === draftMinute
                                            return (
                                                <button
                                                    key={`${p.hour}-${p.minute}`}
                                                    onClick={() => {
                                                        setDraftHour(p.hour)
                                                        setDraftMinute(p.minute)
                                                    }}
                                                    className={`relative p-3 rounded-lg border text-left transition-colors ${
                                                        isSelected
                                                            ? 'bg-green-50 border-brand'
                                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                                                            <Check size={10} className="text-white" strokeWidth={3} />
                                                        </span>
                                                    )}
                                                    <div className={`text-[15px] font-semibold tabular-nums ${
                                                        isSelected ? 'text-brand' : 'text-gray-900'
                                                    }`}>
                                                        {p.label}
                                                    </div>
                                                    <div className={`text-[10px] mt-0.5 ${
                                                        isSelected ? 'text-brand' : 'text-gray-400'
                                                    }`}>
                                                        {p.desc}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Custom time inputs */}
                                    <div className="border-t border-gray-100 pt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <div className="text-[13px] font-medium text-gray-800">
                                                    Custom time
                                                </div>
                                                <div className="text-[11px] text-gray-400">
                                                    24-hour format · {formatTwelveHour(draftHour, draftMinute)} · Asia/Tashkent
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 font-mono">
                                                <NumberSpinner
                                                    value={draftHour}
                                                    min={0}
                                                    max={23}
                                                    onChange={setDraftHour}
                                                    ariaLabel="Hour"
                                                />
                                                <span className="text-gray-400 text-[16px] font-semibold">:</span>
                                                <NumberSpinner
                                                    value={draftMinute}
                                                    min={0}
                                                    max={59}
                                                    onChange={setDraftMinute}
                                                    ariaLabel="Minute"
                                                />
                                            </div>
                                        </div>

                                        {/* Live preview */}
                                        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                            <Clock size={13} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-[12px] text-gray-600">
                                                Next reset {nextResetText}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mutation error */}
                                    {mutation.isError && (
                                        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                                            <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-[12px] text-red-700">
                                                {mutation.error instanceof Error
                                                    ? mutation.error.message
                                                    : 'Could not save settings'}
                                            </span>
                                        </div>
                                    )}


                                    {/* Success banner — auto-fades after 3s */}
                                    {showSuccess && (
                                        <div
                                            role="status"
                                            className="mt-3 px-3 py-2 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 transition-opacity duration-300"
                                        >
                                            <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                                                <Check size={10} className="text-white" strokeWidth={3} />
                                            </div>
                                            <span className="text-[12px] font-medium text-green-800">
                                                Settings saved
                                            </span>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={handleCancel}
                                            disabled={!isDirty || mutation.isPending}
                                            className="px-4 py-1.5 text-[13px] font-medium text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={!isDirty || mutation.isPending}
                                            className="px-4 py-1.5 text-[13px] font-medium text-white bg-brand rounded-lg hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {mutation.isPending ? 'Saving…' : 'Save'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Warning note */}
                    <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] text-amber-800 leading-relaxed">
                            This setting only affects which orders appear on the Live board.
                            Order data is never deleted — you can always find every order on the
                            Orders page using the date filter.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ═════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════

function NumberSpinner({
                           value, min, max, onChange, ariaLabel,
                       }: {
    value:     number
    min:       number
    max:       number
    onChange:  (v: number) => void
    ariaLabel: string
}) {
    return (
        <input
            type="number"
            inputMode="numeric"
            aria-label={ariaLabel}
            value={value.toString().padStart(2, '0')}
            min={min}
            max={max}
            onChange={(e) => {
                const raw = parseInt(e.target.value, 10)
                if (isNaN(raw)) return
                const clamped = Math.max(min, Math.min(max, raw))
                onChange(clamped)
            }}
            className="w-14 px-2 py-1.5 text-[15px] font-semibold text-center text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-brand focus:bg-white tabular-nums"
        />
    )
}

function SkeletonBody() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                ))}
            </div>
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-9 bg-gray-100 rounded-lg" />
        </div>
    )
}

function ErrorBody({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="text-center py-6">
            <AlertCircle size={20} className="mx-auto text-red-500 mb-2" />
            <p className="text-[13px] font-medium text-gray-800">Couldn't load settings</p>
            <p className="text-[11px] text-gray-500 mt-1 mb-3">{message}</p>
            <button
                onClick={onRetry}
                className="px-3 py-1.5 text-[12px] font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
                Try again
            </button>
        </div>
    )
}

// ═════════════════════════════════════════════════════════════
// "Next reset in Xh Ym" — computed in Asia/Tashkent local time
// regardless of where the user actually is.
// ═════════════════════════════════════════════════════════════

function formatNextReset(hour: number, minute: number): string {
    const TASHKENT_OFFSET_HOURS = 5

    // Express "now" as wall-clock in Asia/Tashkent
    const nowUtc      = new Date()
    const nowTashkent = new Date(nowUtc.getTime() + TASHKENT_OFFSET_HOURS * 60 * 60 * 1000)

    // Construct today's reset moment in Tashkent wall-clock
    const todaysReset = new Date(Date.UTC(
        nowTashkent.getUTCFullYear(),
        nowTashkent.getUTCMonth(),
        nowTashkent.getUTCDate(),
        hour,
        minute,
        0, 0,
    ))

    let next = todaysReset
    if (nowTashkent.getTime() >= todaysReset.getTime()) {
        // already passed today — next is tomorrow
        next = new Date(todaysReset.getTime() + 24 * 60 * 60 * 1000)
    }

    const diffMs  = next.getTime() - nowTashkent.getTime()
    const diffMin = Math.max(0, Math.floor(diffMs / 60_000))
    const hours   = Math.floor(diffMin / 60)
    const mins    = diffMin % 60

    const todayOrTomorrow = next.getTime() === todaysReset.getTime() ? 'today' : 'tomorrow'
    const timeLabel       = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    if (hours === 0 && mins === 0) {
        return `is now (${timeLabel})`
    }
    if (hours === 0) {
        return `${todayOrTomorrow} at ${timeLabel} · in ${mins}m`
    }
    return `${todayOrTomorrow} at ${timeLabel} · in ${hours}h ${mins}m`
}

// ═════════════════════════════════════════════════════════════
// 12-hour translation — small parenthetical for users who learned
// time on an AM/PM clock. We stay 24-hour as the primary format
// (matches Uzbek market norms), but offer this as a sanity check.
// ═════════════════════════════════════════════════════════════

function formatTwelveHour(hour: number, minute: number): string {
    const period = hour < 12 ? 'AM' : 'PM'
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const mm = String(minute).padStart(2, '0')
    return `${h12}:${mm} ${period}`
}