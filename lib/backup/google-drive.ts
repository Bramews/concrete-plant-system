import { google } from "googleapis";
import fs from "fs";

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function uploadToGoogleDrive(
  filePath: string,
  fileName: string,
  mimeType: string = "application/vnd.sqlite3",
) {
  if (
    !process.env.GOOGLE_CLIENT_EMAIL ||
    !process.env.GOOGLE_PRIVATE_KEY ||
    !FOLDER_ID
  ) {
    console.warn("Google Drive credentials not found, skipping upload.");
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType,
        body: fs.createReadStream(filePath),
      },
      fields: "id, webViewLink",
    });

    return response.data;
  } catch (error) {
    console.error("Google Drive Upload Error:", error);
    return null;
  }
}
