#!/usr/bin/env node
// Generates the "Secret Key (for OAuth)" for the Supabase Apple provider: an
// ES256 JWT signed with your Sign in with Apple key. Apple caps it at six
// months, so regenerate and replace it before it expires. The .p8 key never
// leaves this machine.
//
// Usage:
//   node scripts/apple-client-secret.mjs --team 7K9DA5AX76 --key <KEY_ID> \
//     --services com.sonx.web --p8 ~/Downloads/AuthKey_<KEY_ID>.p8
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, all) => {
    if (value.startsWith("--")) pairs.push([value.slice(2), all[index + 1]]);
    return pairs;
  }, []),
);
for (const name of ["team", "key", "services", "p8"]) {
  if (!args[name]) {
    console.error(`Missing --${name}. See the usage at the top of this file.`);
    process.exit(1);
  }
}

const SIX_MONTHS_MINUS_A_DAY = 180 * 24 * 60 * 60;
const now = Math.floor(Date.now() / 1000);
const base64url = (value) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");

const header = base64url({ alg: "ES256", kid: args.key });
const payload = base64url({
  iss: args.team,
  iat: now,
  exp: now + SIX_MONTHS_MINUS_A_DAY,
  aud: "https://appleid.apple.com",
  sub: args.services,
});
const signature = sign("sha256", Buffer.from(`${header}.${payload}`), {
  key: createPrivateKey(readFileSync(args.p8.replace(/^~/, process.env.HOME), "utf8")),
  dsaEncoding: "ieee-p1363",
}).toString("base64url");

console.log(`${header}.${payload}.${signature}`);
console.error(`\nExpires ${new Date((now + SIX_MONTHS_MINUS_A_DAY) * 1000).toDateString()}. Set a reminder to rotate it.`);
