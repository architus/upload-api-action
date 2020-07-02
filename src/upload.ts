import { Readable } from "stream";
import fs from "fs";
import path from "path";
import got from "got";

export interface UploadResponse {
  path: string;
  url: string;
}

// From: https://stackoverflow.com/a/49428486/13192375
async function streamToString(incoming: Readable): Promise<string> {
  const chunks: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    incoming.on("data", (chunk) => chunks.push(chunk));
    incoming.on("error", reject);
    incoming.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

/**
 * Performs the core upload logic to send the file at the given path to the upload server
 * at `${apiUrl}/upload`
 */
export default async function upload({
  apiUrl,
  event,
  eventId,
  filepath,
  token,
  namespace = null,
}: {
  apiUrl: string;
  event: string;
  eventId: string;
  filepath: string;
  token: string;
  namespace?: string | null;
}): Promise<UploadResponse> {
  // Construct URL with query params
  let url = `${apiUrl}/upload?event=${event}&event_id=${eventId}`;
  if (namespace != null) {
    url += `&namespace=${namespace}`;
  }

  const filename = path.basename(filepath);
  const fileStream = fs.createReadStream(filepath);
  const result = await streamToString(
    got.stream.post(url, {
      body: fileStream,
      retry: 0,
      headers: {
        "cache-control": "no-cache",
        "content-disposition": `attachment; filename=${filename}`,
        "content-type": "application/octet-stream",
        authorization: `Bearer ${token}`,
        responseType: "json",
      },
    }),
  );

  return JSON.parse(result) as UploadResponse;
}
