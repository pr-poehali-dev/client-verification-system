import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Client, Account, formatMoney } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface ClientsPageProps {
  clients: Client[];
  setClients: (c: Client[]) => void;
  accounts: Account[];
  setAccounts: (a: Account[]) => void;
}

export default function ClientsPage({ clients, setClients, accounts, setAccounts }: ClientsPageProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addAccountFor, setAddAccountFor] = useState<string | null>(null);

  const [newClient, setNewClient] = useState({ fullName: '', phone: '', passport: '', birthDate: '', address: '' });
  const [newAccType, setNewAccType] = useState<Account['type']>('текущий');

  const filtered = clients.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.passport.includes(search)
  );

  const handleAddClient = async () => {
    if (!newClient.fullName || !newClient.phone || !newClient.passport) {
      toast({ title: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }
    try {
      const created = await api.clients.create(newClient);
      setClients([...clients, { ...created }]);
      setNewClient({ fullName: '', phone: '', passport: '', birthDate: '', address: '' });
      setShowAddClient(false);
      toast({ title: 'Клиент добавлен', description: created.fullName });
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    }
  };

  const handleAddAccount = async () => {
    const clientId = addAccountFor || selected?.id;
    if (!clientId) return;
    try {
      const acc = await api.accounts.create({ clientId, type: newAccType });
      setAccounts([...accounts, acc]);
      const updated = clients.map((c) =>
        c.id === clientId ? { ...c, accounts: [...c.accounts, acc.id] } : c
      );
      setClients(updated);
      if (selected?.id === clientId) {
        setSelected({ ...selected, accounts: [...selected.accounts, acc.id] });
      }
      setShowAddAccount(false);
      setAddAccountFor(null);
      toast({ title: 'Счёт открыт', description: acc.number });
    } catch {
      toast({ title: 'Ошибка создания счёта', variant: 'destructive' });
    }
  };

  const clientAccounts = selected ? accounts.filter((a) => a.clientId === selected.id) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Клиентская база</h1>
          <p className="text-sm text-muted-foreground">{clients.length} клиентов</p>
        </div>
        <button onClick={() => setShowAddClient(true)} className="neon-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <Icon name="UserPlus" size={16} />
          Добавить клиента
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по ФИО, телефону, паспорту..."
          className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.map((client) => {
            const cAccounts = accounts.filter((a) => a.clientId === client.id);
            return (
              <div
                key={client.id}
                onClick={() => setSelected(client)}
                className={`glass-card rounded-xl border p-4 cursor-pointer transition-all duration-200 ${selected?.id === client.id ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <span className="text-sm font-bold neon-text">{client.fullName[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.fullName}</p>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] mono text-muted-foreground">{cAccounts.length} счёт(а)</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Icon name="UserX" size={32} className="mx-auto mb-2 opacity-30" />
              Клиенты не найдены
            </div>
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="glass-card rounded-xl border border-border p-5 animate-scale-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">{selected.fullName}</h2>
                <p className="text-xs text-muted-foreground mono">{selected.passport}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: 'Телефон', value: selected.phone, icon: 'Phone' },
                { label: 'Паспорт', value: selected.passport, icon: 'FileText' },
                { label: 'Дата рождения', value: selected.birthDate || '—', icon: 'Calendar' },
                { label: 'Адрес', value: selected.address || '—', icon: 'MapPin' },
                { label: 'Дата регистрации', value: selected.createdAt, icon: 'Clock' },
              ].map((field) => (
                <div key={field.label} className="flex items-start gap-2">
                  <Icon name={field.icon} fallback="Circle" size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground">{field.label}: </span>
                    <span className="text-xs text-foreground">{field.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Accounts */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground mono uppercase">Счета клиента</h3>
                <button
                  onClick={() => { setAddAccountFor(selected.id); setShowAddAccount(true); }}
                  className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  <Icon name="Plus" size={12} />
                  Открыть счёт
                </button>
              </div>
              {clientAccounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Счетов нет</p>
              ) : (
                <div className="space-y-1.5">
                  {clientAccounts.map((acc) => (
                    <div key={acc.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] mono text-muted-foreground">{acc.number}</span>
                        <span className="badge-secure">{acc.type}</span>
                      </div>
                      <p className="text-sm font-semibold neon-text mono mt-0.5">{formatMoney(acc.balance)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center">
            <Icon name="UserCheck" size={40} className="text-muted-foreground mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">Выберите клиента для просмотра деталей</p>
          </div>
        )}
      </div>

      {/* Add client modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl border border-border w-full max-w-md animate-scale-in p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">Новый клиент</h2>
              <button onClick={() => setShowAddClient(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'ФИО *', key: 'fullName', placeholder: 'Иванов Иван Иванович' },
                { label: 'Телефон *', key: 'phone', placeholder: '+7 (___) ___-__-__' },
                { label: 'Паспорт *', key: 'passport', placeholder: '0000 000000' },
                { label: 'Дата рождения', key: 'birthDate', placeholder: 'ГГГГ-ММ-ДД' },
                { label: 'Адрес', key: 'address', placeholder: 'г. Москва, ул. ...' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-muted-foreground mb-1 mono uppercase">{field.label}</label>
                  <input
                    type="text"
                    value={newClient[field.key as keyof typeof newClient]}
                    onChange={(e) => setNewClient({ ...newClient, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500"
                  />
                </div>
              ))}
              <button onClick={handleAddClient} className="neon-btn w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 mt-2">
                <Icon name="UserPlus" size={16} />
                Добавить клиента
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add account modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl border border-border w-full max-w-sm animate-scale-in p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">Открыть счёт</h2>
              <button onClick={() => { setShowAddAccount(false); setAddAccountFor(null); }} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Тип счёта</label>
                <select value={newAccType} onChange={(e) => setNewAccType(e.target.value as Account['type'])}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500">
                  <option value="текущий">Текущий</option>
                  <option value="сберегательный">Сберегательный</option>
                  <option value="кредитный">Кредитный</option>
                  <option value="карточный">Карточный</option>
                </select>
              </div>
              <button onClick={handleAddAccount} className="neon-btn w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
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