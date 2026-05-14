import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: { port: 5175, strictPort: true },
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    oxc: {
        jsx: {
            runtime: 'automatic',
        },
    },
})