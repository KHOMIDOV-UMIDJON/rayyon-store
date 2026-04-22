import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { RefreshCw } from 'lucide-react'
import { storeApi } from '../../api'
import Toast from '../../components/ui/Toast'
import type { Order, OrderStatus } from '../../types'

const COLUMNS: {
    status: OrderStatus; label: string
    color: string; bg: string; border: string
}[] = [
    { status: 'CONFIRMED',        label: 'New orders', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { status: 'PREPARING',        label: 'Preparing',  color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    { status: 'READY_FOR_PICKUP', label: 'Ready',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { status: 'COURIER_ASSIGNED', label: 'Picked up',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { status: 'DELIVERED',        label: 'Delivered',  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
]

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Cash', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum',
}

function fmtMoney(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) }

function getWaitSeconds(order: Order) {
    return order.waitSeconds ?? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)
}

function fmtWait(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

function OrderCard({ order, onAction }: {
    order: Order
    onAction: (id: string, action: string) => void
}) {
    const wait = getWaitSeconds(order)
    const isUrgent = wait > 300
    const col = COLUMNS.find(c => c.status === order.status)

    const nextAction =
        order.status === 'CONFIRMED'          ? { label: 'Start preparing',   action: 'prepare'  }
            : order.status === 'PREPARING'        ? { label: 'Mark as ready',     action: 'ready'    }
                : order.status === 'READY_FOR_PICKUP' ? { label: 'Confirm pickup',    action: 'complete' }
                    : null

    return (
        <div
            className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
            style={{ borderLeft: `3px solid ${col?.color ?? '#e5e7eb'}` }}
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
        <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
          #{order.orderId.slice(0, 8)}
        </span>
                <span className="text-[10px] text-gray-400 flex-1 truncate">{order.storeName}</span>
                <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>
          ⏱ {fmtWait(wait)}
        </span>
            </div>
            <div className="px-3 py-2.5">
                <div className="text-[12px] font-semibold text-gray-900 mb-0.5">{order.customerName}</div>
                <div className="text-[11px] text-gray-400 mb-2 truncate">{order.deliveryAddress}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                    {order.items?.slice(0, 2).map((item, i) => (
                        <span key={i} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
              {item.productName} ×{item.quantity}
            </span>
                    ))}
                    {(order.items?.length ?? 0) > 2 && (
                        <span className="text-[10px] text-gray-400">+{order.items.length - 2} more</span>
                    )}
                </div>

                {/* Collector badge */}
                {order.collectorName && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[8px] font-bold text-green-700 flex-shrink-0">
                            {order.collectorName.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-[10px] text-green-700 font-medium">{order.collectorName}</span>
                    </div>
                )}

                {/* Driver badge */}
                {order.driverName && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700 flex-shrink-0">
                            {order.driverName.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-[10px] text-blue-700 font-medium">{order.driverName}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-900">{fmtMoney(order.totalAmount)} UZS</span>
                    <span className="text-[10px] text-brand font-medium">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                </div>
                {nextAction && (
                    <button
                        onClick={e => { e.stopPropagation(); onAction(order.orderId, nextAction.action) }}
                        className="w-full py-1.5 rounded-lg bg-brand text-white text-[11px] font-semibold hover:bg-green-700 transition-colors"
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

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['store-orders'],
        queryFn: storeApi.getOrders,
        refetchInterval: 30_000,
    })

    const mutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: string }) => {
            if (action === 'prepare')  return storeApi.prepare(id)
            if (action === 'ready')    return storeApi.ready(id)
            if (action === 'complete') return storeApi.complete(id)
            return Promise.reject(new Error('Unknown action'))
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['store-orders'] })
            setToast({ message: 'Order updated!', type: 'success' })
        },
        onError: (err: AxiosError<{message: string}>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    const activeStatuses: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ASSIGNED']
    const active = orders.filter(o => activeStatuses.includes(o.status)).length
    const urgent = orders.filter(o => getWaitSeconds(o) > 300 && activeStatuses.includes(o.status)).length

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div>
                    <h1 className="text-[15px] font-semibold text-gray-900">Live order board</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        {active} active orders
                        {urgent > 0 && <span className="text-red-500 font-medium"> · {urgent} urgent</span>}
                    </p>
                </div>
                <button onClick={() => refetch()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            <div className="flex-1 overflow-x-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-[13px] text-gray-400">Loading orders...</div>
                ) : (
                    <div className="flex gap-4 h-full min-w-max">
                        {COLUMNS.map(col => {
                            const colOrders = orders
                                .filter(o => o.status === col.status)
                                .sort((a, b) => getWaitSeconds(b) - getWaitSeconds(a))
                            return (
                                <div key={col.status} className="w-72 flex flex-col flex-shrink-0">
                                    <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
                                         style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                                            <span className="text-[12px] font-semibold" style={{ color: col.color }}>{col.label}</span>
                                        </div>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                              style={{ background: col.color + '20', color: col.color }}>
                      {colOrders.length}
                    </span>
                                    </div>
                                    <div className="flex flex-col gap-2 overflow-y-auto flex-1 pb-2">
                                        {colOrders.length === 0 ? (
                                            <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-100 text-[12px] text-gray-300">
                                                No orders
                                            </div>
                                        ) : (
                                            colOrders.map(order => (
                                                <div key={order.orderId} onClick={() => navigate(`/kanban/${order.orderId}`)}>
                                                    <OrderCard order={order} onAction={(id, action) => mutation.mutate({ id, action })} />
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
    )
}
