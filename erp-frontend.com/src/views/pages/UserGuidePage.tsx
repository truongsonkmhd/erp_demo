import { BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/i18n/LocaleContext"

export default function UserGuidePage() {
  const { t } = useLocale()

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">{t("guide.kicker")}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t("guide.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("guide.subtitle")}</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-blue" />
            <CardTitle className="text-lg">{t("guide.emptyTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("guide.emptyHint")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
