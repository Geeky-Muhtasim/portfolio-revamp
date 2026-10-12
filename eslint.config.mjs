import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "out/**", "node_modules/**", ".venv/**", "promo/**", "next-env.d.ts", "src/motion/brush/generated/**"] },
];

export default config;
