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
const command_1 = require("@oclif/command");
const errors_1 = require("@oclif/errors");
const upload_1 = __importDefault(require("./upload"));
/**
 * CLI version of the upload action that can be used for testing locally
 * @example
 * ```bash
 * node ./lib/cli.js \
 *   --token $(cat ./token) \
 *   --apiUrl "https://staging.archit.us/api" \
 *   --event "commit" \
 *   --eventId "aaaaaaa" \
 *   --filepath ../archit.us/dist.tar.gz
 * ```
 */
let LS = /** @class */ (() => {
    class LS extends command_1.Command {
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const { token, apiUrl, event, eventId, filepath } = this.parse(LS).flags;
                try {
                    yield upload_1.default({ token, apiUrl, event, eventId, filepath });
                }
                catch (error) {
                    // eslint-disable-next-line no-console
                    console.log(error);
                }
            });
        }
    }
    LS.flags = {
        version: command_1.flags.version(),
        help: command_1.flags.help(),
        token: command_1.flags.string({
            char: "t",
            required: true,
        }),
        apiUrl: command_1.flags.string({
            char: "a",
            required: true,
        }),
        event: command_1.flags.string({
            char: "e",
            required: true,
        }),
        eventId: command_1.flags.string({
            char: "i",
            required: true,
        }),
        filepath: command_1.flags.string({
            char: "f",
            required: true,
        }),
    };
    return LS;
})();
LS.run().catch(errors_1.handle);
