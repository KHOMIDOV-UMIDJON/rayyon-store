// MIRRORED FROM rayyon-admin/src/components/ui/PaymentBadge.tsx
// Keep visually in sync with admin for cross-app consistency.

import type { PaymentMethod } from '../../types'

interface Props {
    method: PaymentMethod
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    CASH:   'Cash',
    PAYME:  'Payme',
    CLICK:  'Click',
    UZUM:   'Uzum',
    UZCARD: 'Uzcard',
    HUMO:   'Humo',
}

export default function PaymentBadge({ method }: Props) {
    const isCash = method === 'CASH'

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                isCash
                    ? 'bg-[#FFF6E0] text-[#854F0B]'
                    : 'bg-[#E6F1FB] text-[#0C447C]'
            }`}
        >
            {PAYMENT_LABELS[method] ?? method}
        </span>
    )
}