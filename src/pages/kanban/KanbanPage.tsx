import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { RefreshCw } from 'lucide-react'
import { storeApi } from '../../api'
import Toast from '../../components/ui/Toast'
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
// COLUMNS — each column maps multiple statuses so orders don't
// disappear between transitions.
//
//   New orders → CONFIRMED
//   Preparing  → PREPARING
//   Ready      → READY_FOR_PICKUP, COURIER_ASSIGNED, COURIER_ACCEPTED
//                (bag still at store; driver may or may not be assigned)
//   Picked up  → PICKED_UP
//                (driver has the bag, en route to customer)
//   Delivered  → DELIVERED, COMPLETED
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

function TimerPill({ order }: { order: Order }) {
    const seconds = getWaitSeconds(order)
    const tier: UrgencyTier = getUrgencyTier(order)
    const segs = getWaitSegments(seconds)
    const active = isOrderActive(order)

    const pillCls = !active
        ? 'bg-gray-100 text-gray-500'
        : URGENCY_STYLES[tier].pill

    const dotCls = !active
        ? 'text-gray-300'
        : tier === 'overdue'
            ? 'text-red-300'
            : tier === 'warning'
                ? 'text-amber-400'
                : 'text-brand/40'

    const parts: { value: number; label: string }[] = []
    if (segs.days > 0)                           parts.push({ value: segs.days,    label: 'd' })
    if (parts.length > 0 || segs.hours > 0)      parts.push({ value: segs.hours,   label: 'h' })
    if (parts.length > 0 || segs.minutes > 0)    parts.push({ value: segs.minutes, label: 'm' })
    parts.push({ value: segs.seconds, label: 's' })

    return (
        <span
            className={
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold whitespace-nowrap ' +
                pillCls
            }
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

function OrderCard({ order, onAction }: {
    order: Order
    onAction: (id: string, action: string) => void
}) {
    const col = COLUMNS.find(c => c.statuses.includes(order.status))

    const nextAction =
        order.status === 'CONFIRMED'          ? { label: 'Start preparing', action: 'prepare'       }
            : order.status === 'PREPARING'          ? { label: 'Mark as ready',   action: 'ready'         }
                : order.status === 'READY_FOR_PICKUP'   ? { label: 'Confirm pickup',  action: 'confirmPickup' }
                    : null

    return (
        <div
            className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
            style={{ borderLeft: `3px solid ${col?.color ?? '#e5e7eb'}` }}
        >
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-50">
                <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                    #{order.orderId.slice(0, 8)}
                </span>
                <span className="text-[10px] text-gray-400 flex-1 truncate min-w-0">{order.storeName}</span>
                <TimerPill order={order} />
            </div>
            <div className="px-2.5 py-2.5">
                <div className="text-[12px] font-semibold text-gray-900 mb-0.5 truncate">{order.customerName}</div>
                <div className="text-[11px] text-gray-400 mb-2 truncate">{order.deliveryAddress}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                    {order.items?.slice(0, 2).map((item, i) => (
                        <span key={i} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-full">
                            {item.productName} ×{item.quantity}
                        </span>
                    ))}
                    {(order.items?.length ?? 0) > 2 && (
                        <span className="text-[10px] text-gray-400">+{order.items.length - 2} more</span>
                    )}
                </div>

                {order.collectorName && (
                    <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[8px] font-bold text-brand-dark flex-shrink-0">
                            {order.collectorName.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-[10px] text-brand-dark font-medium truncate">{order.collectorName}</span>
                    </div>
                )}

                {order.driverName && (
                    <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700 flex-shrink-0">
                            {order.driverName.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-[10px] text-blue-700 font-medium truncate">{order.driverName}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[12px] font-bold text-gray-900 truncate">{fmtMoney(order.totalAmount)} UZS</span>
                    <span className="text-[10px] text-brand font-medium flex-shrink-0">
                        {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                </div>
                {nextAction && (
                    <button
                        onClick={e => { e.stopPropagation(); onAction(order.orderId, nextAction.action) }}
                        className="w-full py-1.5 rounded-lg bg-brand text-white text-[11px] font-semibold hover:bg-brand-dark transition-colors"
                    >
                        {nextAction.label}
                    </button>
                )}
            </div>
        </div>
    )
}

export default function KanbanPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
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

    const mutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: string }) => {
            if (action === 'prepare')       return storeApi.prepare(id)
            if (action === 'ready')         return storeApi.ready(id)
            if (action === 'confirmPickup') return storeApi.confirmPickup(id)
            return Promise.reject(new Error('Unknown action'))
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['store-orders'] })
            setToast({ message: 'Order updated!', type: 'success' })
        },
        onError: (err: AxiosError<{message: string}>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
                                                        <OrderCard
                                                            order={order}
                                                            onAction={(id, action) => mutation.mutate({ id, action })}
                                                        />
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