import type { PaymentMethod } from '../../../types'

interface Props {
    value:    PaymentMethod | ''
    onChange: (value: PaymentMethod | '') => void
}

const OPTIONS: { value: PaymentMethod | ''; label: string }[] = [
    { value: '',       label: 'All payments' },
    { value: 'CASH',   label: 'Cash' },
    { value: 'PAYME',  label: 'Payme' },
    { value: 'CLICK',  label: 'Click' },
    { value: 'UZUM',   label: 'Uzum' },
    { value: 'UZCARD', label: 'Uzcard' },
    { value: 'HUMO',   label: 'Humo' },
]

export default function PaymentFilterDropdown({ value, onChange }: Props) {
    const isActive = value !== ''

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as PaymentMethod | '')}
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