import { build } from "esbuild";
import path from "path";

const serverEntry = path.resolve(import.meta.dirname, "_core", "index.ts");
const serverOut = path.resolve(import.meta.dirname, "..", "dist", "index.js");

build({
  entryPoints: [serverEntry],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: serverOut,
  external: ["express", "mysql2", "jose", "dotenv", "pino", "node-cron", "axios", "qrcode", "qrcode-terminal", "@whiskeysockets/baileys", "openai", "superjson", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner", "drizzle-orm", "@hapi/boom", "nodemailer", "@tailwindcss/oxide-linux-x64-gnu", "@tailwindcss/oxide-linux-x64-musl", "@babel/preset-typescript/package.json", "../pkg"],
  minify: true,
  sourcemap: false,
  logLevel: "info",
}).catch(() => process.exit(1));
