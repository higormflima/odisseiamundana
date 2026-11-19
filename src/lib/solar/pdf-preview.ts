import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFWorker, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function createSolarPdfPreview(dialog: HTMLDialogElement) {
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = dialog.querySelector<T>(selector);
    if (!element) throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
    return element;
  };
  const stage = get<HTMLElement>('[data-pdf-preview-stage]');
  const status = get<HTMLElement>('[data-pdf-preview-status]');
  const previous = get<HTMLButtonElement>('[data-pdf-preview-previous]');
  const next = get<HTMLButtonElement>('[data-pdf-preview-next]');
  const zoom = get<HTMLButtonElement>('[data-pdf-preview-zoom]');
  let loadingTask: PDFDocumentLoadingTask | undefined;
  let pdf: PDFDocumentProxy | undefined;
  let renderTask: RenderTask | undefined;
  let nativeWorker: Worker | undefined;
  let pdfWorker: PDFWorker | undefined;
  let workerFailure: Promise<never> | undefined;
  let revision = 0;
  let pageNumber = 1;
  let enlarged = false;
  let previousOverflow: string | undefined;

  function clearCanvas() {
    stage.querySelectorAll('canvas').forEach((canvas) => {
      canvas.width = 0;
      canvas.height = 0;
    });
    stage.replaceChildren();
  }

  function reset() {
    revision += 1;
    renderTask?.cancel();
    renderTask = undefined;
    const oldWorker = pdfWorker;
    const oldNativeWorker = nativeWorker;
    void (loadingTask?.destroy() ?? Promise.resolve()).finally(() => {
      oldWorker?.destroy();
      oldNativeWorker?.terminate();
    }).catch((error: unknown) => {
      console.error('Falha ao encerrar a visualização do PDF.', error);
    });
    loadingTask = undefined;
    pdf = undefined;
    nativeWorker = undefined;
    pdfWorker = undefined;
    workerFailure = undefined;
    clearCanvas();
    if (previousOverflow !== undefined) document.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
    if (dialog.open) dialog.close();
  }

  async function renderPage() {
    if (!pdf || !dialog.open || !workerFailure) return;
    const pdfDocument = pdf;
    const failedWorker = workerFailure;
    const currentRevision = ++revision;
    renderTask?.cancel();
    previous.disabled = true;
    next.disabled = true;
    zoom.disabled = true;
    status.textContent = `Preparando página ${pageNumber} de ${pdfDocument.numPages}…`;
    let canvas: HTMLCanvasElement | undefined;
    try {
      const page = await Promise.race([pdfDocument.getPage(pageNumber), failedWorker]);
      if (currentRevision !== revision) return;
      const original = page.getViewport({ scale: 1 });
      const width = Math.min(stage.clientWidth - 32, 760) * (enlarged ? 2 : 1);
      const viewport = page.getViewport({ scale: width / original.width });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width * pixelRatio);
      canvas.height = Math.ceil(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Página ${pageNumber} de ${pdfDocument.numPages} do PDF`);
      clearCanvas();
      renderTask = page.render({
        canvas,
        viewport,
        transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
      });
      await Promise.race([renderTask.promise, failedWorker]);
      if (currentRevision !== revision) return;
      stage.replaceChildren(canvas);
      stage.scrollTo(0, 0);
      status.textContent = `Página ${pageNumber} de ${pdfDocument.numPages}`;
    } catch (error) {
      if (currentRevision !== revision) return;
      console.error('Falha ao exibir a página do PDF.', error);
      status.textContent = 'Não foi possível exibir esta página. Tente outra página ou feche e abra a visualização novamente. O PDF continua disponível para salvar.';
    } finally {
      if (canvas && !canvas.isConnected) {
        canvas.width = 0;
        canvas.height = 0;
      }
      if (currentRevision === revision) {
        renderTask = undefined;
        previous.disabled = pageNumber <= 1;
        next.disabled = pageNumber >= pdfDocument.numPages;
        zoom.disabled = false;
      }
    }
  }

  async function open(file: File) {
    reset();
    const currentRevision = revision;
    pageNumber = 1;
    enlarged = false;
    zoom.textContent = 'Ampliar';
    zoom.setAttribute('aria-pressed', 'false');
    previous.disabled = true;
    next.disabled = true;
    zoom.disabled = true;
    status.textContent = 'Preparando a visualização do PDF neste dispositivo…';
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    try {
      const [pdfjs, data] = await Promise.all([import('pdfjs-dist'), file.arrayBuffer()]);
      if (currentRevision !== revision) return;
      const worker = new Worker(workerUrl, { type: 'module' });
      nativeWorker = worker;
      workerFailure = new Promise<never>((_resolve, reject) => {
        worker.addEventListener('error', (event) => {
          event.preventDefault();
          reject(new Error('Não foi possível carregar ou executar o worker do PDF.'));
        }, { once: true });
      });
      pdfWorker = pdfjs.PDFWorker.create({ port: nativeWorker });
      loadingTask = pdfjs.getDocument({ data, isEvalSupported: false, worker: pdfWorker });
      const pdfDocument = await Promise.race([loadingTask.promise, workerFailure]);
      if (currentRevision !== revision) return;
      pdf = pdfDocument;
      await renderPage();
    } catch (error) {
      if (currentRevision !== revision) return;
      console.error('Falha ao abrir a visualização do PDF.', error);
      status.textContent = 'Não foi possível carregar a visualização. Confira sua conexão e tente novamente. O PDF continua disponível para salvar.';
    }
  }

  get<HTMLButtonElement>('[data-pdf-preview-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (!dialog.open) reset();
  });
  previous.addEventListener('click', () => {
    pageNumber -= 1;
    void renderPage();
  });
  next.addEventListener('click', () => {
    pageNumber += 1;
    void renderPage();
  });
  zoom.addEventListener('click', () => {
    enlarged = !enlarged;
    zoom.textContent = enlarged ? 'Ajustar à tela' : 'Ampliar';
    zoom.setAttribute('aria-pressed', String(enlarged));
    void renderPage();
  });
  window.addEventListener('resize', () => {
    if (dialog.open && pdf) void renderPage();
  });

  return { open, reset };
}
