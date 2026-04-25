import { useState } from 'react'
import { Users, Check, Pencil } from 'lucide-react'
import type { StaffMember } from '../../types'

function initials(name: string) {
    return name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'
}

interface Props {
    /** All store staff — component filters to COLLECTOR role internally */
    staff: StaffMember[]
    /** Currently assigned collector id, if any */
    assignedCollectorId?: string
    /** Currently assigned collector name, if any */
    assignedCollectorName?: string
    /** Order status — controls which state of the card renders */
    orderStatus: string
    /** Picking progress — used in PREPARING state */
    pickedCount?: number
    totalItems?: number
    /** Action handlers */
    onAssign: (collectorId: string) => void
    onStartPreparing: () => void
    onMarkReady: () => void
    /** Pending flags from parent mutations */
    assigning: boolean
    starting: boolean
    markingReady: boolean
}

type Mode = 'pick' | 'assigned' | 'preparing' | 'done'

export default function AssignCollectorCard({
                                                staff,
                                                assignedCollectorId,
                                                assignedCollectorName,
                                                orderStatus,
                                                pickedCount = 0,
                                                totalItems = 0,
                                                onAssign,
                                                onStartPreparing,
                                                onMarkReady,
                                                assigning,
                                                starting,
                                                markingReady,
                                            }: Props) {
    const [selected, setSelected] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)

    const collectors = staff
        .filter(s => s.role === 'COLLECTOR')
        .slice()
        .sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0))

    const hasCollector = Boolean(assignedCollectorId)
    const busy = assigning || starting || markingReady

    // Resolve mode from inputs
    const mode: Mode =
        orderStatus === 'CONFIRMED' && (!hasCollector || editing) ? 'pick'
            : orderStatus === 'CONFIRMED' && hasCollector            ? 'assigned'
                : orderStatus === 'PREPARING'                            ? 'preparing'
                    : 'done'

    const selectedPerson = collectors.find(c => c.id === selected)

    // ── PICK STATE ──
    if (mode === 'pick') {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-brand" />
                    <span className="text-[14px] font-semibold text-gray-900 flex-1">Assign collector</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                        REQUIRED
                    </span>
                </div>

                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Collectors · sorted by workload
                </div>

                {collectors.length === 0 ? (
                    <div className="text-[12px] text-gray-400 py-4 text-center">
                        No collectors available
                    </div>
                ) : (
                    collectors.map(c => {
                        const isSelected = selected === c.id
                        return (
                            <div
                                key={c.id}
                                onClick={() => setSelected(prev => prev === c.id ? null : c.id)}
                                className={
                                    'flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all mb-1.5 ' +
                                    (isSelected
                                        ? 'border-brand bg-green-50 border-[1.5px]'
                                        : 'border-gray-100 bg-white hover:bg-gray-50')
                                }
                            >
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-brand-dark flex-shrink-0">
                                    {initials(c.fullName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-gray-900 truncate">
                                        {c.fullName}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                                        COLLECTOR
                                    </div>
                                </div>
                                <span
                                    className={
                                        'text-[9px] font-bold px-2 py-0.5 rounded-full ' +
                                        ((c.activeOrderCount ?? 0) === 0
                                            ? 'bg-green-50 text-brand-dark'
                                            : (c.activeOrderCount ?? 0) <= 2
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-red-50 text-red-700')
                                    }
                                >
                                    {c.activeOrderCount ?? 0} active
                                </span>
                                {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                                        <Check size={12} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}

                <div className="flex gap-2 mt-3">
                    {editing && (
                        <button
                            onClick={() => { setEditing(false); setSelected(null) }}
                            disabled={busy}
                            className="flex-1 py-2.5 rounded-lg bg-white text-gray-700 border border-gray-300 text-[12px] font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (selected) {
                                onAssign(selected)
                                setEditing(false)
                            }
                        }}
                        disabled={busy || !selected}
                        className="flex-[1.6] py-2.5 rounded-lg bg-brand text-white text-[12px] font-semibold hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {assigning
                            ? 'Assigning...'
                            : selectedPerson
                                ? `Assign ${selectedPerson.fullName.split(' ')[0]}`
                                : 'Select a collector'}
                    </button>
                </div>
            </div>
        )
    }

    // ── ASSIGNED STATE ──
    if (mode === 'assigned') {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-brand" />
                    <span className="text-[14px] font-semibold text-gray-900 flex-1">Collector</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-brand-dark">
                        ASSIGNED
                    </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg mb-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-[12px] font-bold text-brand-dark flex-shrink-0">
                        {initials(assignedCollectorName || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-gray-900 truncate">
                            {assignedCollectorName}
                        </div>
                        <div className="text-[11px] text-brand-dark mt-0.5">Waiting to start picking</div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setEditing(true)}
                        disabled={busy}
                        className="flex-1 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 text-[12px] font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        <Pencil size={11} />
                        Change
                    </button>
                    <button
                        onClick={onStartPreparing}
                        disabled={busy}
                        className="flex-[1.4] py-2 rounded-lg bg-brand text-white text-[12px] font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
                    >
                        {starting ? 'Starting...' : 'Start preparing →'}
                    </button>
                </div>
                <div className="text-[10px] text-gray-400 text-center mt-2 leading-snug">
                    Normally pressed by the collector. Use only as fallback if needed.
                </div>
            </div>
        )
    }

    // ── PREPARING STATE ──
    if (mode === 'preparing') {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-orange-700" />
                    <span className="text-[14px] font-semibold text-gray-900 flex-1">Collector</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-orange-700">
                        PICKING
                    </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg mb-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[12px] font-bold text-orange-700 flex-shrink-0">
                        {initials(assignedCollectorName || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-gray-900 truncate">
                            {assignedCollectorName}
                        </div>
                        <div className="text-[11px] text-orange-700 mt-0.5">
                            Picking now · {pickedCount} / {totalItems} items
                        </div>
                    </div>
                </div>

                <button
                    onClick={onMarkReady}
                    disabled={busy}
                    className="w-full py-2 rounded-lg bg-white text-gray-700 border border-gray-300 text-[12px] font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    {markingReady ? 'Processing...' : 'Mark as ready →'}
                </button>
                <div className="text-[10px] text-gray-400 text-center mt-2 leading-snug">
                    Override: only if collector is unable to mark it themselves.
                </div>
            </div>
        )
    }

    // ── DONE STATE — for READY_FOR_PICKUP and beyond ──
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-400" />
                <span className="text-[14px] font-semibold text-gray-900 flex-1">Collector</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    DONE ✓
                </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600 flex-shrink-0">
                    {initials(assignedCollectorName || '')}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-600 truncate">
                        {assignedCollectorName || 'No collector recorded'}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Picking completed</div>
                </div>
            </div>
        </div>
    )
}