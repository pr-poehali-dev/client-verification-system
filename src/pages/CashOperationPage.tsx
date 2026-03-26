import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Client, Account, Transaction, formatMoney, generateDocNumber, generateSmsCode } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface CashOperationPageProps {
  type: 'cash_out' | 'cash_in';
  clients: Client[];
  accounts: Account[];
  setAccounts: (a: Account[]) => void;
  onAddTransaction: (tx: Transaction) => void;
}

function generateOKUD(type: 'cash_out' | 'cash_in', data: { clientName: string; account: string; amount: number; docNumber: string; date: string }) {
  const form = type === 'cash_out' ? 'РАСХОДНЫЙ КАССОВЫЙ ОРДЕР\nОКУД 0402009' : 'ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР\nОКУД 0402008';
  return `${form}\n\nНомер: ${data.docNumber}\nДата: ${data.date}\n\n${type === 'cash_out' ? 'Выдать' : 'Принято от'}: ${data.clientName}\nСумма: ${data.amount.toFixed(2)} руб.\nСчёт: ${data.account}\n\nПодпись: _______________\n\nАС ЕФС СБОЛ.про`;
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function CashOperationPage({ type, clients, accounts, setAccounts, onAddTransaction }: CashOperationPageProps) {
  const { toast } = useToast();
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [step, setStep] = useState<'form' | 'sms' | 'done'>('form');
  const [smsCode, setSmsCode] = useState('');
  const [generatedSms] = useState(generateSmsCode());
  const [docNumber] = useState(generateDocNumber(type === 'cash_out' ? 'ВН' : 'ВЗ'));
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccType, setNewAccType] = useState<Account['type']>('текущий');

  const isCashOut = type === 'cash_out';
  const title = isCashOut ? 'Выдача наличных' : 'Взнос наличных';
  const icon = isCashOut ? 'ArrowUpFromLine' : 'ArrowDownToLine';
  const color = isCashOut ? 'text-red-400' : 'text-green-400';

  const filteredClients = clients.filter((c) =>
    c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch) || c.passport.includes(clientSearch)
  );
  const clientAccounts = selectedClient ? accounts.filter((a) => a.clientId === selectedClient.id) : [];

  const handleCheckAccount = () => {
    const found = accounts.find((a) => a.number === accountNumber);
    if (!found) {
      toast({ title: 'Счёт не найден', description: 'Создать новый счёт?', variant: 'destructive' });
      setShowCreateAccount(true);
    } else {
      toast({ title: 'Счёт найден', description: `${found.type} — ${formatMoney(found.balance)}` });
    }
  };

  const handleCreateAccount = () => {
    if (!selectedClient) return;
    const acc: Account = {
      id: 'acc' + Date.now(),
      number: '40817810' + String(Date.now()).slice(-12),
      clientId: selectedClient.id,
      balance: 0,
      currency: 'RUB',
      type: newAccType,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAccounts([...accounts, acc]);
    setAccountNumber(acc.number);
    setShowCreateAccount(false);
    toast({ title: 'Счёт открыт', description: acc.number });
  };

  const handleSendSms = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: 'Введите корректную сумму', variant: 'destructive' }); return;
    }
    if (!accountNumber) {
      toast({ title: 'Введите номер счёта', variant: 'destructive' }); return;
    }
    if (!selectedClient) {
      toast({ title: 'Выберите клиента', variant: 'destructive' }); return;
    }
    toast({ title: 'СМС отправлен', description: `Код: ${generatedSms} → ${selectedClient.phone}` });
    setStep('sms');
  };

  const handleConfirm = () => {
    if (smsCode !== generatedSms) {
      toast({ title: 'Неверный код', variant: 'destructive' }); return;
    }
    const amountNum = Number(amount);
    const tx: Transaction = {
      id: 't' + Date.now(),
      type,
      typeLabel: title,
      amount: amountNum,
      fromAccount: isCashOut ? accountNumber : undefined,
      toAccount: !isCashOut ? accountNumber : undefined,
      clientId: selectedClient!.id,
      clientName: selectedClient!.fullName,
      employeeId: 'emp2',
      employeeName: 'Тимофеев А.Н.',
      status: 'success',
      createdAt: new Date().toISOString(),
      docNumber,
    };
    onAddTransaction(tx);
    toast({ title: `✓ ${title} выполнена`, description: `${docNumber} — ${formatMoney(amountNum)}` });
    setStep('done');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isCashOut ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>
          <Icon name={icon} fallback="Circle" size={20} className={color} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground mono">{isCashOut ? 'ОКУД 0402009' : 'ОКУД 0402008'}</p>
        </div>
      </div>

      {step === 'form' && (
        <div className="space-y-4">
          {/* Client selection */}
          <div className="glass-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="User" size={14} className="text-green-400" />
              Клиент
            </h3>
            {!selectedClient ? (
              <>
                <div className="relative mb-3">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Поиск клиента..."
                    className="w-full bg-muted border border-border rounded-lg pl-8 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-green-500" />
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {filteredClients.map((c) => (
                    <button key={c.id} onClick={() => setSelectedClient(c)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 transition-all text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <span className="text-xs font-bold neon-text">{c.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{c.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.phone} • {c.passport}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <span className="font-bold neon-text">{selectedClient.fullName[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedClient.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedClient(null); setAccountNumber(''); }} className="text-xs text-muted-foreground hover:text-foreground">
                  Изменить
                </button>
              </div>
            )}
          </div>

          {/* Amount & Account */}
          <div className="glass-card rounded-xl border border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icon name="DollarSign" size={14} className="text-green-400" />
              Параметры операции
            </h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Сумма (руб.)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-green-500 mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Номер счёта</label>
              <div className="flex gap-2">
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="40817810..."
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                <button onClick={handleCheckAccount} className="px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-green-500/50 transition-all">
                  Проверить
                </button>
              </div>
              {clientAccounts.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground">Счета клиента:</p>
                  {clientAccounts.map((acc) => (
                    <button key={acc.id} onClick={() => setAccountNumber(acc.number)}
                      className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted border border-border/50 mono flex items-center justify-between">
                      <span>{acc.number}</span>
                      <span className="neon-text">{formatMoney(acc.balance)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showCreateAccount && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-3">
                <p className="text-xs text-yellow-400">Счёт не найден. Открыть новый счёт?</p>
                <select value={newAccType} onChange={(e) => setNewAccType(e.target.value as Account['type'])}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500">
                  <option value="текущий">Текущий</option>
                  <option value="сберегательный">Сберегательный</option>
                  <option value="карточный">Карточный</option>
                </select>
                <button onClick={handleCreateAccount} className="neon-btn w-full rounded-lg py-2 text-xs flex items-center justify-center gap-2">
                  <Icon name="Plus" size={14} />
                  Открыть и вернуться к операции
                </button>
              </div>
            )}
          </div>

          <button onClick={handleSendSms} className="neon-btn w-full rounded-xl py-3 text-sm flex items-center justify-center gap-2">
            <Icon name="MessageSquare" size={16} />
            Отправить SMS для подтверждения
          </button>
        </div>
      )}

      {step === 'sms' && (
        <div className="glass-card rounded-xl border border-border p-6 space-y-5 animate-fade-in text-center">
          <Icon name="MessageSquare" size={40} className="text-green-400 mx-auto" />
          <div>
            <p className="text-foreground font-semibold">Код отправлен на {selectedClient?.phone}</p>
            <p className="text-sm text-muted-foreground mt-1">Попросите клиента назвать 4-значный код из SMS</p>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2 mono uppercase">Код подтверждения</label>
            <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •" maxLength={4}
              className="w-full bg-muted border border-border rounded-lg px-3 py-4 text-center text-3xl font-bold text-foreground focus:outline-none focus:border-green-500 tracking-widest mono" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={smsCode.length !== 4}
              className="neon-btn flex-1 rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Icon name="ShieldCheck" size={16} />
              Подтвердить операцию
            </button>
            <button onClick={() => setStep('form')} className="px-5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm">
              Назад
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="glass-card rounded-xl border p-8 text-center space-y-4 animate-scale-in" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', boxShadow: 'var(--neon-glow)' }}>
            <Icon name="CheckCircle2" size={40} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold neon-text">{title} выполнена!</h2>
            <p className="text-3xl font-bold mono text-foreground mt-2">{formatMoney(Number(amount))}</p>
            <p className="text-xs mono text-muted-foreground mt-1">{docNumber}</p>
          </div>
          <button
            onClick={() => {
              const date = new Date().toLocaleDateString('ru-RU');
              const content = generateOKUD(type, { clientName: selectedClient!.fullName, account: accountNumber, amount: Number(amount), docNumber, date });
              downloadText(content, `${isCashOut ? 'ВН_ОКУД0402009' : 'ВЗ_ОКУД0402008'}_${docNumber}.txt`);
              toast({ title: 'Документ скачан', description: isCashOut ? 'ОКУД 0402009' : 'ОКУД 0402008' });
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-all text-sm mx-auto"
          >
            <Icon name="Download" size={16} />
            Скачать {isCashOut ? 'ОКУД 0402009' : 'ОКУД 0402008'}
          </button>
          <button onClick={() => { setStep('form'); setAmount(''); setSmsCode(''); setSelectedClient(null); setAccountNumber(''); }}
            className="neon-btn w-full rounded-xl py-3 text-sm">
            Новая операция
          </button>
        </div>
      )}
    </div>
  );
}
