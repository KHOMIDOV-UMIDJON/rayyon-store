export interface AuthUser {
    userId: string
    fullName: string
    role: string
    accessToken: string
    refreshToken: string
    storeId?: string
}

export interface ApiResponse<T> {
    success: boolean
    message: string
    data?: T
}

export type OrderStatus =
    | 'CREATED' | 'CONFIRMED' | 'ASSIGNED' | 'PREPARING'
    | 'READY_FOR_PICKUP' | 'COURIER_ASSIGNED' | 'COURIER_ACCEPTED'
    | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'

export type PaymentMethod = 'CASH' | 'PAYME' | 'CLICK' | 'UZUM' | 'UZCARD' | 'HUMO'

export type UrgencyTier = 'normal' | 'warning' | 'overdue'

export type StaffRole =
    | 'SUPER_ADMIN' | 'STORE_MANAGER' | 'DISPATCHER'
    | 'DRIVER' | 'COLLECTOR' | 'FINANCE_MANAGER' | 'CUSTOMER'

export interface OrderItem {
    id: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    unitDisplay: string
}

export interface StatusHistory {
    status: OrderStatus
    changedBy: string | null
    changedByName: string | null
    changedByRole: StaffRole | null
    note: string | null
    createdAt: string
}

export interface Order {
    orderId: string
    status: OrderStatus
    storeName: string
    storeId: string

    customerId?: string
    customerName: string
    customerPhone: string

    deliveryAddress: string
    deliveryLat?: number
    deliveryLng?: number

    subtotal: number
    deliveryFee: number
    totalAmount: number

    paymentMethod: string
    isPaid: boolean
    notes?: string

    items: OrderItem[]
    statusHistory?: StatusHistory[]

    dispatcherId?: string
    dispatcherName?: string

    assignedDriverId?: string
    driverName?: string

    collectorId?: string
    collectorName?: string

    createdAt: string
    updatedAt: string
    waitSeconds?: number
}

export interface StoreInfo {
    id: string
    nameUz: string
    address: string
    city: string
    phone: string
    status: string
    managerId: string
}

export interface StaffMember {
    id: string
    fullName: string
    role: string
    phone: string
    isActive: boolean
    username: string
    activeOrderCount?: number
}

// ─────────────────────────────────────────────────────────────
// ORDER FILTERS — used by Kanban live board filter bar
// ─────────────────────────────────────────────────────────────
export interface OrderFilters {
    search: string
    status: OrderStatus | ''
    paymentMethod: PaymentMethod | ''
    collectorId: string
    driverId: string
    urgency: UrgencyTier | ''
}

export const EMPTY_FILTERS: OrderFilters = {
    search: '',
    status: '',
    paymentMethod: '',
    collectorId: '',
    driverId: '',
    urgency: '',
}