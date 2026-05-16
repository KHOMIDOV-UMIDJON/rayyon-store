import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Info, AlertCircle } from 'lucide-react'

import { storeApi } from '../../api'
import type { StoreInfo, StoreHours } from '../../types'

// ─────────────────────────────────────────────────────────────
// MY STORE PAGE
//
// Read-only view of the store's identity, working hours, and
// delivery rules. Edits happen in the admin panel — see the
// footer note.
//
// Layout: two-column grid below a full-width hero.
//   Left column:  Working hours (tall, 7 rows)
//   Right column: Store information + Delivery (stacked)
// At <1024px viewport, the grid collapses to single column.
// ─────────────────────────────────────────────────────────────

const TASHKENT_OFFSET_HOURS = 5

const DAY_ORDER: Array<{ key: StoreHours['dayOfWeek']; label: string }> = [
    { key: 'MONDAY',    label: 'Monday'    },
    { key: 'TUESDAY',   label: 'Tuesday'   },
    { key: 'WEDNESDAY', label: 'Wednesday' },
    { key: 'THURSDAY',  label: 'Thursday'  },
    { key: 'FRIDAY',    label: 'Friday'    },
    { key: 'SATURDAY',  label: 'Saturday'  },
    { key: 'SUNDAY',    label: 'Sunday'    },
]

export default function StorePage() {
    const { data: store, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['my-store'],
        queryFn:  storeApi.getMyStore,
    })

    // Tick every minute so the "Open now" pill stays accurate
    const [, forceTick] = useState(0)
    useEffect(() => {
        const t = setInterval(() => forceTick((n) => n + 1), 60_000)
        return () => clearInterval(t)
    }, [])

    if (isLoading)           return <PageSkeleton />
    if (isError || !store) {
        return (
            <ErrorScreen
                message={error instanceof Error ? error.message : 'Failed to load store'}
                onRetry={() => refetch()}
            />
        )
    }

    return <StoreContent store={store} />
}

// ═════════════════════════════════════════════════════════════
// Main content
// ═════════════════════════════════════════════════════════════

function StoreContent({ store }: { store: StoreInfo }) {
    const initial    = getStoreInitial(store.nameUz)
    const openStatus = useMemo(
        () => computeOpenStatus(store.workingHours ?? []),
        // recomputes on every minute tick (parent forces re-render)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [store.workingHours],
    )

    return (
        <div className="h-full overflow-auto bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-6">

                {/* ── Hero (full-width) ──────────────────── */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 flex items-center gap-4 flex-wrap">
                    <div className="w-11 h-11 rounded-[10px] bg-brand flex items-center justify-center text-white font-medium text-[16px] flex-shrink-0">
                        {initial}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <h1 className="text-[16px] font-semibold text-gray-900 leading-tight">
                            {store.nameUz}
                        </h1>
                        <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                            {[store.city, store.address].filter(Boolean).join(' · ') || '—'}
                        </p>
                    </div>
                    <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{
                            background: openStatus.color === '#0F6E56' ? '#E1F5EE' : '#F1EFE8',
                            color:      openStatus.color,
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: openStatus.color }}
                        />
                        {openStatus.label}
                    </span>
                    <StatusPill status={store.status} />
                </div>

                {/* ── Two-column grid ────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Left: working hours */}
                    <Card title="Working hours">
                        <WorkingHoursList hours={store.workingHours ?? []} />
                    </Card>

                    {/* Right: info + delivery stacked */}
                    <div className="flex flex-col gap-4">
                        <Card title="Store information">
                            <Row label="Store name" value={store.nameUz} />
                            <Row label="City"       value={store.city} />
                            <Row label="Address"    value={store.address} />
                            <Row label="Phone"      value={store.phone} accent />
                            <Row label="Email"      value={store.email} />
                        </Card>

                        <Card title="Delivery">
                            <Row label="Delivery radius"
                                 value={formatKm(store.deliveryRadiusKm)} />
                            <Row label="Minimum order"
                                 value={formatUzs(store.minimumOrderAmount)} />
                            <Row label="Delivery fee"
                                 value={formatUzs(store.deliveryFee)} />
                            <Row label="Free delivery from"
                                 value={store.freeDeliveryFrom ? formatUzs(store.freeDeliveryFrom) : 'Not configured'} />
                        </Card>
                    </div>
                </div>

                {/* Footer note */}
                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg mt-4">
                    <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-800 leading-relaxed">
                        To update store information, working hours, or delivery rules, contact your administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ═════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-[13px] font-semibold text-gray-900">{title}</h2>
            </div>
            {children}
        </div>
    )
}

function Row({
                 label, value, accent = false,
             }: {
    label:  string
    value:  string | null | undefined
    accent?: boolean
}) {
    const display = value && value.toString().trim() !== '' ? value : '—'
    const isEmpty = display === '—'
    return (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-0 text-[13px]">
            <span className="text-gray-400">{label}</span>
            <span className={
                isEmpty
                    ? 'text-gray-300 italic'
                    : accent
                        ? 'text-brand font-medium'
                        : 'text-gray-900'
            }>
                {display}
            </span>
        </div>
    )
}

function StatusPill({ status }: { status: string }) {
    const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.UNKNOWN
    return (
        <span
            className="text-[10px] font-semibold tracking-[0.05em] px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: cfg.bg, color: cfg.text }}
        >
            {status}
        </span>
    )
}

function WorkingHoursList({ hours }: { hours: StoreHours[] }) {
    if (!hours || hours.length === 0) {
        return (
            <div className="px-5 py-6 text-center">
                <p className="text-[13px] text-gray-500">Hours not configured yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                    Ask your administrator to set up your store's working hours.
                </p>
            </div>
        )
    }

    const byDay = new Map<StoreHours['dayOfWeek'], StoreHours>()
    for (const h of hours) byDay.set(h.dayOfWeek, h)

    const todayKey = currentDayOfWeekTashkent()

    return (
        <div>
            {DAY_ORDER.map(({ key, label }) => {
                const h       = byDay.get(key)
                const isToday = key === todayKey
                const isOpen  = h?.isOpen === true

                return (
                    <div
                        key={key}
                        className={`grid grid-cols-[110px_1fr_14px] items-center px-5 py-2.5 border-b border-gray-100 last:border-0 text-[13px] ${
                            isToday ? 'bg-[#FAFCFB]' : ''
                        }`}
                    >
                        <span className="text-gray-600">
                            {label}
                            {isToday && <span className="text-gray-400"> · today</span>}
                        </span>

                        {h && isOpen ? (
                            <span className="tabular-nums text-gray-900">
                                {formatTime(h.openTime)} – {formatTime(h.closeTime)}
                            </span>
                        ) : (
                            <span className="text-gray-400 italic">Closed</span>
                        )}

                        <span
                            className="w-1.5 h-1.5 rounded-full justify-self-end"
                            style={{ background: isOpen ? '#1D9E75' : '#D3D1C7' }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

// ═════════════════════════════════════════════════════════════
// Skeleton + error states
// ═════════════════════════════════════════════════════════════

function PageSkeleton() {
    return (
        <div className="h-full overflow-auto bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-6 animate-pulse">
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-[10px] bg-gray-100" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-gray-100 rounded" />
                            <div className="h-3 w-48 bg-gray-100 rounded" />
                        </div>
                        <div className="h-5 w-24 bg-gray-100 rounded-full" />
                        <div className="h-5 w-16 bg-gray-100 rounded-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-3 w-full bg-gray-100 rounded" />
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                            <div className="h-3 w-32 bg-gray-100 rounded" />
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-3 w-full bg-gray-100 rounded" />
                            ))}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                            <div className="h-3 w-32 bg-gray-100 rounded" />
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-3 w-full bg-gray-100 rounded" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-xs">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
                    <AlertCircle size={20} className="text-red-500" />
                </div>
                <p className="text-[14px] font-medium text-gray-800 mb-1">
                    Couldn't load your store
                </p>
                <p className="text-[12px] text-gray-500 mb-4 break-words">{message}</p>
                <button
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}

// ═════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════

interface OpenStatus {
    label: string
    color: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    ACTIVE:      { bg: '#E1F5EE', text: '#0F6E56' },
    COMING_SOON: { bg: '#FAEEDA', text: '#854F0B' },
    INACTIVE:    { bg: '#FCEBEB', text: '#A32D2D' },
    UNKNOWN:     { bg: '#F1EFE8', text: '#5F5E5A' },
}

function getStoreInitial(name: string): string {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatKm(km: number | string | null | undefined): string {
    if (km == null) return '—'
    const n = typeof km === 'string' ? parseFloat(km) : km
    if (isNaN(n)) return '—'
    return `${n.toFixed(1)} km`
}

function formatUzs(amount: number | string | null | undefined): string {
    if (amount == null) return '—'
    const n = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(n)) return '—'
    return `${new Intl.NumberFormat('uz-UZ').format(Math.round(n))} UZS`
}

function formatTime(t: string | null): string {
    if (!t) return ''
    const parts = t.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
    return t
}

function currentDayOfWeekTashkent(): StoreHours['dayOfWeek'] {
    const nowUtc      = new Date()
    const nowTashkent = new Date(nowUtc.getTime() + TASHKENT_OFFSET_HOURS * 60 * 60 * 1000)
    const dows: StoreHours['dayOfWeek'][] = [
        'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
        'THURSDAY', 'FRIDAY', 'SATURDAY',
    ]
    return dows[nowTashkent.getUTCDay()]
}

function computeOpenStatus(hours: StoreHours[]): OpenStatus {
    if (!hours || hours.length === 0) {
        return { label: 'Hours not configured', color: '#888780' }
    }

    const nowUtc      = new Date()
    const nowTashkent = new Date(nowUtc.getTime() + TASHKENT_OFFSET_HOURS * 60 * 60 * 1000)
    const nowMinutes  = nowTashkent.getUTCHours() * 60 + nowTashkent.getUTCMinutes()
    const todayKey    = currentDayOfWeekTashkent()

    const byDay = new Map<StoreHours['dayOfWeek'], StoreHours>()
    for (const h of hours) byDay.set(h.dayOfWeek, h)

    const todayHours = byDay.get(todayKey)
    if (todayHours && todayHours.isOpen && todayHours.openTime && todayHours.closeTime) {
        const open  = toMinutes(todayHours.openTime)
        const close = toMinutes(todayHours.closeTime)
        if (nowMinutes >= open && nowMinutes < close) {
            return {
                label: `Open now until ${formatTime(todayHours.closeTime)}`,
                color: '#0F6E56',
            }
        }
        if (nowMinutes < open) {
            return {
                label: `Closed · opens today at ${formatTime(todayHours.openTime)}`,
                color: '#888780',
            }
        }
    }

    const order: StoreHours['dayOfWeek'][] = [
        'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
        'FRIDAY', 'SATURDAY', 'SUNDAY',
    ]
    const labelByKey: Record<StoreHours['dayOfWeek'], string> = {
        MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
        THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
    }
    const todayIdx = order.indexOf(todayKey === 'SUNDAY' ? 'SUNDAY' : todayKey)

    for (let i = 1; i <= 7; i++) {
        const key      = order[(todayIdx + i) % 7]
        const dayHours = byDay.get(key)
        if (dayHours && dayHours.isOpen && dayHours.openTime) {
            const when = i === 1 ? 'tomorrow' : labelByKey[key]
            return {
                label: `Closed · opens ${when} at ${formatTime(dayHours.openTime)}`,
                color: '#888780',
            }
        }
    }

    return { label: 'Closed', color: '#888780' }
}

function toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}