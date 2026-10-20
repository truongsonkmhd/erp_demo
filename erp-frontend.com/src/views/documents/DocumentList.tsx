import { useState } from "react"
import { MoreVertical, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Project {
  id: number
  name: string
}

interface Document {
  id: number
  name: string
  type: string
  uploadedBy: string
  uploadedAt: string
}

const mockProjects: Project[] = [
  { id: 1, name: "Dự án Chung cư ABC" },
  { id: 2, name: "Dự án Cầu XYZ" },
]

const mockDocumentsByProject: Record<number, Document[]> = {
  1: [
    { id: 1, name: "Hợp đồng giai đoạn 1.pdf", type: "pdf", uploadedBy: "Nguyễn Văn A", uploadedAt: "2025-09-01" },
    { id: 2, name: "Bản vẽ móng.docx", type: "docx", uploadedBy: "Trần Thị B", uploadedAt: "2025-09-02" },
  ],
  2: [
    { id: 3, name: "Biên bản nghiệm thu.docx", type: "docx", uploadedBy: "Phạm Văn C", uploadedAt: "2025-09-03" },
  ],
}

export default function DocumentList() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newDocName, setNewDocName] = useState("")
  const [newDocUploader, setNewDocUploader] = useState("")
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project)
    setDocuments(mockDocumentsByProject[project.id] || [])
  }

  const handleAddDocument = () => {
    if (!newDocName.trim() || !newDocUploader.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const newDoc: Document = {
      id: Date.now(),
      name: newDocName,
      type: newDocName.split(".").pop() || "other",
      uploadedBy: newDocUploader,
      uploadedAt: new Date().toISOString().split("T")[0],
    }

    setDocuments([...documents, newDoc])
    setShowForm(false)
    setNewDocName("")
    setNewDocUploader("")

    toast.success(`Đã thêm tài liệu "${newDoc.name}"`)
  }

  const confirmDelete = (doc: Document) => {
    setDocToDelete(doc)
    setOpenMenuId(null)
  }

  const handleDelete = () => {
    if (docToDelete) {
      setDocuments(documents.filter((doc) => doc.id !== docToDelete.id))
      toast.success(`Đã xóa tài liệu "${docToDelete.name}"`)
      setDocToDelete(null)
    }
  }

  return (
    <div className="p-6">
      {!selectedProject ? (
        <>
          <h1 className="text-2xl font-semibold mb-4">Danh sách Dự Án</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg shadow-sm hover:shadow-md cursor-pointer"
                onClick={() => handleSelectProject(project)}
              >
                <h2 className="text-lg font-medium">{project.name}</h2>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">Tài Liệu: {selectedProject.name}</h1>

          <button
            onClick={() => setShowForm(true)}
            className="mb-3 flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium shadow 
                         bg-gradient-to-r from-blue-500 to-orange-400 hover:opacity-90 transition"
          >
            + Thêm Tài Liệu
          </button>

          {showForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h2 className="text-lg font-medium mb-2">Thêm Tài Liệu Mới</h2>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewDocName(e.target.files[0].name)
                  }
                }}
                className="w-full mb-2"
              />
              <input
                type="text"
                placeholder="Người upload"
                value={newDocUploader}
                onChange={(e) => setNewDocUploader(e.target.value)}
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddDocument}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {documents.length === 0 ? (
            <p>Chưa có tài liệu nào cho dự án này.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="relative p-4 border rounded-lg shadow hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-blue-600 break-words whitespace-normal">{doc.name}</h3>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}>
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {openMenuId === doc.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-10">
                          <button
                            onClick={() => confirmDelete(doc)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Người upload: {doc.uploadedBy}</p>
                  <p className="text-sm text-gray-600">Ngày: {doc.uploadedAt}</p>
                </div>
              ))}
            </div>
          )}

          {/* Hộp thoại xác nhận xóa */}
          {docToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-lg font-semibold mb-4">Xác nhận xóa</h2>
                <p className="break-words max-w-full">
                  Bạn có chắc chắn muốn xóa tài liệu <b>{docToDelete.name}</b> không?
                </p>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => setDocToDelete(null)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setSelectedProject(null)}
            className="mt-6 px-4 py-2 border rounded-lg"
          >
            ← Quay lại danh sách dự án
          </button>
        </>
      )}
    </div>
  )
}
