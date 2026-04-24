import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { EMPTY_FILTERS } from '../../types'
import type {
    OrderFilters,
    OrderStatus,
    PaymentMethod,
    StaffMember,
    UrgencyTier,
} from '../../types'

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
    { value: '',                 label: 'All statuses' },
    { value: 'CONFIRMED',        label: 'New orders' },
    { value: 'PREPARING',        label: 'Preparing' },
    { value: 'READY_FOR_PICKUP', label: 'Ready' },
    { value: 'COURIER_ASSIGNED', label: 'Picked up' },
    { value: 'DELIVERED',        label: 'Delivered' },
]

const PAYMENT_OPTIONS: { value: PaymentMethod | ''; label: string }[] = [
    { value: '',      label: 'All payments' },
    { value: 'CASH',  label: 'Cash' },
    { value: 'PAYME', label: 'Payme' },
    { value: 'CLICK', label: 'Click' },
    { value: 'UZUM',  label: 'Uzum' },
]

const URGENCY_OPTIONS: { value: UrgencyTier | ''; label: string }[] = [
    { value: '',        label: 'Any urgency' },
    { value: 'normal',  label: 'Normal (< 15 min)' },
    { value: 'warning', label: 'Warning (15-30 min)' },
    { value: 'overdue', label: 'Overdue (> 30 min)' },
]

const CHIP_LABELS: Partial<Record<keyof OrderFilters, string>> = {
    search:        'Search',
    status:        'Status',
    paymentMethod: 'Payment',
    collectorId:   'Collector',
    driverId:      'Driver',
    urgency:       'Urgency',
}

interface Props {
    filters: OrderFilters
    onChange: (next: OrderFilters) => void
    staff: StaffMember[]
    totalCount: number
    filteredCount: number
}

export default function OrderFilterBar({
                                           filters, onChange, staff, totalCount, filteredCount,
                                       }: Props) {
    const collectors = useMemo(
        () => staff.filter(s =>
            ['COLLECTOR', 'STORE_MANAGER', 'SUPER_ADMIN'].includes(s.role)
        ),
        [staff],
    )
    const drivers = useMemo(
        () => staff.filter(s => s.role === 'DRIVER'),
        [staff],
    )

    const clearAll = () => onChange(EMPTY_FILTERS)

    const removeChip = (key: keyof OrderFilters) => {
        const next: OrderFilters = { ...filters }
        if (key === 'status')             next.status = ''
        else if (key === 'paymentMethod') next.paymentMethod = ''
        else if (key === 'urgency')       next.urgency = ''
        else                              next[key] = ''
        onChange(next)
    }

    const activeChips: { key: keyof OrderFilters; display: string }[] = []

    if (filters.search) {
        activeChips.push({ key: 'search', display: filters.search })
    }
    if (filters.status) {
        activeChips.push({
            key: 'status',
            display: STATUS_OPTIONS.find(o => o.value === filters.status)?.label ?? filters.status,
        })
    }
    if (filters.paymentMethod) {
        activeChips.push({
            key: 'paymentMethod',
            display: PAYMENT_OPTIONS.find(o => o.value === filters.paymentMethod)?.label ?? filters.paymentMethod,
        })
    }
    if (filters.collectorId) {
        activeChips.push({
            key: 'collectorId',
            display: collectors.find(c => c.id === filters.collectorId)?.fullName ?? filters.collectorId,
        })
    }
    if (filters.driverId) {
        activeChips.push({
            key: 'driverId',
            display: drivers.find(d => d.id === filters.driverId)?.fullName ?? filters.driverId,
        })
    }
    if (filters.urgency) {
        activeChips.push({
            key: 'urgency',
            display: URGENCY_OPTIONS.find(o => o.value === filters.urgency)?.label ?? filters.urgency,
        })
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-3">
            {/* Top row — search + dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300"
                    />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={e => onChange({ ...filters, search: e.target.value })}
                        placeholder="Search order ID, customer, address..."
                        className="w-full pl-7 pr-3 py-1.5 text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-brand focus:bg-white transition-colors"
                    />
                </div>

                <FilterSelect
                    value={filters.status}
                    onChange={v => onChange({ ...filters, status: v as OrderStatus | '' })}
                    options={STATUS_OPTIONS}
                    active={filters.status !== ''}
                />

                <FilterSelect
                    value={filters.paymentMethod}
                    onChange={v => onChange({ ...filters, paymentMethod: v as PaymentMethod | '' })}
                    options={PAYMENT_OPTIONS}
                    active={filters.paymentMethod !== ''}
                />

                <FilterSelect
                    value={filters.collectorId}
                    onChange={v => onChange({ ...filters, collectorId: v })}
                    options={[
                        { value: '', label: 'All collectors' },
                        ...collectors.map(c => ({ value: c.id, label: c.fullName })),
                    ]}
                    active={filters.collectorId !== ''}
                />

                <FilterSelect
                    value={filters.driverId}
                    onChange={v => onChange({ ...filters, driverId: v })}
                    options={[
                        { value: '', label: 'All drivers' },
                        ...drivers.map(d => ({ value: d.id, label: d.fullName })),
                    ]}
                    active={filters.driverId !== ''}
                />

                <FilterSelect
                    value={filters.urgency}
                    onChange={v => onChange({ ...filters, urgency: v as UrgencyTier | '' })}
                    options={URGENCY_OPTIONS}
                    active={filters.urgency !== ''}
                />
            </div>

            {/* Bottom row — chips + clear + count */}
            {(activeChips.length > 0 || filteredCount !== totalCount) && (
                <div className="flex items-center gap-2 flex-wrap pt-2.5 mt-2.5 border-t border-gray-50">
                    {activeChips.map(({ key, display }) => (
                        <div
                            key={key}
                            className="inline-flex items-center gap-1.5 h-6 pl-2 pr-1 rounded-md bg-gray-100 border border-gray-200 text-[11px]"
                        >
                            <span className="text-gray-400 font-semibold uppercase tracking-wide text-[9px]">
                                {CHIP_LABELS[key] ?? key}
                            </span>
                            <span className="text-gray-700 font-medium max-w-[120px] truncate">
                                {display}
                            </span>
                            <button
                                onClick={() => removeChip(key)}
                                className="w-4 h-4 rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                                aria-label={`Remove ${CHIP_LABELS[key] ?? key} filter`}
                            >
                                <X size={9} />
                            </button>
                        </div>
                    ))}

                    {activeChips.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="text-[11px] text-red-500 font-medium px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >
                            Clear all
                        </button>
                    )}

                    <span className="ml-auto text-[11px] text-gray-400">
                        {activeChips.length > 0
                            ? `${filteredCount} of ${totalCount} orders`
                            : `${totalCount} orders`}
                    </span>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// FilterSelect — small pill-style native select
// ─────────────────────────────────────────────────────────────
function FilterSelect({
                          value, onChange, options, active,
                      }: {
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    active: boolean
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`px-2.5 py-1.5 text-[12px] rounded-lg outline-none cursor-pointer transition-colors border ${
                active
                    ? 'bg-green-50 border-green-200 text-brand font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    )
}