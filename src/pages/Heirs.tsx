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
import { getRelationshipKey } from "@/i18n";
import { Constants } from "@/integrations/supabase/types";
import type { Tables, Database } from "@/integrations/supabase/types";

type Heir = Tables<"heirs">;
type HeirRelationship = Database["public"]["Enums"]["heir_relationship"];

const relationships = Constants.public.Enums.heir_relationship;

export default function Heirs() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Heir | null>(null);
  const [form, setForm] = useState({ name: "", relationship: "son" as HeirRelationship, phone: "", email: "" });

  const fetchHeirs = async () => {
    if (!user) return;
    const { data } = await supabase.from("heirs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setHeirs(data || []);
  };

  useEffect(() => { fetchHeirs(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = { ...form, user_id: user.id };

    if (editing) {
      const { error } = await supabase.from("heirs").update(payload).eq("id", editing.id);
      if (error) { toast({ title: t("common_error"), description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("heirs").insert(payload);
      if (error) { toast({ title: t("common_error"), description: error.message, variant: "destructive" }); return; }
    }
    setOpen(false); setEditing(null); setForm({ name: "", relationship: "son", phone: "", email: "" });
    fetchHeirs();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("heirs").delete().eq("id", id);
    fetchHeirs();
  };

  const openEdit = (heir: Heir) => {
    setEditing(heir);
    setForm({ name: heir.name, relationship: heir.relationship, phone: heir.phone || "", email: heir.email || "" });
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">{t("heirs_title")}</h1>
            <p className="text-muted-foreground">{heirs.length} {t("heirs_count")}</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: "", relationship: "son", phone: "", email: "" }); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> {t("heirs_add")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-serif">{editing ? t("heirs_edit") : t("heirs_add")}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>{t("heirs_name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>{t("heirs_relationship")}</Label>
                  <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v as HeirRelationship })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{relationships.map((r) => <SelectItem key={r} value={r}>{t(getRelationshipKey(r))}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{t("heirs_phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("heirs_email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <Button type="submit" className="w-full">{editing ? t("heirs_update") : t("heirs_add_btn")} </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-primary/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("heirs_name")}</TableHead>
                  <TableHead>{t("heirs_relationship")}</TableHead>
                  <TableHead>{t("heirs_contact")}</TableHead>
                  <TableHead className="text-right">{t("heirs_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heirs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("heirs_no_heirs")}</TableCell></TableRow>
                ) : heirs.map((heir) => (
                  <TableRow key={heir.id}>
                    <TableCell className="font-medium">{heir.name}</TableCell>
                    <TableCell>{t(getRelationshipKey(heir.relationship))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{heir.email || heir.phone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(heir)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(heir.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
