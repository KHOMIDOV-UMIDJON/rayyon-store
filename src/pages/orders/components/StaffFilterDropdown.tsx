import type { StaffMember } from '../../../types'

interface Props {
    label:    string                        // 'driver' or 'collector' — drives placeholder
    role:     'DRIVER' | 'COLLECTOR'
    staff:    StaffMember[]
    value:    string                        // staff user ID or ''
    onChange: (value: string) => void
}

export default function StaffFilterDropdown({ label, role, staff, value, onChange }: Props) {
    const filtered = staff.filter((s) => s.role === role)
    const isActive = value !== ''

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`px-2.5 py-1.5 text-[12px] rounded-lg outline-none cursor-pointer transition-colors border ${
                isActive
                    ? 'bg-green-50 border-green-200 text-brand font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
        >
            <option value="">All {label}s</option>
            {filtered.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
        </select>
    )
}