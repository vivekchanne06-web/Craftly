const LANGUAGE_BY_EXTENSION = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  css: "css",
  scss: "scss",
  html: "html",
  md: "markdown",
  py: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  rs: "rust",
  sh: "shell",
  bash: "shell",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
};

export function detectLanguage(filePath = "") {
  const fileName = filePath.split(/[\\/]/).pop() ?? "";
  const extension = fileName.includes(".")
    ? fileName.split(".").pop().toLowerCase()
    : "";
  return LANGUAGE_BY_EXTENSION[extension] ?? "plaintext";
}

export function getLanguageColor(filePath = "") {
  const extension = filePath.split(/[\\/]/).pop()?.split(".").pop()?.toLowerCase() ?? "";
  return {
    js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
    html: "#e44d26", css: "#264de4", scss: "#c6538c", json: "#cbcb41",
    md: "#519aba", py: "#3572a5", sh: "#89e051", bash: "#89e051",
    yml: "#cb171e", yaml: "#cb171e", xml: "#f26522",
  }[extension] ?? "var(--color-text-subtle)";
}
