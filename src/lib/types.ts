import type { REVIEW_STATUS } from "../consts";

export type ModuleId = "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8";
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
export type Confidence = "confirmed" | "pedagogical" | "doubtful";
export type ConceptType = "concept" | "material" | "work" | "person" | "event" | "method";
export type LabEngine = "reasoning" | "classify" | "sequence" | "simulate" | "annotate" | "assemble";

export interface MinimalKnowledgeUnit {
  id: string;
  chapter: number;
  chapter_title: string;
  section: string;
  subsection?: string;
  module: ModuleId;
  page_start: number;
  page_end?: number;
  status: ReviewStatus;
  concept_ids: string[];
  quiz_ids: string[];
  lab_ids: string[];
}

export interface ConceptRecord {
  id: string;
  label: string;
  type: ConceptType;
  definition: string;
  chapter_ids: string[];
  status: ReviewStatus;
}

export interface GraphEdgeRecord {
  id: string;
  source: string;
  target: string;
  type: string;
  evidence: string;
  confidence: Confidence;
}
