const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  // An object with only `ignores` is a global ignore in flat config.
  { ignores: ["dist/*", ".expo/*"] },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",

      "import/no-unresolved": "off",
      "import/namespace": "off",
      "import/no-duplicates": "off",
    },
  },
]);
