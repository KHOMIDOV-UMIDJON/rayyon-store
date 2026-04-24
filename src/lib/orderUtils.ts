import type { Order, OrderFilters, UrgencyTier } from '../types'

// ─────────────────────────────────────────────────────────────
// WAIT SECONDS — seconds since the order was created
// ─────────────────────────────────────────────────────────────
export function getWaitSeconds(order: Order): number {
    return (
        order.waitSeconds ??
        Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)
    )
}

// ─────────────────────────────────────────────────────────────
// URGENCY TIER — Jush-style 3 levels
//   < 15 min  -> normal
//   15-30 min -> warning
//   > 30 min  -> overdue
// ─────────────────────────────────────────────────────────────
export const URGENCY_WARNING_SECS = 15 * 60
export const URGENCY_OVERDUE_SECS = 30 * 60

export function getUrgencyTier(order: Order): UrgencyTier {
    const wait = getWaitSeconds(order)
    if (wait >= URGENCY_OVERDUE_SECS) return 'overdue'
    if (wait >= URGENCY_WARNING_SECS) return 'warning'
    return 'normal'
}

// ─────────────────────────────────────────────────────────────
// FORMAT WAIT — "mm:ss"
// ─────────────────────────────────────────────────────────────
export function formatWait(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

// ─────────────────────────────────────────────────────────────
// URGENCY STYLES — Tailwind class names
// ─────────────────────────────────────────────────────────────
export interface UrgencyStyle {
    dot: string
    text: string
    bg: string
    border: string
    label: string
}

export const URGENCY_STYLES: Record<UrgencyTier, UrgencyStyle> = {
    normal: {
        dot: 'bg-gray-300',
        text: 'text-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        label: 'Normal',
    },
    warning: {
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: '15-30 min',
    },
    overdue: {
        dot: 'bg-red-500',
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Overdue',
    },
}

// ─────────────────────────────────────────────────────────────
// APPLY ORDER FILTERS — pure function, runs in-memory
// Used by KanbanPage to filter orders before splitting into columns
// ─────────────────────────────────────────────────────────────
export function applyOrderFilters(
    orders: Order[],
    filters: OrderFilters,
    getUrgency: (o: Order) => UrgencyTier,
): Order[] {
    const q = filters.search.trim().toLowerCase()

    return orders.filter(o => {
        if (q) {
            const haystack = [
                o.orderId,
                o.customerName,
                o.customerPhone,
                o.deliveryAddress,
            ].join(' ').toLowerCase()
            if (!haystack.includes(q)) return false
        }
        if (filters.status        && o.status !== filters.status)               return false
        if (filters.paymentMethod && o.paymentMethod !== filters.paymentMethod) return false
        if (filters.collectorId   && o.collectorId !== filters.collectorId)     return false
        if (filters.driverId      && o.assignedDriverId !== filters.driverId)   return false
        if (filters.urgency       && getUrgency(o) !== filters.urgency)         return false
        return true
    })
}