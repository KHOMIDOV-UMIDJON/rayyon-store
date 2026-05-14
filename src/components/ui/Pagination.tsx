// MIRRORED FROM rayyon-admin/src/pages/users/components/users-list/Pagination.tsx
// "users" wording changed to "orders". Keep behavior in sync with admin.

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    currentPage:   number    // 0-based to match Spring
    totalPages:    number
    totalElements: number
    pageSize:      number
    onPageChange:  (page: number) => void
}

export default function Pagination({
                                       currentPage,
                                       totalPages,
                                       totalElements,
                                       pageSize,
                                       onPageChange,
                                   }: Props) {
    if (totalElements === 0) {
        return (
            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-gray-100">
                <span className="text-[11px] text-gray-400">No orders to display</span>
            </div>
        )
    }

    const firstItem = currentPage * pageSize + 1
    const lastItem  = Math.min((currentPage + 1) * pageSize, totalElements)

    const pageNumbers = getPageNumbers(currentPage, totalPages)

    return (
        <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-gray-100 flex-shrink-0">
            <span className="text-[11px] text-gray-500">
                Showing <span className="font-medium text-gray-700">{firstItem}–{lastItem}</span>
                {' '}of <span className="font-medium text-gray-700">{totalElements}</span> orders
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={12} />
                </button>
                {pageNumbers.map((p, i) =>
                    p === 'ellipsis' ? (
                        <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`min-w-[28px] h-7 px-2 text-[11px] rounded-md border transition-colors ${
                                p === currentPage
                                    ? 'bg-brand border-brand text-white font-medium'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {p + 1}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight size={12} />
                </button>
            </div>
        </div>
    )
}

// Smart window: ≤7 pages → all; else first, neighbors of current, last with ellipses.
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i)
    }

    const pages: (number | 'ellipsis')[] = []
    pages.push(0)

    if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(total - 1)
    } else if (current >= total - 4) {
        pages.push('ellipsis')
        for (let i = total - 5; i < total; i++) pages.push(i)
    } else {
        pages.push('ellipsis')
        pages.push(current - 1)
        pages.push(current)
        pages.push(current + 1)
        pages.push('ellipsis')
        pages.push(total - 1)
    }

    return pages
}