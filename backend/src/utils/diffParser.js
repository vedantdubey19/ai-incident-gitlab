export function cleanDiff(diff = "") {
  return diff.replace(/```diff/gi, "").replace(/```/g, "").trim();
}

export function extractFilePath(diff = "") {
  let match = diff.match(/\+\+\+\s+b\/(.+?)\s*$/m);
  if (match) {
    return match[1].trim();
  }

  match = diff.match(/\+\+\+\s+(.+?)\s*$/m);
  if (match) {
    return match[1].trim();
  }

  return null;
}

export function isNewFile(diff = "") {
  return diff.includes("--- /dev/null");
}
