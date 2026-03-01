import { Link, useLocation } from "wouter";
import { 
  Home, 
  CalendarDays, 
  Wallet, 
  ShoppingCart, 
  MessageSquare, 
  BookOpen,
  Target,
  LogOut,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
  { title: "Money", url: "/money", icon: Wallet },
  { title: "Shopping", url: "/groceries", icon: ShoppingCart },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Diary", url: "/diary", icon: BookOpen },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: family } = useFamily();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="inset" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none">{family?.name || "FamilyHub"}</h2>
            <p className="text-xs text-muted-foreground mt-1">Operating System</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 pb-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url} 
                        onClick={() => setOpenMobile(false)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${isActive ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="w-9 h-9 border border-border/50 shadow-sm">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} className="text-muted-foreground hover:text-destructive shrink-0" title="Log out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
