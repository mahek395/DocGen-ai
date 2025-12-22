const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function createJob(repoUrl) {
  const res = await fetch(`${BASE_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repoUrl }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || "Failed to create job");
  }

  return res.json();
}

export async function getJob(jobId) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || "Failed to fetch job");
  }

  return res.json();
}

export function getApiUrl() {
  return BASE_URL;
}
