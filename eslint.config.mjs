import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Contrato de reactividad (M-07): ninguna pantalla lee el store fuera de
    // useDataStore(). getDataStore() no re-renderiza a quien lo llama, así que
    // usarlo en app/ reintroduce el bug de "mutar y no se refleja" (POC-10).
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@/lib/data",
          importNames: ["getDataStore"],
          message: "Usá useDataStore() (hook reactivo) en vez de getDataStore() dentro de app/. Ver arnes/lineas/ola7/tecnico/m07_capa_reactividad.md.",
        }],
      }],
    },
  },
];

export default eslintConfig;