export interface AppVersion {
  id: number;
  versionNumber: string;
  buildNumber: number;
  appFlowVersion: string | null;
  changelogs: string | null;
  gitCommit: string | null;
  platforms: string;
  releaseDate: string; // ISO date string
  forceUpdate: boolean;
}

export interface AppUpdateData {
  platform: string;
  playStoreAppUrl: string;
  appStoreAppUrl: string;
  updateAvailable: boolean;
  forceUpdateRequired: boolean;
  forceUpdateVersion: AppVersion;
  latestVersion: AppVersion;
  reloginRequired: boolean;
  underMaintenance: boolean;
}
