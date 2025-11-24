/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["./packages/config/eslint/base.js"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    project: true,
  },
};

