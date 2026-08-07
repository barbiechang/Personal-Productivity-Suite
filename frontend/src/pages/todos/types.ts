export interface TodoProjectDto {
  id: string;
  name: string;
  description: string | null;
  coverDataUrl: string | null;
}

export interface ResourceDto {
  id: string;
  projectId: string;
  label: string;
  url: string | null;
  fileDataUrl: string | null;
  fileName: string | null;
}
