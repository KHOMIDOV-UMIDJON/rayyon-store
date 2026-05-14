// MIRRORED FROM rayyon-admin/src/components/ui/StatusBadge.tsx
// Keep visually in sync with admin for cross-app consistency.

import type { OrderStatus } from '../../types'

interface Props {
    status: OrderStatus
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; dot: string; bg: string; text: string }> = {
    CREATED:            { label: 'Created',     dot: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
    CONFIRMED:          { label: 'New',         dot: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
    ASSIGNED:           { label: 'Preparing',   dot: '#E29A1F', bg: '#FAEEDA', text: '#854F0B' },
    PREPARING:          { label: 'Preparing',   dot: '#E29A1F', bg: '#FAEEDA', text: '#854F0B' },
    READY_FOR_PICKUP:   { label: 'Ready',       dot: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
    COURIER_ASSIGNED:   { label: 'Ready',       dot: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
    COURIER_ACCEPTED:   { label: 'Ready',       dot: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
    PICKED_UP:          { label: 'Picked up',   dot: '#7C4DFF', bg: '#EEEDFE', text: '#3C3489' },
    DELIVERED:          { label: 'Delivered',   dot: '#3187D8', bg: '#E6F1FB', text: '#0C447C' },
    COMPLETED:          { label: 'Completed',   dot: '#0F6E56', bg: '#f1f5f9', text: '#475569' },
    CANCELLED:          { label: 'Cancelled',   dot: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
}

export default function StatusBadge({ status }: Props) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CREATED

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
            style={{ background: cfg.bg, color: cfg.text }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    )
}