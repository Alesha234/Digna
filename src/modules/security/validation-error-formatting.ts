type ValidationIssueLike = {
  path: Array<string | number>;
  message: string;
};

type ValidationErrorLike = {
  issues: Array<ValidationIssueLike>;
};

function toFieldKey(path: Array<string | number>): string {
  if (path.length === 0) {
    return "form";
  }
  let key: string = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      key += "[" + String(segment) + "]";
    } else if (key === "") {
      key += segment;
    } else {
      key += "." + segment;
    }
  }
  return key === "" ? "form" : key;
}

export function formatValidationErrors(err: ValidationErrorLike): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    if (!err || !Array.isArray(err.issues)) {
      return out;
    }
    for (const issue of err.issues) {
      if (!issue || typeof issue.message !== "string") {
        continue;
      }
      const path: Array<string | number> = Array.isArray(issue.path) ? issue.path : [];
      const cleanPath: Array<string | number> = path.filter((s: string | number): boolean => {
        return (typeof s === "string" && s.length > 0) || typeof s === "number";
      });
      const field: string = toFieldKey(cleanPath);
      if (!(field in out)) {
        out[field] = issue.message;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getFirstValidationMessage(err: ValidationErrorLike, fallback?: string): string {
  try {
    const defaultMessage: string = "Check what you entered and try again.";
    if (!err || !Array.isArray(err.issues) || err.issues.length === 0) {
      return typeof fallback === "string" && fallback.length > 0 ? fallback : defaultMessage;
    }
    const first: ValidationIssueLike | undefined = err.issues[0];
    if (first && typeof first.message === "string" && first.message.length > 0) {
      return first.message;
    }
    return typeof fallback === "string" && fallback.length > 0 ? fallback : defaultMessage;
  } catch {
    return typeof fallback === "string" && fallback.length > 0
      ? fallback
      : "Check what you entered and try again.";
  }
}
