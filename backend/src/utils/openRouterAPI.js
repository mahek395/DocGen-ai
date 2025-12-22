import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

/**
 * Generate README.md + DEVELOPER_GUIDE.md
 * based strictly on static repository analysis
 */
export async function generateDocumentation(analysis) {
  const response = await openrouter.chat.send({
    model: "meta-llama/llama-3.3-70b-instruct",
    temperature: 0.15, // low creativity = higher factual accuracy
    messages: [
      {
        role: "system",
        content: `
You are a senior software architect and professional technical documentation engineer.

========================
STRICT RULES (MANDATORY)
========================
- Base ALL explanations ONLY on the provided repository analysis.
- DO NOT invent features, APIs, frameworks, database tables, or workflows.
- DO NOT guess silently.
- If something is inferred, explicitly label it as **ASSUMPTION**.
- If something is missing, say **"Not detected in repository"**.
- Prefer correctness and clarity over verbosity.
- Reference real files, folders, and detected structures.
- NEVER contradict the provided analysis.

========================
OUTPUT REQUIREMENTS
========================
You MUST generate TWO SEPARATE DOCUMENTS in MARKDOWN:

1) README.md
2) DEVELOPER_GUIDE.md

Each document must be clearly separated with visible headers.

========================
TONE & STYLE
========================
- Formal technical
- Developer-friendly
- Clean, concise, professional
- SaaS-quality documentation
`
      },
      {
        role: "user",
        content: `
========================
REPOSITORY ANALYSIS
========================

Repository Type:
${analysis.repoType || "Not detected"}

--------------------------------
TECH STACK (AUTO-DETECTED)
--------------------------------

Runtime:
${analysis.techStack?.runtime?.join(", ") || "Not detected"}

Frameworks:
${analysis.techStack?.frameworks?.join(", ") || "Not detected"}

Databases:
${analysis.techStack?.databases?.join(", ") || "Not detected"}

Queues / Background Processing:
${analysis.techStack?.queues?.join(", ") || "Not detected"}

Authentication:
${analysis.techStack?.auth?.join(", ") || "Not detected"}

Tooling:
${analysis.techStack?.tooling?.join(", ") || "Not detected"}

--------------------------------
ENTRY POINTS
--------------------------------
${analysis.entryPoints?.length ? analysis.entryPoints.join("\n") : "Not detected"}

--------------------------------
KEY MODULES / FOLDERS
--------------------------------
${analysis.modules?.length ? analysis.modules.join("\n") : "Not detected"}

--------------------------------
API ROUTES
--------------------------------
${
  Array.isArray(analysis.routes) && analysis.routes.length
    ? analysis.routes
        .map(r => `${r.method} ${r.path} (${r.file})`)
        .join("\n")
    : "Not detected"
}

--------------------------------
DATABASE SCHEMA
--------------------------------
${
  analysis.database?.detected
    ? analysis.database.tables
        .map(
          t =>
            `Table: ${t.name}\n` +
            t.columns.map(c => `- ${c.name}: ${c.type}`).join("\n")
        )
        .join("\n\n")
    : "Not detected"
}

--------------------------------
BACKGROUND JOBS / WORKERS
--------------------------------
${
  analysis.workers?.length
    ? analysis.workers
        .map(w => `${w.file} → ${w.inferredPurpose}`)
        .join("\n")
    : "Not detected"
}

--------------------------------
AUTHENTICATION FILES
--------------------------------
${
  analysis.auth?.detected
    ? analysis.auth.files.join("\n")
    : "Not detected"
}

--------------------------------
ENVIRONMENT VARIABLES
--------------------------------
${analysis.envVars?.length ? analysis.envVars.join("\n") : "Not detected"}

--------------------------------
FOLDER STRUCTURE
--------------------------------
${analysis.folderTree || "Not detected"}

==================================================
DOCUMENT 1: README.md
==================================================

Generate a **GitHub-ready README.md**.

Follow these rules:
- Audience: Open-source users & recruiters
- Keep it concise
- Avoid internal implementation details
- Do NOT include speculative features

MANDATORY SECTIONS:
- Project Overview
- Implemented Features (ONLY detected features)
- Tech Stack (auto-detected)
- High-Level Architecture Overview
- Folder Structure (brief)
- Setup & Installation
- How to Run the Project
- API Overview (high-level only)
- Assumptions & Limitations (if any)

NOTE:
If repository type is:
- frontend → focus on UI, state, API integration
- backend → focus on APIs, jobs, DB
- fullstack → cover frontend + backend separation
- library → focus on usage and public APIs

==================================================
DOCUMENT 2: DEVELOPER_GUIDE.md
==================================================

Generate a **deep technical internal developer guide**.

Audience: Engineers onboarding to the project.

MANDATORY SECTIONS:
- System Architecture Overview
- End-to-End Request / Job Flow (step-by-step)
- Entry Points Explained
- API Design & Routing
- Background Jobs & Workers (queues, async flow)
- Database Schema & Access Patterns
- Authentication Flow (ONLY if detected)
- Error Handling Strategy
- Configuration & Environment Variables
- Important Design Decisions
- Assumptions & Inferred Behavior (clearly labeled)
- Where a New Developer Should Start

RULES:
- Reference actual files and folders.
- Explain REAL workflows present in code.
- If a section cannot be generated, explicitly state why.
- Do NOT repeat README content verbatim.

========================
FINAL OUTPUT
========================
Return BOTH documents in VALID MARKDOWN.
`
      }
    ]
  });

  return response.choices[0].message.content;
}
