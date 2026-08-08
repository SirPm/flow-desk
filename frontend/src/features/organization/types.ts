export interface Organization {
  id: string;
  name: string;
  featureFlags: Record<string, boolean>;
  changeRequestTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  title: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
