export interface AssetFileManifest {
  absolutePath: string;
  relativePath: string;
  filename: string;
  extension: string;
  sizeBytes: number;
  sha256?: string;
  suspectedModule: string;
  isReadable: boolean;
  evidenceType: string;
  notes?: string;
}

export interface LegacyModuleStats {
  moduleName: string;
  sourceFile: string;
  rawCount: number;
  parsedSuccessCount: number;
  duplicateCount: number;
  validMigratableCount: number;
  missingRequiredFieldsCount: number;
  evidenceType: string;
}

export interface DryRunReport {
  batchId: string;
  timestamp: string;
  isDryRunMode: true;
  databaseWritten: false;
  dbCountBefore: Record<string, number>;
  dbCountAfter: Record<string, number>;
  totalAssetsScanned: number;
  moduleStats: LegacyModuleStats[];
  warnings: string[];
}
