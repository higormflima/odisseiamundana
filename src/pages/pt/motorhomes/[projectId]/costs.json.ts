import { getCollection, getEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { buildProjectCostRows } from '../../../../lib/motorhomeCosts.mjs';

export async function getStaticPaths() {
  const pages = await getCollection('motorhomeProjectPages', (entry) =>
    entry.data.status === 'published' || import.meta.env.DEV);
  return Promise.all(pages.map(async (entry) => {
    const metadata = await getEntry(entry.data.project_id);
    if (!metadata || metadata.id !== metadata.data.project_id) {
      throw new Error(`Metadados de motorhome ausentes ou divergentes: ${entry.id}`);
    }
    return {
      params: { projectId: metadata.id },
      props: { rows: buildProjectCostRows(metadata.data.cost_items ?? []) },
    };
  }));
}

export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(props.rows), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
