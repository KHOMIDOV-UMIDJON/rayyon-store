import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { storeApi } from '../../api'
import Toast from '../../components/ui/Toast'

const fmtMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n))
const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Cash on delivery', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum',
}

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED:        'bg-red-50 text-red-600',
    PREPARING:        'bg-orange-50 text-orange-600',
    READY_FOR_PICKUP: 'bg-green-50 text-green-700',
    COURIER_ASSIGNED: 'bg-gray-100 text-gray-500',
    COMPLETED:        'bg-blue-50 text-blue-600',
}

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => storeApi.getOrder(orderId!),
        enabled: !!orderId,
        refetchInterval: 15_000,
    })

    const mutation = useMutation({
        mutationFn: (action: string) => {
            if (action === 'prepare')  return storeApi.prepare(orderId!)
            if (action === 'ready')    return storeApi.ready(orderId!)
            if (action === 'complete') return storeApi.complete(orderId!)
            return Promise.reject('Unknown action')
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['store-orders'] })
            void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
            setToast({ message: 'Order updated successfully!', type: 'success' })
        },
        onError: (err: any) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed to update', type: 'error' }),
    })

    const toggleItem = (id: string) => setCheckedItems(p => ({ ...p, [id]: !p[id] }))
    const checkedCount = Object.values(checkedItems).filter(Boolean).length
    const totalItems = order?.items?.length ?? 0
    const allChecked = totalItems > 0 && checkedCount === totalItems

    const nextAction =
        order?.status === 'CONFIRMED'   ? { label: 'Start preparing',   action: 'prepare',  disabled: false }
            : order?.status === 'PREPARING' ? { label: allChecked ? 'Mark order as ready' : `Pick all items first (${checkedCount}/${totalItems})`, action: 'ready', disabled: !allChecked }
                : order?.status === 'READY_FOR_PICKUP' ? { label: 'Confirm picked up', action: 'complete', disabled: false }
                    : null

    if (isLoading) return (
        <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">
            Loading order...
        </div>
    )
    if (!order) return (
        <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">
            Order not found
        </div>
    )

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <button onClick={() => navigate('/kanban')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50">
                    <ArrowLeft size={13} /> Board
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-gray-900">
                        Order #{order.orderId.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                        {order.customerName} · {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} · {fmtMoney(order.totalAmount)} UZS
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-4 max-w-4xl">

                    {/* Picking list */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[13px] font-semibold text-gray-900">Picking list</h2>
                            <span className="text-[11px] text-gray-400">{checkedCount} / {totalItems} picked</span>
                        </div>
                        {/* Progress */}
                        <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-brand rounded-full transition-all duration-300"
                                 style={{ width: totalItems ? `${(checkedCount / totalItems) * 100}%` : '0%' }} />
                        </div>
                        {/* Items */}
                        {(order.items ?? []).map(item => (
                            <div key={item.id}
                                 onClick={() => order.status === 'PREPARING' && toggleItem(item.id)}
                                 className={`flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 ${
                                     order.status === 'PREPARING' ? 'cursor-pointer select-none' : ''
                                 }`}>
                                <div className="flex-shrink-0">
                                    {checkedItems[item.id]
                                        ? <CheckSquare size={18} className="text-brand" />
                                        : <Square size={18} className="text-gray-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[12px] font-medium transition-all ${
                                        checkedItems[item.id] ? 'line-through text-gray-400' : 'text-gray-900'
                                    }`}>
                                        {item.productName}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">× {item.quantity} {item.unitDisplay}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-[12px] font-semibold text-gray-900">{fmtMoney(item.totalPrice)} UZS</div>
                                    <div className="text-[10px] text-gray-400">{fmtMoney(item.unitPrice)} each</div>
                                </div>
                            </div>
                        ))}
                        {order.status === 'PREPARING' && (
                            <button
                                onClick={() => setCheckedItems(Object.fromEntries((order.items ?? []).map(i => [i.id, true])))}
                                className="w-full mt-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                                Mark all as picked
                            </button>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4">

                        {/* Order info */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Order details</h2>
                            {[
                                { label: 'Customer',    value: order.customerName },
                                { label: 'Phone',       value: order.customerPhone, green: true },
                                { label: 'Address',     value: order.deliveryAddress },
                                { label: 'Payment',     value: PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod, green: true },
                                { label: 'Subtotal',    value: `${fmtMoney(order.subtotal)} UZS` },
                                { label: 'Delivery',    value: `${fmtMoney(order.deliveryFee)} UZS` },
                                { label: 'Total',       value: `${fmtMoney(order.totalAmount)} UZS`, bold: true },
                                ...(order.notes ? [{ label: 'Notes', value: order.notes }] : []),
                            ].map(({ label, value, green, bold }) => (
                                <div key={label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0 gap-4">
                                    <span className="text-[11px] text-gray-400 flex-shrink-0">{label}</span>
                                    <span className={`text-[12px] font-medium text-right ${
                                        green ? 'text-brand' : bold ? 'text-gray-900 font-bold text-[13px]' : 'text-gray-700'
                                    }`}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action button */}
                        {nextAction && (
                            <button
                                onClick={() => mutation.mutate(nextAction.action)}
                                disabled={mutation.isPending || nextAction.disabled}
                                className="w-full py-3 rounded-xl bg-brand text-white text-[13px] font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                {mutation.isPending ? 'Updating...' : nextAction.label}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
