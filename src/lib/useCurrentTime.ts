import { useEffect, useState } from 'react'

// Returns the current time in milliseconds, re-rendering consumers every second.
// Use this at the top of a parent component; it forces all cards inside to
// recompute timer displays without each card needing its own interval.
export function useCurrentTime(intervalMs: number = 1000): number {
    const [now, setNow] = useState<number>(() => Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs)
        return () => clearInterval(id)
    }, [intervalMs])

    return now
}