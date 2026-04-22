import { useQuery } from '@tanstack/react-query'
import { storeApi } from '../../api'

export default function StaffPage() {
    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['store-staff'],
        queryFn: storeApi.getStaff,
    })

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div>
                    <h1 className="text-[15px] font-semibold text-gray-900">Staff</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">{staff.length} team members</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
                {isLoading ? (
                    <div className="text-center text-[13px] text-gray-400 py-12">Loading staff...</div>
                ) : staff.length === 0 ? (
                    <div className="text-center text-[13px] text-gray-400 py-12">No staff members found</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 max-w-2xl">
                        {staff.map(member => (
                            <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 border-[1.5px] border-green-300 flex items-center justify-center text-[13px] font-bold text-brand flex-shrink-0">
                                    {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium text-gray-900 truncate">{member.fullName}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{member.role}</div>
                                    <div className="text-[11px] text-gray-400">{member.phone}</div>
                                </div>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${member.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
