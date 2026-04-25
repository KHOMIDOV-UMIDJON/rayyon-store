import { CheckCircle, Circle } from 'lucide-react'
import type { OrderStatus, StatusHistory, StaffRole } from '../../types'
import { formatDateTime, formatElapsed, formatTotalElapsed } from '../../lib/dateUtils'

// ─────────────────────────────────────────────────────────────
// Timeline rendering rules
//   - Collapse duplicate consecutive entries with same status
//   - Show actor name and a role chip ("Collector", "Driver", "Store", "Customer")
//   - Highlight the current stage
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

const ROLE_TONE: Record<StaffRole, string> = {
    SUPER_ADMIN:     'text-purple-700',
    STORE_MANAGER:   'text-purple-700',
    DISPATCHER:      'text-purple-700',
    DRIVER:          'text-blue-700',
    COLLECTOR:       'text-orange-700',
    FINANCE_MANAGER: 'text-gray-600',
    CUSTOMER:        'text-blue-500',
}

function dedupeHistory(history: StatusHistory[]): StatusHistory[] {
    // Keep only the FIRST occurrence of each status (in chronological order).
    // Subsequent same-status events still appear in the Event log; they
    // don't represent new lifecycle stages.
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

export default function OrderTimeline({ history, currentStatus }: Props) {
    const events = dedupeHistory(history)
    const totalElapsed = events.length > 0
        ? formatTotalElapsed(events[0].createdAt, events[events.length - 1].createdAt)
        : ''

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
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

                    return (
                        <li key={`${evt.status}-${evt.createdAt}`} className="mb-4 last:mb-0 relative">
                            {/* Dot */}
                            <span className="absolute -left-[27px] top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-white">
                                {isCurrent && !isLast ? (
                                    <Circle size={14} className="text-brand fill-brand/20" />
                                ) : isCurrent && isLast ? (
                                    <CheckCircle size={14} className="text-brand fill-brand" />
                                ) : (
                                    <CheckCircle size={14} className="text-brand fill-green-100" />
                                )}
                            </span>

                            {/* Event content */}
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className={'text-[13px] font-semibold ' + (isCurrent ? 'text-brand-dark' : 'text-gray-900')}>
                                        {STATUS_LABELS[evt.status] ?? evt.status}
                                    </div>
                                    {evt.changedByName && (
                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                            by <span className="text-gray-700 font-medium">{evt.changedByName}</span>
                                            {evt.changedByRole && (
                                                <span className={'ml-1.5 text-[10px] font-semibold uppercase tracking-wide ' + ROLE_TONE[evt.changedByRole]}>
                                                    {ROLE_LABEL[evt.changedByRole]}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                                    {formatDateTime(evt.createdAt)}
                                </div>
                            </div>

                            {elapsed && (
                                <div className="text-[10px] text-gray-400 mt-1">
                                    +{elapsed}
                                    {isCurrent && <span className="text-brand-dark font-medium"> · current stage</span>}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}