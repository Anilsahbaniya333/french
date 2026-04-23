import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fix: a parent-directory package.json (Expo app) causes @tailwindcss/node's
// enhanced-resolve to look for 'tailwindcss' starting from the wrong directory.
// @tailwindcss/node exposes globalThis.__tw_resolve as an override hook.
globalThis.__tw_resolve = (id, _base) => {
  const localPath = path.join(__dirname, "node_modules", id);
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(localPath, "package.json"), "utf8")
    );
    const cssEntry = pkg.style || pkg.main;
    if (cssEntry) return path.join(localPath, cssEntry);
  } catch {
    return null;
  }
  return null;
};

export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
