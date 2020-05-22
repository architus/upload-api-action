import fs from "fs";
import path from "path";
import got from "got";

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
}: {
  apiUrl: string;
  event: string;
  eventId: string;
  filepath: string;
  token: string;
}): Promise<void> {
  const url = `${apiUrl}/upload?event=${event}&event_id=${eventId}`;
  const filename = path.basename(filepath);
  const fileStream = fs.createReadStream(filepath);
  got.stream.post(url, {
    body: fileStream,
    retry: 0,
    headers: {
      "cache-control": "no-cache",
      "content-disposition": `attachment; filename=${filename}`,
      "content-type": "application/octet-stream",
      authorization: `Bearer ${token}`,
    },
  });
}
