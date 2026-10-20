import { useEffect, useState } from "react"
import { getAllProjectsTemplate } from "@/services/ProjectService"
import { ProjectTemplate } from "@/types/project"

export const useProjectTemplates = () => {
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const data = await getAllProjectsTemplate()
      setProjectTemplates(data)
    } catch (error) {
      console.error("Lỗi khi lấy project templates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return { projectTemplates, loading, refetch: fetchTemplates }
}
