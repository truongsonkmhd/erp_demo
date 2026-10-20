import React, { useState } from "react"
import { Briefcase, Calendar, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { EmployeeRecord, WorkHistoryItem } from "../../types/employee-profile.types.ts"

interface WorkHistoryTimelineTabProps {
  record: EmployeeRecord
  onUpdateHistory?: (updatedHistory: WorkHistoryItem[]) => void
  canEdit?: boolean
}

export function WorkHistoryTimelineTab({
  record,
  onUpdateHistory,
  canEdit = false,
}: WorkHistoryTimelineTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newUnit, setNewUnit] = useState("")
  const [newPosition, setNewPosition] = useState("")
  const [newStartDate, setNewStartDate] = useState("")
  const [newEndDate, setNewEndDate] = useState("")
  const [newNotes, setNewNotes] = useState("")

  const history = record.workHistory || []

  const handleAdd = () => {
    if (!newUnit.trim() || !newPosition.trim() || !newStartDate.trim()) return

    const newItem: WorkHistoryItem = {
      id: "wh-" + Date.now(),
      unit: newUnit.trim(),
      position: newPosition.trim(),
      startDate: newStartDate,
      endDate: newEndDate || undefined,
      notes: newNotes.trim() || undefined,
    }

    const updated = [newItem, ...history]
    onUpdateHistory?.(updated)
    setIsDialogOpen(false)
    setNewUnit("")
    setNewPosition("")
    setNewStartDate("")
    setNewEndDate("")
    setNewNotes("")
  }

  const handleDelete = (id: string) => {
    const updated = history.filter((item) => item.id !== id)
    onUpdateHistory?.(updated)
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Lịch sử và Quá trình công tác</CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Thêm quá trình</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm italic">
              Chưa có dữ liệu quá trình công tác.
            </div>
          ) : (
            <div className="relative border-l-2 border-primary/30 ml-4 space-y-8 pl-6 my-2">
              {history.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4 transition-all hover:bg-muted/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                        <span>{item.position}</span>
                      </h4>
                      <span className="inline-flex items-center text-xs text-muted-foreground gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.startDate}</span>
                        <span>–</span>
                        <span>{item.endDate || "Hiện tại"}</span>
                      </span>
                    </div>

                    <p className="text-sm font-medium text-foreground/80 mb-1">{item.unit}</p>

                    {item.notes && <p className="text-xs text-muted-foreground italic mt-2">{item.notes}</p>}

                    {canEdit && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span>Xóa</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm mốc công tác */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm quá trình công tác</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <div>
              <Label htmlFor="unit">Đơn vị / Phòng ban (*)</Label>
              <Input
                id="unit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="VD: Đoàn Địa vật lý 1"
              />
            </div>
            <div>
              <Label htmlFor="position">Vị trí đảm nhiệm (*)</Label>
              <Input
                id="position"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="VD: Kỹ sư trắc địa"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startDate">Từ ngày (*)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Đến ngày</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Nhiệm vụ chính hoặc kết quả đạt được..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAdd} disabled={!newUnit.trim() || !newPosition.trim() || !newStartDate.trim()}>
              Lưu mốc công tác
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
