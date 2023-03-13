import "dotenv/config";
import {
  AttachmentBuilder,
  Client,
  GatewayIntentBits,
  GatewayIntentsString,
  Team,
  User,
} from "discord.js";
import ts from "typescript";
import { inspect } from "util";
import { createRequire } from "module";
import url from "node:url";
import path from "node:path";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const client = new Client({
  intents: Object.values(GatewayIntentBits).filter(
    (x) => typeof x === "string"
  ) as unknown as GatewayIntentsString,
});

client.on("ready", async () => {
  await client.application?.fetch().catch(console.error);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!isDeveloper(message.client.application.owner, message.author.id)) return;
  if (!message.content.startsWith("!eval")) return;

  const groups = message.content.match(
    /`{3}(?<ext>[a-zA-Z]+)\n(?<code>.+)`{3}/ms
  )?.groups;
  if (!groups) return void message.reply("バカ").catch(console.error);

  let { ext, code } = groups;
  if (ext === "ts" || ext === "typescript") code = ts.transpile(code);

  let result = "",
    error = "";
  try {
    result = inspect(
      await new AsyncFunction(
        "require",
        "__filename",
        "__dirname",
        "exports",
        "client",
        code
      )(require, __filename, __dirname, {}, client)
    ).replaceAll(process.env.token!, "*".repeat(process.env.token!.length));
  } catch (err) {
    error = inspect(err).replaceAll(
      process.env.token!,
      "*".repeat(process.env.token!.length)
    );
  }

  if (result.length > 1500 || error.length > 1500) {
    console.log(error, result);
    message.reply({
      content: "長すぎ",
      files: [
        new AttachmentBuilder(Buffer.from(result), { name: "result.txt" }),
        new AttachmentBuilder(Buffer.from(error), { name: "error.txt" }),
      ],
    });
  } else {
    message.reply(
      "結果:```js\n" +
        (result || "なし") +
        "```\n\nエラー:```js\n" +
        (error || "なし") +
        "```"
    );
  }
});

await client.login(process.env.token);

function isDeveloper(owner: User | Team | null, id: string): boolean {
  if (!owner) return false;
  if (owner instanceof Team) {
    return owner.members.has(id);
  } else {
    return owner.id === id;
  }
}
