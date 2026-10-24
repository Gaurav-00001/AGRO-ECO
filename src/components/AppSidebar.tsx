import { LayoutDashboard, Wheat, Palmtree, TrendingUp, Sprout, Calculator, LogOut, Clock } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppSidebar() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isMobile = useIsMobile();

  // Auto-close mobile sidebar on route change (reliable fix for nav click)
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const items = [
    { title: t('dashboard'), url: '/', icon: LayoutDashboard },
    { title: t('wheatManagement'), url: '/wheat', icon: Wheat },
    { title: t('oilPalmAnalytics'), url: '/oil-palm', icon: Palmtree },
    { title: t('marketInsights'), url: '/market', icon: TrendingUp },
    { title: t('profitPlanner'), url: '/profit-planner', icon: Calculator },
    { title: t('cropAdvisory'), url: '/advisory', icon: Sprout },
    { title: t('activityTimeline'), url: '/activity', icon: Clock },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-primary font-bold text-base px-3 py-4">
            {!collapsed && '🌾 AgroEco'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => { handleNavClick(); signOut(); }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && t('logout')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
