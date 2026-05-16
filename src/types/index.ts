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

// ─────────────────────────────────────────────────────────────
// SPRING PAGE — shape returned by every paginated endpoint
// ─────────────────────────────────────────────────────────────
export interface SpringPage<T> {
    content:          T[]
    totalElements:    number
    totalPages:       number
    size:             number
    number:           number   // 0-indexed current page
    first:            boolean
    last:             boolean
    numberOfElements: number
    empty:            boolean
}

// ─────────────────────────────────────────────────────────────
// ORDER SUMMARY — slim row for the Orders page table
//
// Mirrors backend's StoreOrderSummaryResponse exactly.
// Use Order (heavyweight) for the detail page, OrderSummary
// for the list/table.
// ─────────────────────────────────────────────────────────────
export interface OrderSummary {
    orderId:         string
    status:          OrderStatus
    paymentMethod:   PaymentMethod
    isPaid:          boolean
    totalAmount:     number
    customerName:    string | null
    customerPhone:   string | null
    deliveryAddress: string | null
    driverName:      string | null
    collectorName:   string | null
    itemCount:       number
    createdAt:       string
    updatedAt:       string
}

// ─────────────────────────────────────────────────────────────
// ORDERS QUERY PARAMS — drives GET /store/orders/search
//
// All fields optional. Backend ignores any field that's null
// or undefined. storeId is intentionally NOT here — backend
// always scopes to caller's storeId from the JWT.
// ─────────────────────────────────────────────────────────────
export interface OrdersQueryParams {
    // Date range (YYYY-MM-DD)
    from?:          string
    to?:            string

    // Status & payment
    status?:        OrderStatus
    paymentMethod?: PaymentMethod

    // Staff
    driverId?:      string
    collectorId?:   string

    // Free-text search (matches order ID prefix, name, phone, address)
    search?:        string

    // Amount range (UZS, integer)
    minAmount?:     number
    maxAmount?:     number
}

// ─────────────────────────────────────────────────────────────
// STORE SETTINGS — current values from GET /store/my/settings
// Updated via PATCH /store/my/settings.
//
// Mirrors backend's StoreSettingsResponse and the validated
// payload of UpdateStoreSettingsRequest.
// ─────────────────────────────────────────────────────────────
export interface StoreSettings {
    liveBoardResetHour:   number  // 0-23, Asia/Tashkent
    liveBoardResetMinute: number  // 0-59
}