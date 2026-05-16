import api from '../lib/axios'
import type {
    ApiResponse, AuthUser, Order, OrderSummary, OrdersQueryParams,
    SpringPage, StoreInfo, StoreSettings, StaffMember,
} from '../types'

export interface Driver {
    id: string
    fullName: string
    phone: string
    isActive: boolean
    activeOrderCount: number
    distanceKm?: number
}

export const authApi = {
    login: async (data: { username: string; password: string; deviceId: string }): Promise<AuthUser> => {
        const res = await api.post<ApiResponse<AuthUser>>('/auth/login/web', data)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    logout: async (refreshToken: string) => {
        await api.post('/auth/logout', { refreshToken })
    },
}

export const storeApi = {
    getMyStore: async (): Promise<StoreInfo> => {
        const res = await api.get<ApiResponse<StoreInfo>>('/store/my')
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    getOrders: async (): Promise<Order[]> => {
        const res = await api.get<ApiResponse<Order[]>>('/store/orders')
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    getOrder: async (id: string): Promise<Order> => {
        const res = await api.get<ApiResponse<Order>>(`/store/orders/${id}`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    confirm: async (id: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(`/store/orders/${id}/confirm`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    prepare: async (id: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(`/store/orders/${id}/prepare`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    ready: async (id: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(`/store/orders/${id}/ready`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    confirmPickup: async (id: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(`/store/orders/${id}/confirm-pickup`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    // Manager override — mark PICKED_UP order as DELIVERED when driver
    // cannot confirm from their app. Audit trail records this as an override.
    markDelivered: async (id: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(`/store/orders/${id}/mark-delivered`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    complete: async (id: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(`/store/orders/${id}/complete`)
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    // ── Backend expects JSON body { collectorId }, not a query param ──
    assignCollector: async (orderId: string, collectorId: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(
            `/store/orders/${orderId}/assign-collector`,
            { collectorId },
        )
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    // ── Backend expects JSON body { driverId }, not a query param ──
    assignDriver: async (orderId: string, driverId: string): Promise<Order> => {
        const res = await api.put<ApiResponse<Order>>(
            `/store/orders/${orderId}/assign-driver`,
            { driverId },
        )
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    getStaff: async (): Promise<StaffMember[]> => {
        const res = await api.get<ApiResponse<StaffMember[]>>('/store/staff')
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
    getDrivers: async (): Promise<Driver[]> => {
        const res = await api.get<ApiResponse<Driver[]>>('/store/drivers')
        if (!res.data.success) throw new Error(res.data.message)
        return res.data.data ?? []
    },
}

// ─────────────────────────────────────────────────────────────
// ORDERS API — paginated search for the Orders page
//
// Always scoped to the caller's store on the backend (from JWT).
// Never pass a storeId in params — it would be ignored anyway.
// ─────────────────────────────────────────────────────────────
export const ordersApi = {
    search: async (
        params: OrdersQueryParams,
        page:   number,
        size:   number,
        sort:   string = 'createdAt,desc',
    ): Promise<SpringPage<OrderSummary>> => {
        // Strip undefined values so axios doesn't serialize them
        // as empty query params (?status=&search=).
        const clean: Record<string, string | number> = {}
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== '' && value !== null) {
                clean[key] = value as string | number
            }
        }

        const res = await api.get<ApiResponse<SpringPage<OrderSummary>>>(
            '/store/orders/search',
            { params: { ...clean, page, size, sort } },
        )

        if (!res.data.success || !res.data.data) {
            throw new Error(res.data.message)
        }
        return res.data.data
    },

}

// ─────────────────────────────────────────────────────────────
// SETTINGS API — per-store configuration
//
// Always scoped to the caller's store on the backend (from JWT).
// A store manager can only view/update their own store's settings.
// ─────────────────────────────────────────────────────────────
export const settingsApi = {
    get: async (): Promise<StoreSettings> => {
        const res = await api.get<ApiResponse<StoreSettings>>('/store/my/settings')
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },

    update: async (settings: StoreSettings): Promise<StoreSettings> => {
        const res = await api.patch<ApiResponse<StoreSettings>>(
            '/store/my/settings',
            settings,
        )
        if (!res.data.success || !res.data.data) throw new Error(res.data.message)
        return res.data.data
    },
}