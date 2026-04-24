import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { storeApi } from '../../api'
import Toast from '../../components/ui/Toast'
import CustomerCard from '../../components/order/CustomerCard'
import PickingList from '../../components/order/PickingList'
import OrderTimeline from '../../components/order/OrderTimeline'
import AssignDriverCard from '../../components/order/AssignDriverCard'
import OrderEventLog from '../../components/order/OrderEventLog'

const fmtMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n))

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Cash on delivery', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum',
}

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: 'bg-red-50 text-red-600',
    PREPARING: 'bg-orange-50 text-orange-700',
    READY_FOR_PICKUP: 'bg-green-50 text-brand-dark',
    COURIER_ASSIGNED: 'bg-purple-50 text-purple-700',
    DELIVERED: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-gray-100 text-gray-600',
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

    const { data: staff = [] } = useQuery({
        queryKey: ['store-staff'],
        queryFn: storeApi.getStaff,
    })

    const drivers = staff.filter(s => s.role === 'DRIVER')

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ['store-orders'] })
        void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    }

    const confirmMut = useMutation({
        mutationFn: () => storeApi.confirm(orderId!),
        onSuccess: () => { invalidate(); setToast({ message: 'Order confirmed!', type: 'success' }) },
        onError: (err: AxiosError<{ message: string }>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    const prepareMut = useMutation({
        mutationFn: () => storeApi.prepare(orderId!),
        onSuccess: () => { invalidate(); setToast({ message: 'Preparing started', type: 'success' }) },
        onError: (err: AxiosError<{ message: string }>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    const readyMut = useMutation({
        mutationFn: () => storeApi.ready(orderId!),
        onSuccess: () => { invalidate(); setToast({ message: 'Order marked as ready!', type: 'success' }) },
        onError: (err: AxiosError<{ message: string }>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    const assignDriverMut = useMutation({
        mutationFn: (driverId: string) => storeApi.assignDriver(orderId!, driverId),
        onSuccess: () => { invalidate(); setToast({ message: 'Driver assigned!', type: 'success' }) },
        onError: (err: AxiosError<{ message: string }>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    const pickupMut = useMutation({
        mutationFn: () => storeApi.complete(orderId!),
        onSuccess: () => {
            invalidate()
            setToast({ message: 'Picked up!', type: 'success' })
            setTimeout(() => navigate('/kanban'), 1000)
        },
        onError: (err: AxiosError<{ message: string }>) =>
            setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    if (isLoading) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">
                Loading order...
            </div>
        )
    }
    if (!order) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">
                Order not found
            </div>
        )
    }

    const items = order.items ?? []
    const history = order.statusHistory ?? []
    const totalItems = items.length
    const checkedCount = items.filter(i => checkedItems[i.id]).length
    const allChecked = totalItems > 0 && checkedCount === totalItems

    const isConfirmed = order.status === 'CONFIRMED'
    const isPreparing = order.status === 'PREPARING'
    const isReady = order.status === 'READY_FOR_PICKUP'

    const toggleItem = (id: string) =>
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))
    const markAll = () =>
        setCheckedItems(Object.fromEntries(items.map(i => [i.id, true])))

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <button
                    onClick={() => navigate('/kanban')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50"
                >
                    <ArrowLeft size={13} /> Board
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-gray-900">
                        Order #{order.orderId.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                        {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} · {fmtMoney(order.totalAmount)} UZS
                    </div>
                </div>
                <span
                    className={
                        'px-3 py-1 rounded-full text-[11px] font-semibold ' +
                        (STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-500')
                    }
                >
                    {order.status.replace(/_/g, ' ')}
                </span>
            </div>

            {/* ── 3-column grid ── */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-3 max-w-[1400px] mx-auto">

                    {/* LEFT — Picking list + primary action */}
                    <div className="flex flex-col gap-3">
                        <PickingList
                            items={items}
                            checkedItems={checkedItems}
                            onToggle={toggleItem}
                            onMarkAll={markAll}
                            interactive={isPreparing}
                        />

                        {order.status === 'CREATED' && (
                            <button
                                onClick={() => confirmMut.mutate()}
                                disabled={confirmMut.isPending}
                                className="py-2.5 rounded-xl bg-brand text-white text-[12px] font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
                            >
                                {confirmMut.isPending ? 'Confirming...' : 'Confirm order'}
                            </button>
                        )}
                        {isConfirmed && (
                            <button
                                onClick={() => prepareMut.mutate()}
                                disabled={prepareMut.isPending}
                                className="py-2.5 rounded-xl bg-brand text-white text-[12px] font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
                            >
                                {prepareMut.isPending ? 'Starting...' : 'Start preparing'}
                            </button>
                        )}
                        {isPreparing && (
                            <button
                                onClick={() => readyMut.mutate()}
                                disabled={readyMut.isPending || !allChecked}
                                className="py-2.5 rounded-xl bg-brand text-white text-[12px] font-semibold hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {!allChecked
                                    ? `Pick all items first (${checkedCount}/${totalItems})`
                                    : readyMut.isPending ? 'Processing...' : 'Mark as ready'}
                            </button>
                        )}
                    </div>

                    {/* MIDDLE — Timeline + Event log */}
                    <div className="flex flex-col gap-3">
                        <OrderTimeline history={history} currentStatus={order.status} />
                        <OrderEventLog history={history} />
                    </div>

                    {/* RIGHT — Customer + Details + Driver assignment */}
                    <div className="flex flex-col gap-3">
                        <CustomerCard
                            name={order.customerName}
                            phone={order.customerPhone}
                        />

                        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
                            <h2 className="text-[12px] font-semibold text-gray-900 mb-2">Order details</h2>
                            <Row label="Address" value={order.deliveryAddress || '—'} />
                            <Row label="Payment" value={PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} green />
                            <Row label="Subtotal" value={`${fmtMoney(order.subtotal)} UZS`} />
                            <Row label="Delivery" value={`${fmtMoney(order.deliveryFee)} UZS`} />
                            <Row label="Total" value={`${fmtMoney(order.totalAmount)} UZS`} bold />
                            {order.notes && (
                                <div className="flex justify-between items-start pt-2 mt-1 border-t border-gray-50 gap-3">
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">Note</span>
                                    <span className="text-[11px] font-medium text-orange-500 text-right">{order.notes}</span>
                                </div>
                            )}
                        </div>

                        {isReady && (
                            <AssignDriverCard
                                drivers={drivers}
                                alreadyAssignedDriverId={order.assignedDriverId}
                                alreadyAssignedDriverName={order.driverName}
                                onAssignDriver={(id) => assignDriverMut.mutate(id)}
                                onConfirmPickup={() => pickupMut.mutate()}
                                assigning={assignDriverMut.isPending}
                                confirming={pickupMut.isPending}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Row({ label, value, green, bold, orange }: {
    label: string
    value: string
    green?: boolean
    bold?: boolean
    orange?: boolean
}) {
    const cls = green
        ? 'text-brand'
        : bold
            ? 'text-gray-900 font-bold text-[12px]'
            : orange
                ? 'text-orange-500'
                : 'text-gray-700'

    return (
        <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0 gap-3">
            <span className="text-[10px] text-gray-400 flex-shrink-0">{label}</span>
            <span className={'text-[11px] font-medium text-right ' + cls}>{value}</span>
        </div>
    )
}