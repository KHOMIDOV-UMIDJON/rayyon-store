import type { StatusHistory, StaffRole } from '../../types'
import { formatDateTime } from '../../lib/dateUtils'

const STATUS_LABELS: Record<string, string> = {
    CREATED: 'placed the order',
    CONFIRMED: 'confirmed the order',
    ASSIGNED: 'assigned a collector',
    PREPARING: 'started preparing',
    READY_FOR_PICKUP: 'marked as ready for pickup',
    COURIER_ASSIGNED: 'assigned a driver',
    COURIER_ACCEPTED: 'accepted the delivery',
    PICKED_UP: 'confirmed pickup',
    DELIVERED: 'delivered the order',
    COMPLETED: 'completed the order',
    CANCELLED: 'cancelled the order',
}

const STATUS_COLORS: Record<string, string> = {
    CREATED: 'text-blue-700',
    CONFIRMED: 'text-brand-dark',
    PREPARING: 'text-orange-700',
    READY_FOR_PICKUP: 'text-brand-dark',
    COURIER_ASSIGNED: 'text-violet-700',
    PICKED_UP: 'text-violet-700',
    DELIVERED: 'text-blue-800',
    COMPLETED: 'text-gray-600',
    CANCELLED: 'text-red-600',
}

const ROLE_LABELS: Partial<Record<StaffRole, string>> = {
    SUPER_ADMIN: 'Super Admin',
    STORE_MANAGER: 'Store Manager',
    DISPATCHER: 'Dispatcher',
    DRIVER: 'Driver',
    COLLECTOR: 'Collector',
    FINANCE_MANAGER: 'Finance Manager',
    CUSTOMER: 'Customer',
}

function initials(name?: string | null) {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColors(role: StaffRole | null | undefined) {
    if (role === 'CUSTOMER') return 'bg-blue-100 text-blue-800'
    if (role === 'DRIVER') return 'bg-amber-100 text-amber-800'
    return 'bg-green-100 text-brand-dark'
}

interface Props {
    history: StatusHistory[]
}

export default function OrderEventLog({ history }: Props) {
    if (!history || history.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[15px] font-semibold text-gray-900 mb-2">Event log</div>
                <div className="text-[13px] text-gray-400 py-4 text-center">No events yet</div>
            </div>
        )
    }

    const sortedDesc = [...history].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">Event log</h2>
                <span className="text-[12px] text-gray-400">
                    {history.length} event{history.length === 1 ? '' : 's'}
                </span>
            </div>

            <div className="flex flex-col">
                {sortedDesc.map((event, i) => {
                    const actionText = STATUS_LABELS[event.status] || event.status.replace(/_/g, ' ').toLowerCase()
                    const actionColor = STATUS_COLORS[event.status] || 'text-gray-600'
                    const roleLabel = event.changedByRole
                        ? (ROLE_LABELS[event.changedByRole] || event.changedByRole)
                        : ''
                    const avatarCls = avatarColors(event.changedByRole)
                    return (
                        <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                            <div
                                className={
                                    'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ' +
                                    avatarCls
                                }
                            >
                                {initials(event.changedByName)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-gray-800">
                                    <span className="font-semibold text-gray-900">
                                        {event.changedByName || 'System'}
                                    </span>
                                    {' '}
                                    <span className={'font-medium ' + actionColor}>{actionText}</span>
                                </div>
                                <div className="text-[12px] text-gray-400 mt-1">
                                    {roleLabel && <span>{roleLabel} · </span>}
                                    {formatDateTime(event.createdAt)}
                                </div>
                                {event.note && (
                                    <div className="text-[12px] text-gray-500 mt-1 italic">{event.note}</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}