const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadError("Ukuran file terlalu besar. Maksimal 5MB.");
  }
}

export async function uploadToCloudinary(
  file: File,
  folder = "couple-budget"
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new UploadError("Konfigurasi Cloudinary tidak lengkap.");
  }

  validateFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new UploadError(body?.error?.message ?? "Upload gagal. Coba lagi.");
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ─── DELETE (server-side only) ────────────────────────────────────────────────

export function extractPublicId(url: string): string {
  // https://res.cloudinary.com/<cloud>/image/upload/v1234567890/folder/filename.jpg
  // → folder/filename
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
  if (!match) throw new Error("URL Cloudinary tidak valid");
  return match[1];
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Konfigurasi Cloudinary server tidak lengkap.");
  }

  const publicId  = extractPublicId(imageUrl);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Generate SHA-1 signature
  const { createHash } = await import("crypto");
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("public_id",  publicId);
  formData.append("timestamp",  timestamp);
  formData.append("api_key",    apiKey);
  formData.append("signature",  signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Gagal menghapus dari Cloudinary.");
  }
}