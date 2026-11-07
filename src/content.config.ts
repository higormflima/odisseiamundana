import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journeyPages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/journeys' }),
  schema: z.object({
    journey_id: z.string(),
    episode_id: z.string(),
    title: z.string(),
    language: z.enum(['pt', 'en']),
    status: z.enum(['draft', 'reviewed', 'published']),
    youtube_video_id: z.string().optional(),
    sort_order: z.number().int().optional(),
  }),
});

const journeyMetadata = defineCollection({
  loader: glob({
    pattern: '**/*.yaml',
    base: './metadata/journeys',
    generateId: ({ entry }) => entry.replace(/\.yaml$/i, ''),
  }),
});

export const collections = {
  journeyPages,
  journeyMetadata,
};
