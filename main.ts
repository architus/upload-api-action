import * as core from "@actions/core";
import fs from "fs";
import axios, { AxiosError } from "axios";
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

const PR_NUMBER_REGEX = /refs\/pull\/([0-9]+)\/merge/;

/**
 * Attempts to extract the PR number from the github ref
 * @param ref - GitHub ref from the environment variable `GITHUB_REF`
 */
function extractPrNumber(ref: string): string {
  const matchObject = ref.match(PR_NUMBER_REGEX);
  if (matchObject != null) {
    return matchObject[1];
  }

  throw new Error(`No PR match on ref ${ref}`);
}

/**
 * Gets the event ID from the event input and the ref/sha values
 * @param event - underlying event name from the job
 * @param ref - value of `GITHUB_REF` env variable
 * @param sha - long commit SHA, value of `GITHUB_SHA` env variable
 */
function getEventId(event: string, ref: string, sha: string): string {
  if (event === "pull_request") return extractPrNumber(ref);
  return sha.slice(0, 7);
}

/**
 * Executes the primary logic of the action
 */
async function run(): Promise<void> {
  try {
    // Get inputs from job
    const archivePath: string = core.getInput("archive-path");
    const event: string = core.getInput("event");
    const apiUrl: string = core.getInput("api-root");
    const token: string = core.getInput("token");

    // Extract the eventId from the environment
    const ref = process.env.GITHUB_REF;
    const sha = process.env.GITHUB_SHA;
    const eventId = getEventId(event, ref ?? "", sha ?? "");

    // Ensure the token gets masked from log output
    core.setSecret(token);

    // Make sure the archive path exists
    if (!(await fileExists(archivePath))) {
      core.setFailed(`archive-path ${archivePath} could not be found`);
      return;
    }

    const resolvedEvent = event === "pull_request" ? "pr" : "commit";
    core.info(`Preparing request to Upload API at ${resolvedEvent}/${eventId}`);

    // Construct form data with archive read stream from the filesystem
    const formData = new FormData();
    const archiveStream = fs.createReadStream(archivePath);
    formData.append("file", archiveStream);

    const url = `${apiUrl}/upload`;
    await axios.post(url, formData, {
      params: {
        event: resolvedEvent,
        // eslint-disable-next-line @typescript-eslint/camelcase
        event_id: eventId,
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
    if (error.response != null) {
      const axiosError = error as AxiosError;
      core.debug(JSON.stringify(axiosError.response));
      core.setFailed(`${axiosError.message}: ${axiosError.response?.data}`);
    } else {
      core.debug(JSON.stringify(error));
      core.setFailed(error.message);
    }
  }
}

run();
