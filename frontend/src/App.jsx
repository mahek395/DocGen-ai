import { useEffect, useState } from "react";
import { createJob, getJob, getApiUrl } from "./api/jobAPI";
import { downloadMarkdown } from "./utils/downloadMarkdown";
import MarkdownRenderer from "./components/MarkdownRenderer";
import {
  FileText,
  Moon,
  Sun,
  Zap,
  FileSearch,
  ShieldCheck,
  Github,
  FileDown,
  Loader2,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

/* ----------------------------------------
   Validation helper
---------------------------------------- */
function isValidGithubUrl(url) {
  return /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/.test(url.trim());
}

/* ----------------------------------------
   Progress helper
---------------------------------------- */
function getJobStep(progress) {
  if (progress < 20) return "Initializing job";
  if (progress < 40) return "Cloning repository";
  if (progress < 60) return "Analyzing codebase";
  if (progress < 80) return "Understanding architecture";
  if (progress < 95) return "Generating documentation";
  return "Finalizing output";
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState("readme");
  const [error, setError] = useState("");

  const documents = job?.documents || {
    readme: "",
    developerGuide: ""
  };

  /* ------------------ Dark mode ------------------ */
  useEffect(() => {
    const root = document.documentElement;
    dark ? root.classList.add("dark") : root.classList.remove("dark");
  }, [dark]);

  /* ------------------ Restore job on refresh ------------------ */
  useEffect(() => {
    const savedJobId = localStorage.getItem("docgen_job_id");
    if (savedJobId) {
      setJobId(savedJobId);
      setLoading(true);
    }
  }, []);

  /* ------------------ Create job ------------------ */
  async function handleGenerate() {
    if (!repoUrl.trim() || loading) return;

    // Validate GitHub URL
    if (!isValidGithubUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)");
      return;
    }

    setError("");
    setLoading(true);
    setJob(null);

    try {
      const res = await createJob(repoUrl);
      setJobId(res.jobId);
      localStorage.setItem("docgen_job_id", res.jobId);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to start documentation generation. Please try again.");
      setLoading(false);
    }
  }

  /* ------------------ Poll job ------------------ */
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const data = await getJob(jobId);
        setJob(data.job);
        if (["completed", "failed"].includes(data.job.status)) {
          clearInterval(interval);
          setLoading(false);
          setError("");
          localStorage.removeItem("docgen_job_id");
        }
      } catch (err) {
        console.error("Polling failed", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  /* ------------------ Clear session ------------------ */
  function handleClear() {
    setJobId(null);
    setJob(null);
    setRepoUrl("");
    setError("");
    setActiveDoc("readme");
    setLoading(false);
    localStorage.removeItem("docgen_job_id");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0f1c] dark:to-black text-gray-900 dark:text-white">

      {/* ───────── NAVBAR ───────── */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-white/5 dark:bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            DocGen
          </div>

          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* ───────── HERO ───────── */}
      <section className="pt-32 text-center px-4">
        <h1 className="text-5xl font-bold">
          AI Documentation <span className="text-blue-500">Generator</span>
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
          Transform any GitHub repository into clean, structured,
          developer-ready documentation.
        </p>

        <div className="mt-10 max-w-xl mx-auto">
          <div className="relative">
            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={loading}
              placeholder="https://github.com/username/repository"
              className="w-full pl-12 pr-5 py-4 rounded-xl bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Generating…" : "Generate Documentation"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 max-w-xl mx-auto bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-500 font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Progress */}
        {job && (
          <div className="mt-10 max-w-xl mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{getJobStep(job.progress)}</span>
              <span>{job.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {job?.status === "failed" && (
          <div className="mt-6 max-w-xl mx-auto bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-500 font-medium">Documentation generation failed</p>
              <p className="text-red-400 text-sm mt-1">The repository analysis encountered an error. Please try again or check if the repository is accessible.</p>
            </div>
          </div>
        )}
      </section>

      {/* ───────── RESULT ───────── */}
      {job?.status === "completed" && (
        <section className="mt-20 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Success Message */}
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-500 font-medium">Documentation generated successfully!</p>
                <p className="text-green-400 text-sm mt-1">Your documentation is ready for download and use.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 items-center flex-wrap">
              <button
                onClick={() => setActiveDoc("readme")}
                className={`px-4 py-2 rounded-lg ${
                  activeDoc === "readme"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10"
                }`}
              >
                README
              </button>

              <button
                onClick={() => setActiveDoc("developer")}
                className={`px-4 py-2 rounded-lg ${
                  activeDoc === "developer"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10"
                }`}
              >
                Developer Guide
              </button>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() =>
                    downloadMarkdown(
                      activeDoc === "readme"
                        ? documents.readme
                        : documents.developerGuide,
                      activeDoc === "readme"
                        ? "README.md"
                        : "DEVELOPER_GUIDE.md"
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
                >
                  <FileDown size={16} /> Markdown
                </button>

                {activeDoc === "developer" && (
                  <a
                    href={`${getApiUrl().replace('/api', '')}/jobs/${job.id}/developer-guide.pdf`}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FileDown size={16} /> PDF
                  </a>
                )}
              </div>
            </div>

            {/* Rendered Docs */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-8 max-h-[700px] overflow-y-auto">
              {activeDoc === "readme" && !documents.readme ? (
                <p className="text-gray-500 text-center py-8">No README content generated yet</p>
              ) : activeDoc === "developer" && !documents.developerGuide ? (
                <p className="text-gray-500 text-center py-8">No Developer Guide content generated yet</p>
              ) : (
                <MarkdownRenderer
                  content={
                    activeDoc === "readme"
                      ? documents.readme
                      : documents.developerGuide
                  }
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ───────── FEATURES ───────── */}
      <section className="mt-28 px-8">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Feature icon={Zap} title="Fast Generation" desc="Get clean, well-structured documentation for your repository in just a few minutes." />
          <Feature icon={FileSearch} title="Smart Analysis" desc="Understand what a project does, how it works, and where to start, without reading the entire codebase." />
          <Feature icon={ShieldCheck} title="Secure" desc="Your repository is processed securely and removed after documentation is generated.No source code is stored or shared." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-2xl p-6 bg-white/5 dark:bg-[#0f172a] border border-white/10 backdrop-blur hover:-translate-y-1 transition">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{desc}</p>
    </div>
  );
}
