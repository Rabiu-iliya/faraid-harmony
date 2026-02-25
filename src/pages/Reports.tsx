import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getRelationshipKey } from "@/i18n";
import type { Tables } from "@/integrations/supabase/types";

type Calculation = Tables<"calculations">;
type CalcHeir = Tables<"calculation_heirs"> & { heirs: { name: string } | null };

const COLORS = ["#2d6a4f", "#c4a54a", "#40916c", "#d4a843", "#52b788", "#b8860b", "#74c69d", "#8b7355"];

export default function Reports() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [heirResults, setHeirResults] = useState<CalcHeir[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("calculations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setCalculations(data || []);
      if (data && data.length > 0) setSelected(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    supabase.from("calculation_heirs").select("*, heirs(name)").eq("calculation_id", selected).then(({ data }) => {
      setHeirResults((data as CalcHeir[]) || []);
    });
  }, [selected]);

  const activeHeirs = heirResults.filter((h) => !h.is_blocked);
  const blockedHeirs = heirResults.filter((h) => h.is_blocked);
  const pieData = activeHeirs.map((h) => ({ name: h.heirs?.name || "Unknown", value: h.share_percentage }));
  const barData = activeHeirs.map((h) => ({ name: h.heirs?.name || "Unknown", amount: h.share_amount }));
  const selectedCalc = calculations.find((c) => c.id === selected);

  const exportPDF = () => {
    if (!selectedCalc) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GadoPro — Inheritance Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`${selectedCalc.title}`, 14, 30);
    doc.text(`${t("reports_total_estate")}: ${Number(selectedCalc.total_estate).toLocaleString()} ${selectedCalc.currency}`, 14, 38);
    if (selectedCalc.awl_applied) doc.text(t("reports_awl"), 14, 46);
    if (selectedCalc.radd_applied) doc.text(t("reports_radd"), selectedCalc.awl_applied ? 60 : 14, 46);

    autoTable(doc, {
      startY: 54,
      head: [[t("reports_heir"), t("reports_relationship"), t("reports_share_type"), t("reports_amount"), t("reports_percentage")]],
      body: activeHeirs.map((h) => [
        h.heirs?.name || "",
        t(getRelationshipKey(h.relationship)),
        h.fixed_share || "",
        Number(h.share_amount).toLocaleString(),
        `${h.share_percentage}%`,
      ]),
    });

    if (blockedHeirs.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.text(t("reports_blocked_heirs"), 14, finalY + 10);
      autoTable(doc, {
        startY: finalY + 14,
        head: [[t("reports_heir"), t("reports_relationship"), t("reports_reason")]],
        body: blockedHeirs.map((h) => [
          h.heirs?.name || "",
          t(getRelationshipKey(h.relationship)),
          h.blocked_by || "",
        ]),
      });
    }

    doc.save(`${selectedCalc.title.replace(/\s+/g, "_")}_report.pdf`);
  };

  const exportExcel = () => {
    if (!selectedCalc) return;
    const wsData = [
      ["GadoPro — Inheritance Report"],
      [selectedCalc.title],
      [`${t("reports_total_estate")}: ${Number(selectedCalc.total_estate).toLocaleString()} ${selectedCalc.currency}`],
      [],
      [t("reports_heir"), t("reports_relationship"), t("reports_share_type"), t("reports_amount"), t("reports_percentage")],
      ...activeHeirs.map((h) => [
        h.heirs?.name || "",
        t(getRelationshipKey(h.relationship)),
        h.fixed_share || "",
        Number(h.share_amount),
        h.share_percentage,
      ]),
    ];
    if (blockedHeirs.length > 0) {
      wsData.push([], [t("reports_blocked_heirs")], [t("reports_heir"), t("reports_relationship"), t("reports_reason")]);
      blockedHeirs.forEach((h) =>
        wsData.push([h.heirs?.name || "", t(getRelationshipKey(h.relationship)), h.blocked_by || ""])
      );
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${selectedCalc.title.replace(/\s+/g, "_")}_report.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-primary">{t("reports_title")}</h1>
          {selectedCalc && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel}>
                <Download className="mr-1 h-4 w-4" /> Excel
              </Button>
            </div>
          )}
        </div>

        {calculations.length === 0 ? (
          <Card className="border-primary/10"><CardContent className="py-8 text-center text-muted-foreground">{t("reports_no_calcs")}</CardContent></Card>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              {calculations.map((c) => (
                <button key={c.id} onClick={() => setSelected(c.id)}
                  className={`px-4 py-2 rounded-md text-sm border transition-colors ${selected === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
                  {c.title} — {new Date(c.created_at).toLocaleDateString()}
                </button>
              ))}
            </div>

            {selectedCalc && (
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="font-serif">{selectedCalc.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("reports_total_estate")}: <span className="font-bold text-secondary">{Number(selectedCalc.total_estate).toLocaleString()} {selectedCalc.currency}</span>
                    {selectedCalc.awl_applied && <Badge className="ml-2 bg-secondary text-secondary-foreground">{t("reports_awl")}</Badge>}
                    {selectedCalc.radd_applied && <Badge className="ml-2 bg-secondary text-secondary-foreground">{t("reports_radd")}</Badge>}
                  </p>
                </CardHeader>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-primary/10">
                <CardHeader><CardTitle className="font-serif text-lg">{t("reports_share_dist")}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardHeader><CardTitle className="font-serif text-lg">{t("reports_share_amounts")}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="hsl(152, 45%, 28%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/10">
              <CardHeader><CardTitle className="font-serif text-lg">{t("reports_dist_table")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("reports_heir")}</TableHead>
                      <TableHead>{t("reports_relationship")}</TableHead>
                      <TableHead>{t("reports_share_type")}</TableHead>
                      <TableHead className="text-right">{t("reports_amount")}</TableHead>
                      <TableHead className="text-right">{t("reports_percentage")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeHeirs.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.heirs?.name}</TableCell>
                        <TableCell>{t(getRelationshipKey(h.relationship))}</TableCell>
                        <TableCell>{h.fixed_share}</TableCell>
                        <TableCell className="text-right font-mono">{Number(h.share_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{h.share_percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {blockedHeirs.length > 0 && (
              <Card className="border-destructive/20">
                <CardHeader><CardTitle className="font-serif text-lg text-destructive">{t("reports_blocked_heirs")}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>{t("reports_heir")}</TableHead><TableHead>{t("reports_relationship")}</TableHead><TableHead>{t("reports_reason")}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {blockedHeirs.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>{h.heirs?.name}</TableCell>
                          <TableCell>{t(getRelationshipKey(h.relationship))}</TableCell>
                          <TableCell><Badge variant="destructive">{h.blocked_by}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
