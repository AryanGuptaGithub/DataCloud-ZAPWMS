module.exports = {
  apps: [
    {
      name: "backdatacloud",
      script: "./server.js",
      env: {
        PORT: 5006,
      },
      watch: false,
    },
  ],
};
