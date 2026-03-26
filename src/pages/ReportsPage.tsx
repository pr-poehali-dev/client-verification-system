import Icon from '@/components/ui/icon';
import { Transaction, formatMoney } from '@/lib/store';

interface ReportsPageProps {
  transactions: Transaction[];
}

export default function ReportsPage({ transactions }: ReportsPageProps) {
  const totalOps = transactions.length;
  const cashOut = transactions.filter((t) => t.type === 'cash_out');
  const cashIn = transactions.filter((t) => t.type === 'cash_in');
  const transfers = transactions.filter((t) => t.type === 'transfer');
  const success = transactions.filter((t) => t.status === 'success').length;

  const totalCashOut = cashOut.reduce((s, t) => s + (t.amount || 0), 0);
  const totalCashIn = cashIn.reduce((s, t) => s + (t.amount || 0), 0);
  const totalTransfer = transfers.reduce((s, t) => s + (t.amount || 0), 0);

  const successRate = totalOps > 0 ? Math.round((success / totalOps) * 100) : 100;

  const stats = [
    { label: 'Всего операций', value: String(totalOps), icon: 'Activity', color: 'text-green-400', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Успешных', value: `${successRate}%`, icon: 'CheckCircle', color: 'text-green-400', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Выдано наличных', value: formatMoney(totalCashOut), icon: 'ArrowUpFromLine', color: 'text-red-400', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Принято наличных', value: formatMoney(totalCashIn), icon: 'ArrowDownToLine', color: 'text-green-400', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Переводы', value: formatMoney(totalTransfer), icon: 'ArrowLeftRight', color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Оборот', value: formatMoney(totalCashOut + totalCashIn + totalTransfer), icon: 'TrendingUp', color: 'text-yellow-400', bg: 'rgba(234,179,8,0.1)' },
  ];

  const opTypes = [
    { label: 'Выдача наличных', count: cashOut.length, amount: totalCashOut, color: '#ef4444', pct: totalOps > 0 ? (cashOut.length / totalOps) * 100 : 0 },
    { label: 'Взнос наличных', count: cashIn.length, amount: totalCashIn, color: '#22c55e', pct: totalOps > 0 ? (cashIn.length / totalOps) * 100 : 0 },
    { label: 'Переводы', count: transfers.length, amount: totalTransfer, color: '#3b82f6', pct: totalOps > 0 ? (transfers.length / totalOps) * 100 : 0 },
  ];

  // Mock hourly data
  const hours = Array.from({ length: 9 }, (_, i) => ({ hour: `${9 + i}:00`, ops: Math.floor(Math.random() * 8) + 1 }));
  const maxOps = Math.max(...hours.map((h) => h.ops));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Отчёты и аналитика</h1>
          <p className="text-sm text-muted-foreground">Операционные показатели за сегодня</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-green-500/40 transition-all">
          <Icon name="Download" size={14} />
          Экспорт отчёта
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="glass-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon name={s.icon} fallback="Circle" size={15} className={s.color} />
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-foreground mono">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="glass-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="BarChart3" size={16} className="text-green-400" />
            Операции по часам
          </h3>
          <div className="flex items-end gap-1.5 h-32">
            {hours.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${(h.ops / maxOps) * 100}%`,
                    background: 'linear-gradient(to top, rgba(34,197,94,0.8), rgba(34,197,94,0.3))',
                    minHeight: '4px',
                  }}
                />
                <span className="text-[8px] mono text-muted-foreground">{h.hour.replace(':00', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operation types */}
        <div className="glass-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="PieChart" size={16} className="text-green-400" />
            Типы операций
          </h3>
          <div className="space-y-4">
            {opTypes.map((op, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{op.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs mono text-muted-foreground">{op.count} шт.</span>
                    <span className="text-xs mono font-semibold" style={{ color: op.color }}>{Math.round(op.pct)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${op.pct}%`, background: op.color, boxShadow: `0 0 8px ${op.color}60` }}
                  />
                </div>
                <p className="text-[10px] mono text-muted-foreground mt-0.5">{formatMoney(op.amount)}</p>
              </div>
            ))}
            {totalOps === 0 && <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>}
          </div>
        </div>
      </div>

      {/* Employees table */}
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Users" size={16} className="text-green-400" />
          Показатели сотрудников
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Сотрудник', 'Роль', 'Операций', 'Оборот', 'Успешность'].map((h) => (
                  <th key={h} className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Тимофеев А.Н.', role: 'Ст. операционист', ops: transactions.filter((t) => t.employeeId === 'emp2').length, turnover: transactions.filter((t) => t.employeeId === 'emp2').reduce((s, t) => s + (t.amount || 0), 0), success: 100 },
                { name: 'Иванова М.С.', role: 'Операционист', ops: transactions.filter((t) => t.employeeId === 'emp1').length, turnover: transactions.filter((t) => t.employeeId === 'emp1').reduce((s, t) => s + (t.amount || 0), 0), success: 100 },
              ].map((emp, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-3 text-sm font-medium text-foreground">{emp.name}</td>
                  <td className="px-3 py-3"><span className="badge-secure">{emp.role}</span></td>
                  <td className="px-3 py-3 text-sm mono text-foreground">{emp.ops}</td>
                  <td className="px-3 py-3 text-sm mono neon-text">{formatMoney(emp.turnover)}</td>
                  <td className="px-3 py-3"><span className="badge-secure">{emp.success}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
