import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import YAML from 'yaml';

const API_ROOT = 'https://www.googleapis.com/youtube/v3';
const OAUTH_ROOT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REQUIRED_SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
const MAX_VIDEOS_PER_RUN = 30;

function printHelp() {
  console.log(`Extração local de faixas de legenda do YouTube (somente leitura)

Uso:
  pnpm youtube:metadata -- --client-secrets <arquivo.json> --journey-id <id> --playlist-id <id> --write-video-metadata --metadata-only
  pnpm youtube:captions -- --client-secrets <arquivo.json> --journey-id <id> --playlist-id <id> [--exclude-video-id <id> ...] [--offset <n>]
  pnpm youtube:captions -- --client-secrets <arquivo.json> --journey-id <id> --video-id <id> [--video-id <id> ...]

Opções:
  --client-secrets       JSON de cliente OAuth Desktop baixado do Google Cloud.
  --journey-id           Identificador usado em transcripts/journeys/<id>.
  --playlist-id          Playlist pública/privada acessível, como a playlist da viagem.
  --video-id             Vídeo específico; pode ser informado várias vezes.
  --exclude-video-id     Vídeo sem narração; evita consulta e gasto de cota.
  --write-video-metadata Preenche metadados dos vídeos via YouTube Data API em metadata/videos/<journey-id>/.
  --metadata-only        Consulta somente metadados de vídeo; não consulta nem baixa legendas.
  --offset               Posição inicial da playlist depois das exclusões (padrão: 0).
  --help                 Exibe esta ajuda.

O programa não envia nem altera vídeos, legendas ou metadados no YouTube.
`);
}

function parseArgs(argv) {
  if (argv[0] === '--') argv = argv.slice(1);
  const result = { videoIds: [], excludedIds: [], offset: 0, writeVideoMetadata: false, metadataOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--help' || flag === '-h') return { help: true };
    if (flag === '--write-video-metadata') { result.writeVideoMetadata = true; continue; }
    if (flag === '--metadata-only') { result.metadataOnly = true; continue; }
    if (!flag.startsWith('--')) throw new Error(`Opção inesperada: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Informe um valor para ${flag}.`);
    index += 1;
    if (flag === '--client-secrets') result.clientSecretsPath = value;
    else if (flag === '--journey-id') result.journeyId = value;
    else if (flag === '--playlist-id') result.playlistId = value;
    else if (flag === '--video-id') result.videoIds.push(value);
    else if (flag === '--exclude-video-id') result.excludedIds.push(value);
    else if (flag === '--offset') {
      if (!/^\d+$/.test(value)) throw new Error('--offset deve ser um número inteiro maior ou igual a zero.');
      result.offset = Number(value);
    }
    else throw new Error(`Opção desconhecida: ${flag}`);
  }
  return result;
}

function validateOptions(options) {
  if (!options.clientSecretsPath) throw new Error('Informe --client-secrets.');
  if (!options.journeyId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.journeyId)) {
    throw new Error('--journey-id deve usar letras minúsculas, números e hífens.');
  }
  if (Boolean(options.playlistId) === (options.videoIds.length > 0)) {
    throw new Error('Informe exatamente uma fonte: --playlist-id ou um ou mais --video-id.');
  }
  if (options.metadataOnly && !options.writeVideoMetadata) {
    throw new Error('--metadata-only exige --write-video-metadata.');
  }
  if (options.playlistId && !/^[A-Za-z0-9_-]+$/.test(options.playlistId)) throw new Error('O ID da playlist contém caracteres inválidos.');
  for (const videoId of [...options.videoIds, ...options.excludedIds]) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error(`ID de vídeo inválido: ${videoId}`);
  }
  if (options.videoIds.length > MAX_VIDEOS_PER_RUN) {
    throw new Error(`Limite seguro: até ${MAX_VIDEOS_PER_RUN} vídeos por execução para respeitar a cota padrão.`);
  }
}

function base64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function loadOAuthClient(filePath) {
  const file = JSON.parse(await readFile(resolve(filePath), 'utf8'));
  const client = file.installed;
  if (!client?.client_id) {
    throw new Error('O JSON deve ser uma credencial OAuth do tipo Desktop app (installed).');
  }
  return client;
}

async function authorize(client) {
  const verifier = base64url(randomBytes(48));
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = base64url(randomBytes(24));

  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  const redirectUri = `http://127.0.0.1:${address.port}`;

  const authorizationUrl = new URL(OAUTH_ROOT);
  authorizationUrl.search = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: REQUIRED_SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    access_type: 'online',
  }).toString();

  console.log('\nAbra este endereço no navegador e conclua o consentimento do Google:');
  console.log(authorizationUrl.toString());
  console.log('\nO programa aguardará o retorno local nesta máquina. Não compartilhe a URL.');

  const authorizationCode = await new Promise((resolveCode, rejectCode) => {
    const timer = setTimeout(() => rejectCode(new Error('Tempo de autorização esgotado. Execute o comando novamente.')), 5 * 60 * 1000);
    server.on('request', (request, response) => {
      const callbackUrl = new URL(request.url, redirectUri);
      if (callbackUrl.pathname !== '/') {
        response.writeHead(404).end();
        return;
      }
      if (callbackUrl.searchParams.get('state') !== state) {
        response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Estado OAuth inválido.');
        clearTimeout(timer);
        rejectCode(new Error('A validação de estado do OAuth falhou.'));
        return;
      }
      const oauthError = callbackUrl.searchParams.get('error');
      const code = callbackUrl.searchParams.get('code');
      if (oauthError || !code) {
        response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Autorização cancelada ou recusada.');
        clearTimeout(timer);
        rejectCode(new Error(`O Google não concedeu autorização (${oauthError || 'sem código'}).`));
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><meta charset="utf-8"><title>Odisseia Mundana</title><p>Autorização recebida. Você pode voltar ao terminal.</p>');
      clearTimeout(timer);
      resolveCode(code);
    });
  }).finally(() => new Promise((resolveClose) => server.close(resolveClose)));

  const body = new URLSearchParams({
    client_id: client.client_id,
    code: authorizationCode,
    code_verifier: verifier,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  if (client.client_secret) body.set('client_secret', client.client_secret);
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenResult = await response.json();
  if (!response.ok || !tokenResult.access_token) {
    throw new Error(`Falha na troca OAuth (${tokenResult.error || response.status}). Não foi salvo nenhum token.`);
  }
  if (!tokenResult.scope?.split(/\s+/).includes(REQUIRED_SCOPE)) {
    throw new Error('O Google não concedeu o escopo exigido. Nenhuma chamada à YouTube Data API será feita.');
  }
  return tokenResult.access_token;
}

async function apiGet(accessToken, endpoint, params) {
  const url = new URL(`${API_ROOT}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    let apiError;
    try { apiError = await response.json(); } catch { apiError = {}; }
    const reasons = apiError.error?.errors?.map((item) => item.reason).filter(Boolean) ?? [];
    const reason = reasons.join(', ') || apiError.error?.status || response.statusText;
    if (response.status === 403 && /quota|dailyLimit/i.test(reason)) {
      throw new Error(`Cota diária do YouTube atingida (${reason}). Os arquivos já baixados foram preservados; tente novamente após a renovação da cota ou exporte os casos restantes pelo Studio.`);
    }
    if (response.status === 401) throw new Error('A autorização expirou. Execute novamente para autorizar outra sessão.');
    throw new Error(`A API do YouTube respondeu HTTP ${response.status} (${reason}).`);
  }
  return response;
}

async function listPlaylistVideos(accessToken, playlistId) {
  const videos = [];
  let pageToken;
  do {
    const response = await apiGet(accessToken, 'playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: '50',
      pageToken,
    });
    const data = await response.json();
    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (videoId) videos.push({
        videoId,
        title: item.snippet?.title ?? '',
        playlistPosition: Number.isInteger(item.snippet?.position) ? item.snippet.position + 1 : undefined,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return videos;
}

async function listVideoDetails(accessToken, videoIds) {
  const details = new Map();
  for (let index = 0; index < videoIds.length; index += 50) {
    const ids = videoIds.slice(index, index + 50);
    const response = await apiGet(accessToken, 'videos', {
      part: 'snippet,contentDetails',
      id: ids.join(','),
      maxResults: '50',
    });
    const data = await response.json();
    for (const item of data.items ?? []) details.set(item.id, item);
  }
  return details;
}

function parseIsoDurationSeconds(duration) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(duration ?? '');
  if (!match) return undefined;
  return Math.round(Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0));
}

function selectThumbnail(thumbnails = {}) {
  return thumbnails.maxres?.url
    ?? thumbnails.standard?.url
    ?? thumbnails.high?.url
    ?? thumbnails.medium?.url
    ?? thumbnails.default?.url;
}

async function writeVideoMetadata(accessToken, videos, journeyId, playlistId) {
  const detailsById = await listVideoDetails(accessToken, videos.map(({ videoId }) => videoId));
  const outputDirectory = resolve('metadata', 'videos', journeyId);
  await mkdir(outputDirectory, { recursive: true });
  let written = 0;

  for (const video of videos) {
    const details = detailsById.get(video.videoId);
    const snippet = details?.snippet ?? {};
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const generated = {
      video_id: video.videoId,
      journey_id: journeyId,
      youtube_url: videoUrl,
      playlist_id: playlistId,
      playlist_position: video.playlistPosition,
      title: snippet.title ?? video.title,
      description: snippet.description,
      thumbnail_url: selectThumbnail(snippet.thumbnails),
      duration_seconds: parseIsoDurationSeconds(details?.contentDetails?.duration),
      video_published_at: snippet.publishedAt,
    };
    const filePath = join(outputDirectory, `${video.videoId}.yaml`);
    let existing = {};
    try {
      existing = YAML.parse(await readFile(filePath, 'utf8')) ?? {};
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Preenche somente propriedades ausentes para preservar edições manuais existentes.
    const merged = {
      ...Object.fromEntries(Object.entries(generated).filter(([, value]) => value !== undefined)),
      ...existing,
    };
    for (const [key, value] of Object.entries(generated)) {
      if (value !== undefined && existing[key] === undefined) merged[key] = value;
    }
    const apiFields = Object.keys(generated).filter((key) => generated[key] !== undefined);
    const provenance = Array.isArray(merged.provenance) ? [...merged.provenance] : [];
    const apiRecord = provenance.find((item) => item.source_type === 'youtube_metadata' && item.source_id === video.videoId);
    if (apiRecord) {
      apiRecord.verification_status = 'confirmed';
      apiRecord.fields = [...new Set([...(apiRecord.fields ?? []), ...apiFields])];
    } else {
      provenance.push({
        source_type: 'youtube_metadata',
        verification_status: 'confirmed',
        source_id: video.videoId,
        fields: apiFields,
      });
    }
    merged.provenance = provenance;
    await writeFile(filePath, YAML.stringify(merged), 'utf8');
    written += 1;
  }

  console.log(`Metadados oficiais da YouTube Data API gravados/preenchidos: ${written} arquivo(s).`);
}

function isPortuguese(language) {
  return typeof language === 'string' && /^pt(?:-|$)/i.test(language);
}

function safePart(value) {
  return String(value).replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

async function hasRawSource(directory, videoId) {
  let files;
  try { files = await readdir(directory); } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  return files.some((name) => name.startsWith(`${videoId}.`) && name.includes('.raw.'));
}

async function downloadOneTrack(accessToken, track, video, outputDirectory) {
  const trackId = track.id;
  const language = safePart(track.snippet.language);
  const basename = `${video.videoId}.${language}`;
  const rawPath = join(outputDirectory, `${basename}.raw.vtt`);
  const sourcePath = join(outputDirectory, `${basename}.source.json`);

  const response = await apiGet(accessToken, `captions/${encodeURIComponent(trackId)}`, { tfmt: 'vtt' });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`A faixa de ${video.videoId} retornou conteúdo vazio.`);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(rawPath, bytes, { flag: 'wx' });
  const source = {
    video_id: video.videoId,
    video_title: video.title,
    caption_track_id: trackId,
    language: track.snippet.language,
    track_kind: track.snippet.trackKind,
    track_name: track.snippet.name,
    retrieved_at: new Date().toISOString(),
    source_url: `https://www.youtube.com/watch?v=${video.videoId}`,
    raw_sha256: createHash('sha256').update(bytes).digest('hex'),
  };
  await writeFile(sourcePath, `${JSON.stringify(source, null, 2)}\n`, { flag: 'wx' });
  return rawPath;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();
  validateOptions(options);

  const client = await loadOAuthClient(options.clientSecretsPath);
  const accessToken = await authorize(client);
  const outputDirectory = resolve('transcripts', 'journeys', options.journeyId);
  const excluded = new Set(options.excludedIds);
  let videos = options.videoIds.map((videoId) => ({ videoId, title: '' }));
  if (options.playlistId) videos = await listPlaylistVideos(accessToken, options.playlistId);
  if (options.writeVideoMetadata) {
    await writeVideoMetadata(accessToken, videos, options.journeyId, options.playlistId);
  }
  if (options.metadataOnly) return;
  videos = videos.filter(({ videoId }) => !excluded.has(videoId));
  const availableCount = videos.length;
  videos = videos.slice(options.offset, options.offset + MAX_VIDEOS_PER_RUN);

  let downloaded = 0;
  let noPortugueseTrack = 0;
  let ambiguous = 0;
  let preserved = 0;
  console.log(`\nConsultando ${videos.length} vídeo(s), a partir da posição ${options.offset} de ${availableCount} após exclusões. Vídeos excluídos por ausência de narração: ${excluded.size}.`);
  for (const video of videos) {
    if (await hasRawSource(outputDirectory, video.videoId)) {
      console.log(`PRESERVADO ${video.videoId}: já existe uma fonte bruta; nada foi sobrescrito.`);
      preserved += 1;
      continue;
    }

    const response = await apiGet(accessToken, 'captions', {
      part: 'snippet',
      videoId: video.videoId,
    });
    const data = await response.json();
    const tracks = data.items ?? [];
    const portugueseTracks = tracks.filter((track) => isPortuguese(track.snippet?.language) && track.snippet?.isDraft !== true && track.snippet?.status !== 'failed');
    if (portugueseTracks.length === 0) {
      const languages = [...new Set(tracks.map((track) => track.snippet?.language).filter(Boolean))];
      console.log(`SEM FAIXA PT ${video.videoId}: ${languages.length ? `idiomas disponíveis: ${languages.join(', ')}` : 'nenhuma faixa retornada'}.`);
      noPortugueseTrack += 1;
      continue;
    }
    if (portugueseTracks.length > 1) {
      console.log(`REVISÃO NECESSÁRIA ${video.videoId}: ${portugueseTracks.length} faixas em português; nenhuma foi escolhida automaticamente.`);
      for (const track of portugueseTracks) console.log(`  faixa=${track.id} tipo=${track.snippet.trackKind ?? 'não informado'} nome=${track.snippet.name ?? 'sem nome'}`);
      ambiguous += 1;
      continue;
    }

    const rawPath = await downloadOneTrack(accessToken, portugueseTracks[0], video, outputDirectory);
    console.log(`BAIXADO ${video.videoId}: ${rawPath}`);
    downloaded += 1;
  }

  console.log(`\nResumo: baixadas=${downloaded}; sem faixa em português=${noPortugueseTrack}; ambíguas=${ambiguous}; fontes existentes preservadas=${preserved}.`);
  console.log('As transcrições baixadas continuam pendentes de inspeção humana; nenhum conteúdo editorial foi gerado.');
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
