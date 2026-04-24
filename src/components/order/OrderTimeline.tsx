import type { StatusHistory } from '../../types'
import { formatDateTime, formatElapsed, formatTotalElapsed } from '../../lib/dateUtils'

const STATUS_LABELS: Record<string, string> = {
    CREATED: 'Order placed',
    CONFIRMED: 'Confirmed',
    ASSIGNED: 'Collector assigned',
    PREPARING: 'Preparing',
    READY_FOR_PICKUP: 'Ready for pickup',
    COURIER_ASSIGNED: 'Driver assigned',
    COURIER_ACCEPTED: 'Driver accepted',
    PICKED_UP: 'Picked up',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

interface Props {
    history: StatusHistory[]
    currentStatus: string
}

export default function OrderTimeline({ history, currentStatus }: Props) {
    if (!history || history.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[15px] font-semibold text-gray-900 mb-2">Timeline</div>
                <div className="text-[13px] text-gray-400 py-4 text-center">No events yet</div>
            </div>
        )
    }

    const sorted = [...history].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    const firstIso = sorted[0].createdAt
    const lastIso = sorted[sorted.length - 1].createdAt
    const total = formatTotalElapsed(firstIso, lastIso)

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-gray-900">Timeline</h2>
                {total && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-brand-dark">
                        {total}
                    </span>
                )}
            </div>

            <div className="flex flex-col">
                {sorted.map((event, i) => {
                    const isLast = i === sorted.length - 1
                    const isCurrent = event.status === currentStatus && isLast
                    const elapsed = i === 0
                        ? '— starting point'
                        : formatElapsed(sorted[i - 1].createdAt, event.createdAt)

                    const dotStyle = isCurrent
                        ? { boxShadow: '0 0 0 4px #E1F5EE' }
                        : undefined

                    return (
                        <div key={i} className="relative flex items-start gap-3 py-2">
                            <div className="w-[20px] flex justify-center flex-shrink-0 pt-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand" style={dotStyle} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-3">
                                    <div className="text-[13px] font-semibold text-gray-900">
                                        {STATUS_LABELS[event.status] || event.status}
                                    </div>
                                    <div className="text-[12px] text-gray-400 whitespace-nowrap">
                                        {formatDateTime(event.createdAt)}
                                    </div>
                                </div>
                                <div
                                    className={
                                        'text-[12px] mt-1 ' +
                                        (isCurrent ? 'text-brand-dark font-medium' : 'text-gray-400')
                                    }
                                >
                                    {elapsed}
                                    {isCurrent ? ' · current stage' : ''}
                                </div>
                            </div>
                            {!isLast && (
                                <div className="absolute left-[14px] top-[28px] bottom-[-4px] w-px bg-gray-200" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}