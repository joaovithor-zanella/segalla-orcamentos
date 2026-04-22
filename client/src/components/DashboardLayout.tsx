import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  ShoppingCart,
  FileText,
  Users,
  CreditCard,
  Settings,
  Package,
  ChevronRight,
  Shield,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";

// ─── Menu Items ───────────────────────────────────────────────────────────────
const menuItems = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: Package, label: "Catálogo de Produtos", path: "/produtos" },
  { icon: ShoppingCart, label: "Novo Orçamento", path: "/orcamentos/novo" },
  { icon: FileText, label: "Meus Orçamentos", path: "/orcamentos" },
];

const adminMenuItems = [
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: CreditCard, label: "Formas de Pagamento", path: "/admin/pagamentos" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Logo Segalla */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--segalla-red) 0%, var(--segalla-red-dark) 100%)" }}>
              <span className="text-white font-black text-3xl tracking-tight">S</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Segalla</h1>
              <p className="text-sm text-muted-foreground">Sistema de Orçamentos</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-sm text-muted-foreground text-center">
              Faça login para acessar o sistema.
            </p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              size="lg"
              className="w-full"
              style={{ background: "var(--segalla-red)" }}
            >
              Entrar no Sistema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "admin";

  // Current page title
  const allMenuItems = [...menuItems, ...(isAdmin ? adminMenuItems : [])];
  const activeMenuItem = allMenuItems.find((item) => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
          style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
        >
          {/* Header com logo Segalla */}
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors focus:outline-none shrink-0"
                style={{ background: "var(--segalla-red)" }}
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-white" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "var(--segalla-red)" }}>
                    <span className="text-white font-black text-sm">S</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-sidebar-foreground truncate">Segalla</p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">Orçamentos</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2">
            {/* Main menu */}
            <SidebarMenu className="px-2 gap-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Admin section */}
            {isAdmin && (
              <>
                {!isCollapsed && (
                  <div className="px-4 pt-4 pb-1">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-sidebar-foreground/40" />
                      <span className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                        Administrador
                      </span>
                    </div>
                  </div>
                )}
                <SidebarMenu className="px-2 gap-0.5">
                  {adminMenuItems.map((item) => {
                    const isActive = location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-10 transition-all font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </>
            )}
          </SidebarContent>

          {/* Footer with user info */}
          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 shrink-0" style={{ background: "var(--segalla-blue)" }}>
                    <AvatarFallback className="text-xs font-bold text-white"
                      style={{ background: "var(--segalla-blue)" }}>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate leading-none">
                        {user?.name || "Usuário"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {isAdmin ? (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-xs text-sidebar-foreground/50 truncate">
                            {user?.email || ""}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top bar */}
        <div className="flex border-b h-14 items-center justify-between bg-card px-4 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {activeMenuItem?.label ?? "Segalla"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{user?.name}</span>
              {isAdmin && (
                <Badge variant="outline" className="text-xs border-primary text-primary">
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 p-6 bg-background min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
