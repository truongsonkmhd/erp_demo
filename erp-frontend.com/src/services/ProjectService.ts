import { milestone, Project, ProjectTask, ProjectTemplate } from "@/types/project"
import { newLocalId, readStore, removeUndefinedValues, writeStore } from "@/lib/localStore"

const PROJECTS_KEY = "pts.projects"
const TEMPLATES_KEY = "pts.projects_template"

export const getAllProjectsTemplate = async (): Promise<ProjectTemplate[]> => {
  return readStore<ProjectTemplate>(TEMPLATES_KEY)
}

export const addMilestone = async (projectId: string, newMilestone: milestone): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  const next = projects.map((project) =>
    project.id === projectId
      ? { ...project, milestones: [...(project.milestones ?? []), newMilestone] }
      : project,
  )
  writeStore(PROJECTS_KEY, next)
}

export const deleteMilestone = async (projectId: string, milestoneToDelete: milestone): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  const next = projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          milestones: (project.milestones ?? []).filter((item) => item.id !== milestoneToDelete.id),
        }
      : project,
  )
  writeStore(PROJECTS_KEY, next)
}

export const updateMilestone = async (projectId: string, updatedMilestone: milestone): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  const next = projects.map((project) => {
    if (project.id !== projectId) return project
    const milestones = (project.milestones ?? []).map((item) =>
      item.id === updatedMilestone.id ? updatedMilestone : item,
    )
    return { ...project, milestones }
  })
  writeStore(PROJECTS_KEY, next)
}

export const getAllProjects = async (): Promise<Project[]> => {
  return readStore<Project>(PROJECTS_KEY)
}

export const addProject = async (newProject: Omit<Project, "id">): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  projects.push(removeUndefinedValues({ ...newProject, id: newLocalId("project") } as Project))
  writeStore(PROJECTS_KEY, projects)
}

export const updateProject = async (id: string, updatedProject: Partial<Project>): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  const next = projects.map((project) =>
    project.id === id ? removeUndefinedValues({ ...project, ...updatedProject, id }) : project,
  )
  writeStore(PROJECTS_KEY, next)
}

export const deleteProject = async (id: string): Promise<void> => {
  writeStore(
    PROJECTS_KEY,
    readStore<Project>(PROJECTS_KEY).filter((project) => project.id !== id),
  )
}

const findTaskInProject = (project: Project, taskId: string) => {
  if ((project.tasks ?? []).some((task) => task.id === taskId)) return "root" as const
  if ((project.phases ?? []).some((phase) => (phase.tasks ?? []).some((task) => task.id === taskId))) {
    return "phase" as const
  }
  return null
}

export const upsertProjectTask = async (projectId: string, task: ProjectTask): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  const project = projects.find((item) => item.id === projectId)
  if (!project) return

  const location = findTaskInProject(project, task.id)
  let updated: Project

  if (location === "phase") {
    updated = {
      ...project,
      phases: (project.phases ?? []).map((phase) => ({
        ...phase,
        tasks: (phase.tasks ?? []).map((item) => (item.id === task.id ? { ...item, ...task } : item)),
      })),
    }
  } else {
    const tasks =
      location === "root"
        ? (project.tasks ?? []).map((item) => (item.id === task.id ? { ...item, ...task } : item))
        : [...(project.tasks ?? []), task]
    updated = { ...project, tasks }
  }

  writeStore(
    PROJECTS_KEY,
    projects.map((item) => (item.id === projectId ? removeUndefinedValues(updated) : item)),
  )
}

export const deleteProjectTask = async (projectId: string, taskId: string): Promise<void> => {
  const projects = readStore<Project>(PROJECTS_KEY)
  const project = projects.find((item) => item.id === projectId)
  if (!project) return

  const location = findTaskInProject(project, taskId)
  let updated: Project

  if (location === "phase") {
    updated = {
      ...project,
      phases: (project.phases ?? []).map((phase) => ({
        ...phase,
        tasks: (phase.tasks ?? []).filter((item) => item.id !== taskId),
      })),
    }
  } else {
    updated = {
      ...project,
      tasks: (project.tasks ?? []).filter((item) => item.id !== taskId),
    }
  }

  writeStore(
    PROJECTS_KEY,
    projects.map((item) => (item.id === projectId ? removeUndefinedValues(updated) : item)),
  )
}
