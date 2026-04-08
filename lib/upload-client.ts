import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

export async function handleImageUpload(file?: File | null) {
  if (!file || file.size === 0) return undefined;

  return await uploadToCloudinary(file, "bucket-list");
}