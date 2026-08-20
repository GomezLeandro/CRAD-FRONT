// eslint.security.config.js
//
// Config de ESLint dedicada a reglas de seguridad (eslint-plugin-security),
// separada del lint general (oxlint, más rápido, corre en `npm run lint`).
// Se ejecuta con `npm run lint:security`.
//
// Por qué separado: oxlint todavía no soporta plugins de terceros como
// eslint-plugin-security, así que para cubrir ese chequeo puntual usamos
// ESLint acá, sin duplicar todo el resto de las reglas de estilo.

import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      // Los servicios arman objetos de patch dinámicamente (ver
      // trabajosService/serviciosService) a partir de claves fijas
      // conocidas en tiempo de compilación, nunca de input arbitrario
      // del usuario — es un falso positivo esperado de esta regla.
      'security/detect-object-injection': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  }
);
