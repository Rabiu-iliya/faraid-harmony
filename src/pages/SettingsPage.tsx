import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: "en", name: "English" }, { code: "ha", name: "Hausa" },
  { code: "ar", name: "Arabic" }, { code: "fr", name: "French" }, { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" }, { code: "tr", name: "Turkish" }, { code: "ur", name: "Urdu" },
  { code: "ms", name: "Malay" }, { code: "id", name: "Indonesian" }, { code: "sw", name: "Swahili" },
  { code: "bn", name: "Bengali" }, { code: "hi", name: "Hindi" }, { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" }, { code: "de", name: "German" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "it", name: "Italian" }, { code: "nl", name: "Dutch" },
];

const currencies = [
  { code: "NGN", name: "Nigerian Naira" }, { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" }, { code: "GBP", name: "British Pound" },
  { code: "SAR", name: "Saudi Riyal" }, { code: "AED", name: "UAE Dirham" },
  { code: "MYR", name: "Malaysian Ringgit" }, { code: "IDR", name: "Indonesian Rupiah" },
  { code: "TRY", name: "Turkish Lira" }, { code: "PKR", name: "Pakistani Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" }, { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" }, { code: "CNY", name: "Chinese Yuan" },
  { code: "KRW", name: "South Korean Won" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { t, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [prefs, setPrefs] = useState({ language: "en", currency: "USD" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
    ]).then(([p, pr]) => {
      if (p.data) setProfile({ full_name: p.data.full_name, phone: p.data.phone || "" });
      if (pr.data) setPrefs({ language: pr.data.language, currency: pr.data.currency });
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update(profile).eq("user_id", user.id);
    toast({ title: t("settings_profile_updated") });
    setLoading(false);
  };

  const savePrefs = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("user_preferences").update(prefs).eq("user_id", user.id);
    setLanguage(prefs.language);
    toast({ title: t("settings_prefs_updated") });
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-primary">{t("settings_title")}</h1>

        <Card className="border-primary/10">
          <CardHeader><CardTitle className="font-serif">{t("settings_profile")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>{t("settings_full_name")}</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("settings_phone")}</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("settings_email")}</Label><Input value={user?.email || ""} disabled /></div>
            <Button onClick={saveProfile} disabled={loading}>{t("settings_save_profile")}</Button>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader><CardTitle className="font-serif">{t("settings_language")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings_display_language")}</Label>
              <Select value={prefs.language} onValueChange={(v) => setPrefs({ ...prefs, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{languages.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("settings_language_note")}</p>
            </div>
            <Button onClick={savePrefs} disabled={loading}>{t("settings_save_language")}</Button>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader><CardTitle className="font-serif">{t("settings_currency")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings_default_currency")}</Label>
              <Select value={prefs.currency} onValueChange={(v) => setPrefs({ ...prefs, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("settings_currency_note")}</p>
            </div>
            <Button onClick={savePrefs} disabled={loading}>{t("settings_save_currency")}</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
