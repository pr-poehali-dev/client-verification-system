import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Transaction, formatMoney, formatDate } from '@/lib/store';

interface TransactionsPageProps {
  transactions: Transaction[];
}

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  cash_out: { label: 'Выдача наличных', color: 'text-red-400', icon: 'ArrowUpFromLine' },
  cash_in: { label: 'Взнос наличных', color: 'text-green-400', icon: 'ArrowDownToLine' },
  transfer: { label: 'Перевод', color: 'text-blue-400', icon: 'ArrowLeftRight' },
  card_issue: { label: 'Выпуск карты', color: 'text-purple-400', icon: 'CreditCard' },
  credit: { label: 'Кредит', color: 'text-orange-400', icon: 'Landmark' },
};

export default function TransactionsPage({ transactions }: TransactionsPageProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((t) => {
    const matchType = filter === 'all' || t.type === filter;
    const matchSearch = t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (t.docNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchType && matchSearch;
  });

  const totalOut = transactions.filter((t) => t.type === 'cash_out').reduce((s, t) => s + (t.amount || 0), 0);
  const totalIn = transactions.filter((t) => t.type === 'cash_in').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">История операций</h1>
        <p className="text-sm text-muted-foreground">{transactions.length} транзакций в базе</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Всего операций</p>
          <p className="text-2xl font-bold mono text-foreground">{transactions.length}</p>
        </div>
        <div className="glass-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Выдано наличных</p>
          <p className="text-lg font-bold mono text-red-400">{formatMoney(totalOut)}</p>
        </div>
        <div className="glass-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Принято наличных</p>
          <p className="text-lg font-bold mono text-green-400">{formatMoney(totalIn)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клиенту или номеру..."
            className="w-full bg-muted border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'Все' },
            { id: 'cash_out', label: 'Выдача' },
            { id: 'cash_in', label: 'Взнос' },
            { id: 'transfer', label: 'Перевод' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.id ? 'neon-btn' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">Тип</th>
                <th className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">Клиент</th>
                <th className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">Сумма</th>
                <th className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">Документ</th>
                <th className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">Дата</th>
                <th className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const cfg = TYPE_LABELS[tx.type] || { label: tx.typeLabel, color: 'text-foreground', icon: 'Circle' };
                return (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon name={cfg.icon} fallback="Circle" size={13} className={cfg.color} />
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground font-medium">{tx.clientName.split(' ')[0]} {tx.clientName.split(' ')[1]}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.employeeName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold mono ${tx.type === 'cash_out' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.amount ? formatMoney(tx.amount) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] mono text-muted-foreground">{tx.docNumber || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] mono text-muted-foreground">{formatDate(tx.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'success' ? (
                        <span className="badge-secure">✓ OK</span>
                      ) : tx.status === 'error' ? (
                        <span className="badge-danger">✗ ERR</span>
                      ) : (
                        <span className="badge-warning">⏳ ...</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="History" size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Нет операций по выбранным фильтрам</p>
          </div>
        )}
      </div>
    </div>
  );
}
