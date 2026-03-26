import Icon from '@/components/ui/icon';
import { Employee } from '@/lib/store';

interface ProfilePageProps {
  employee: Employee;
  onLogout: () => void;
}

export default function ProfilePage({ employee, onLogout }: ProfilePageProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Личный кабинет</h1>

      <div className="glass-card rounded-2xl border border-border p-6" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold neon-text"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', boxShadow: 'var(--neon-glow)' }}>
            {employee.name[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{employee.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-secure">{employee.roleLabel}</span>
              <span className="status-dot online" />
              <span className="text-xs text-muted-foreground mono">ОНЛАЙН</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Идентификатор', value: employee.id, icon: 'Fingerprint' },
            { label: 'Рабочее место', value: employee.window, icon: 'Monitor' },
            { label: 'Роль', value: employee.roleLabel, icon: 'Shield' },
            { label: 'Сессия', value: new Date().toLocaleDateString('ru-RU'), icon: 'Calendar' },
          ].map((field) => (
            <div key={field.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <Icon name={field.icon} fallback="Circle" size={16} className="text-muted-foreground flex-shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-muted-foreground">{field.label}</span>
                <span className="text-xs font-semibold text-foreground mono">{field.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Shield" size={15} className="text-green-400" />
          Безопасность сессии
        </h3>
        <div className="space-y-2">
          {[
            { label: '2-факторная аутентификация', status: 'Активна', ok: true },
            { label: 'Шифрование TLS 1.3', status: 'Включено', ok: true },
            { label: 'Верификация по SMS', status: 'Активна', ok: true },
            { label: 'Журналирование операций', status: 'Включено', ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="status-dot online" />
                <span className="text-xs text-green-400 font-medium">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
      >
        <Icon name="LogOut" size={16} />
        Завершить сеанс и выйти
      </button>
    </div>
  );
}
