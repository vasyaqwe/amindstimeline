/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').options} */
const config = {
    plugins: ["prettier-plugin-tailwindcss"],
    trailingComma: "es5",
    tabWidth: 3,
    semi: false,
    singleAttributePerLine: true,
}

export default config
