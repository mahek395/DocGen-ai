import fs from "fs";
import path from "path";

/* -----------------------------------------------------
   CONSTANTS
----------------------------------------------------- */
const IGNORE_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo"
];

/* -----------------------------------------------------
   SAFE FILE READ
----------------------------------------------------- */
function safeRead(file) {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return "";
  }
}

/* -----------------------------------------------------
   REPOSITORY TYPE DETECTION
----------------------------------------------------- */
export function detectRepoType(files) {
  const hasFrontend =
    files.some(f => f.includes("frontend")) ||
    files.some(f => f.includes("client")) ||
    files.some(f => /src\/(App|main)\.(jsx|tsx)/.test(f)) ||
    files.some(f => f.includes("pages")) ||
    files.some(f => f.includes("vite.config")) ||
    files.some(f => f.includes("next.config"));

  const hasBackend =
    files.some(f => f.includes("server.js")) ||
    files.some(f => f.includes("app.js")) ||
    files.some(f => f.includes("controllers")) ||
    files.some(f => f.includes("routes"));

  const hasLibrarySignals =
    files.some(f => f.includes("lib")) &&
    files.some(f => f.includes("index.js")) &&
    files.some(f => f.includes("examples"));

  if (hasFrontend && hasBackend) return "fullstack";
  if (hasLibrarySignals) return "library";
  if (hasBackend) return "backend";
  if (hasFrontend) return "frontend";

  return "application";
}

/* -----------------------------------------------------
   TECH STACK DETECTION (CONTENT BASED)
----------------------------------------------------- */
export function detectTechStack(files) {
  const tech = {
    runtime: [],
    frameworks: [],
    databases: [],
    queues: [],
    auth: [],
    tooling: []
  };

  const jsFiles = files.filter(f =>
    f.endsWith(".js") || f.endsWith(".ts")
  );

  if (files.some(f => f.endsWith("package.json")))
    tech.runtime.push("Node.js");

  if (files.some(f => f.endsWith("tsconfig.json")))
    tech.runtime.push("TypeScript");

  for (const file of jsFiles) {
    const content = safeRead(file);

    /* Frameworks */
    if (
      content.includes("express()") ||
      content.includes("require('express')") ||
      content.includes('from "express"')
    ) {
      tech.frameworks.push("Express");
    }

    if (
      content.includes("from 'react'") ||
      content.includes('from "react"') ||
      content.includes("ReactDOM")
    ) {
      tech.frameworks.push("React");
    }

    /* Databases */
    if (content.includes("mysql2") || content.includes("sequelize"))
      tech.databases.push("MySQL");

    if (content.includes("mongoose"))
      tech.databases.push("MongoDB");

    /* Queues */
    if (content.includes("bullmq") || content.includes("new Queue"))
      tech.queues.push("Bull / BullMQ (Redis)");

    /* Auth */
    if (
      content.includes("jsonwebtoken") ||
      content.includes("passport") ||
      content.includes("verifyToken")
    ) {
      tech.auth.push("JWT / Middleware-based Auth");
    }
  }

  if (files.some(f => f.endsWith("Dockerfile")))
    tech.tooling.push("Docker");

  /* Deduplicate */
  for (const key in tech) {
    tech[key] = [...new Set(tech[key])];
  }

  return tech;
}

/* -----------------------------------------------------
   ENTRY POINTS
----------------------------------------------------- */
export function detectEntryPoints(files) {
  return files.filter(file => {
    const base = path.basename(file);
    return (
      ["server.js", "app.js", "index.js"].includes(base) &&
      !file.includes("node_modules") &&
      !file.includes("examples")
    );
  });
}

/* -----------------------------------------------------
   FOLDER TREE (SAFE)
----------------------------------------------------- */
export function generateFolderTree(rootDir, depth = 3) {
  function walk(dir, level) {
    if (level > depth) return "";

    let tree = "";
    let items = [];

    try {
      items = fs.readdirSync(dir);
    } catch {
      return "";
    }

    for (const item of items) {
      if (IGNORE_DIRS.includes(item)) continue;

      const full = path.join(dir, item);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }

      tree += `${"  ".repeat(level)}- ${item}\n`;

      if (stat.isDirectory()) {
        tree += walk(full, level + 1);
      }
    }
    return tree;
  }

  return walk(rootDir, 0);
}

/* -----------------------------------------------------
   API ROUTE DETECTION (EXPRESS)
----------------------------------------------------- */
export function detectRoutes(files) {
  const routes = [];

  for (const file of files.filter(f => f.endsWith(".js"))) {
    const content = safeRead(file);

    /* Detect app.use prefixes */
    const prefixRegex =
      /app\.use\(\s*["'`](.*?)["'`]\s*,\s*(\w+)/g;

    const prefixes = {};
    let pMatch;

    while ((pMatch = prefixRegex.exec(content))) {
      prefixes[pMatch[2]] = pMatch[1];
    }

    /* Detect routes */
    const routeRegex =
      /(router|app)\.(get|post|put|delete|patch)\(\s*["'`](.*?)["'`]/gi;

    let match;
    while ((match = routeRegex.exec(content))) {
      routes.push({
        method: match[2].toUpperCase(),
        path: match[3],
        file
      });
    }
  }

  return routes.length ? routes : "Not detected";
}

export function groupRoutesByFile(routes) {
  if (!Array.isArray(routes)) return {};

  return routes.reduce((acc, r) => {
    acc[r.file] = acc[r.file] || [];
    acc[r.file].push(`${r.method} ${r.path}`);
    return acc;
  }, {});
}

/* -----------------------------------------------------
   DATABASE SCHEMA (SQL)
----------------------------------------------------- */
export function detectDatabaseSchema(files) {
  const tables = [];

  for (const file of files.filter(f => f.endsWith(".sql"))) {
    const content = safeRead(file);

    const tableRegex =
      /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;

    let match;
    while ((match = tableRegex.exec(content))) {
      const columns = match[2]
        .split(",")
        .map(c => c.trim())
        .filter(Boolean)
        .map(c => {
          const [name, type] = c.split(/\s+/);
          return { name, type };
        });

      tables.push({ name: match[1], columns });
    }
  }

  return {
    detected: tables.length > 0,
    tables
  };
}

/* -----------------------------------------------------
   BACKGROUND JOBS / WORKERS
----------------------------------------------------- */
export function detectBackgroundJobs(files) {
  return files
    .filter(f =>
      f.toLowerCase().includes("worker") ||
      f.toLowerCase().includes("queue")
    )
    .map(file => ({
      file,
      type: file.toLowerCase().includes("worker")
        ? "Worker"
        : "Queue",
      inferredPurpose:
        "Asynchronous background processing"
    }));
}

/* -----------------------------------------------------
   AUTH DETECTION
----------------------------------------------------- */
export function detectAuth(files) {
  const authFiles = files.filter(f =>
    f.toLowerCase().includes("auth")
  );

  const middlewareHints = files.filter(f => {
    const c = safeRead(f);
    return (
      c.includes("req.user") ||
      c.includes("Authorization") ||
      c.includes("verifyToken")
    );
  });

  return {
    detected: authFiles.length > 0 || middlewareHints.length > 0,
    files: [...new Set([...authFiles, ...middlewareHints])],
    assumption:
      authFiles.length === 0 && middlewareHints.length > 0
        ? "Authentication inferred via middleware usage"
        : null
  };
}

/* -----------------------------------------------------
   ENVIRONMENT VARIABLES
----------------------------------------------------- */
export function detectEnvVariables(files) {
  const envVars = new Set();

  for (const file of files.filter(f => f.endsWith(".env"))) {
    safeRead(file)
      .split("\n")
      .forEach(line => {
        const key = line.split("=")[0];
        if (key) envVars.add(key.trim());
      });
  }

  for (const file of files.filter(f => f.endsWith(".js"))) {
    const content = safeRead(file);
    const matches =
      content.match(/process\.env\.([A-Z0-9_]+)/g) || [];

    matches.forEach(m => envVars.add(m.split(".")[2]));
  }

  return Array.from(envVars);
}
