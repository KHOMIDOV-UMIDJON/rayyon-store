import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Search, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

import { ordersApi, storeApi } from '../../api'
import type { OrderSummary, OrderStatus, PaymentMethod } from '../../types'
import StatusBadge from '../../components/ui/StatusBadge'
import PaymentBadge from '../../components/ui/PaymentBadge'

import DateFilterDropdown from './components/DateFilterDropdown'
import { rangeForPreset, type OrderDateRange, PRESET_LABELS } from './components/dateFilter'
import StatusFilterDropdown from './components/StatusFilterDropdown'
import PaymentFilterDropdown from './components/PaymentFilterDropdown'
import StaffFilterDropdown from './components/StaffFilterDropdown'
import Pagination from './components/Pagination'
import EmptyState from './components/EmptyState'

export default function OrdersPage() {
    const navigate = useNavigate()

    // ── Filter state ──────────────────────────────────────
    const [dateRange,     setDateRange]     = useState<OrderDateRange>(rangeForPreset('last7'))
    const [status,        setStatus]        = useState<OrderStatus | ''>('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
    const [driverId,      setDriverId]      = useState<string>('')
    const [collectorId,   setCollectorId]   = useState<string>('')
    const [searchInput,   setSearchInput]   = useState<string>('')
    const [debouncedSearch, setDebouncedSearch] = useState<string>('')

    // ── Pagination state (0-indexed to match Spring) ──────
    const [page, setPage] = useState(0)
    const [size] = useState(25)

    // Wrap filter setters to reset page to 0 on change
    const handleDateChange      = (v: OrderDateRange)     => { setDateRange(v);     setPage(0) }
    const handleStatusChange    = (v: OrderStatus | '')   => { setStatus(v);        setPage(0) }
    const handlePaymentChange   = (v: PaymentMethod | '') => { setPaymentMethod(v); setPage(0) }
    const handleDriverChange    = (v: string)             => { setDriverId(v);      setPage(0) }
    const handleCollectorChange = (v: string)             => { setCollectorId(v);   setPage(0) }

    // Debounce search input + reset page when search actually changes
    useEffect(() => {
        const t = setTimeout(() => {
            const trimmed = searchInput.trim()
            setDebouncedSearch((prev) => {
                if (prev !== trimmed) setPage(0)
                return trimmed
            })
        }, 300)
        return () => clearTimeout(t)
    }, [searchInput])

    // ── Staff for driver/collector dropdowns ──────────────
    const { data: staff = [] } = useQuery({
        queryKey: ['store-staff'],
        queryFn:  storeApi.getStaff,
    })

    // ── Orders query ──────────────────────────────────────
    const queryKey = [
        'store-orders-search',
        dateRange, status, paymentMethod, driverId, collectorId,
        debouncedSearch, page, size,
    ] as const

    const {
        data, isLoading, isFetching, isError, error, refetch,
    } = useQuery({
        queryKey,
        queryFn: () => ordersApi.search(
            {
                from:          dateRange.from,
                to:            dateRange.to,
                status:        status || undefined,
                paymentMethod: paymentMethod || undefined,
                driverId:      driverId    || undefined,
                collectorId:   collectorId || undefined,
                search:        debouncedSearch || undefined,
            },
            page,
            size,
        ),
        placeholderData: keepPreviousData,
        refetchInterval: 30_000,
    })

    const orders     = data?.content       ?? []
    const total      = data?.totalElements ?? 0
    const totalPages = data?.totalPages    ?? 0

    const hasFilters =
        status !== '' ||
        paymentMethod !== '' ||
        driverId !== '' ||
        collectorId !== '' ||
        debouncedSearch !== '' ||
        dateRange.preset !== 'all'

    const clearAllFilters = () => {
        setDateRange(rangeForPreset('all'))
        setStatus('')
        setPaymentMethod('')
        setDriverId('')
        setCollectorId('')
        setSearchInput('')
        setPage(0)
    }

    // ── Header subtitle ───────────────────────────────────
    const headerSubtitle = useMemo(() => {
        if (isLoading) return 'Loading…'
        const parts: string[] = []
        parts.push(`${total.toLocaleString()} ${total === 1 ? 'order' : 'orders'}`)
        if (dateRange.preset !== 'all') {
            parts.push(`in ${PRESET_LABELS[dateRange.preset].toLowerCase()}`)
        }
        return parts.join(' · ')
    }, [isLoading, total, dateRange.preset])

    return (
        <div className="h-full flex flex-col bg-white">

            {/* ── Header (fixed) ────────────────────────── */}
            <div className="flex-shrink-0 px-5 pt-4 pb-3 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-[16px] font-semibold text-gray-900 tracking-tight">
                            Orders
                        </h1>
                        <p className="text-[12px] text-gray-400 mt-0.5">{headerSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            disabled
                            title="Coming soon"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-400 cursor-not-allowed"
                        >
                            <Download size={12} />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <DateFilterDropdown value={dateRange} onChange={handleDateChange} />
                    <StatusFilterDropdown value={status} onChange={handleStatusChange} />
                    <PaymentFilterDropdown value={paymentMethod} onChange={handlePaymentChange} />
                    <StaffFilterDropdown
                        label="driver"
                        role="DRIVER"
                        staff={staff}
                        value={driverId}
                        onChange={handleDriverChange}
                    />
                    <StaffFilterDropdown
                        label="collector"
                        role="COLLECTOR"
                        staff={staff}
                        value={collectorId}
                        onChange={handleCollectorChange}
                    />
                </div>

                <div className="relative mt-2.5">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by order ID, customer name, address, or phone…"
                        className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-brand focus:bg-white transition-colors"
                    />
                </div>
            </div>

            {/* ── Table ─────────────────────────────────── */}
            <div className="flex-1 overflow-auto bg-white">
                {isError ? (
                    <ErrorState
                        message={error instanceof Error ? error.message : 'Something went wrong'}
                        onRetry={() => refetch()}
                    />
                ) : !isLoading && orders.length === 0 ? (
                    <EmptyState
                        variant={hasFilters ? 'no-match' : 'no-data'}
                        onClear={hasFilters ? clearAllFilters : undefined}
                    />
                ) : (
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-50 z-10 shadow-[inset_0_-1px_0_rgb(229_231_235)]">
                        <tr>
                            <Th>Order ID</Th>
                            <Th>Date &amp; time</Th>
                            <Th>Customer</Th>
                            <Th>Address</Th>
                            <Th align="right">Amount</Th>
                            <Th>Status</Th>
                            <Th>Payment</Th>
                            <Th>Driver</Th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading
                            ? Array.from({ length: Math.min(size, 8) }).map((_, i) => (
                                <SkeletonRow key={i} />
                            ))
                            : orders.map((order) => (
                                <OrderRow
                                    key={order.orderId}
                                    order={order}
                                    onClick={() => navigate(`/kanban/${order.orderId}`)}
                                />
                            ))
                        }
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Pagination ────────────────────────────── */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={total}
                pageSize={size}
                onPageChange={setPage}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
    return (
        <th
            className={`px-4 py-2.5 text-[10px] font-bold text-gray-400 tracking-[0.4px] uppercase ${
                align === 'right' ? 'text-right' : 'text-left'
            }`}
        >
            {children}
        </th>
    )
}

function OrderRow({ order, onClick }: { order: OrderSummary; onClick: () => void }) {
    const created = new Date(order.createdAt)
    const dateStr = format(created, 'd MMM yyyy')
    const timeStr = format(created, 'h:mm a')

    return (
        <tr
            onClick={onClick}
            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
        >
            <td className="px-4 py-3">
                <span className="font-mono text-[12px] text-brand font-semibold underline underline-offset-2">
                    #{order.orderId.slice(0, 8)}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="text-[12px] text-gray-800">{dateStr}</div>
                <div className="text-[11px] text-gray-400">{timeStr}</div>
            </td>
            <td className="px-4 py-3">
                <div className="text-[12px] font-medium text-gray-800 truncate max-w-[180px]">
                    {order.customerName ?? '—'}
                </div>
                {order.customerPhone && (
                    <div className="text-[11px] text-gray-400 font-mono">
                        {order.customerPhone}
                    </div>
                )}
            </td>
            <td className="px-4 py-3 max-w-[240px]">
                <span className="text-[12px] text-gray-600 truncate block">
                    {order.deliveryAddress ?? '—'}
                </span>
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
                <span className="text-[12px] font-semibold text-gray-900">
                    {new Intl.NumberFormat('uz-UZ').format(Math.round(order.totalAmount))}
                </span>
                <span className="ml-1 text-[10px] text-gray-400">UZS</span>
            </td>
            <td className="px-4 py-3">
                <StatusBadge status={order.status} />
            </td>
            <td className="px-4 py-3">
                <PaymentBadge method={order.paymentMethod} />
            </td>
            <td className="px-4 py-3">
                <span className="text-[12px] text-gray-600">
                    {order.driverName ?? <span className="text-gray-300 italic">—</span>}
                </span>
            </td>
        </tr>
    )
}

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100 last:border-0">
            <td className="px-4 py-3"><Skel w="70px" /></td>
            <td className="px-4 py-3">
                <Skel w="80px" />
                <div className="mt-1.5"><Skel w="50px" h="10px" /></div>
            </td>
            <td className="px-4 py-3"><Skel w="100px" /></td>
            <td className="px-4 py-3"><Skel w="180px" /></td>
            <td className="px-4 py-3 text-right">
                <div className="ml-auto"><Skel w="60px" /></div>
            </td>
            <td className="px-4 py-3"><Skel w="70px" h="18px" rounded="9999px" /></td>
            <td className="px-4 py-3"><Skel w="40px" h="14px" rounded="4px" /></td>
            <td className="px-4 py-3"><Skel w="80px" /></td>
        </tr>
    )
}

function Skel({ w, h = '12px', rounded = '4px' }: { w: string; h?: string; rounded?: string }) {
    return (
        <span
            className="inline-block bg-gray-100 animate-pulse"
            style={{ width: w, height: h, borderRadius: rounded }}
        />
    )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
                <AlertCircle size={20} className="text-red-500" />
            </div>
            <p className="text-[14px] font-medium text-gray-800 mb-1">
                Couldn't load orders
            </p>
            <p className="text-[12px] text-gray-500 max-w-sm mb-4 break-words">
                {message}
            </p>
            <button
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] font-medium text-gray-700 hover:bg-gray-50"
            >
                Try again
            </button>
        </div>
    )
}