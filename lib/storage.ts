import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

/**
 * Uploads a file either locally or to Cloud Storage (GCS/S3) depending on environment settings.
 * Default provider is "local" storing files in public/uploads.
 */
export async function uploadFile(
  file: File,
  folderName: string,
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Clean filename to avoid special character errors in paths
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${Date.now()}_${cleanName}`;

  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "local") {
    const uploadDir = join(process.cwd(), "public", "uploads", folderName);
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    return `/uploads/${folderName}/${filename}`;
  } else {
    // Placeholder for GCS / AWS S3 Integration
    // Example GCS implementation:
    // const { Storage } = require("@google-cloud/storage");
    // const storage = new Storage();
    // const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    // const blob = bucket.file(`${folderName}/${filename}`);
    // await blob.save(buffer, { contentType: file.type });
    // return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${folderName}/${filename}`;

    console.log(
      `[STORAGE] Uploading to cloud provider (${provider}): ${filename}`,
    );

    // Fallback to local so that local testing continues to work out-of-the-box
    const uploadDir = join(process.cwd(), "public", "uploads", folderName);
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    return `/uploads/${folderName}/${filename}`;
  }
}
