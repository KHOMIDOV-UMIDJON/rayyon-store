export default function InventoryPage() {
    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div>
                    <h1 className="text-[15px] font-semibold text-gray-900">Store inventory</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">Manage your product stock and pricing</p>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                        </svg>
                    </div>
                    <div className="text-[14px] font-medium text-gray-700 mb-1">Inventory management</div>
                    <div className="text-[12px] text-gray-400">Use the Admin panel to manage product stock and pricing</div>
                </div>
            </div>
        </div>
    )
}
