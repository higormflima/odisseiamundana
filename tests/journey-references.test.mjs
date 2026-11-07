import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { assertJourneyReferences } from '../src/lib/journeyReferences.mjs';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'editorial');
const knownJourneyIds = ['sample-trip'];

async function readPageReference(name) {
  const page = await readFile(path.join(fixtureRoot, name), 'utf8');
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(page);

  assert.ok(frontmatter, `Frontmatter MDX ausente no fixture ${name}`);
  const data = YAML.parse(frontmatter[1]);

  return { pageId: name, journeyId: data.journey_id };
}

test('aceita uma página MDX que referencia uma viagem existente', async () => {
  const reference = await readPageReference('valid-reference.mdx');

  assert.doesNotThrow(() => assertJourneyReferences([reference], knownJourneyIds));
});

test('rejeita uma página MDX que referencia uma viagem inexistente com mensagem clara', async () => {
  const reference = await readPageReference('missing-reference.mdx');

  assert.throws(
    () => assertJourneyReferences([reference], knownJourneyIds),
    /missing-reference\.mdx: journey-does-not-exist/,
  );
});
