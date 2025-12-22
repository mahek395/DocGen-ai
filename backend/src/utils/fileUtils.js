import fs from "fs";
import path from "path";

// Folders we want to ignore completely
const IGNORED_FOLDERS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "test",
  "tests",
  "__tests__"
];

// File extensions we care about
const ALLOWED_EXTENSIONS = [".js", ".ts", ".jsx", ".tsx", ".json", ".md"];

/**
 * Recursively read files from a directory
 */
export function readFilesRecursively(dirPath, collectedFiles = []) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);

    // ❌ Ignore unwanted folders
    if (stats.isDirectory()) {
      if (IGNORED_FOLDERS.includes(item)) {
        continue;
      }

      // 🔁 Go deeper
      readFilesRecursively(fullPath, collectedFiles);
    }

    // ✅ Collect allowed files
    else {
      const ext = path.extname(item);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        collectedFiles.push(fullPath);
      }
    }
  }

  return collectedFiles;
}
