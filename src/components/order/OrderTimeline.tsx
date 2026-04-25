import { CheckCircle, Circle } from 'lucide-react'
import type { OrderStatus, StatusHistory, StaffRole } from '../../types'
import { formatDateTime, formatElapsed, formatTotalElapsed } from '../../lib/dateUtils'

// ─────────────────────────────────────────────────────────────
// Consolidated timeline (replaces the old separate Event log)
//
// Each step shows:
//   - Status name (e.g. "Driver assigned")
//   - Actor avatar + name + role chip
//   - Timestamp (right side)
//   - Elapsed time below (gap to next step)
//   - For events that name another person (driver/collector assigned),
//     an inline target hint with that person's avatar
// ─────────────────────────────────────────────────────────────

interface Props {
    history: StatusHistory[]
    currentStatus: OrderStatus
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    CREATED:          'Order placed',
    CONFIRMED:        'Confirmed',
    ASSIGNED:         'Assigned',
    PREPARING:        'Preparing',
    READY_FOR_PICKUP: 'Ready for pickup',
    COURIER_ASSIGNED: 'Driver assigned',
    COURIER_ACCEPTED: 'Driver accepted',
    PICKED_UP:        'Picked up',
    DELIVERED:        'Delivered',
    COMPLETED:        'Completed',
    CANCELLED:        'Cancelled',
}

const ROLE_LABEL: Record<StaffRole, string> = {
    SUPER_ADMIN:     'Super admin',
    STORE_MANAGER:   'Store manager',
    DISPATCHER:      'Dispatcher',
    DRIVER:          'Driver',
    COLLECTOR:       'Collector',
    FINANCE_MANAGER: 'Finance',
    CUSTOMER:        'Customer',
}

const ROLE_STYLES: Record<StaffRole, { bg: string; text: string; avatarBg: string; avatarText: string }> = {
    SUPER_ADMIN:     { bg: 'bg-purple-50', text: 'text-purple-700', avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' },
    STORE_MANAGER:   { bg: 'bg-purple-50', text: 'text-purple-700', avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' },
    DISPATCHER:      { bg: 'bg-purple-50', text: 'text-purple-700', avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' },
    DRIVER:          { bg: 'bg-blue-50',   text: 'text-blue-700',   avatarBg: 'bg-blue-100',   avatarText: 'text-blue-700'   },
    COLLECTOR:       { bg: 'bg-orange-50', text: 'text-orange-700', avatarBg: 'bg-orange-100', avatarText: 'text-orange-700' },
    FINANCE_MANAGER: { bg: 'bg-gray-100',  text: 'text-gray-600',   avatarBg: 'bg-gray-200',   avatarText: 'text-gray-600'   },
    CUSTOMER:        { bg: 'bg-blue-50',   text: 'text-blue-500',   avatarBg: 'bg-blue-100',   avatarText: 'text-blue-700'   },
}

function initials(name: string | null | undefined): string {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// Keep only the first occurrence of each status so we collapse
// duplicate consecutive entries from the backend (e.g. multiple
// CONFIRMED rows). The Event log used to expose these duplicates;
// the consolidated timeline doesn't need them.
function dedupeHistory(history: StatusHistory[]): StatusHistory[] {
    const seen = new Set<OrderStatus>()
    const result: StatusHistory[] = []
    for (const h of history) {
        if (!seen.has(h.status)) {
            seen.add(h.status)
            result.push(h)
        }
    }
    return result
}

// Try to extract the assignee's display name from the history note.
// Notes are in the format "Driver assigned: Alisher Toshmatov" or
// "Collector assigned: Dilshod Rasulov" — we just read everything
// after the colon.
function extractAssigneeName(note: string | null | undefined): string | null {
    if (!note) return null
    const idx = note.indexOf(':')
    if (idx === -1) return null
    return note.slice(idx + 1).trim() || null
}

export default function OrderTimeline({ history, currentStatus }: Props) {
    const events = dedupeHistory(history)
    const totalElapsed = events.length > 0
        ? formatTotalElapsed(events[0].createdAt, events[events.length - 1].createdAt)
        : ''

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-gray-900">Timeline</h2>
                {totalElapsed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-brand-dark">
                        {totalElapsed} total
                    </span>
                )}
            </div>

            <ol className="relative pl-5 border-l border-gray-200">
                {events.map((evt, idx) => {
                    const isCurrent = evt.status === currentStatus
                    const isLast = idx === events.length - 1
                    const next = idx < events.length - 1 ? events[idx + 1] : null
                    const elapsed = next ? formatElapsed(evt.createdAt, next.createdAt) : null

                    const role = evt.changedByRole
                    const roleStyle = role ? ROLE_STYLES[role] : null

                    // Show target hint for events that assign another person.
                    // The "actor" did the assigning; the "target" is who got assigned.
                    const isAssignmentEvent =
                        evt.status === 'COURIER_ASSIGNED' ||
                        evt.status === 'ASSIGNED'
                    const targetName = isAssignmentEvent ? extractAssigneeName(evt.note) : null

                    return (
                        <li key={`${evt.status}-${evt.createdAt}`} className="mb-5 last:mb-0 relative">
                            {/* Step dot */}
                            <span className="absolute -left-[27px] top-0.5 flex items-center justify-center">
                                {isCurrent ? (
                                    <span className="relative flex">
                                        <span className="absolute inset-0 rounded-full bg-brand opacity-25 animate-ping" />
                                        <span className="relative w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-green-50" />
                                    </span>
                                ) : (
                                    <CheckCircle size={14} className="text-brand fill-green-100" />
                                )}
                            </span>

                            {/* Header row: status + timestamp */}
                            <div className="flex justify-between items-start gap-2">
                                <div className={'text-[13px] font-semibold ' + (isCurrent ? 'text-brand-dark' : 'text-gray-900')}>
                                    {STATUS_LABELS[evt.status] ?? evt.status}
                                </div>
                                <div className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5 flex-shrink-0">
                                    {formatDateTime(evt.createdAt)}
                                </div>
                            </div>

                            {/* Actor row: avatar + name + role chip */}
                            {evt.changedByName && (
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <div className={
                                        'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ' +
                                        (roleStyle ? `${roleStyle.avatarBg} ${roleStyle.avatarText}` : 'bg-gray-200 text-gray-600')
                                    }>
                                        {initials(evt.changedByName)}
                                    </div>
                                    <span className="text-[11px] text-gray-600">{evt.changedByName}</span>
                                    {role && (
                                        <span className={
                                            'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ' +
                                            roleStyle!.bg + ' ' + roleStyle!.text
                                        }>
                                            {ROLE_LABEL[role]}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Inline target hint for assignment events */}
                            {targetName && (
                                <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-[10px] text-gray-400">
                                    <span>→ assigned</span>
                                    <div className={
                                        'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ' +
                                        (evt.status === 'COURIER_ASSIGNED'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-orange-100 text-orange-700')
                                    }>
                                        {initials(targetName)}
                                    </div>
                                    <span className={
                                        'font-medium ' +
                                        (evt.status === 'COURIER_ASSIGNED' ? 'text-purple-700' : 'text-orange-700')
                                    }>
                                        {targetName}
                                    </span>
                                </div>
                            )}

                            {/* Elapsed footer + current marker */}
                            {(elapsed || isCurrent) && (
                                <div className="text-[10px] mt-2 leading-tight">
                                    {elapsed && (
                                        <span className="text-gray-400">+{elapsed}</span>
                                    )}
                                    {isCurrent && !isLast && (
                                        <span className="text-brand-dark font-medium ml-2">· Current stage</span>
                                    )}
                                    {isCurrent && isLast && (
                                        <span className="text-brand-dark font-medium">● Current stage</span>
                                    )}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
