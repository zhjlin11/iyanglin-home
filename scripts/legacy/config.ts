import path from "path";

export const LEGACY_DRY_RUN_ONLY = true;

export const BASE_DIR = path.resolve(process.cwd());

export const PATHS = {
  input: path.join(BASE_DIR, "legacy-assets", "input"),
  work: path.join(BASE_DIR, "legacy-assets", "work"),
  reports: path.join(BASE_DIR, "legacy-assets", "reports"),
  manifests: path.join(BASE_DIR, "legacy-assets", "manifests"),
  mappings: path.join(BASE_DIR, "legacy-assets", "mappings"),
  errors: path.join(BASE_DIR, "legacy-assets", "errors"),
};

export const ALLOWED_EXTENSIONS = [
  ".json",
  ".sql",
  ".py",
  ".csv",
  ".html",
  ".txt",
  ".md",
  ".bak",
];
