import { useCallback, useEffect, useRef } from "react";
import type { StepMarketData } from "@/components/reports/steps/step-your-market";
import type { StepTierData } from "@/components/reports/steps/step-your-tier";
import type { StepFocusData } from "@/components/reports/steps/step-your-focus";
import type { StepAudienceData } from "@/components/reports/steps/step-your-audience";

const STORAGE_KEY = "mir-creation-flow-draft";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface FlowDraftState {
  currentStep: number;
  marketData: StepMarketData | null;
  tierData: StepTierData | null;
  focusData: StepFocusData | null;
  audienceData: StepAudienceData | null;
  savedAt: string;
}

function isExpired(savedAt: string): boolean {
  const saved = new Date(savedAt).getTime();
  return Date.now() - saved > EXPIRY_MS;
}

export function loadDraft(): FlowDraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: FlowDraftState = JSON.parse(raw);
    if (!parsed.savedAt || isExpired(parsed.savedAt)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveDraft(state: FlowDraftState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Hook that auto-saves flow state to localStorage on changes.
 * Returns the initial draft (if any) on first mount.
 */
export function useFlowPersistence(
  currentStep: number,
  marketData: StepMarketData | null,
  tierData: StepTierData | null,
  focusData: StepFocusData | null,
  audienceData: StepAudienceData | null,
) {
  const initialDraft = useRef<FlowDraftState | null | undefined>(undefined);

  // Load draft once on mount
  if (initialDraft.current === undefined) {
    initialDraft.current = loadDraft();
  }

  // Auto-save on step/data changes (skip step 5+ — review/generating)
  useEffect(() => {
    if (currentStep >= 5) return;
    saveDraft({
      currentStep,
      marketData,
      tierData,
      focusData,
      audienceData,
      savedAt: new Date().toISOString(),
    });
  }, [currentStep, marketData, tierData, focusData, audienceData]);

  const clear = useCallback(() => {
    clearDraft();
  }, []);

  return { initialDraft: initialDraft.current, clearDraft: clear };
}
