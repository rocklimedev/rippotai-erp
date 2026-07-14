import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["node_modules", "dist", "build", ".vite"],
  },

  js.configs.recommended,

  // Config files (Vite, Tailwind, PostCSS)
  {
    files: [
      "tailwind.config.js",
      "postcss.config.js",
      "vite.config.js",
      "**/*.config.js",
    ],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },

  // React files
  {
    files: ["src/**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      /**
       * React
       */
      "react/react-in-jsx-scope": "off",

      /**
       * React Hooks
       *
       * Disabled because react-hooks v7
       * enables React Compiler rules.
       */
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",

      /**
       * React Fast Refresh
       */
      "react-refresh/only-export-components": "off",

      /**
       * Existing project cleanup
       */
      "no-unused-vars": "off",

      /**
       * Imports
       */
      "import/order": "off",

      /**
       * Development
       */
      "no-console": "off",

      /**
       * Temporarily disabled because
       * Vite env uses import.meta
       */
      "no-undef": "off",
    },
  },
];
