// Copies the English and Greek interface texts into functions/i18n.json so push messages use the same wording as the app.
// Run after changing any i18n file:  node tools/build-functions-i18n.mjs
import fs from "node:fs";
globalThis.document = { documentElement: {} };
const { EN } = await import("../src/i18n.js");
const { EL } = await import("../src/i18n-el.js");
fs.writeFileSync(new URL("../functions/i18n.json", import.meta.url), JSON.stringify({ en: EN, el: EL }));
console.log("functions/i18n.json written:", Object.keys(EN).length, "English and", Object.keys(EL).length, "Greek lines");
