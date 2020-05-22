import { Command, flags } from "@oclif/command";
import { handle } from "@oclif/errors";
import upload from "./upload";

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
class LS extends Command {
  static flags = {
    version: flags.version(),
    help: flags.help(),
    token: flags.string({
      char: "t",
      required: true,
    }),
    apiUrl: flags.string({
      char: "a",
      required: true,
    }),
    event: flags.string({
      char: "e",
      required: true,
    }),
    eventId: flags.string({
      char: "i",
      required: true,
    }),
    filepath: flags.string({
      char: "f",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { token, apiUrl, event, eventId, filepath } = this.parse(LS).flags;
    try {
      await upload({ token, apiUrl, event, eventId, filepath });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
}

(LS.run() as Promise<void>).catch(handle);
