import { Project } from "./project"

export interface ProjectFormProps {
  project?: Project
  onSave: (project: Omit<Project, 'id'> | Project) => void | Promise<void>
  onCancel: () => void
  mode: 'create' | 'edit' | 'copy' | 'view'
  officeOnly?: boolean
}
