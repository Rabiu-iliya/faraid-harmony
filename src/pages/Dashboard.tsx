import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Coins, Users, Calculator, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import type { Tables } from "@/integrations/supabase/types";

type Calculation = Tables<"calculations">;

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [stats, setStats] = useState({ assets: 0, heirs: 0, calculations: 0, totalValue: 0 });
  const [cases, setCases] = useState<Calculation[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [assetsRes, heirsRes, calcsRes, prefsRes] = await Promise.all([
        supabase.from("assets").select("value").eq("user_id", user.id),
        supabase.from("heirs").select("id").eq("user_id", user.id),
        supabase.from("calculations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_preferences").select("currency").eq("user_id", user.id).single(),
      ]);
      const totalValue = (assetsRes.data || []).reduce((sum, a) => sum + Number(a.value), 0);
      if (prefsRes.data?.currency) setDefaultCurrency(prefsRes.data.currency);
      setStats({ assets: assetsRes.data?.length || 0, heirs: heirsRes.data?.length || 0, calculations: calcsRes.data?.length || 0, totalValue });
      setCases(calcsRes.data || []);
    };
    fetchAll();
  }, [user]);

  const deleteCase = async (calcId: string) => {
    await supabase.from("calculation_heirs").delete().eq("calculation_id", calcId);
    await supabase.from("calculations").delete().eq("id", calcId);
    setCases((prev) => prev.filter((c) => c.id !== calcId));
    setStats((prev) => ({ ...prev, calculations: prev.calculations - 1 }));
    toast({ title: t("dashboard_case_deleted") });
  };

  const cards = [
    { title: t("dashboard_total_assets"), value: stats.assets, icon: Coins, desc: `${t("dashboard_total_value")}: ${formatCurrency(stats.totalValue, defaultCurrency)}` },
    { title: t("dashboard_heirs"), value: stats.heirs, icon: Users, desc: t("dashboard_registered_heirs") },
    { title: t("dashboard_calculations"), value: stats.calculations, icon: Calculator, desc: t("dashboard_completed_calcs") },
    { title: t("dashboard_reports"), value: stats.calculations, icon: FileText, desc: t("dashboard_generated_reports") },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-full">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary break-words">{t("dashboard_title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("dashboard_welcome")}</p>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title} className="border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{card.value}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 break-words">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/10">
          <CardHeader className="p-4 sm:p-6"><CardTitle className="font-serif text-lg sm:text-xl">{t("dashboard_recent_cases")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {cases.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8 px-4">{t("dashboard_no_cases")}</p>
            ) : (
              <>
                {/* Mobile: card list */}
                <ul className="md:hidden divide-y divide-border">
                  {cases.map((c) => (
                    <li key={c.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{c.title}</p>
                        <p className="text-sm text-primary font-semibold mt-0.5 break-words">{formatCurrency(Number(c.total_estate), c.currency)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("dashboard_delete_case")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("dashboard_delete_case_desc")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common_cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCase(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("dashboard_confirm_delete")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("calc_calc_title")}</TableHead>
                        <TableHead>{t("calc_total_estate")}</TableHead>
                        <TableHead>{t("admin_case_date")}</TableHead>
                        <TableHead className="text-right">{t("assets_actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell>{formatCurrency(Number(c.total_estate), c.currency)}</TableCell>
                          <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("dashboard_delete_case")}</AlertDialogTitle>
                                  <AlertDialogDescription>{t("dashboard_delete_case_desc")}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("common_cancel")}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCase(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("dashboard_confirm_delete")}</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
