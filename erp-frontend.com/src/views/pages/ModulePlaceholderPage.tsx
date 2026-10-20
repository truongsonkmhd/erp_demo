import { Construction } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type ModulePlaceholderPageProps = {
  title: string
  description: string
}

export default function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <section className="mx-auto w-full max-w-7xl" aria-labelledby="module-heading">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Phân hệ nghiệp vụ
        </p>
        <h1 id="module-heading" className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>

      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Construction className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">Chức năng đang được phát triển</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Khung phân hệ đã sẵn sàng. Nội dung nghiệp vụ chi tiết sẽ được bổ sung ở giai đoạn tiếp theo.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
