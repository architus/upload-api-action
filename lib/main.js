"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const request_1 = __importDefault(require("request"));
const safe_json_stringify_1 = __importDefault(require("safe-json-stringify"));
/**
 * Checks to see if a file exists using the fs API in an async function
 * @param path - Filesystem path
 */
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((r) => fs_1.default.access(filePath, fs_1.default.constants.F_OK, (e) => r(!e)));
    });
}
const PR_NUMBER_REGEX = /refs\/pull\/([0-9]+)\/merge/;
/**
 * Attempts to extract the PR number from the github ref
 * @param ref - GitHub ref from the environment variable `GITHUB_REF`
 */
function extractPrNumber(ref) {
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
function getEventId(event, ref, sha) {
    if (event === "pull_request")
        return extractPrNumber(ref);
    return sha.slice(0, 7);
}
/**
 * Executes the primary logic of the action
 */
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get inputs from job
            const archivePath = core.getInput("archive-path");
            const apiUrl = core.getInput("api-root");
            const token = core.getInput("token");
            // Extract the eventId from the environment
            const event = (_a = process.env.GITHUB_EVENT_NAME) !== null && _a !== void 0 ? _a : "";
            const ref = process.env.GITHUB_REF;
            const sha = process.env.GITHUB_SHA;
            const eventId = getEventId(event, ref !== null && ref !== void 0 ? ref : "", sha !== null && sha !== void 0 ? sha : "");
            // Ensure the token gets masked from log output
            core.setSecret(token);
            // Make sure the archive path exists
            if (!(yield fileExists(archivePath))) {
                core.setFailed(`archive-path ${archivePath} could not be found`);
                return;
            }
            const resolvedEvent = event === "pull_request" ? "pr" : "commit";
            core.info(`Preparing request to Upload API at ${resolvedEvent}/${eventId}`);
            const url = `${apiUrl}/upload`;
            const filename = path_1.default.basename(archivePath);
            const archiveStream = fs_1.default.createReadStream(archivePath);
            yield new Promise((resolve, failure) => request_1.default({
                url,
                method: "POST",
                headers: {
                    "cache-control": "no-cache",
                    "content-disposition": `attachment; filename=${filename}`,
                    "content-type": "application/gzip",
                    authorization: "Basic token",
                },
                encoding: null,
                body: archiveStream,
            }, (error) => {
                if (error) {
                    failure(error);
                }
                else {
                    resolve();
                }
            }));
            // Errors thrown here should be caught in the try block, so request is successful if
            // we get to this line
            core.info("Successfully uploaded archive to staging Upload API");
        }
        catch (error) {
            core.debug(safe_json_stringify_1.default(error));
            core.setFailed(error.message);
        }
    });
}
run();
