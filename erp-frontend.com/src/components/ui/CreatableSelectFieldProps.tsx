import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";


export type CreatableSelectFieldProps = {
  label: string;
  isCheckIsImportant?: boolean; 
  placeholder?: string;
  value: string; // Select expects string values
  onChange: (v: string) => void;

  /**
   * Seed values shown on first render.
   * Ignored if `options` is passed (controlled options mode).
   */
  initialOptions?: string[];

  /**
   * Controlled options list. If provided, component will NOT manage internal options state.
   */
  options?: string[];
  /**
   * Callback when options change (only fires when component is allowed to mutate options).
   */
  onOptionsChange?: (next: string[]) => void;

  /** Allow creating new values via + button & dialog */
  allowCreate?: boolean;

  /**
   * Customize dialog copy and layout.
   */
  createDialogTitle?: string; // default: "Thêm mục mới"
  inputLabel?: string; // default: "Tên"
  addButtonAriaLabel?: string; // default: "Thêm"

  /**
   * Normalizer used for duplicate detection. Defaults to trim + lowercase.
   */
  normalize?: (s: string) => string;

  /**
   * Persist options to localStorage under this key. Restore on mount and merge with initialOptions.
   */
  persistKey?: string;

  /**
   * Style hooks
   */
  className?: string;
  addButtonClassName?: string;
  selectTriggerClassName?: string;
};

export function CreatableSelectField({
  label,
  isCheckIsImportant,
  placeholder = "Chọn...",
  value,
  onChange,
  initialOptions = [],
  options: controlledOptions,
  onOptionsChange,
  allowCreate = true,
  createDialogTitle = "Thêm mục mới",
  inputLabel = "Tên",
  addButtonAriaLabel = "Thêm",
  normalize = (s: string) => s.trim().toLowerCase(),
  persistKey,
  className,
  addButtonClassName,
  selectTriggerClassName,
}: CreatableSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // Internal options, only used when NOT controlled
  const [internalOptions, setInternalOptions] = useState<string[]>(initialOptions);

  // Load from localStorage once
  useEffect(() => {
    if (!persistKey) return;
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const saved: string[] = JSON.parse(raw);
        setInternalOptions((prev) => mergeDeDupe(prev.length ? prev : initialOptions, saved, normalize));
      }
    } catch (err) {
      // ignore parse errors silently
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  // Persist when internal options change
  useEffect(() => {
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, JSON.stringify(internalOptions));
    } catch (err) {
      // storage quota etc. → ignore
    }
  }, [internalOptions, persistKey]);

  const opts = useMemo(() => controlledOptions ?? internalOptions, [controlledOptions, internalOptions]);

  const setOptions = (updater: (prev: string[]) => string[]) => {
    if (controlledOptions) {
      // In controlled mode, emit change but don't set internal state
      onOptionsChange?.(updater(controlledOptions));
    } else {
      setInternalOptions((prev) => {
        const next = updater(prev);
        onOptionsChange?.(next);
        return next;
      });
    }
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;

    const exists = opts.some((o) => normalize(o) === normalize(name));
    if (!exists) {
      setOptions((prev) => [...prev, name]);
      // Select the newly created value after options update
      setTimeout(() => onChange(name), 0);
    } else {
      // If it already exists, still select it
      onChange(resolveOriginalCasing(opts, name, normalize));
    }

    setNewName("");
    setOpen(false);
  };

  return (
    <div className={"space-y-2 " + (className ?? "") }>
      <Label>
    {label}
    {isCheckIsImportant && <span className="text-red-500">*</span>}
  </Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={value ?? ""} onValueChange={onChange}>
            <SelectTrigger className={"w-full " + (selectTriggerClassName ?? "") }>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {allowCreate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={"rounded-full h-10 w-10 " + (addButtonClassName ?? "")}
            aria-label={addButtonAriaLabel}
            onClick={() => setOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{createDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="creatable-input">{inputLabel} </Label>
            <Input
              id="creatable-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nhập tên..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={handleAdd}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helpers
function mergeDeDupe(a: string[], b: string[], normalize: (s: string) => string) {
  const seen = new Set(a.map((x) => normalize(x)));
  const merged = [...a];
  for (const item of b) {
    const key = normalize(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

function resolveOriginalCasing(options: string[], name: string, normalize: (s: string) => string) {
  const norm = normalize(name);
  return options.find((o) => normalize(o) === norm) ?? name;
}


// 1) Project group (Nhóm Dự Án)
export function ProjectGroupField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CreatableSelectField
      label="Nhóm Dự Án"
      isCheckIsImportant={true}
      placeholder="Chọn nhóm dự án"
      value={value}
      onChange={onChange}
      initialOptions={["A", "B", "C"]}
      persistKey="project-group-options" // lưu lại để tái sử dụng
      createDialogTitle="Thêm nhóm dự án"
      inputLabel="Tên nhóm"
    />
  );
}


export function CapitalProject({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CreatableSelectField
      label="Nguồn vốn"
      isCheckIsImportant={false}
      placeholder="Chọn Nguồn Vốn"
      value={value}
      onChange={onChange}
      initialOptions={["Xây Dựng Cơ Bản", "Ngân Sách Địa Phương", "Xã hội hóa" , "Vốn dự nghiệp"]}
      persistKey="capital-project-options" // lưu lại để tái sử dụng
      createDialogTitle="Thêm Nhóm Nguồn Vốn"
      inputLabel="Tên Nguồn Vốn"
    />
  );
}

export function FieldProject({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CreatableSelectField
      label="Lĩnh Vực"
      isCheckIsImportant={false}
      placeholder="Chọn Lĩnh Vực"
      value={value}
      onChange={onChange}
      initialOptions={["Dân sự", "Giải phóng mặt bằng", "Hạ tầng kỹ thuật"]}
      persistKey="field-project-options" // lưu lại để tái sử dụng
      createDialogTitle="Thêm Nhóm Lĩnh Vực"
      inputLabel="Tên Lĩnh Vực"
    />
  );
}

// 2) "Số bước thiết kế" – dùng chung thành chuỗi (chuyển đổi số <-> chuỗi ở ngoài)
export function DesignStepsField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const stringValue = value != null ? String(value) : "";
  const handleChange = (v: string) => {
    const n = Number(v);
    onChange(Number.isNaN(n) ? null : n);
  };

  return (
    <CreatableSelectField
      label="Số bước thiết kế"
      isCheckIsImportant={true}
      placeholder="Chọn số bước"
      value={stringValue}
      onChange={handleChange}
      initialOptions={["1", "2", "3", "4", "5"]}
      persistKey="design-steps-options"
      createDialogTitle="Thêm số bước"
      inputLabel="Số bước"
    />
  );
}




