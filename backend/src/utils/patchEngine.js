export function applyPatchNewFile(diff = "") {
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.replace(/^\+/, ""))
    .join("\n");
}

export function applyPatchExistingFile(original = "", diff = "") {
  const lines = diff.split("\n");
  const added = lines.filter((line) => line.startsWith("+") && !line.startsWith("+++"));

  if (added.length === 0) {
    return null;
  }

  return added.map((line) => line.replace(/^\+/, "")).join("\n");
}
