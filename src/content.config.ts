import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    author: z.string(),
    source: z.string().url(),
    duration: z.string().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string(),
    pdf: z.string(),
  }),
});

export const collections = { notes };
