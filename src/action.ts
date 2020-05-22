import fs from "fs";
import * as core from "@actions/core";
import jsonStringify from "safe-json-stringify";
import upload from "./upload";

/**
 * Checks to see if a file exists using the fs API in an async function
 * @param path - Filesystem path
 */
async function fileExists(filePath: string): Promise<boolean> {
  return new Promise<boolean>((r) =>
    fs.access(filePath, fs.constants.F_OK, (e) => r(!e)),
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
    const apiUrl: string = core.getInput("api-root");
    const token: string = core.getInput("token");

    // Extract the eventId from the environment
    const event = process.env.GITHUB_EVENT_NAME ?? "";
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
    await upload({
      apiUrl,
      event: resolvedEvent,
      eventId,
      token,
      filepath: archivePath,
    });

    // Errors thrown here should be caught in the try block, so request is successful if
    // we get to this line
    core.info("Successfully uploaded archive to staging Upload API");
  } catch (error) {
    core.debug(jsonStringify(error));
    core.setFailed(error.message);
  }
}

run();
