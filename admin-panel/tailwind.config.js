/** @type {import('tailwindcss').Config} */
let mainConfig = require("../tailwind.config.js"); // Adjust path as needed

module.exports = {
  ...mainConfig,
  content: [
    "./src/**/*.{html,ts,scss}",
    "../src/app/shared/**/*.{html,ts,scss}",
    "../src/app/ui-kit/**/*.{html,ts,scss}",
  ],
};
