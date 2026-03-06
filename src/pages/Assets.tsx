import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getCategoryKey } from "@/i18n";
import { formatCurrency, parseNumericValue } from "@/lib/currency";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type Asset = Tables<"assets">;
type AssetCategory = Database["public"]["Enums"]["asset_category"];

const categoryValues: AssetCategory[] = ["cash", "real_estate", "jewelry", "valuables", "other"];

export default function Assets() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState({ name: "", category: "other" as AssetCategory, value: "", description: "", currency: "USD" });
  const [displayValue, setDisplayValue] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  const fetchAssets = async () => {
    if (!user) return;
    const { data } = await supabase.from("assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAssets(data || []);
  };

  useEffect(() => {
    if (!user) return;
    fetchAssets();
    supabase.from("user_preferences").select("currency").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.currency) {
        setDefaultCurrency(data.currency);
        setForm(f => ({ ...f, currency: data.currency }));
      }
    });
  }, [user]);

  const handleValueChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setForm({ ...form, value: cleaned });
    setDisplayValue(cleaned);
  };

  const handleValueBlur = () => {
    const num = parseNumericValue(form.value);
    if (num > 0) {
      setDisplayValue(formatCurrency(num, form.currency));
    }
  };

  const handleValueFocus = () => {
    setDisplayValue(form.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = { name: form.name, category: form.category, value: Number(form.value), description: form.description, user_id: user.id, currency: form.currency };

    if (editing) {
      const { error } = await supabase.from("assets").update(payload).eq("id", editing.id);
      if (error) { toast({ title: t("common_error"), description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("assets").insert(payload);
      if (error) { toast({ title: t("common_error"), description: error.message, variant: "destructive" }); return; }
    }
    setOpen(false); setEditing(null); resetForm();
    fetchAssets();
  };

  const resetForm = () => {
    setForm({ name: "", category: "other", value: "", description: "", currency: defaultCurrency });
    setDisplayValue("");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("assets").delete().eq("id", id);
    fetchAssets();
  };

  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setForm({ name: asset.name, category: asset.category, value: String(asset.value), description: asset.description || "", currency: asset.currency });
    setDisplayValue(formatCurrency(Number(asset.value), asset.currency));
    setOpen(true);
  };

  const total = assets.reduce((sum, a) => sum + Number(a.value), 0);

  const currencies = [
    { code: "NGN", label: "₦ NGN" }, { code: "USD", label: "$ USD" }, { code: "EUR", label: "€ EUR" },
    { code: "GBP", label: "£ GBP" }, { code: "SAR", label: "﷼ SAR" }, { code: "AED", label: "د.إ AED" },
    { code: "MYR", label: "RM MYR" }, { code: "IDR", label: "Rp IDR" }, { code: "TRY", label: "₺ TRY" },
    { code: "PKR", label: "₨ PKR" }, { code: "BDT", label: "৳ BDT" }, { code: "INR", label: "₹ INR" },
    { code: "JPY", label: "¥ JPY" }, { code: "CNY", label: "¥ CNY" }, { code: "KRW", label: "₩ KRW" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">{t("assets_title")}</h1>
            <p className="text-muted-foreground">{t("assets_total_estate")}: <span className="font-bold text-secondary">{formatCurrency(total, defaultCurrency)}</span></p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> {t("assets_add")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-serif">{editing ? t("assets_edit") : t("assets_add")}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>{t("assets_name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>{t("assets_category")}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as AssetCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categoryValues.map((c) => <SelectItem key={c} value={c}>{t(getCategoryKey(c))}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("assets_currency")}</Label>
                  <Select value={form.currency} onValueChange={(v) => { setForm({ ...form, currency: v }); if (form.value) setDisplayValue(formatCurrency(Number(form.value), v)); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("assets_value")}</Label>
                  <Input
                    value={displayValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    onBlur={handleValueBlur}
                    onFocus={handleValueFocus}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2"><Label>{t("assets_description")}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button type="submit" className="w-full">{editing ? t("assets_update") : t("assets_add_btn")}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-primary/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("assets_name")}</TableHead>
                  <TableHead>{t("assets_category")}</TableHead>
                  <TableHead className="text-right">{t("assets_value")}</TableHead>
                  <TableHead className="text-right">{t("assets_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("assets_no_assets")}</TableCell></TableRow>
                ) : assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{t(getCategoryKey(asset.category))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(asset.value), asset.currency)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(asset)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
