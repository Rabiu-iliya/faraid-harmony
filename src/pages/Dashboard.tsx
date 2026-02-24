import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Users, Calculator, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ assets: 0, heirs: 0, calculations: 0, totalValue: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [assetsRes, heirsRes, calcsRes] = await Promise.all([
        supabase.from("assets").select("value").eq("user_id", user.id),
        supabase.from("heirs").select("id").eq("user_id", user.id),
        supabase.from("calculations").select("id").eq("user_id", user.id),
      ]);
      const totalValue = (assetsRes.data || []).reduce((sum, a) => sum + Number(a.value), 0);
      setStats({
        assets: assetsRes.data?.length || 0,
        heirs: heirsRes.data?.length || 0,
        calculations: calcsRes.data?.length || 0,
        totalValue,
      });
    };
    fetchStats();
  }, [user]);

  const cards = [
    { title: "Total Assets", value: stats.assets, icon: Coins, desc: `Total value: ${stats.totalValue.toLocaleString()}` },
    { title: "Heirs", value: stats.heirs, icon: Users, desc: "Registered heirs" },
    { title: "Calculations", value: stats.calculations, icon: Calculator, desc: "Completed calculations" },
    { title: "Reports", value: stats.calculations, icon: FileText, desc: "Generated reports" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to GadoPro — Islamic Inheritance Distribution</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title} className="border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
