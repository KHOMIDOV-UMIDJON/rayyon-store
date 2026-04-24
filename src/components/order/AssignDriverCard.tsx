import { useState } from 'react'
import { Clock, Check } from 'lucide-react'
import type { StaffMember } from '../../types'

function initials(name: string) {
    return name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'
}

interface Props {
    drivers: StaffMember[]
    alreadyAssignedDriverId?: string
    alreadyAssignedDriverName?: string
    onAssignDriver: (driverId: string) => void
    onConfirmPickup: () => void
    assigning: boolean
    confirming: boolean
}

export default function AssignDriverCard({
                                             drivers,
                                             alreadyAssignedDriverId,
                                             alreadyAssignedDriverName,
                                             onAssignDriver,
                                             onConfirmPickup,
                                             assigning,
                                             confirming,
                                         }: Props) {
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

    const hasDriver = Boolean(alreadyAssignedDriverId)
    const canConfirm = hasDriver
    const busy = assigning || confirming

    const selectedPerson = drivers.find(d => d.id === selectedDriver)

    const sortedDrivers = drivers
        .slice()
        .sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0))

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
                <Clock size={13} className="text-blue-500" />
                <span className="text-[12px] font-semibold text-gray-900 flex-1">
                    {hasDriver ? 'Driver' : 'Assign driver'}
                </span>
                <span
                    className={
                        'text-[9px] font-bold px-2 py-0.5 rounded-full ' +
                        (hasDriver ? 'bg-green-50 text-brand-dark' : 'bg-red-50 text-red-500')
                    }
                >
                    {hasDriver ? 'ASSIGNED' : 'REQUIRED'}
                </span>
            </div>

            {hasDriver && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg mb-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-800 flex-shrink-0">
                        {initials(alreadyAssignedDriverName || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-gray-900 truncate">
                            {alreadyAssignedDriverName}
                        </div>
                        <div className="text-[9px] text-blue-700">Heading to store</div>
                    </div>
                </div>
            )}

            {!hasDriver && (
                <>
                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                        Drivers · sorted by workload
                    </div>
                    {sortedDrivers.length === 0 ? (
                        <div className="text-[10px] text-gray-400 py-3 text-center">No drivers available</div>
                    ) : (
                        sortedDrivers.map(d => {
                            const isSelected = selectedDriver === d.id
                            return (
                                <div
                                    key={d.id}
                                    onClick={() =>
                                        setSelectedDriver(prev => (prev === d.id ? null : d.id))
                                    }
                                    className={
                                        'flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all mb-1 ' +
                                        (isSelected
                                            ? 'border-brand bg-green-50 border-[1.5px]'
                                            : 'border-gray-100 bg-white hover:bg-gray-50')
                                    }
                                >
                                    <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-800 flex-shrink-0">
                                        {initials(d.fullName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-semibold text-gray-900 truncate">
                                            {d.fullName}
                                        </div>
                                        <div className="text-[8px] text-gray-400 uppercase tracking-wide">
                                            {d.role}
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-bold text-brand-dark bg-green-50 px-1.5 py-0.5 rounded-full">
                                        {d.activeOrderCount ?? 0} active
                                    </span>
                                    {isSelected && (
                                        <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                                            <Check size={10} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </>
            )}

            <div className="flex gap-1.5 mt-2.5">
                {!hasDriver && (
                    <button
                        onClick={() => selectedDriver && onAssignDriver(selectedDriver)}
                        disabled={busy || !selectedDriver}
                        className="flex-1 py-2 rounded-lg bg-brand text-white text-[11px] font-semibold hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {assigning
                            ? 'Assigning...'
                            : selectedPerson
                                ? `Assign ${selectedPerson.fullName.split(' ')[0]}`
                                : 'Select driver'}
                    </button>
                )}

                <button
                    onClick={onConfirmPickup}
                    disabled={busy || !canConfirm}
                    className={
                        'flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ' +
                        (canConfirm
                            ? 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 border border-gray-100 cursor-not-allowed')
                    }
                >
                    {confirming ? 'Confirming...' : 'Confirm pickup'}
                </button>
            </div>

            {!canConfirm && !hasDriver && (
                <div className="text-[9px] text-gray-400 text-center mt-1.5">
                    Pickup can be confirmed after driver is assigned
                </div>
            )}
        </div>
    )
}