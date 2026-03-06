import {
  LayoutDashboard, Coins, Users, Calculator, FileText, Bot, Settings, LogOut, BookOpen, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import gadoproLogo from "@/assets/gadopro-logo.png";
import type { TranslationKey } from "@/i18n";

const navItems: { titleKey: TranslationKey; url: string; icon: any }[] = [
  { titleKey: "nav_dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav_assets", url: "/assets", icon: Coins },
  { titleKey: "nav_heirs", url: "/heirs", icon: Users },
  { titleKey: "nav_calculate", url: "/calculate", icon: Calculator },
  { titleKey: "nav_reports", url: "/reports", icon: FileText },
  { titleKey: "nav_gadobot", url: "/gadobot", icon: Bot },
  { titleKey: "nav_manual", url: "/manual", icon: BookOpen },
  { titleKey: "nav_settings", url: "/settings", icon: Settings },
  { titleKey: "nav_admin", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <Sidebar>
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <img src={gadoproLogo} alt="GadoPro" className="h-9 w-9" />
        <span className="font-serif text-xl font-bold text-sidebar-foreground">GadoPro</span>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">{t("nav_menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav_sign_out")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
