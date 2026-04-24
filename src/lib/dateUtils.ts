// ─────────────────────────────────────────────────────────────
// DATE UTILS — centralized so format stays consistent everywhere
// ─────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "23 Apr 2026 · 14:02"
export function formatDateTime(iso: string): string {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'

    const day   = d.getDate()
    const mon   = MONTHS[d.getMonth()]
    const year  = d.getFullYear()
    const hh    = String(d.getHours()).padStart(2, '0')
    const mm    = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${mon} ${year} · ${hh}:${mm}`
}

// "14:02" — time only
export function formatTime(iso: string): string {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
}

// Phone pretty-printing: +998901234567 -> "+998 90 123 45 67"
export function formatPhone(raw?: string): string {
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 12 || !digits.startsWith('998')) return raw
    const cc    = digits.slice(0, 3)
    const op    = digits.slice(3, 5)
    const p1    = digits.slice(5, 8)
    const p2    = digits.slice(8, 10)
    const p3    = digits.slice(10, 12)
    return `+${cc} ${op} ${p1} ${p2} ${p3}`
}

// Elapsed between two ISO dates, rendered like:
//   "+2 min", "+45 min", "+3 h 15 min", "+1 d 4 h"
export function formatElapsed(fromIso: string, toIso: string): string {
    const from = new Date(fromIso).getTime()
    const to   = new Date(toIso).getTime()
    if (isNaN(from) || isNaN(to) || to < from) return ''

    const totalSec = Math.floor((to - from) / 1000)
    const days     = Math.floor(totalSec / 86400)
    const hours    = Math.floor((totalSec % 86400) / 3600)
    const minutes  = Math.floor((totalSec % 3600) / 60)

    if (days > 0)       return `+${days} d${hours > 0 ? ` ${hours} h` : ''}`
    if (hours > 0)      return `+${hours} h${minutes > 0 ? ` ${minutes} min` : ''}`
    if (minutes > 0)    return `+${minutes} min`
    return '+<1 min'
}

// Total elapsed, spoken aloud — for the "18 min total" / "2 h 15 min total" badge
export function formatTotalElapsed(fromIso: string, toIso: string): string {
    const raw = formatElapsed(fromIso, toIso)
    if (!raw) return ''
    return raw.replace(/^\+/, '') + ' total'
}