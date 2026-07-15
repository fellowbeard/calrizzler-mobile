const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      "react-hooks/set-state-in-effect": "off",

      "import/no-unresolved": "off",
      "import/namespace": "off",
      "import/no-duplicates": "off",
    },
  },
]);
