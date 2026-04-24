import type { Order, OrderFilters, UrgencyTier } from '../types'

// ─────────────────────────────────────────────────────────────
// TERMINAL STATES — timer freezes when order reaches any of these
// ─────────────────────────────────────────────────────────────
const TERMINAL_STATUSES = new Set<string>([
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
])

// Returns elapsed seconds since order creation.
// If the order has reached a terminal state, the elapsed time
// is frozen at (updatedAt - createdAt) so the timer stops ticking.
export function getWaitSeconds(order: Order): number {
    const created = new Date(order.createdAt).getTime()
    if (isNaN(created)) return 0

    const endMs = TERMINAL_STATUSES.has(order.status) && order.updatedAt
        ? new Date(order.updatedAt).getTime()
        : Date.now()

    const secs = Math.floor((endMs - created) / 1000)
    return secs < 0 ? 0 : secs
}

// Whether this order's timer is still running
export function isOrderActive(order: Order): boolean {
    return !TERMINAL_STATUSES.has(order.status)
}

// ─────────────────────────────────────────────────────────────
// URGENCY TIERS — only apply to active orders
// < 15 min  -> normal
// 15-30 min -> warning
// > 30 min  -> overdue
// Terminal orders always return 'normal' (no urgency badge)
// ─────────────────────────────────────────────────────────────
export function getUrgencyTier(order: Order): UrgencyTier {
    if (!isOrderActive(order)) return 'normal'
    const secs = getWaitSeconds(order)
    if (secs > 30 * 60) return 'overdue'
    if (secs > 15 * 60) return 'warning'
    return 'normal'
}

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────

// Short form for legacy uses: "2m" or "1h 5m" or "1d 4h"
export function formatWait(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const mm = m % 60
    if (h < 24) return mm > 0 ? `${h}h ${mm}m` : `${h}h`
    const d = Math.floor(h / 24)
    const hh = h % 24
    return hh > 0 ? `${d}d ${hh}h` : `${d}d`
}

// Full segmented breakdown — returns every unit separately so the
// card can render them as labeled pills separated by dots.
// Always returns at least seconds, then grows as needed.
export interface WaitSegments {
    days: number
    hours: number
    minutes: number
    seconds: number
}

export function getWaitSegments(totalSeconds: number): WaitSegments {
    if (totalSeconds < 0) totalSeconds = 0
    const days    = Math.floor(totalSeconds / 86400)
    const hours   = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { days, hours, minutes, seconds }
}

// ─────────────────────────────────────────────────────────────
// URGENCY STYLES — tailwind classes for tier-based coloring
// ─────────────────────────────────────────────────────────────
export const URGENCY_STYLES: Record<UrgencyTier, { text: string; bg: string; pill: string }> = {
    normal:  { text: 'text-brand-dark',  bg: 'bg-green-50', pill: 'bg-green-50 text-brand-dark' },
    warning: { text: 'text-amber-700',   bg: 'bg-amber-50', pill: 'bg-amber-50 text-amber-800'  },
    overdue: { text: 'text-red-600',     bg: 'bg-red-50',   pill: 'bg-red-50 text-red-700'      },
}

// ─────────────────────────────────────────────────────────────
// FILTER APPLICATION
// ─────────────────────────────────────────────────────────────
export function applyOrderFilters(
    orders: Order[],
    filters: OrderFilters,
    urgencyOf: (o: Order) => UrgencyTier,
): Order[] {
    return orders.filter(order => {
        if (filters.search) {
            const q = filters.search.toLowerCase()
            const hit =
                order.orderId.toLowerCase().includes(q) ||
                (order.customerName?.toLowerCase().includes(q) ?? false) ||
                (order.deliveryAddress?.toLowerCase().includes(q) ?? false)
            if (!hit) return false
        }
        if (filters.status        && order.status !== filters.status) return false
        if (filters.paymentMethod && order.paymentMethod !== filters.paymentMethod) return false
        if (filters.collectorId   && order.collectorId !== filters.collectorId) return false
        if (filters.driverId      && order.assignedDriverId !== filters.driverId) return false
        if (filters.urgency       && urgencyOf(order) !== filters.urgency) return false
        return true
    })
}