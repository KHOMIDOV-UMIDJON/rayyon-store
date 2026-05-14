import { Inbox, SearchX } from 'lucide-react'

interface Props {
    variant: 'no-data' | 'no-match'
    onClear?: () => void
}

export default function EmptyState({ variant, onClear }: Props) {
    const isNoMatch = variant === 'no-match'
    const Icon = isNoMatch ? SearchX : Inbox

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-gray-400" />
            </div>
            <p className="text-[14px] font-medium text-gray-800 mb-1">
                {isNoMatch ? 'No orders match your filters' : 'No orders yet'}
            </p>
            <p className="text-[12px] text-gray-500 max-w-sm mb-4">
                {isNoMatch
                    ? 'Try widening your date range or clearing some filters.'
                    : "Orders placed by customers will show up here once they're confirmed."}
            </p>
            {isNoMatch && onClear && (
                <button
                    onClick={onClear}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                >
                    Clear filters
                </button>
            )}
        </div>
    )
}