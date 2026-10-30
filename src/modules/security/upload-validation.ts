export function validateImageSignature(bytes: Uint8Array, mimeType: string): string | null {
  const error: string = "Use a JPG, PNG, or WebP photo.";
  if (!(bytes instanceof Uint8Array)) {
    return error;
  }
  if (bytes.length < 12) {
    return error;
  }
  if (mimeType === "image/jpeg") {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return null;
    }
    return error;
  }
  if (mimeType === "image/png") {
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return null;
    }
    return error;
  }
  if (mimeType === "image/webp") {
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return null;
    }
    return error;
  }
  return error;
}

export function validateUploadSize(sizeBytes: unknown): string | null {
  if (
    typeof sizeBytes === "number" &&
    Number.isInteger(sizeBytes) &&
    sizeBytes >= 1024 &&
    sizeBytes <= 10485760
  ) {
    return null;
  }
  return "Use a photo under 10 MB.";
}

export function validateImageDimensions(width: unknown, height: unknown): string | null {
  const error: string = "Use a clearer photo and try again.";
  if (width === undefined && height === undefined) {
    return null;
  }
  if (
    typeof width === "number" &&
    typeof height === "number" &&
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= 100 &&
    width <= 8000 &&
    height >= 100 &&
    height <= 8000
  ) {
    return null;
  }
  return error;
}
