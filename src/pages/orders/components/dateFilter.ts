// MIRRORED FROM rayyon-admin/src/components/orders/dateFilter.ts
// Keep behavior in sync with admin.

export type DatePreset = 'today' | 'yesterday' | 'last3' | 'last7' | 'last30' | 'all' | 'custom'

export interface OrderDateRange {
    preset: DatePreset
    from?:  string   // YYYY-MM-DD, omitted for 'all'
    to?:    string   // YYYY-MM-DD, omitted for 'all'
}

function fmt(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export function rangeForPreset(preset: DatePreset): OrderDateRange {
    const today = new Date()

    switch (preset) {
        case 'today':
            return { preset, from: fmt(today), to: fmt(today) }

        case 'yesterday': {
            const y = new Date(today)
            y.setDate(today.getDate() - 1)
            return { preset, from: fmt(y), to: fmt(y) }
        }

        case 'last3': {
            const start = new Date(today)
            start.setDate(today.getDate() - 2)   // includes today
            return { preset, from: fmt(start), to: fmt(today) }
        }

        case 'last7': {
            const start = new Date(today)
            start.setDate(today.getDate() - 6)
            return { preset, from: fmt(start), to: fmt(today) }
        }

        case 'last30': {
            const start = new Date(today)
            start.setDate(today.getDate() - 29)
            return { preset, from: fmt(start), to: fmt(today) }
        }

        case 'all':
            return { preset }                    // no date filter applied

        case 'custom':
            return { preset, from: fmt(today), to: fmt(today) }
    }
}

export const PRESET_LABELS: Record<DatePreset, string> = {
    today:     'Today',
    yesterday: 'Yesterday',
    last3:     'Last 3 days',
    last7:     'Last 7 days',
    last30:    'Last 30 days',
    all:       'All time',
    custom:    'Custom',
}