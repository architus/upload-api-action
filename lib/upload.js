"use strict";
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const got_1 = __importDefault(require("got"));
/**
 * Performs the core upload logic to send the file at the given path to the upload server
 * at `${apiUrl}/upload`
 */
function upload({ apiUrl, event, eventId, filepath, token, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${apiUrl}/upload?event=${event}&event_id=${eventId}`;
        const filename = path_1.default.basename(filepath);
        const fileStream = fs_1.default.createReadStream(filepath);
        got_1.default.stream.post(url, {
            body: fileStream,
            retry: 0,
            headers: {
                "cache-control": "no-cache",
                "content-disposition": `attachment; filename=${filename}`,
                "content-type": "application/octet-stream",
                authorization: `Bearer ${token}`,
            },
        });
    });
}
exports.default = upload;
