// Faraid Calculation Engine — Islamic Inheritance Distribution
import type { Database } from "@/integrations/supabase/types";

type HeirRelationship = Database["public"]["Enums"]["heir_relationship"];

export interface HeirInput {
  id: string;
  name: string;
  relationship: HeirRelationship;
}

export interface HeirResult {
  id: string;
  name: string;
  relationship: HeirRelationship;
  fixedShare: string;
  shareFraction: number;
  shareAmount: number;
  sharePercentage: number;
  isBlocked: boolean;
  blockedBy: string;
  isResiduary: boolean;
}

interface HeirCounts {
  sons: number; daughters: number; father: number; mother: number;
  husband: number; wife: number;
  fullBrothers: number; fullSisters: number;
  paternalBrothers: number; paternalSisters: number;
  maternalBrothers: number; maternalSisters: number;
  grandfather: number; grandmother: number;
  grandsons: number; granddaughters: number;
}

function countHeirs(heirs: HeirInput[]): HeirCounts {
  const c: HeirCounts = {
    sons: 0, daughters: 0, father: 0, mother: 0, husband: 0, wife: 0,
    fullBrothers: 0, fullSisters: 0, paternalBrothers: 0, paternalSisters: 0,
    maternalBrothers: 0, maternalSisters: 0, grandfather: 0, grandmother: 0,
    grandsons: 0, granddaughters: 0,
  };
  for (const h of heirs) {
    const map: Record<HeirRelationship, keyof HeirCounts> = {
      son: "sons", daughter: "daughters", father: "father", mother: "mother",
      husband: "husband", wife: "wife", full_brother: "fullBrothers", full_sister: "fullSisters",
      paternal_brother: "paternalBrothers", paternal_sister: "paternalSisters",
      maternal_brother: "maternalBrothers", maternal_sister: "maternalSisters",
      grandfather: "grandfather", grandmother: "grandmother",
      grandson: "grandsons", granddaughter: "granddaughters",
    };
    c[map[h.relationship]]++;
  }
  return c;
}

function getBlockingReason(rel: HeirRelationship, c: HeirCounts): string {
  const hasChildren = c.sons > 0 || c.daughters > 0;
  const hasSons = c.sons > 0;
  const hasFather = c.father > 0;
  const hasFullBrothers = c.fullBrothers > 0;
  const hasFullSisters = c.fullSisters > 0;

  switch (rel) {
    case "grandson": if (hasSons) return "Blocked by son"; break;
    case "granddaughter": if (hasSons) return "Blocked by son"; break;
    case "full_brother": if (hasSons || c.grandsons > 0 || hasFather) return hasFather ? "Blocked by father" : "Blocked by son/grandson"; break;
    case "full_sister": if (hasSons || c.grandsons > 0 || hasFather) return hasFather ? "Blocked by father" : "Blocked by son/grandson"; break;
    case "paternal_brother":
      if (hasSons || c.grandsons > 0 || hasFather) return hasFather ? "Blocked by father" : "Blocked by son/grandson";
      if (hasFullBrothers) return "Blocked by full brother";
      break;
    case "paternal_sister":
      if (hasSons || c.grandsons > 0 || hasFather) return hasFather ? "Blocked by father" : "Blocked by son/grandson";
      if (hasFullBrothers) return "Blocked by full brother";
      if (hasFullSisters && c.fullSisters >= 2) return "Blocked by two+ full sisters";
      break;
    case "maternal_brother": if (hasChildren || hasFather || c.grandfather > 0) return hasFather ? "Blocked by father" : "Blocked by children/grandfather"; break;
    case "maternal_sister": if (hasChildren || hasFather || c.grandfather > 0) return hasFather ? "Blocked by father" : "Blocked by children/grandfather"; break;
    case "grandfather": if (hasFather) return "Blocked by father"; break;
  }
  return "";
}

function getFixedShare(rel: HeirRelationship, c: HeirCounts): { share: string; fraction: number; isResiduary: boolean } {
  const hasChildren = c.sons > 0 || c.daughters > 0;
  const hasMaleDescendant = c.sons > 0 || c.grandsons > 0;

  switch (rel) {
    case "husband":
      return hasChildren ? { share: "1/4", fraction: 1/4, isResiduary: false } : { share: "1/2", fraction: 1/2, isResiduary: false };
    case "wife":
      return hasChildren ? { share: "1/8", fraction: 1/8, isResiduary: false } : { share: "1/4", fraction: 1/4, isResiduary: false };
    case "father":
      if (hasMaleDescendant) return { share: "1/6", fraction: 1/6, isResiduary: false };
      if (c.daughters > 0 || c.granddaughters > 0) return { share: "1/6 + residuary", fraction: 1/6, isResiduary: true };
      return { share: "Residuary", fraction: 0, isResiduary: true };
    case "mother":
      if (hasChildren || (c.fullBrothers + c.fullSisters + c.paternalBrothers + c.paternalSisters + c.maternalBrothers + c.maternalSisters) >= 2)
        return { share: "1/6", fraction: 1/6, isResiduary: false };
      return { share: "1/3", fraction: 1/3, isResiduary: false };
    case "daughter":
      if (c.sons > 0) return { share: "Residuary (with son)", fraction: 0, isResiduary: true };
      if (c.daughters === 1) return { share: "1/2", fraction: 1/2, isResiduary: false };
      return { share: "2/3 (shared)", fraction: 2/3, isResiduary: false };
    case "son":
      return { share: "Residuary", fraction: 0, isResiduary: true };
    case "grandson":
      return { share: "Residuary", fraction: 0, isResiduary: true };
    case "granddaughter":
      if (c.grandsons > 0) return { share: "Residuary (with grandson)", fraction: 0, isResiduary: true };
      if (c.daughters >= 2) return { share: "Blocked/none", fraction: 0, isResiduary: false };
      if (c.daughters === 1) return { share: "1/6", fraction: 1/6, isResiduary: false };
      if (c.granddaughters === 1) return { share: "1/2", fraction: 1/2, isResiduary: false };
      return { share: "2/3 (shared)", fraction: 2/3, isResiduary: false };
    case "full_sister":
      if (c.fullBrothers > 0) return { share: "Residuary (with brother)", fraction: 0, isResiduary: true };
      if (c.fullSisters === 1) return { share: "1/2", fraction: 1/2, isResiduary: false };
      return { share: "2/3 (shared)", fraction: 2/3, isResiduary: false };
    case "full_brother":
      return { share: "Residuary", fraction: 0, isResiduary: true };
    case "paternal_sister":
      if (c.paternalBrothers > 0) return { share: "Residuary (with brother)", fraction: 0, isResiduary: true };
      if (c.fullSisters >= 2) return { share: "None", fraction: 0, isResiduary: false };
      if (c.fullSisters === 1) return { share: "1/6", fraction: 1/6, isResiduary: false };
      if (c.paternalSisters === 1) return { share: "1/2", fraction: 1/2, isResiduary: false };
      return { share: "2/3 (shared)", fraction: 2/3, isResiduary: false };
    case "paternal_brother":
      return { share: "Residuary", fraction: 0, isResiduary: true };
    case "maternal_brother":
    case "maternal_sister":
      if (c.maternalBrothers + c.maternalSisters === 1) return { share: "1/6", fraction: 1/6, isResiduary: false };
      return { share: "1/3 (shared)", fraction: 1/3, isResiduary: false };
    case "grandfather":
      if (hasMaleDescendant) return { share: "1/6", fraction: 1/6, isResiduary: false };
      return { share: "Residuary", fraction: 0, isResiduary: true };
    case "grandmother":
      return { share: "1/6", fraction: 1/6, isResiduary: false };
  }
}

export function calculateFaraid(heirs: HeirInput[], totalEstate: number): { results: HeirResult[]; awlApplied: boolean; raddApplied: boolean } {
  if (heirs.length === 0 || totalEstate <= 0) return { results: [], awlApplied: false, raddApplied: false };

  const c = countHeirs(heirs);
  const results: HeirResult[] = [];

  // Step 1: Apply blocking and assign shares
  for (const h of heirs) {
    const blockReason = getBlockingReason(h.relationship, c);
    if (blockReason) {
      results.push({ id: h.id, name: h.name, relationship: h.relationship, fixedShare: "Blocked", shareFraction: 0, shareAmount: 0, sharePercentage: 0, isBlocked: true, blockedBy: blockReason, isResiduary: false });
      continue;
    }
    const { share, fraction, isResiduary } = getFixedShare(h.relationship, c);
    results.push({ id: h.id, name: h.name, relationship: h.relationship, fixedShare: share, shareFraction: fraction, shareAmount: 0, sharePercentage: 0, isBlocked: false, blockedBy: "", isResiduary });
  }

  // Step 2: Calculate fixed share totals (for shared shares, divide among count)
  const activeHeirs = results.filter((r) => !r.isBlocked);
  let totalFixedFraction = 0;

  // Group shared shares
  const sharedGroups: Record<string, HeirResult[]> = {};
  for (const h of activeHeirs) {
    if (!h.isResiduary && h.shareFraction > 0) {
      const key = `${h.relationship}_${h.shareFraction}`;
      if (!sharedGroups[key]) sharedGroups[key] = [];
      sharedGroups[key].push(h);
    }
  }

  // Assign fractions (shared shares are already the total for the group)
  for (const key of Object.keys(sharedGroups)) {
    const group = sharedGroups[key];
    const totalFrac = group[0].shareFraction;
    const perHeir = totalFrac / group.length;
    for (const h of group) {
      h.shareFraction = perHeir;
    }
    totalFixedFraction += totalFrac;
  }

  // Step 3: Residuary
  const residuaryHeirs = activeHeirs.filter((r) => r.isResiduary);
  let remainder = 1 - totalFixedFraction;

  if (residuaryHeirs.length > 0 && remainder > 0) {
    // Sons get 2x daughters, etc.
    let totalShares = 0;
    for (const rh of residuaryHeirs) {
      const isMale = ["son", "grandson", "full_brother", "paternal_brother", "father", "grandfather"].includes(rh.relationship);
      totalShares += isMale ? 2 : 1;
    }
    for (const rh of residuaryHeirs) {
      const isMale = ["son", "grandson", "full_brother", "paternal_brother", "father", "grandfather"].includes(rh.relationship);
      const share = (isMale ? 2 : 1) / totalShares;
      rh.shareFraction = remainder * share;
    }
  }

  // Step 4: Check for ʿAwl or Radd
  let awlApplied = false;
  let raddApplied = false;
  const totalFractions = activeHeirs.reduce((sum, h) => sum + h.shareFraction, 0);

  if (totalFractions > 1 && residuaryHeirs.length === 0) {
    // ʿAwl: proportionally reduce
    awlApplied = true;
    for (const h of activeHeirs) {
      h.shareFraction = h.shareFraction / totalFractions;
    }
  } else if (totalFractions < 1 && residuaryHeirs.length === 0) {
    // Radd: redistribute surplus (excluding husband/wife)
    raddApplied = true;
    const raddEligible = activeHeirs.filter((h) => h.relationship !== "husband" && h.relationship !== "wife");
    const spouseShare = activeHeirs.filter((h) => h.relationship === "husband" || h.relationship === "wife").reduce((s, h) => s + h.shareFraction, 0);
    const surplus = 1 - totalFractions;
    const raddTotal = raddEligible.reduce((s, h) => s + h.shareFraction, 0);
    if (raddTotal > 0) {
      for (const h of raddEligible) {
        h.shareFraction += surplus * (h.shareFraction / raddTotal);
      }
    }
  }

  // Step 5: Calculate amounts
  for (const h of results) {
    h.shareAmount = Math.round(h.shareFraction * totalEstate * 100) / 100;
    h.sharePercentage = Math.round(h.shareFraction * 10000) / 100;
  }

  return { results, awlApplied, raddApplied };
}
