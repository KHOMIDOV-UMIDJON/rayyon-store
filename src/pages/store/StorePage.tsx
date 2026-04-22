import { useQuery } from '@tanstack/react-query'
import { storeApi } from '../../api'

export default function StorePage() {
    const { data: store, isLoading } = useQuery({
        queryKey: ['my-store'],
        queryFn: storeApi.getMyStore,
    })

    if (isLoading) return (
        <div className="flex flex-col flex-1 items-center justify-center text-[13px] text-gray-400">
            Loading...
        </div>
    )
    if (!store) return null

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div>
                    <h1 className="text-[15px] font-semibold text-gray-900">{store.nameUz}</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">{store.city} · {store.address}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    store.status === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
          {store.status}
        </span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
                <div className="bg-white rounded-xl border border-gray-100 p-4 max-w-md">
                    <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Store information</h2>
                    {[
                        { label: 'Store name', value: store.nameUz },
                        { label: 'City',       value: store.city },
                        { label: 'Address',    value: store.address },
                        { label: 'Phone',      value: store.phone, green: true },
                        { label: 'Status',     value: store.status },
                    ].map(({ label, value, green }) => (
                        <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                            <span className="text-[11px] text-gray-400">{label}</span>
                            <span className={`text-[12px] font-medium ${green ? 'text-brand' : 'text-gray-700'}`}>
                {value}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
