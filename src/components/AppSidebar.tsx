import { Home, ShoppingCart, Megaphone, BarChart3, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Wholesale", url: "/wholesale", icon: ShoppingCart },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Impact", url: "/ads-dashboard", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className="w-60">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          <img 
            src="/lovable-uploads/16b7eb00-ca19-4bc1-96c7-0ea3abc83cb2.png" 
            alt="Grog One Logo" 
            className="h-12 w-auto"
          />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} end className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${getNavCls({ isActive: isActive(item.url) })}`}>
                    <item.icon className="h-4 w-4" />
                    <span className="ml-2">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}