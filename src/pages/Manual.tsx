import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen } from "lucide-react";

export default function Manual() {
  const { t } = useLanguage();

  const sections = [
    { key: "manual_getting_started", content: "manual_getting_started_content" },
    { key: "manual_creating_case", content: "manual_creating_case_content" },
    { key: "manual_adding_assets", content: "manual_adding_assets_content" },
    { key: "manual_defining_heirs", content: "manual_defining_heirs_content" },
    { key: "manual_blocking_rules", content: "manual_blocking_rules_content" },
    { key: "manual_awl_radd", content: "manual_awl_radd_content" },
    { key: "manual_generating_reports", content: "manual_generating_reports_content" },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">{t("manual_title")}</h1>
            <p className="text-muted-foreground">{t("manual_subtitle")}</p>
          </div>
        </div>

        <Card className="border-primary/10">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {sections.map((section, i) => (
                <AccordionItem key={i} value={`section-${i}`}>
                  <AccordionTrigger className="font-serif text-lg text-primary hover:no-underline">
                    {t(section.key as any)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                      {t(section.content as any)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
