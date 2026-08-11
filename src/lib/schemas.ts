import { z } from "zod";

export const reviewStatusSchema = z.enum(["not_started", "drafting", "pending_review", "reviewed", "verified"]);
export const moduleIdSchema = z.enum(["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"]);

export const mkuSchema = z.object({
  id: z.string().regex(/^mku-\d{2}-\d{2}-\d{2}$/), chapter: z.number().int().min(1).max(14),
  chapter_title: z.string().min(1), section: z.string().min(1), subsection: z.string().optional(), module: moduleIdSchema,
  page_start: z.number().int().positive(), page_end: z.number().int().positive().optional(), status: reviewStatusSchema,
  key_question: z.string().min(1), summary: z.string().min(1), boundary: z.string().min(1),
  concept_ids: z.array(z.string()), quiz_ids: z.array(z.string()), lab_ids: z.array(z.string()),
});

export const conceptSchema = z.object({
  id: z.string().regex(/^(c|m|w|p|ev|me)_[a-z0-9_]+$/), label: z.string().min(1),
  type: z.enum(["concept", "material", "work", "person", "event", "method"]), definition: z.string().min(1),
  chapter_ids: z.array(z.string()), status: reviewStatusSchema,
});

export const graphEdgeSchema = z.object({
  id: z.string().regex(/^e-\d{4}$/), source: z.string().min(1), target: z.string().min(1), type: z.string().min(1),
  evidence: z.string().min(1), confidence: z.enum(["confirmed", "pedagogical", "doubtful"]),
});

const quizBase = z.object({
  id: z.string().regex(/^q-ch\d{2}-\d{3}$/), chapter: z.number().int().min(1).max(14), concept_ids: z.array(z.string()).min(1),
  prompt: z.string().min(1), explanation: z.string().min(1),
});
export const quizSchema = z.discriminatedUnion("type", [
  quizBase.extend({ type: z.literal("single_choice"), options: z.array(z.string()).min(2), answer: z.number().int().nonnegative() }),
  quizBase.extend({ type: z.literal("multiple_choice"), options: z.array(z.string()).min(2), answers: z.array(z.number().int().nonnegative()).min(1) }),
  quizBase.extend({ type: z.literal("true_false"), answer: z.boolean() }),
  quizBase.extend({ type: z.literal("fill_blank"), answers: z.array(z.string()).min(1) }),
  quizBase.extend({ type: z.literal("matching"), pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2) }),
  quizBase.extend({ type: z.literal("ordering"), items: z.array(z.string()).min(2), answer: z.array(z.number().int().nonnegative()) }),
  quizBase.extend({ type: z.literal("classification"), zones: z.array(z.string()).min(2), items: z.array(z.object({ label: z.string(), zone: z.string() })).min(2) }),
  quizBase.extend({ type: z.literal("evidence"), evidence_ids: z.array(z.string()).min(1), answer_ids: z.array(z.string()).min(1) }),
  quizBase.extend({ type: z.literal("short_answer"), rubric: z.array(z.string()).min(1) }),
]);

const labBase = z.object({ id: z.string().regex(/^lab-\d{2}-case-\d{3}$/), title: z.string().min(1), concept_ids: z.array(z.string()).min(1) });
export const labSchema = z.discriminatedUnion("engine", [
  labBase.extend({ engine: z.literal("reasoning"), config: z.object({ stages: z.array(z.unknown()).min(1), scoring: z.record(z.string(), z.number()) }) }),
  labBase.extend({ engine: z.literal("classify"), config: z.object({ zones: z.array(z.unknown()).min(2), items: z.array(z.unknown()).min(1) }) }),
  labBase.extend({ engine: z.literal("sequence"), config: z.object({ items: z.array(z.unknown()).min(2), correct_order: z.array(z.string()).min(2) }) }),
  labBase.extend({ engine: z.literal("simulate"), config: z.object({ params: z.array(z.unknown()).min(1), model_table: z.record(z.string(), z.unknown()) }) }),
  labBase.extend({ engine: z.literal("annotate"), config: z.object({ passage: z.string().min(1), hotspots: z.array(z.unknown()).min(1) }) }),
  labBase.extend({ engine: z.literal("assemble"), config: z.object({ pieces: z.array(z.unknown()).min(2), solution: z.array(z.string()).min(2) }) }),
]);

export const deepDiveSchema = z.object({
  id: z.string().regex(/^deep-ch\d{2}-\d{3}$/),
  chapter: z.number().int().min(1).max(14),
  title: z.string().min(1),
  scenario: z.string().min(1),
  question: z.string().min(1),
  concept_ids: z.array(z.string()).min(2),
  evidence: z.array(z.object({
    id: z.string().min(1), label: z.string().min(1), role: z.string().min(1), limitation: z.string().min(1),
  })).min(3),
  workflow: z.array(z.string().min(1)).min(3),
  deliverable: z.string().min(1),
  rubric: z.array(z.string().min(1)).min(3),
  status: reviewStatusSchema,
});

export const outlineFileSchema = z.object({ items: z.array(mkuSchema) });
export const conceptFileSchema = z.object({ items: z.array(conceptSchema) });
export const graphFileSchema = z.object({ items: z.array(graphEdgeSchema) });
export const quizFileSchema = z.object({ items: z.array(quizSchema) });
export const labFileSchema = z.object({ items: z.array(labSchema) });
export const deepDiveFileSchema = z.object({ items: z.array(deepDiveSchema) });
