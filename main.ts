import * as core from "@actions/core";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

/**
 * Checks to see if a file exists using the fs API in an async function
 * @param path - Filesystem path
 */
async function fileExists(path: string): Promise<boolean> {
  return new Promise<boolean>((r) =>
    fs.access(path, fs.constants.F_OK, (e) => r(!e)),
  );
}

/**
 * Executes the primary logic of the action
 */
async function run(): Promise<void> {
  try {
    // Get inputs from job
    const archivePath: string = core.getInput("archive-path");
    const event: string = core.getInput("event");
    const eventId: string = core.getInput("event_id");
    const apiUrl: string = core.getInput("api-url");
    const token: string = core.getInput("token");

    // Ensure the token gets masked from log output
    core.setSecret(token);

    // Make sure the archive path exists
    if (!(await fileExists(archivePath))) {
      core.setFailed(`archive-path ${archivePath} could not be found`);
      return;
    }

    core.info("Preparing request to Upload API");

    // Construct form data with archive read stream from the filesystem
    const formData = new FormData();
    const archiveStream = fs.createReadStream(archivePath);
    formData.append("file", archiveStream);

    const url = `${apiUrl}/upload`;
    await axios.post(url, formData, {
      params: {
        event,
        // eslint-disable-next-line @typescript-eslint/camelcase
        event_id: event === "commit" ? eventId.slice(0, 7) : eventId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
    });

    // Errors thrown here should be caught in the try block, so request is successful if
    // we get to this line
    core.info("Successfully uploaded archive to staging Upload API");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
