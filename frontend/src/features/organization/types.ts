export interface Organization {
  id: string;
  name: string;
  featureFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}
