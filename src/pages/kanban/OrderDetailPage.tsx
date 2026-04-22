import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { ArrowLeft, CheckSquare, Square, User, Clock } from 'lucide-react'
import { storeApi } from '../../api'
import Toast from '../../components/ui/Toast'
import type { StaffMember } from '../../types'

const fmtMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n))

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Cash on delivery', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum',
}

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED:        'bg-red-50 text-red-600',
    PREPARING:        'bg-orange-50 text-orange-600',
    READY_FOR_PICKUP: 'bg-green-50 text-green-700',
    COURIER_ASSIGNED: 'bg-purple-50 text-purple-600',
    DELIVERED:        'bg-blue-50 text-blue-600',
    COMPLETED:        'bg-gray-100 text-gray-500',
}

function initials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'
}

function ActiveOrderBadge({ count }: { count?: number }) {
    const n = count ?? 0
    const cls = n === 0
        ? 'bg-green-50 text-green-700'
        : n <= 2
            ? 'bg-yellow-50 text-yellow-700'
            : 'bg-red-50 text-red-600'
    return (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto flex-shrink-0 ${cls}`}>
      {n} active
    </span>
    )
}

function StaffCard({
                       person, selected, onSelect, color
                   }: {
    person: StaffMember
    selected: boolean
    onSelect: () => void
    color: 'green' | 'blue'
}) {
    const ring = color === 'green' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'
    const av = color === 'green' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-blue-100 text-blue-700 border-blue-300'
    const check = color === 'green' ? 'bg-green-500' : 'bg-blue-500'

    return (
        <div
            onClick={onSelect}
            className={`flex items-center gap-3 p-2.5 rounded-xl border-[1.5px] cursor-pointer transition-all mb-2 ${
                selected ? ring : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
        >
            <div className={`w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${av}`}>
                {initials(person.fullName)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-gray-900 truncate">{person.fullName}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{person.role}</div>
            </div>
            <ActiveOrderBadge count={person.activeOrderCount} />
            {selected && (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-1.5 ${check}`}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
            )}
        </div>
    )
}

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
    const [selectedCollector, setSelectedCollector] = useState<string | null>(null)
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

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

    // Separate collectors and drivers from staff list
    const collectors = staff.filter(s =>
        ['COLLECTOR', 'STORE_MANAGER', 'SUPER_ADMIN'].includes(s.role)
    )
    const drivers = staff.filter(s => s.role === 'DRIVER')

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ['store-orders'] })
        void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    }

    // Confirm order + assign collector (NEW stage)
    const confirmWithCollector = useMutation({
        mutationFn: async () => {
            const confirmed = await storeApi.confirm(orderId!)
            if (selectedCollector) {
                return storeApi.assignCollector(orderId!, selectedCollector)
            }
            return confirmed
        },
        onSuccess: () => { invalidate(); setToast({ message: 'Order confirmed!', type: 'success' }) },
        onError: (err: AxiosError<{message: string}>) => setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    // Assign driver (PREPARING or READY stage)
    const assignDriver = useMutation({
        mutationFn: () => storeApi.assignDriver(orderId!, selectedDriver!),
        onSuccess: () => { invalidate(); setToast({ message: 'Driver assigned!', type: 'success' }) },
        onError: (err: AxiosError<{message: string}>) => setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    // Mark ready
    const markReady = useMutation({
        mutationFn: () => storeApi.ready(orderId!),
        onSuccess: () => { invalidate(); setToast({ message: 'Order marked as ready!', type: 'success' }) },
        onError: (err: AxiosError<{message: string}>) => setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    // Assign driver + confirm pickup
    const assignDriverAndPickup = useMutation({
        mutationFn: async () => {
            if (selectedDriver) await storeApi.assignDriver(orderId!, selectedDriver)
            return storeApi.complete(orderId!)
        },
        onSuccess: () => {
            invalidate()
            setToast({ message: 'Picked up!', type: 'success' })
            setTimeout(() => navigate('/kanban'), 1200)
        },
        onError: (err: AxiosError<{message: string}>) => setToast({ message: err?.response?.data?.message ?? 'Failed', type: 'error' }),
    })

    const toggleItem = (id: string) => setCheckedItems(p => ({ ...p, [id]: !p[id] }))
    const checkedCount = Object.values(checkedItems).filter(Boolean).length
    const totalItems = order?.items?.length ?? 0
    const allChecked = totalItems > 0 && checkedCount === totalItems

    const isLoading_ = confirmWithCollector.isPending || assignDriver.isPending || markReady.isPending || assignDriverAndPickup.isPending

    if (isLoading) return (
        <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">Loading order...</div>
    )
    if (!order) return (
        <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">Order not found</div>
    )

    const isNew      = order.status === 'CONFIRMED'
    const isPreparing = order.status === 'PREPARING'
    const isReady    = order.status === 'READY_FOR_PICKUP'

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
                    <div className="text-[14px] font-semibold text-gray-900">Order #{order.orderId.slice(0, 8)}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                        {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} · {fmtMoney(order.totalAmount)} UZS
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-4 max-w-5xl">

                    {/* ── LEFT: Picking list ── */}
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
                                 onClick={() => isPreparing && toggleItem(item.id)}
                                 className={`flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 ${isPreparing ? 'cursor-pointer select-none' : ''}`}>
                                <div className="flex-shrink-0">
                                    {checkedItems[item.id]
                                        ? <CheckSquare size={18} className="text-brand" />
                                        : <Square size={18} className="text-gray-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[12px] font-medium transition-all ${checkedItems[item.id] ? 'line-through text-gray-400' : 'text-gray-900'}`}>
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
                        {isPreparing && (
                            <button
                                onClick={() => setCheckedItems(Object.fromEntries((order.items ?? []).map(i => [i.id, true])))}
                                className="w-full mt-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                                Mark all as picked
                            </button>
                        )}

                        {/* Collector info (when already assigned) */}
                        {order.collectorName && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Collector</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-[9px] font-bold text-green-700 flex-shrink-0">
                                        {initials(order.collectorName)}
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-medium text-gray-900">{order.collectorName}</div>
                                        <div className="text-[10px] text-green-600">
                                            {isPreparing ? 'Picking now' : 'Picking completed ✓'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Driver info (when already assigned) */}
                        {order.driverName && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Driver</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[9px] font-bold text-blue-700 flex-shrink-0">
                                        {initials(order.driverName)}
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-medium text-gray-900">{order.driverName}</div>
                                        <div className="text-[10px] text-blue-600">
                                            {isPreparing ? 'Heading to store' : 'Assigned ✓'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Order details + Assignments ── */}
                    <div className="flex flex-col gap-4">

                        {/* Order details */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Order details</h2>
                            {[
                                { label: 'Customer',  value: order.customerName },
                                { label: 'Phone',     value: order.customerPhone,                              green: true },
                                { label: 'Address',   value: order.deliveryAddress },
                                { label: 'Payment',   value: PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod, green: true },
                                { label: 'Subtotal',  value: `${fmtMoney(order.subtotal)} UZS` },
                                { label: 'Delivery',  value: `${fmtMoney(order.deliveryFee)} UZS` },
                                { label: 'Total',     value: `${fmtMoney(order.totalAmount)} UZS`,             bold: true },
                                ...(order.notes ? [{ label: 'Notes', value: order.notes, orange: true }] : []),
                            ].map(({ label, value, green, bold, orange }) => (
                                <div key={label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0 gap-4">
                                    <span className="text-[11px] text-gray-400 flex-shrink-0">{label}</span>
                                    <span className={`text-[12px] font-medium text-right ${
                                        green ? 'text-brand' : bold ? 'text-gray-900 font-bold text-[13px]' : orange ? 'text-orange-500' : 'text-gray-700'
                                    }`}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* ── COLLECTOR ASSIGNMENT — shown on NEW stage ── */}
                        {isNew && (
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                                        <User size={14} className="text-orange-500" />
                                        Assign collector
                                    </div>
                                    <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-500">NEW</span>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg mb-3 text-[10px] text-orange-700 font-medium">
                                        <User size={11} />
                                        Assign a collector so they start picking immediately
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-wider mb-2">
                                        Collectors · sorted by workload
                                    </div>
                                    {collectors.length === 0 ? (
                                        <div className="text-[12px] text-gray-400 py-3 text-center">No collectors available</div>
                                    ) : (
                                        collectors
                                            .sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0))
                                            .map(s => (
                                                <StaffCard
                                                    key={s.id}
                                                    person={s}
                                                    selected={selectedCollector === s.id}
                                                    onSelect={() => setSelectedCollector(prev => prev === s.id ? null : s.id)}
                                                    color="green"
                                                />
                                            ))
                                    )}
                                    <button
                                        onClick={() => confirmWithCollector.mutate()}
                                        disabled={isLoading_}
                                        className="w-full py-2.5 rounded-xl bg-brand text-white text-[12px] font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors mt-2">
                                        {isLoading_ ? 'Processing...' : selectedCollector
                                            ? `Assign ${collectors.find(c => c.id === selectedCollector)?.fullName?.split(' ')[0]} & confirm order`
                                            : 'Confirm without collector'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── DRIVER ASSIGNMENT — shown on PREPARING stage (optional) ── */}
                        {isPreparing && !order.assignedDriverId && (
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                                        <Clock size={14} className="text-blue-500" />
                                        Assign driver
                                        <span className="text-[10px] text-gray-400 font-normal">(optional)</span>
                                    </div>
                                    <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-orange-50 text-orange-500">PREPARING</span>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg mb-3 text-[10px] text-blue-700 font-medium">
                                        <Clock size={11} />
                                        Driver heads to store now — order will be ready when they arrive
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-wider mb-2">
                                        Drivers · sorted by distance
                                    </div>
                                    {drivers.length === 0 ? (
                                        <div className="text-[12px] text-gray-400 py-3 text-center">No drivers available</div>
                                    ) : (
                                        drivers
                                            .sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0))
                                            .map(d => (
                                                <StaffCard
                                                    key={d.id}
                                                    person={d}
                                                    selected={selectedDriver === d.id}
                                                    onSelect={() => setSelectedDriver(prev => prev === d.id ? null : d.id)}
                                                    color="blue"
                                                />
                                            ))
                                    )}
                                    {selectedDriver && (
                                        <button
                                            onClick={() => assignDriver.mutate()}
                                            disabled={isLoading_}
                                            className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-[12px] font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors mt-2">
                                            {isLoading_ ? 'Assigning...' : `Assign ${drivers.find(d => d.id === selectedDriver)?.fullName?.split(' ')[0]}`}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => markReady.mutate()}
                                        disabled={isLoading_ || !allChecked}
                                        className="w-full py-2.5 rounded-xl bg-brand text-white text-[12px] font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors mt-2">
                                        {!allChecked
                                            ? `Pick all items first (${checkedCount}/${totalItems})`
                                            : isLoading_ ? 'Processing...' : 'Mark as ready →'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── DRIVER ASSIGNMENT — shown on READY stage (required if no driver) ── */}
                        {isReady && (
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                                        <Clock size={14} className="text-blue-500" />
                                        {order.assignedDriverId ? 'Driver assigned' : 'Assign driver'}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                        order.assignedDriverId ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                    }`}>
                    {order.assignedDriverId ? 'ASSIGNED' : 'REQUIRED'}
                  </span>
                                </div>
                                <div className="p-4">
                                    {!order.assignedDriverId && (
                                        <>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg mb-3 text-[10px] text-red-600 font-medium">
                                                <Clock size={11} />
                                                Order is packed — assign a driver to confirm pickup
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-300 uppercase tracking-wider mb-2">
                                                Drivers · sorted by distance
                                            </div>
                                            {drivers.length === 0 ? (
                                                <div className="text-[12px] text-gray-400 py-3 text-center">No drivers available</div>
                                            ) : (
                                                drivers
                                                    .sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0))
                                                    .map(d => (
                                                        <StaffCard
                                                            key={d.id}
                                                            person={d}
                                                            selected={selectedDriver === d.id}
                                                            onSelect={() => setSelectedDriver(prev => prev === d.id ? null : d.id)}
                                                            color="blue"
                                                        />
                                                    ))
                                            )}
                                        </>
                                    )}
                                    <button
                                        onClick={() => assignDriverAndPickup.mutate()}
                                        disabled={isLoading_ || (!order.assignedDriverId && !selectedDriver)}
                                        className="w-full py-2.5 rounded-xl bg-brand text-white text-[12px] font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors mt-2">
                                        {isLoading_
                                            ? 'Processing...'
                                            : order.assignedDriverId
                                                ? 'Confirm picked up'
                                                : selectedDriver
                                                    ? `Assign ${drivers.find(d => d.id === selectedDriver)?.fullName?.split(' ')[0]} & confirm pickup`
                                                    : 'Select a driver to confirm pickup'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}
