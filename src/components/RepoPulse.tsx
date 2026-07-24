import { useEffect, useState } from "react";

export default function RepoPulse() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/Jennifer-qj/wenxianxue-lab", {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((repo) => setStars(repo.stargazers_count))
      .catch(() => setStars(null));
  }, []);

  return (
    <a
      className="repo-pulse"
      href="https://github.com/Jennifer-qj/wenxianxue-lab"
      target="_blank"
      rel="noreferrer"
      aria-label={`在 GitHub 查看项目${stars === null ? "" : `，当前 ${stars} 个 Star`}`}
    >
      <span aria-hidden="true">★</span>
      <strong>{stars ?? "—"}</strong>
      <small>GitHub Stars</small>
    </a>
  );
}
