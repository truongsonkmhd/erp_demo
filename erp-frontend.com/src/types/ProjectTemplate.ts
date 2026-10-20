export interface ProjectTask {
  id: string;
  name: string;
  description?: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description?: string;
  legalBasis?: string;
  documents: { id: string; name: string; url?: string }[];
  tasks: ProjectTask[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  phases: ProjectPhase[];
}
