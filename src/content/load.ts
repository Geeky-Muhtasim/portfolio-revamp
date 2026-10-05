import { readFileSync } from "node:fs";
import path from "node:path";
import { parsePortfolio } from "./parse";
import type { Portfolio } from "./schema";

export const PORTFOLIO_PATH = path.join(process.cwd(), "content", "portfolio.md");

let cached: Portfolio | undefined;

/** Reads and validates portfolio.md once per build. Throws (and fails the build) on invalid content. */
export function getPortfolio(): Portfolio {
  cached ??= parsePortfolio(readFileSync(PORTFOLIO_PATH, "utf8"));
  return cached;
}
