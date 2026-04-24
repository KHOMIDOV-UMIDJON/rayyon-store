import { Phone } from 'lucide-react'
import { formatPhone } from '../../lib/dateUtils'

interface Props {
    name?: string
    phone?: string
}

export default function CustomerCard({ name, phone }: Props) {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'
    const pretty = formatPhone(phone)
    const telLink = phone ? `tel:${phone.replace(/\D/g, '')}` : ''

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Customer
            </div>
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[12px] font-bold text-blue-800 flex-shrink-0">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">
                        {name || 'Unknown customer'}
                    </div>
                    {pretty && telLink ? (
                        <a
                            href={telLink}
                            className="text-[11px] text-brand font-medium inline-flex items-center gap-1 mt-0.5 hover:text-brand-dark transition-colors"
                        >
                            <Phone size={10} />
                            {pretty}
                        </a>
                    ) : (
                        <div className="text-[11px] text-gray-400 mt-0.5">No phone on file</div>
                        )}
                </div>
            </div>
        </div>
    )
}