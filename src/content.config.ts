import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { conceptFileSchema, deepDiveFileSchema, graphFileSchema, labFileSchema, outlineFileSchema, quizFileSchema, reviewFileSchema } from "./lib/schemas";

const outline = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/outline" }), schema: outlineFileSchema });
const concepts = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/concepts" }), schema: conceptFileSchema });
const graph = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/graph" }), schema: graphFileSchema });
const quiz = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/quiz" }), schema: quizFileSchema });
const labs = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/labs" }), schema: labFileSchema });
const deepdives = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/deepdives" }), schema: deepDiveFileSchema });
const reviews = defineCollection({ loader: glob({ pattern: "**/*.{yaml,yml}", base: "./content/reviews" }), schema: reviewFileSchema });

export const collections = { outline, concepts, graph, quiz, labs, deepdives, reviews };
