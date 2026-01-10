import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Package, FileText, MessageCircle, BarChart3, Settings, LogOut, Sparkles, Store, Phone, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";

const mainItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Inventory",
  url: "/inventory",
  icon: Package
}, {
  title: "Invoices",
  url: "/invoices",
  icon: FileText
}, {
  title: "WhatsApp",
  url: "/whatsapp",
  icon: MessageCircle
}, {
  title: "Reports",
  url: "/reports",
  icon: BarChart3
}, {
  title: "Profile",
  url: "/profile",
  icon: User
}];
const settingsItems = [{
  title: "Settings",
  url: "/settings",
  icon: Settings
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const { vendor, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground";
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get vendor initials for avatar
  const getInitials = () => {
    if (vendor?.shopName) {
      return vendor.shopName.substring(0, 2).toUpperCase();
    }
    return user?.name?.substring(0, 2).toUpperCase() || "U";
  };

  return <Sidebar className={collapsed ? "w-14" : "w-64"}>
    {/* Header */}
    <SidebarHeader className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        {!collapsed && <div>
          <h2 className="font-bold text-lg">Vyapaar</h2>
          <p className="text-xs text-muted-foreground">AI Business Tools</p>
        </div>}
      </div>
    </SidebarHeader>

    <SidebarContent>
      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupLabel>
          {!collapsed && "Main Menu"}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainItems.map(item => <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} className={getNavClass}>
                  <item.icon className="w-4 h-4" />
                  {!collapsed && <span>{item.title}</span>}
                  {!collapsed && item.title === "Inventory" && <Badge variant="destructive" className="ml-auto text-xs">3</Badge>}
                  {!collapsed && item.title === "WhatsApp" && <Badge variant="secondary" className="ml-auto text-xs">New</Badge>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Settings */}
      <SidebarGroup>
        <SidebarGroupLabel>
          {!collapsed && "Settings"}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {settingsItems.map(item => <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} className={getNavClass}>
                  <item.icon className="w-4 h-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    {/* Footer */}
    <SidebarFooter className="p-4">
      {!collapsed ? <div className="space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{vendor?.shopName || user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{vendor?.email || user?.email || "No email"}</p>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="flex items-center gap-2 p-2 bg-success-muted/50 rounded-lg">
          <Phone className="w-4 h-4 text-success" />
          <span className="text-sm text-inherit">{vendor?.phoneNumber || user?.phone || "+91 XXXXXXXXXX"}</span>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center py-2">
          <ThemeToggle />
        </div>

        {/* Logout */}
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div> : <div className="space-y-2">
        <Avatar className="w-8 h-8 mx-auto">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        <Button variant="ghost" size="icon" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>}
    </SidebarFooter>
  </Sidebar>;
}