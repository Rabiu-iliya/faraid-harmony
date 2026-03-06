import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import gadoproLogo from "@/assets/gadopro-logo.png";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (session) navigate("/dashboard");
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: t("auth_reset_email_sent"), description: t("auth_reset_email_desc") });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: t("auth_account_created"), description: t("auth_check_email") });
      }
    } catch (error: any) {
      toast({ title: t("auth_error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center islamic-pattern bg-background p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <img src={gadoproLogo} alt="GadoPro" className="mx-auto mb-4 h-16 w-16" />
          <CardTitle className="font-serif text-3xl text-primary">{t("auth_app_name")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {mode === "forgot" ? t("auth_enter_email") : mode === "login" ? t("auth_sign_in_desc") : t("auth_sign_up_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth_full_name")}</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth_email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth_password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth_loading") : mode === "forgot" ? t("auth_send_reset") : mode === "login" ? t("auth_sign_in") : t("auth_sign_up")}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-3 text-center">
              <button type="button" onClick={() => setMode("forgot")} className="text-sm text-secondary hover:underline">
                {t("auth_forgot_password")}
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            {mode === "forgot" ? (
              <button type="button" onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                {t("auth_back_to_login")}
              </button>
            ) : (
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-primary hover:underline">
                {mode === "login" ? t("auth_no_account") : t("auth_has_account")}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
