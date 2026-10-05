import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { crew } from "@/config/site";
import { aegis, crewCredits, roadStations, scoringModel, shortOrg, skillAliases, telemetrySources, trainingLog, venueShort } from "./derive";
import { parsePortfolio } from "./parse";

const p = parsePortfolio(readFileSync("content/portfolio.md", "utf8"));

describe("derived views of portfolio.md", () => {
  it("shortens venues to their parenthesised name", () => {
    expect(p.publications.map((x) => venueShort(x.venue))).toEqual([
      "IJCNLP-AACL 2025",
      "CHI EA 2025",
      "BEA 2025",
      "BLP-2025",
      "ICCSCE",
      "Independent University, Bangladesh",
    ]);
  });

  it("reads AEGIS's four telemetry sources and its scoring model from the highlights", () => {
    const a = aegis(p)!;
    expect(telemetrySources(a)).toHaveLength(4);
    const model = scoringModel(a)!;
    expect(model.factors).toEqual(["activity diversity", "source diversity", "severity", "burst compression"]);
    expect(model.damping).toBe("high-volume noise");
    expect(model.range).toBe("0-100");
  });

  it("puts every education and experience entry on the road, in date order", () => {
    const stations = roadStations(p);
    expect(stations).toHaveLength(p.education.length + p.experience.length);
    expect(stations[0]!.name).toBe("IUB");
    expect(stations.map((s) => s.start)).toEqual([...stations.map((s) => s.start)].sort((a, b) => a - b));
    expect(shortOrg("Center for Computational & Data Sciences (CCDS), IUB")).toBe("CCDS, IUB");
  });

  it("credits crew only with roles and work found in the file", () => {
    const credits = crewCredits(p, crew);
    expect(credits.find((c) => c.name === "Dr. Amin Ahsan Ali")!.role).toBe("Supervisor");
    for (const c of credits) {
      expect(c.role, c.name).not.toBe("");
      expect(c.shared.length, c.name).toBeGreaterThan(0);
    }
    expect(credits.find((c) => c.name === "Md Fahim")!.shared).toContain("SOMAJGYAAN (IJCNLP-AACL 2025)");
  });

  it("ties skills to where they were used, by name only", () => {
    expect(skillAliases("JWT/RBAC")).toEqual(expect.arrayContaining(["jwt", "rbac"]));
    expect(skillAliases("firewall log analysis (FortiGate, Palo Alto)")).toEqual(expect.arrayContaining(["fortigate", "palo alto"]));
    const log = trainingLog(p);
    expect(log).toHaveLength(p.skills.reduce((n, g) => n + g.items.length, 0));
    const find = (skill: string) => log.find((e) => e.skill === skill)!;
    expect(find("Wazuh").blade).toBe("security");
    expect(find("PyTorch").blade).toBe("research");
    expect(find("FastAPI").blade).toBe("engineering");
    expect(find("Wazuh").usedIn).toContain("AEGIS");
    expect(find("firewall log analysis (FortiGate, Palo Alto)").usedIn).toContain("AEGIS");
    // "Git" must not match "GitHub", nor "Go" match "Google".
    expect(find("Git").usedIn).toEqual([]);
  });
});
