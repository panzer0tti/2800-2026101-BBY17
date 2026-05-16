/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: "tw-",

  corePlugins: {
    preflight: false,
  },

  content: [
    "./views/**/*.ejs",
    "./public/**/*.html",
    "./public/**/*.js",
    "./app.js",
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};
