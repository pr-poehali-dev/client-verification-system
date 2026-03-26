import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Account, Client, formatMoney } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface AccountsPageProps {
  accounts: Account[];
  setAccounts: (a: Account[]) => void;
  clients: Client[];
  setClients: (c: Client[]) => void;
}

export default function AccountsPage({ accounts, setAccounts, clients, setClients }: AccountsPageProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [accType, setAccType] = useState<Account['type']>('текущий');

  const filtered = accounts.filter((a) => {
    const client = clients.find((c) => c.id === a.clientId);
    return (
      a.number.includes(search) ||
      (client?.fullName.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  });

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const handleAdd = async () => {
    if (!selectedClientId) {
      toast({ title: 'Выберите клиента', variant: 'destructive' });
      return;
    }
    try {
      const acc = await api.accounts.create({ clientId: selectedClientId, type: accType });
      setAccounts([...accounts, acc]);
      const updated = clients.map((c) =>
        c.id === selectedClientId ? { ...c, accounts: [...c.accounts, acc.id] } : c
      );
      setClients(updated);
      setShowAdd(false);
      toast({ title: 'Счёт открыт', description: acc.number });
    } catch {
      toast({ title: 'Ошибка создания счёта', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Счета</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} счетов • Общий баланс: <span className="neon-text mono">{formatMoney(totalBalance)}</span></p>
        </div>
        <button onClick={() => setShowAdd(true)} className="neon-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <Icon name="Plus" size={16} />
          Открыть счёт
        </button>
      </div>

      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по номеру счёта или клиенту..."
          className="w-full bg-muted border border-border rounded-lg pl-8 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500" />
      </div>

      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Счёт', 'Клиент', 'Тип', 'Валюта', 'Баланс', 'Открыт'].map((h) => (
                <th key={h} className="text-left text-[10px] mono text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((acc) => {
              const client = clients.find((c) => c.id === acc.clientId);
              return (
                <tr key={acc.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs mono text-foreground font-medium">{acc.number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground">{client?.fullName || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-secure">{acc.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs mono text-muted-foreground">{acc.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold mono ${acc.balance >= 0 ? 'neon-text' : 'text-red-400'}`}>
                      {formatMoney(acc.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] mono text-muted-foreground">{acc.createdAt}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Icon name="CreditCard" size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Счета не найдены</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl border border-border w-full max-w-sm animate-scale-in p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">Открыть счёт</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Клиент</label>
                <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500">
                  <option value="">Выберите клиента...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Тип счёта</label>
                <select value={accType} onChange={(e) => setAccType(e.target.value as Account['type'])}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500">
                  <option value="текущий">Текущий</option>
                  <option value="сберегательный">Сберегательный</option>
                  <option value="кредитный">Кредитный</option>
                  <option value="карточный">Карточный</option>
                </select>
              </div>
              <button onClick={handleAdd} className="neon-btn w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                <Icon name="Plus" size={16} />
                Открыть счёт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}