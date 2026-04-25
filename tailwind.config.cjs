/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: "#1D9E75",
                    dark:    "#0F6E56",
                    light:   "#5DCAA5",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
}