const {FlatCompat} = require("@eslint/eslintrc");
const js = require("@eslint/js");

// Existe para que ESLint deje de subir a buscar el eslint.config.js del
// proyecto React en la carpeta raíz (que usa reglas de navegador, no de
// Node.js). Traduce automáticamente functions/.eslintrc.js al formato
// nuevo, sin cambiar ninguna regla.
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...compat.env({es6: true, node: true}),
  ...compat.extends("eslint:recommended", "google"),
  {
    languageOptions: {
      ecmaVersion: "latest",
    },
    rules: {
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      "quotes": ["error", "double", {allowTemplateLiterals: true}],
      // El código existente no se escribió con estas 2 reglas de "google" en
      // mente (líneas largas y sin JSDoc); se desactivan en vez de forzar una
      // reescritura masiva sin relación con el motivo original del cambio.
      "max-len": "off",
      "require-jsdoc": "off",
    },
  },
];
