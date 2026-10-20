import { useCallback, useEffect, useState } from "react"

import { getAllProjects } from "@/services/ProjectService"
import { Project, ProjectTask } from "@/types/project"

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    try {
      setProjects(await getAllProjects())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  const getById = useCallback(
    (id: string) => projects.find((item) => item.id === id),
    [projects],
  )

  const getAllTasks = useCallback(() => {
    return projects.flatMap((project) =>
      (project.tasks || []).map((task: ProjectTask) => ({
        ...task,
        projectId: project.id,
      })),
    )
  }, [projects])

  return {
    projects,
    loading: isLoading,
    isLoading,
    refetch: fetchProjects,
    getById,
    getAllTasks,
  }
}
