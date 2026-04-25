import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { storeApi } from '../../api'
import OrderFilterBar from '../../components/filters/OrderFilterBar'
import {
    getWaitSeconds,
    getUrgencyTier,
    getWaitSegments,
    isOrderActive,
    URGENCY_STYLES,
    applyOrderFilters,
} from '../../lib/orderUtils'
import { useCurrentTime } from '../../lib/useCurrentTime'
import { EMPTY_FILTERS } from '../../types'
import type { Order, OrderStatus, OrderFilters, UrgencyTier } from '../../types'

// ─────────────────────────────────────────────────────────────
// COLUMNS — multi-status to status mapping
// ─────────────────────────────────────────────────────────────
const COLUMNS: {
    id: string
    statuses: OrderStatus[]
    label: string
    color: string
    bg: string
    border: string
}[] = [
    { id: 'new',       statuses: ['CONFIRMED'],                                                 label: 'New orders', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { id: 'preparing', statuses: ['PREPARING'],                                                 label: 'Preparing',  color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    { id: 'ready',     statuses: ['READY_FOR_PICKUP', 'COURIER_ASSIGNED', 'COURIER_ACCEPTED'],  label: 'Ready',      color: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB' },
    { id: 'pickedup',  statuses: ['PICKED_UP'],                                                 label: 'Picked up',  color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { id: 'delivered', statuses: ['DELIVERED', 'COMPLETED'],                                    label: 'Delivered',  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
]

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Cash', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum',
}

function fmtMoney(n: number) {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(n))
}

function initials(name: string | null | undefined) {
    return name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'
}

// ─────────────────────────────────────────────────────────────
// Items summary — single line, never wraps
//   1 item  → "Coca-Cola 0.5L ×38"
//   2+      → "Coca-Cola 0.5L + N more item(s)"
// ─────────────────────────────────────────────────────────────
function itemsSummary(items: Order['items']): string {
    if (!items || items.length === 0) return 'No items'
    const first = items[0]
    if (items.length === 1) {
        return `${first.productName} ×${first.quantity}`
    }
    const remaining = items.length - 1
    return `${first.productName} + ${remaining} more item${remaining === 1 ? '' : 's'}`
}

// ─────────────────────────────────────────────────────────────
// Assignee — strict single, currently responsible person only
// ─────────────────────────────────────────────────────────────
type Assignee =
    | { kind: 'placeholder'; text: string; tone: 'red' | 'amber' | 'green' }
    | { kind: 'person'; name: string; tone: 'orange' | 'green' | 'purple' | 'grey' }

function getAssignee(order: Order): Assignee {
    switch (order.status) {
        case 'CONFIRMED':
            return { kind: 'placeholder', text: 'Awaiting collector', tone: 'red' }
        case 'PREPARING':
            return order.collectorName
                ? { kind: 'person', name: order.collectorName, tone: 'orange' }
                : { kind: 'placeholder', text: 'Awaiting collector', tone: 'amber' }
        case 'READY_FOR_PICKUP':
            return { kind: 'placeholder', text: 'Awaiting driver', tone: 'green' }
        case 'COURIER_ASSIGNED':
        case 'COURIER_ACCEPTED':
            return order.driverName
                ? { kind: 'person', name: order.driverName, tone: 'green' }
                : { kind: 'placeholder', text: 'Awaiting driver', tone: 'green' }
        case 'PICKED_UP':
            return order.driverName
                ? { kind: 'person', name: order.driverName, tone: 'purple' }
                : { kind: 'placeholder', text: 'Driver in transit', tone: 'green' }
        case 'DELIVERED':
        case 'COMPLETED':
            return order.driverName
                ? { kind: 'person', name: order.driverName, tone: 'grey' }
                : { kind: 'placeholder', text: 'Delivered', tone: 'green' }
        default:
            return { kind: 'placeholder', text: '—', tone: 'amber' }
    }
}

const ASSIGNEE_TONE = {
    orange: { avatarBg: 'bg-orange-100', avatarText: 'text-orange-700', text: 'text-orange-700' },
    green:  { avatarBg: 'bg-green-100',  avatarText: 'text-brand-dark', text: 'text-brand-dark'  },
    purple: { avatarBg: 'bg-purple-100', avatarText: 'text-purple-700', text: 'text-purple-700' },
    grey:   { avatarBg: 'bg-gray-200',   avatarText: 'text-gray-600',   text: 'text-gray-500'   },
}

const PLACEHOLDER_TONE = {
    red:   'text-red-500',
    amber: 'text-amber-700',
    green: 'text-brand-dark',
}

// ─────────────────────────────────────────────────────────────
// Timer pill — segmented (4d · 10h · 22m · 18s)
// ─────────────────────────────────────────────────────────────
function TimerPill({ order }: { order: Order }) {
    const seconds = getWaitSeconds(order)
    const tier: UrgencyTier = getUrgencyTier(order)
    const segs = getWaitSegments(seconds)
    const active = isOrderActive(order)

    const pillCls = !active ? 'bg-gray-100 text-gray-500' : URGENCY_STYLES[tier].pill
    const dotCls = !active
        ? 'text-gray-300'
        : tier === 'overdue' ? 'text-red-300'
            : tier === 'warning' ? 'text-amber-400'
                : 'text-brand/40'

    const parts: { value: number; label: string }[] = []
    if (segs.days > 0)                        parts.push({ value: segs.days, label: 'd' })
    if (parts.length > 0 || segs.hours > 0)   parts.push({ value: segs.hours, label: 'h' })
    if (parts.length > 0 || segs.minutes > 0) parts.push({ value: segs.minutes, label: 'm' })
    parts.push({ value: segs.seconds, label: 's' })

    return (
        <span
            className={'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold whitespace-nowrap ' + pillCls}
            style={{ fontVariantNumeric: 'tabular-nums' }}
        >
            {parts.map((p, i) => (
                <span key={p.label} className="inline-flex items-center gap-0.5">
                    {i > 0 && <span className={'text-[8px] ' + dotCls}>·</span>}
                    <span className="text-[10px]">{p.value}{p.label}</span>
                </span>
            ))}
        </span>
    )
}

// ─────────────────────────────────────────────────────────────
// OrderCard — fixed 5-row layout
//   1. Header: id + timer pill
//   2. Customer name (truncated)
//   3. Address (truncated)
//   4. Items summary (single line, truncated)
//   5. Assignee (avatar + name OR italic placeholder)
//   6. Footer: total + payment
// ─────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
    const col = COLUMNS.find(c => c.statuses.includes(order.status))
    const assignee = getAssignee(order)

    return (
        <div
            className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
            style={{ borderLeft: `3px solid ${col?.color ?? '#e5e7eb'}` }}
        >
            {/* Row 1: header */}
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-50">
                <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                    #{order.orderId.slice(0, 8)}
                </span>
                <span className="text-[10px] text-gray-400 flex-1 truncate min-w-0">{order.storeName}</span>
                <TimerPill order={order} />
            </div>

            <div className="px-2.5 py-2.5">
                {/* Row 2: customer */}
                <div className="text-[12px] font-semibold text-gray-900 truncate">
                    {order.customerName}
                </div>

                {/* Row 3: address */}
                <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {order.deliveryAddress || '—'}
                </div>

                {/* Row 4: items summary — single line */}
                <div className="mt-2 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-500 truncate">
                    {itemsSummary(order.items)}
                </div>

                {/* Row 5: assignee — fixed height for layout consistency */}
                <div className="h-[20px] mt-2 flex items-center gap-1.5">
                    {assignee.kind === 'person' ? (
                        <>
                            <div className={`w-4 h-4 rounded-full ${ASSIGNEE_TONE[assignee.tone].avatarBg} ${ASSIGNEE_TONE[assignee.tone].avatarText} flex items-center justify-center text-[8px] font-bold flex-shrink-0`}>
                                {initials(assignee.name)}
                            </div>
                            <span className={`text-[10px] font-medium truncate ${ASSIGNEE_TONE[assignee.tone].text}`}>
                                {assignee.name}
                            </span>
                        </>
                    ) : (
                        <span className={`text-[10px] italic ${PLACEHOLDER_TONE[assignee.tone]}`}>
                            {assignee.text}
                        </span>
                    )}
                </div>

                {/* Row 6: footer */}
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-gray-900 truncate">
                        {fmtMoney(order.totalAmount)} UZS
                    </span>
                    <span className="text-[10px] text-brand font-medium flex-shrink-0">
                        {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default function KanbanPage() {
    const navigate = useNavigate()
    const [filters, setFilters] = useState<OrderFilters>(EMPTY_FILTERS)

    useCurrentTime(1000)

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['store-orders'],
        queryFn: storeApi.getOrders,
        refetchInterval: 30_000,
    })

    const { data: staff = [] } = useQuery({
        queryKey: ['store-staff'],
        queryFn: storeApi.getStaff,
    })

    const filtered = useMemo(
        () => applyOrderFilters(orders, filters, getUrgencyTier),
        [orders, filters],
    )

    const activeStatuses: OrderStatus[] = [
        'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
        'COURIER_ASSIGNED', 'COURIER_ACCEPTED', 'PICKED_UP',
    ]
    const activeCount = filtered.filter(o => activeStatuses.includes(o.status)).length
    const urgentCount = filtered.filter(o =>
        getUrgencyTier(o) === 'overdue' && activeStatuses.includes(o.status),
    ).length

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div>
                    <h1 className="text-[15px] font-semibold text-gray-900">Live order board</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        {activeCount} active orders
                        {urgentCount > 0 && (
                            <span className="text-red-500 font-medium"> · {urgentCount} urgent</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 pt-4 flex-shrink-0">
                    <OrderFilterBar
                        filters={filters}
                        onChange={setFilters}
                        staff={staff}
                        totalCount={orders.length}
                        filteredCount={filtered.length}
                    />
                </div>

                <div className="flex-1 overflow-hidden px-4 pb-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-[13px] text-gray-400">
                            Loading orders...
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-3 h-full">
                            {COLUMNS.map(col => {
                                const colOrders = filtered
                                    .filter(o => col.statuses.includes(o.status))
                                    .sort((a, b) => getWaitSeconds(b) - getWaitSeconds(a))
                                return (
                                    <div key={col.id} className="flex flex-col min-w-0 h-full">
                                        <div
                                            className="flex items-center justify-between px-3 py-2 rounded-xl mb-3 flex-shrink-0"
                                            style={{ background: col.bg, border: `1px solid ${col.border}` }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                                                <span className="text-[12px] font-semibold truncate" style={{ color: col.color }}>
                                                    {col.label}
                                                </span>
                                            </div>
                                            <span
                                                className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{ background: col.color + '20', color: col.color }}
                                            >
                                                {colOrders.length}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pb-2 min-h-0">
                                            {colOrders.length === 0 ? (
                                                <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-100 text-[12px] text-gray-300">
                                                    No orders
                                                </div>
                                            ) : (
                                                colOrders.map(order => (
                                                    <div key={order.orderId} onClick={() => navigate(`/kanban/${order.orderId}`)}>
                                                        <OrderCard order={order} />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}