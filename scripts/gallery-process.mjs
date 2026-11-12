import { processPhoto } from './gallery-lib.mjs';

const args = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index += 1) {
  const key = args[index];
  if (!['--collection', '--file', '--id', '--new'].includes(key) || key in options) {
    throw new Error(`Opção inválida ou repetida: ${key}`);
  }
  if (key === '--new') {
    options[key] = true;
  } else {
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Informe um valor para ${key}.`);
    options[key] = value;
  }
}
if (!options['--collection'] || !options['--file']) {
  throw new Error('Uso: pnpm gallery:process --collection ID --file CAMINHO --new | --id ID-DA-FOTO');
}
const result = await processPhoto({
  collectionId: options['--collection'],
  file: options['--file'],
  newPhoto: options['--new'] === true,
  photoId: options['--id'],
});
console.log(result.unchanged
  ? `Imagem já registrada como ${result.id}; nenhum arquivo alterado.`
  : `Foto ${result.id}: ${result.variants} variantes geradas, ${result.bytes} bytes.`);
