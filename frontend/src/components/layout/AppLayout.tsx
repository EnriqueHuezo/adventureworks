'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Receipt, 
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['GERENTE', 'ADMINISTRADOR'] },
  { title: 'Facturación', href: '/facturacion', icon: Receipt },
  { title: 'Historial del Día', href: '/historial', icon: History, roles: ['CAJERO'] },
  { title: 'Reportes', href: '/reportes', icon: FileText, roles: ['GERENTE', 'ADMINISTRADOR'] },
  { title: 'Productos', href: '/productos', icon: Package, roles: ['GERENTE', 'ADMINISTRADOR'] },
  { title: 'Proveedores', href: '/proveedores', icon: Building2, roles: ['GERENTE', 'ADMINISTRADOR'] },
  { title: 'Clientes', href: '/clientes', icon: Users },
  { title: 'Usuarios', href: '/usuarios', icon: UserCircle, roles: ['ADMINISTRADOR'] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role));
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="font-semibold">AdventureWorks</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <UserCircle className="h-5 w-5" />
          </Button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg p-2">
              <div className="px-3 py-2 border-b mb-2">
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => router.push('/cuenta')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                Ver cuenta
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md"
              >
                Cerrar sesión
              </button>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block sticky top-0 z-50 border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">AdventureWorks</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.roles.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={cn(
          'hidden lg:block fixed left-0 top-[57px] h-[calc(100vh-57px)] bg-sidebar border-r transition-all duration-300 z-30',
          sidebarOpen ? 'w-64' : 'w-16'
        )}>
          <div className="p-4 border-b flex items-center justify-between">
            {sidebarOpen && <h1 className="font-bold text-lg">Facturación</h1>}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto"
            >
              <ChevronRight className={cn('h-5 w-5 transition-transform', sidebarOpen && 'rotate-180')} />
            </Button>
          </div>
          <nav className="p-2 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-2 border-t">
            {sidebarOpen && user && (
              <div className="px-3 py-2 mb-2">
                <p className="font-medium text-sm">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.roles.join(', ')}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size={sidebarOpen ? 'default' : 'icon'}
              className="w-full justify-start"
              onClick={() => router.push('/cuenta')}
            >
              <Settings className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Cuenta</span>}
            </Button>
            <Button
              variant="ghost"
              size={sidebarOpen ? 'default' : 'icon'}
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Cerrar sesión</span>}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
            <aside 
              className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <h1 className="font-bold text-lg">AdventureWorks</h1>
              </div>
              <nav className="p-2 space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 transition-all duration-300',
          'lg:ml-16',
          sidebarOpen && 'lg:ml-64'
        )}>
          <div className="p-4 lg:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

