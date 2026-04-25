import { useState } from 'react'
import { Truck, Check, Pencil, MapPin, CheckCircle } from 'lucide-react'
import type { Driver } from '../../api'

function initials(name: string) {
    return name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'
}

interface Props {
    drivers: Driver[]
    /** Currently assigned driver id, if any */
    alreadyAssignedDriverId?: string
    /** Currently assigned driver name, if any */
    alreadyAssignedDriverName?: string
    /** Order status — controls which state to render */
    orderStatus: string
    /** Action handlers */
    onAssignDriver: (driverId: string) => void
    onConfirmPickup: () => void
    /** Pending flags */
    assigning: boolean
    confirming: boolean
}

type Mode = 'pick' | 'assigned' | 'transit' | 'done'

export default function AssignDriverCard({
                                             drivers,
                                             alreadyAssignedDriverId,
                                             alreadyAssignedDriverName,
                                             orderStatus,
                                             onAssignDriver,
                                             onConfirmPickup,
                                             assigning,
                                             confirming,
                                         }: Props) {
    const [selected, setSelected] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)

    const sortedDrivers = drivers
        .slice()
        .sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0))

    const hasDriver = Boolean(alreadyAssignedDriverId)
    const busy = assigning || confirming

    const mode: Mode =
        orderStatus === 'READY_FOR_PICKUP' && (!hasDriver || editing)                    ? 'pick'
            : (orderStatus === 'READY_FOR_PICKUP' || orderStatus === 'COURIER_ASSIGNED' || orderStatus === 'COURIER_ACCEPTED') && hasDriver  ? 'assigned'
                : orderStatus === 'PICKED_UP'                                                ? 'transit'
                    : 'done'

    const selectedPerson = sortedDrivers.find(d => d.id === selected)

    // ── PICK STATE ──
    if (mode === 'pick') {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Truck size={14} className="text-brand" />
                    <span className="text-[14px] font-semibold text-gray-900 flex-1">Assign driver</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                        REQUIRED
                    </span>
                </div>

                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Drivers · sorted by workload
                </div>

                {sortedDrivers.length === 0 ? (
                    <div className="text-[12px] text-gray-400 py-4 text-center">
                        No drivers available
                    </div>
                ) : (
                    sortedDrivers.map(d => {
                        const isSelected = selected === d.id
                        return (
                            <div
                                key={d.id}
                                onClick={() => setSelected(prev => prev === d.id ? null : d.id)}
                                className={
                                    'flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all mb-1.5 ' +
                                    (isSelected
                                        ? 'border-brand bg-green-50 border-[1.5px]'
                                        : 'border-gray-100 bg-white hover:bg-gray-50')
                                }
                            >
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
                                    {initials(d.fullName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-gray-900 truncate">
                                        {d.fullName}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                                        DRIVER
                                    </div>
                                </div>
                                <span
                                    className={
                                        'text-[9px] font-bold px-2 py-0.5 rounded-full ' +
                                        ((d.activeOrderCount ?? 0) === 0
                                            ? 'bg-green-50 text-brand-dark'
                                            : (d.activeOrderCount ?? 0) <= 2
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-red-50 text-red-700')
                                    }
                                >
                                    {d.activeOrderCount ?? 0} active
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
                                onAssignDriver(selected)
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
                                : 'Select a driver'}
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
                    <Truck size={14} className="text-brand" />
                    <span className="text-[14px] font-semibold text-gray-900 flex-1">Driver</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-brand-dark">
                        ASSIGNED
                    </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-bold text-blue-700 flex-shrink-0">
                        {initials(alreadyAssignedDriverName || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-gray-900 truncate">
                            {alreadyAssignedDriverName}
                        </div>
                        <div className="text-[11px] text-brand-dark mt-0.5">
                            Awaiting pickup
                        </div>
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
                        onClick={onConfirmPickup}
                        disabled={busy}
                        className="flex-[1.4] py-2 rounded-lg bg-brand text-white text-[12px] font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
                    >
                        {confirming ? 'Confirming...' : 'Confirm pickup →'}
                    </button>
                </div>
                <div className="text-[10px] text-gray-400 text-center mt-2 leading-snug">
                    Press when driver physically takes the bag.
                </div>
            </div>
        )
    }

    // ── IN TRANSIT STATE ──
    if (mode === 'transit') {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Truck size={14} className="text-purple-700" />
                    <span className="text-[14px] font-semibold text-gray-900 flex-1">Driver</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        IN TRANSIT
                    </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-[12px] font-bold text-purple-700 flex-shrink-0">
                        {initials(alreadyAssignedDriverName || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-gray-900 truncate">
                            {alreadyAssignedDriverName}
                        </div>
                        <div className="text-[11px] text-purple-700 mt-0.5 inline-flex items-center gap-1">
                            <MapPin size={10} />
                            Out for delivery
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── DONE STATE ──
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Truck size={14} className="text-gray-400" />
                <span className="text-[14px] font-semibold text-gray-900 flex-1">Driver</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    DONE ✓
                </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600 flex-shrink-0">
                    {initials(alreadyAssignedDriverName || '')}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-600 truncate">
                        {alreadyAssignedDriverName || 'No driver recorded'}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-1">
                        <CheckCircle size={10} />
                        Delivery completed
                    </div>
                </div>
            </div>
        </div>
    )
}