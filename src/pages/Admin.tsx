import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Coins, Calculator, Trash2 } from "lucide-react";

type UserProfile = { user_id: string; full_name: string; phone: string | null; created_at: string };
type CalcRow = { id: string; title: string; total_estate: number; currency: string; created_at: string; user_id: string };

export default function Admin() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [calculations, setCalculations] = useState<CalcRow[]>([]);
  const [stats, setStats] = useState({ users: 0, cases: 0, totalAssets: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      const admin = (data && data.length > 0);
      setIsAdmin(admin);
      if (admin) fetchAll();
      setLoading(false);
    });
  }, [user]);

  const fetchAll = async () => {
    const [profilesRes, calcsRes, assetsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("calculations").select("*").order("created_at", { ascending: false }),
      supabase.from("assets").select("value"),
    ]);
    setUsers(profilesRes.data || []);
    setCalculations(calcsRes.data || []);
    const totalAssets = (assetsRes.data || []).reduce((s, a) => s + Number(a.value), 0);
    setStats({
      users: profilesRes.data?.length || 0,
      cases: calcsRes.data?.length || 0,
      totalAssets,
    });
  };

  const deleteCase = async (calcId: string) => {
    await supabase.from("calculation_heirs").delete().eq("calculation_id", calcId);
    await supabase.from("calculations").delete().eq("id", calcId);
    toast({ title: t("admin_case_deleted") });
    fetchAll();
  };

  if (loading) return <DashboardLayout><p className="text-muted-foreground p-6">Loading...</p></DashboardLayout>;
  if (!isAdmin) return <DashboardLayout><Card className="border-destructive/20"><CardContent className="py-12 text-center"><Shield className="mx-auto h-12 w-12 text-destructive mb-4" /><h2 className="font-serif text-xl text-destructive">{t("admin_access_denied")}</h2><p className="text-muted-foreground mt-2">{t("admin_access_denied_desc")}</p></CardContent></Card></DashboardLayout>;

  const statCards = [
    { title: t("admin_total_users"), value: stats.users, icon: Users },
    { title: t("admin_total_cases"), value: stats.cases, icon: Calculator },
    { title: t("admin_total_assets_value"), value: stats.totalAssets.toLocaleString(), icon: Coins },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl font-bold text-primary">{t("admin_title")}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((c) => (
            <Card key={c.title} className="border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-primary">{c.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">{t("admin_users_tab")}</TabsTrigger>
            <TabsTrigger value="cases">{t("admin_cases_tab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-primary/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin_user_name")}</TableHead>
                      <TableHead>{t("admin_user_phone")}</TableHead>
                      <TableHead>{t("admin_user_joined")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases">
            <Card className="border-primary/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin_case_title")}</TableHead>
                      <TableHead>{t("admin_case_estate")}</TableHead>
                      <TableHead>{t("admin_case_date")}</TableHead>
                      <TableHead className="text-right">{t("assets_actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{Number(c.total_estate).toLocaleString()} {c.currency}</TableCell>
                        <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("admin_delete_case_title")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("admin_delete_case_desc")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("admin_cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCase(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("admin_delete")}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
