module.exports = {
  prefix: "tw-", // Add a prefix to all Tailwind classes
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts
  },
  content: ["./src/**/*.{html,js}"], // Adjust paths as needed
};
