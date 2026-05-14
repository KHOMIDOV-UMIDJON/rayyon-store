import type { OrderStatus } from '../../../types'

interface Props {
    value:    OrderStatus | ''
    onChange: (value: OrderStatus | '') => void
}

const OPTIONS: { value: OrderStatus | ''; label: string }[] = [
    { value: '',                 label: 'All statuses' },
    { value: 'CONFIRMED',        label: 'New' },
    { value: 'PREPARING',        label: 'Preparing' },
    { value: 'READY_FOR_PICKUP', label: 'Ready' },
    { value: 'PICKED_UP',        label: 'Picked up' },
    { value: 'DELIVERED',        label: 'Delivered' },
    { value: 'COMPLETED',        label: 'Completed' },
    { value: 'CANCELLED',        label: 'Cancelled' },
]

export default function StatusFilterDropdown({ value, onChange }: Props) {
    const isActive = value !== ''

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as OrderStatus | '')}
            className={`px-2.5 py-1.5 text-[12px] rounded-lg outline-none cursor-pointer transition-colors border ${
                isActive
                    ? 'bg-green-50 border-green-200 text-brand font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
        >
            {OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    )
}