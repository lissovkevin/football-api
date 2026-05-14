import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: ["src/generated/**", "node_modules/**"]
  },
  {
    files: ["src/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: globals.node
    }
  },
  pluginJs.configs.recommended,
];