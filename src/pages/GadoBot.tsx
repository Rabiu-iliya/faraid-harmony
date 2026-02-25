import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

export default function GadoBot() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("gadobot_welcome") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await supabase.functions.invoke("gadobot", {
        body: { messages: newMessages.map((m) => ({ role: m.role, content: m.content })) },
      });

      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (data?.error) {
        if (data.error.includes("Rate limit")) toast({ title: t("gadobot_rate_limited"), description: t("gadobot_rate_limited_desc"), variant: "destructive" });
        else toast({ title: t("common_error"), description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }
      const reply = data?.choices?.[0]?.message?.content || t("gadobot_fallback");
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast({ title: t("common_error"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-primary mb-4">{t("gadobot_title")}</h1>

        <Card className="flex-1 flex flex-col border-primary/10 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground">{t("gadobot_thinking")}</div>
              </div>
            )}
          </CardContent>
          <div className="border-t p-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("gadobot_placeholder")}
              disabled={loading}
            />
            <Button onClick={send} disabled={loading} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
