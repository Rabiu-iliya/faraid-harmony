import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Save, AlertTriangle } from "lucide-react";
import { calculateFaraid, type HeirInput, type HeirResult } from "@/lib/faraid";
import { getRelationshipKey } from "@/i18n";
import type { Tables } from "@/integrations/supabase/types";

export default function Calculate() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Tables<"assets">[]>([]);
  const [heirs, setHeirs] = useState<Tables<"heirs">[]>([]);
  const [results, setResults] = useState<HeirResult[]>([]);
  const [awl, setAwl] = useState(false);
  const [radd, setRadd] = useState(false);
  const [title, setTitle] = useState("New Calculation");
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("assets").select("*").eq("user_id", user.id),
      supabase.from("heirs").select("*").eq("user_id", user.id),
    ]).then(([a, h]) => {
      setAssets(a.data || []);
      setHeirs(h.data || []);
    });
  }, [user]);

  const totalEstate = assets.reduce((s, a) => s + Number(a.value), 0);

  const runCalculation = () => {
    if (totalEstate <= 0) { toast({ title: t("calc_no_assets"), description: t("calc_add_assets_first"), variant: "destructive" }); return; }
    if (heirs.length === 0) { toast({ title: t("calc_no_heirs"), description: t("calc_add_heirs_first"), variant: "destructive" }); return; }
    const heirInputs: HeirInput[] = heirs.map((h) => ({ id: h.id, name: h.name, relationship: h.relationship }));
    const { results: r, awlApplied, raddApplied } = calculateFaraid(heirInputs, totalEstate);
    setResults(r);
    setAwl(awlApplied);
    setRadd(raddApplied);
    setCalculated(true);
  };

  const saveCalculation = async () => {
    if (!user || !calculated) return;
    const currency = assets[0]?.currency || "USD";
    const { data: calc, error } = await supabase.from("calculations").insert({
      user_id: user.id, title, total_estate: totalEstate, currency, awl_applied: awl, radd_applied: radd,
    }).select().single();

    if (error || !calc) { toast({ title: t("common_error"), description: error?.message || "Failed to save", variant: "destructive" }); return; }

    const heirRows = results.map((r) => ({
      calculation_id: calc.id, heir_id: r.id, relationship: r.relationship,
      fixed_share: r.fixedShare, share_fraction: r.shareFraction, share_amount: r.shareAmount,
      share_percentage: r.sharePercentage, is_blocked: r.isBlocked, blocked_by: r.blockedBy, is_residuary: r.isResiduary,
    }));

    const { error: heirError } = await supabase.from("calculation_heirs").insert(heirRows);
    if (heirError) { toast({ title: t("common_error"), description: heirError.message, variant: "destructive" }); return; }
    toast({ title: t("calc_saved"), description: t("calc_saved_desc") });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">{t("calc_title")}</h1>
          <p className="text-muted-foreground">{t("calc_total_estate")}: <span className="font-bold text-secondary">{totalEstate.toLocaleString()}</span> · {heirs.length} {t("calc_heir_count")}</p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>{t("calc_calc_title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-64" />
          </div>
          <Button onClick={runCalculation}><Calculator className="mr-2 h-4 w-4" /> {t("calc_calculate")}</Button>
          {calculated && <Button variant="outline" onClick={saveCalculation}><Save className="mr-2 h-4 w-4" /> {t("calc_save")}</Button>}
        </div>

        {(awl || radd) && (
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              <span className="text-sm">
                {awl && t("calc_awl_msg")}
                {radd && t("calc_radd_msg")}
              </span>
            </CardContent>
          </Card>
        )}

        {calculated && (
          <Card className="border-primary/10">
            <CardHeader><CardTitle className="font-serif">{t("calc_results")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("calc_heir")}</TableHead>
                    <TableHead>{t("calc_relationship")}</TableHead>
                    <TableHead>{t("calc_share_type")}</TableHead>
                    <TableHead className="text-right">{t("calc_amount")}</TableHead>
                    <TableHead className="text-right">{t("calc_percentage")}</TableHead>
                    <TableHead>{t("calc_status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id} className={r.isBlocked ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{t(getRelationshipKey(r.relationship))}</TableCell>
                      <TableCell>{r.fixedShare}</TableCell>
                      <TableCell className="text-right font-mono">{r.shareAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.sharePercentage}%</TableCell>
                      <TableCell>
                        {r.isBlocked ? (
                          <Badge variant="destructive" className="text-xs">{t("calc_blocked")}</Badge>
                        ) : r.isResiduary ? (
                          <Badge className="bg-secondary text-secondary-foreground text-xs">{t("calc_residuary")}</Badge>
                        ) : (
                          <Badge className="bg-primary text-primary-foreground text-xs">{t("calc_fixed")}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
