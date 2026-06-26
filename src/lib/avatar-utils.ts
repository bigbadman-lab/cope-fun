const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OUTPUT_SIZE = 128;
const MAX_BYTES = 200 * 1024;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };

    image.src = url;
  });
}

function drawSquareCrop(
  image: HTMLImageElement,
  size: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not process this image.");
  }

  const sourceSize = Math.min(image.width, image.height);
  const sourceX = (image.width - sourceSize) / 2;
  const sourceY = (image.height - sourceSize) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
  );

  return canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Resize and compress an uploaded avatar before server upload.
 * Returns a JPEG data URL capped around 200KB.
 */
export async function resizeAvatarImage(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image is too large. Choose a file under 8MB.");
  }

  const image = await loadImageFromFile(file);
  const canvas = drawSquareCrop(image, OUTPUT_SIZE);

  let quality = 0.82;
  let dataUrl = canvasToDataUrl(canvas, quality);

  while (dataUrlByteSize(dataUrl) > MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvasToDataUrl(canvas, quality);
  }

  if (dataUrlByteSize(dataUrl) > MAX_BYTES) {
    throw new Error("Image is still too large after compression. Try a smaller photo.");
  }

  return dataUrl;
}
