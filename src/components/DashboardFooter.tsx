import { useLanguage } from "@/contexts/LanguageContext";

export function DashboardFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur islamic-pattern">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-primary mb-1">GadoPro</h3>
            <p className="text-sm text-muted-foreground">{t("footer_tagline")}</p>
          </div>
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-2">{t("footer_quick_links")}</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">{t("nav_dashboard")}</a></li>
              <li><a href="/calculate" className="text-muted-foreground hover:text-primary transition-colors">{t("nav_calculate")}</a></li>
              <li><a href="/reports" className="text-muted-foreground hover:text-primary transition-colors">{t("nav_reports")}</a></li>
              <li><a href="/manual" className="text-muted-foreground hover:text-primary transition-colors">{t("nav_manual")}</a></li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            <p>© {year} GadoPro</p>
            <p className="mt-1">{t("footer_rights")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
