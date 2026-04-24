import { CheckSquare, Square } from 'lucide-react'
import type { OrderItem } from '../../types'

const fmtMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n))

interface Props {
    items: OrderItem[]
    checkedItems: Record<string, boolean>
    onToggle: (id: string) => void
    onMarkAll: () => void
    interactive: boolean
}

export default function PickingList({
                                        items, checkedItems, onToggle, onMarkAll, interactive,
                                    }: Props) {
    const total = items.length
    const checked = items.filter(i => checkedItems[i.id]).length
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">Picking list</h2>
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-400">{checked} / {total} picked</span>
                    {total > 0 && (
                        <span
                            className={
                                'text-[11px] font-bold px-2 py-0.5 rounded-full ' +
                                (pct === 100 ? 'bg-green-50 text-brand-dark' : 'bg-amber-50 text-amber-800')
                            }
                        >
                            {pct}%
                        </span>
                    )}
                </div>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="max-h-72 overflow-y-auto -mx-1 px-1">
                {items.map(item => {
                    const isChecked = Boolean(checkedItems[item.id])
                    return (
                        <div
                            key={item.id}
                            onClick={() => interactive && onToggle(item.id)}
                            className={
                                'flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 ' +
                                (interactive ? 'cursor-pointer select-none' : '')
                            }
                        >
                            <div className="flex-shrink-0">
                                {isChecked ? (
                                    <CheckSquare size={20} className="text-brand" />
                                ) : (
                                    <Square size={20} className="text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div
                                    className={
                                        'text-[14px] font-medium transition-all ' +
                                        (isChecked ? 'line-through text-gray-400' : 'text-gray-900')
                                    }
                                >
                                    {item.productName}
                                </div>
                                <div className="text-[12px] text-gray-400 mt-0.5">
                                    × {item.quantity} {item.unitDisplay}
                                </div>
                            </div>
                            <div className={'text-right flex-shrink-0 ' + (isChecked ? 'opacity-60' : '')}>
                                <div className="text-[14px] font-semibold text-gray-900">
                                    {fmtMoney(item.totalPrice)} UZS
                                </div>
                                <div className="text-[12px] text-gray-400 mt-0.5">{fmtMoney(item.unitPrice)} each</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {interactive && total > 0 && (
                <button
                    onClick={onMarkAll}
                    className="w-full mt-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    Mark all as picked
                </button>
            )}
        </div>
    )
}