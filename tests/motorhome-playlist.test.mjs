import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadMotorhomePlaylist } from '../src/lib/motorhomePlaylist.mjs';

const project = {
  playlist_order: ['BBBBBBBBBBB', 'AAAAAAAAAAA'],
  videos: [
    { video_id: 'AAAAAAAAAAA', youtube_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' },
    { video_id: 'BBBBBBBBBBB', youtube_url: 'https://www.youtube.com/watch?v=BBBBBBBBBBB' },
  ],
};

async function sourceDirectory(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'motorhome-playlist-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('mantém a ordem da playlist e usa os títulos originais sem copiar registros', async (t) => {
  const directory = await sourceDirectory(t);
  for (const [id, title] of [['AAAAAAAAAAA', 'Título com vírgula, acentos e "aspas"'], ['BBBBBBBBBBB', 'Outro título']]) {
    await writeFile(path.join(directory, `Source [${id}].info.json`), JSON.stringify({ id, title }));
  }
  const result = await loadMotorhomePlaylist(project, directory);
  assert.deepEqual(result.map((video) => video.videoId), project.playlist_order);
  assert.equal(result[1].title, 'Título com vírgula, acentos e "aspas"');
  assert.equal(result[0].url, 'https://www.youtube.com/watch?v=BBBBBBBBBBB');
  assert.deepEqual(result.map((video) => video.position), [1, 2]);
});

test('interrompe a geração quando faltar a referência ou a fonte original', async (t) => {
  const directory = await sourceDirectory(t);
  await assert.rejects(loadMotorhomePlaylist({ ...project, videos: [] }, directory), /sem referência/);
  await assert.rejects(loadMotorhomePlaylist(project, directory), /não encontrados/);
});

test('rejeita identificador divergente ou título ausente em vez de mostrar um substituto', async (t) => {
  const directory = await sourceDirectory(t);
  const single = { playlist_order: ['AAAAAAAAAAA'], videos: [project.videos[0]] };
  const filename = path.join(directory, 'Source [AAAAAAAAAAA].info.json');
  for (const data of [{ id: 'BBBBBBBBBBB', title: 'Outro vídeo' }, { id: 'AAAAAAAAAAA' }]) {
    await writeFile(filename, JSON.stringify(data));
    await assert.rejects(loadMotorhomePlaylist(single, directory), /Identificador ou título inválido/);
  }
});

test('carrega vídeos sem playlist na ordem das referências e aceita arquivo pelo ID', async (t) => {
  const directory = await sourceDirectory(t);
  await writeFile(path.join(directory, 'AAAAAAAAAAA.info.json'), JSON.stringify({ id: 'AAAAAAAAAAA', title: 'Apresentação' }));
  const result = await loadMotorhomePlaylist({ videos: [project.videos[0]] }, directory);
  assert.deepEqual(result, [{
    videoId: 'AAAAAAAAAAA', title: 'Apresentação',
    url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA', position: 1,
  }]);
});
