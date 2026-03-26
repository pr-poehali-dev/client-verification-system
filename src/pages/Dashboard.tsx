import Icon from '@/components/ui/icon';
import { Employee, formatMoney, INITIAL_TRANSACTIONS, INITIAL_ACCOUNTS, INITIAL_CLIENTS } from '@/lib/store';

interface DashboardProps {
  employee: Employee;
  onNavigate: (page: string) => void;
  transactions: typeof INITIAL_TRANSACTIONS;
  clients: typeof INITIAL_CLIENTS;
  accounts: typeof INITIAL_ACCOUNTS;
}

export default function Dashboard({ employee, onNavigate, transactions, clients, accounts }: DashboardProps) {
  const todayTx = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const totalCashOut = todayTx.filter((t) => t.type === 'cash_out').reduce((s, t) => s + (t.amount || 0), 0);
  const totalCashIn = todayTx.filter((t) => t.type === 'cash_in').reduce((s, t) => s + (t.amount || 0), 0);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const quickActions = [
    { id: 'cash_out', label: 'Выдача наличных', icon: 'ArrowUpFromLine', color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    { id: 'cash_in', label: 'Взнос наличных', icon: 'ArrowDownToLine', color: 'text-green-400', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    { id: 'transfer', label: 'Перевод', icon: 'ArrowLeftRight', color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { id: 'queue', label: 'Очередь', icon: 'Users', color: 'text-yellow-400', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
    { id: 'clients', label: 'Клиенты', icon: 'UserCheck', color: 'text-purple-400', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)' },
    { id: 'credit', label: 'Кредит', icon: 'Landmark', color: 'text-orange-400', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Добро пожаловать, <span className="neon-text">{employee.name.split(' ')[1]}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employee.roleLabel} • {employee.window}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot online" />
          <span className="text-xs text-muted-foreground mono">СИСТЕМА АКТИВНА</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Операций сегодня', value: String(todayTx.length), icon: 'Activity', color: 'text-green-400', sub: 'транзакций' },
          { label: 'Выдано наличных', value: formatMoney(totalCashOut), icon: 'ArrowUpFromLine', color: 'text-red-400', sub: 'сегодня' },
          { label: 'Принято наличных', value: formatMoney(totalCashIn), icon: 'ArrowDownToLine', color: 'text-green-400', sub: 'сегодня' },
          { label: 'Клиентов в базе', value: String(clients.length), icon: 'Users', color: 'text-blue-400', sub: 'записей' },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <Icon name={stat.icon} fallback="Circle" size={16} className={stat.color} />
            </div>
            <div className="text-lg font-bold text-foreground mono">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mono mb-3">Быстрые операции</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: action.bg,
                borderColor: action.border,
              }}
            >
              <Icon name={action.icon} fallback="Circle" size={22} className={action.color} />
              <span className="text-xs text-foreground font-medium text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icon name="History" size={16} className="text-green-400" />
              Последние операции
            </h3>
            <button onClick={() => onNavigate('transactions')} className="text-xs text-green-400 hover:underline">
              Все →
            </button>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${tx.type === 'cash_out' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    <Icon name={tx.type === 'cash_out' ? 'ArrowUpFromLine' : 'ArrowDownToLine'} size={12}
                      className={tx.type === 'cash_out' ? 'text-red-400' : 'text-green-400'} />
                  </div>
                  <div>
                    <div className="text-xs text-foreground font-medium">{tx.typeLabel}</div>
                    <div className="text-[10px] text-muted-foreground">{tx.clientName.split(' ')[0]} {tx.clientName.split(' ')[1]}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold mono ${tx.type === 'cash_out' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.amount ? formatMoney(tx.amount) : '—'}
                  </div>
                  <div className={`text-[10px] ${tx.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.status === 'success' ? '✓ Выполнено' : '✗ Ошибка'}
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Операций пока нет</p>
            )}
          </div>
        </div>

        {/* System status */}
        <div className="glass-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Icon name="Activity" size={16} className="text-green-400" />
            Статус системы
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Ядро АС ЕФС', status: 'OK', color: 'text-green-400' },
              { label: 'База данных', status: 'OK', color: 'text-green-400' },
              { label: 'Криптография', status: 'OK', color: 'text-green-400' },
              { label: 'Терминал Сбер', status: 'ОЖИДАНИЕ', color: 'text-yellow-400' },
              { label: 'SWIFT/МПС', status: 'OK', color: 'text-green-400' },
              { label: 'ФНС/ЦБ РФ', status: 'OK', color: 'text-green-400' },
            ].map((sys, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{sys.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`status-dot ${sys.status === 'OK' ? 'online' : ''}`}
                    style={sys.status !== 'OK' ? { background: '#eab308', boxShadow: '0 0 8px rgba(234,179,8,0.8)' } : {}} />
                  <span className={`text-[10px] mono font-semibold ${sys.color}`}>{sys.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Последняя синхронизация</span>
              <span className="mono text-foreground">{new Date().toLocaleTimeString('ru-RU')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
