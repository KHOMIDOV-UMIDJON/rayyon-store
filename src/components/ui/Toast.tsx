import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props { message: string; type: 'success' | 'error'; onClose: () => void }

export default function Toast({ message, type, onClose }: Props) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border bg-white text-[13px] font-medium shadow-sm"
             style={{ borderColor: type === 'success' ? '#bbf7d0' : '#fca5a5', color: type === 'success' ? '#15803d' : '#dc2626' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: type === 'success' ? '#16a34a' : '#ef4444' }} />
            {message}
            <button onClick={onClose} className="ml-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
    )
}
