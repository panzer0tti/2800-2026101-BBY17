/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: "tw-",

  corePlugins: {
    preflight: false,
  },

  content: ["./views/**/*.ejs", "./public/js/**/*.js"],

  theme: {
    extend: {},
  },

  plugins: [],
};
