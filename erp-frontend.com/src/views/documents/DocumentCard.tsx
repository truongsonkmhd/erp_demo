import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface Document {
  id: number
  name: string
  type: string
  uploadedBy: string
  uploadedAt: string
}

export default function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Card className="hover:shadow-md cursor-pointer">
      <CardHeader className="flex flex-row items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        <CardTitle className="text-base">{doc.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        <p>Người upload: {doc.uploadedBy}</p>
        <p>Ngày: {doc.uploadedAt}</p>
      </CardContent>
    </Card>
  )
}
