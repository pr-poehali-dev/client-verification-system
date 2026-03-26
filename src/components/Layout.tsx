import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Employee } from '@/lib/store';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  employee: Employee;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Главная', icon: 'LayoutDashboard' },
  { id: 'queue', label: 'Электронная очередь', icon: 'Users' },
  { id: 'cash_out', label: 'Выдача наличных', icon: 'ArrowUpFromLine' },
  { id: 'cash_in', label: 'Взнос наличных', icon: 'ArrowDownToLine' },
  { id: 'transfer', label: 'Перевод', icon: 'ArrowLeftRight' },
  { id: 'transactions', label: 'История операций', icon: 'History' },
  { id: 'clients', label: 'Клиентская база', icon: 'UserCheck' },
  { id: 'accounts', label: 'Счета', icon: 'CreditCard' },
  { id: 'credit', label: 'Кредиты и рассрочка', icon: 'Landmark' },
  { id: 'reports', label: 'Отчёты и аналитика', icon: 'BarChart3' },
  { id: 'terminal', label: 'Терминал Сбер', icon: 'Wifi' },
  { id: 'profile', label: 'Личный кабинет', icon: 'UserCog' },
];

export default function Layout({ children, currentPage, onNavigate, employee, onLogout }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex h-screen bg-background overflow-hidden grid-bg">
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 border-r border-border bg-[hsl(220,20%,5%)] ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--neon)', boxShadow: 'var(--neon-glow)' }}>
            <span className="text-black font-bold text-xs mono">АС</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="neon-text font-bold text-sm leading-tight">ЕФС СБОЛ.про</div>
              <div className="text-muted-foreground text-[10px] mono">v2.4.1 SECURE</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded text-left transition-all duration-150 text-sm
                ${currentPage === item.id
                  ? 'nav-active font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} fallback="Circle" size={16} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Employee info */}
        <div className={`border-t border-border p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="text-xs text-muted-foreground mono">{employee.window}</span>
              </div>
              <div className="text-xs text-foreground font-medium truncate">{employee.name.split(' ')[0]} {employee.name.split(' ')[1]}</div>
              <div className="badge-secure">{employee.roleLabel}</div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
              >
                <Icon name="LogOut" size={12} />
                Выйти из системы
              </button>
            </div>
          ) : (
            <button onClick={onLogout} className="text-muted-foreground hover:text-destructive">
              <Icon name="LogOut" size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-[hsl(220,20%,7%)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={collapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={18} />
            </button>
            <div className="text-xs mono text-muted-foreground hidden sm:flex items-center gap-2">
              <Icon name="Shield" size={12} className="text-green-500" />
              <span>СОЕДИНЕНИЕ ЗАЩИЩЕНО • TLS 1.3</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs mono text-muted-foreground hidden md:block">
              <span className="neon-text">{timeStr}</span>
              <span className="ml-2">{dateStr}</span>
            </div>
            <div className="badge-secure">ID: {employee.id.toUpperCase()}</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}