import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Client, Account, Transaction, formatMoney, generateDocNumber, generateSmsCode } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface CreditPageProps {
  clients: Client[];
  accounts: Account[];
  setAccounts: (a: Account[]) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export default function CreditPage({ clients, accounts, setAccounts, onAddTransaction }: CreditPageProps) {
  const { toast } = useToast();
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [passport, setPassport] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [term, setTerm] = useState('12');
  const [creditType, setCreditType] = useState<'credit' | 'installment'>('credit');
  const [step, setStep] = useState<'form' | 'sms' | 'done'>('form');
  const [smsCode, setSmsCode] = useState('');
  const [generatedSms] = useState(generateSmsCode());
  const [docNumber] = useState(generateDocNumber('КР'));
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccType] = useState<Account['type']>('кредитный');

  const filteredClients = clients.filter((c) =>
    c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)
  );
  const clientAccounts = selectedClient ? accounts.filter((a) => a.clientId === selectedClient.id) : [];

  const rate = creditType === 'credit' ? 18.5 : 0;
  const monthlyPayment = creditType === 'credit' && creditAmount && term
    ? (Number(creditAmount) * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -Number(term)))
    : Number(creditAmount) / Number(term);

  const handleCheckAccount = () => {
    const found = accounts.find((a) => a.number === creditAccount);
    if (!found) {
      toast({ title: 'Счёт не найден', description: 'Создать новый?', variant: 'destructive' });
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
    setCreditAccount(acc.number);
    setShowCreateAccount(false);
    toast({ title: 'Счёт открыт', description: acc.number });
  };

  const handleSendSms = () => {
    if (!selectedClient || !passport || !creditAmount || !creditAccount || !term) {
      toast({ title: 'Заполните все поля', variant: 'destructive' }); return;
    }
    toast({ title: 'СМС отправлен', description: `Код: ${generatedSms} → ${selectedClient.phone}` });
    setStep('sms');
  };

  const handleConfirm = () => {
    if (smsCode !== generatedSms) {
      toast({ title: 'Неверный код', variant: 'destructive' }); return;
    }
    const tx: Transaction = {
      id: 't' + Date.now(),
      type: 'credit',
      typeLabel: creditType === 'credit' ? 'Кредит' : 'Рассрочка',
      amount: Number(creditAmount),
      toAccount: creditAccount,
      clientId: selectedClient!.id,
      clientName: selectedClient!.fullName,
      employeeId: 'emp2',
      employeeName: 'Тимофеев А.Н.',
      status: 'success',
      createdAt: new Date().toISOString(),
      docNumber,
    };
    onAddTransaction(tx);
    toast({ title: `✓ ${creditType === 'credit' ? 'Кредит' : 'Рассрочка'} оформлена`, description: `${docNumber} — ${formatMoney(Number(creditAmount))}` });
    setStep('done');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
          <Icon name="Landmark" size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Кредит и рассрочка</h1>
          <p className="text-xs text-muted-foreground mono">{docNumber}</p>
        </div>
      </div>

      {step === 'form' && (
        <div className="space-y-4">
          {/* Credit type */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div className="flex gap-2">
              {(['credit', 'installment'] as const).map((t) => (
                <button key={t} onClick={() => setCreditType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${creditType === t ? 'neon-btn' : 'bg-muted text-muted-foreground border border-border hover:text-foreground'}`}>
                  {t === 'credit' ? 'Кредит' : 'Рассрочка'}
                </button>
              ))}
            </div>
            {creditType === 'credit' && (
              <p className="text-xs text-muted-foreground mt-2 mono">Ставка: {rate}% годовых</p>
            )}
          </div>

          {/* Client */}
          <div className="glass-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Клиент</h3>
            {!selectedClient ? (
              <>
                <div className="relative mb-3">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Поиск клиента..."
                    className="w-full bg-muted border border-border rounded-lg pl-8 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-green-500" />
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {filteredClients.map((c) => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setPassport(c.passport); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 transition-all text-left">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold neon-text flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>{c.fullName[0]}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{c.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.passport}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold neon-text" style={{ background: 'rgba(34,197,94,0.1)' }}>{selectedClient.fullName[0]}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedClient.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-xs text-muted-foreground hover:text-foreground">Изменить</button>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="glass-card rounded-xl border border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Параметры {creditType === 'credit' ? 'кредита' : 'рассрочки'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Паспорт</label>
                <input type="text" value={passport} onChange={(e) => setPassport(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Срок (мес.)</label>
                <select value={term} onChange={(e) => setTerm(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500">
                  {[3, 6, 12, 18, 24, 36, 48, 60].map((m) => <option key={m} value={m}>{m} мес.</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Сумма (руб.)</label>
              <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-green-500 mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Счёт зачисления</label>
              <div className="flex gap-2">
                <input type="text" value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} placeholder="40817810..."
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                <button onClick={handleCheckAccount} className="px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-green-500/50 transition-all">
                  Проверить
                </button>
              </div>
              {clientAccounts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {clientAccounts.map((acc) => (
                    <button key={acc.id} onClick={() => setCreditAccount(acc.number)}
                      className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted border border-border/50 mono flex justify-between">
                      <span>{acc.number}</span>
                      <span className="neon-text">{formatMoney(acc.balance)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showCreateAccount && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                <p className="text-xs text-yellow-400">Счёт не найден. Открыть кредитный счёт?</p>
                <button onClick={handleCreateAccount} className="neon-btn w-full rounded-lg py-2 text-xs flex items-center justify-center gap-2">
                  <Icon name="Plus" size={14} />
                  Открыть и вернуться к оформлению
                </button>
              </div>
            )}
            {creditAmount && term && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ежемесячный платёж:</span>
                  <span className="text-orange-400 font-semibold mono">{formatMoney(monthlyPayment)}</span>
                </div>
                {creditType === 'credit' && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Переплата:</span>
                    <span className="text-orange-400 mono">{formatMoney(monthlyPayment * Number(term) - Number(creditAmount))}</span>
                  </div>
                )}
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
        <div className="glass-card rounded-xl border border-border p-6 text-center space-y-5 animate-fade-in">
          <Icon name="MessageSquare" size={40} className="text-orange-400 mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Код отправлен на {selectedClient?.phone}</p>
          </div>
          <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="• • • •" maxLength={4}
            className="w-full bg-muted border border-border rounded-lg px-3 py-4 text-center text-3xl font-bold tracking-widest mono focus:outline-none focus:border-green-500" />
          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={smsCode.length !== 4}
              className="neon-btn flex-1 rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Icon name="ShieldCheck" size={16} />
              Подтвердить
            </button>
            <button onClick={() => setStep('form')} className="px-5 rounded-xl border border-border text-muted-foreground text-sm">Назад</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="glass-card rounded-xl border p-8 text-center space-y-4 animate-scale-in" style={{ borderColor: 'rgba(249,115,22,0.3)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(249,115,22,0.12)', border: '2px solid rgba(249,115,22,0.4)' }}>
            <Icon name="CheckCircle2" size={40} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-orange-400">{creditType === 'credit' ? 'Кредит' : 'Рассрочка'} оформлена!</h2>
            <p className="text-3xl font-bold mono text-foreground mt-2">{formatMoney(Number(creditAmount))}</p>
            <p className="text-sm text-muted-foreground mt-1">Срок: {term} мес. • Платёж: {formatMoney(monthlyPayment)}/мес.</p>
            <p className="text-xs mono text-muted-foreground mt-1">{docNumber}</p>
          </div>
          <button onClick={() => { setStep('form'); setCreditAmount(''); setSmsCode(''); setSelectedClient(null); setCreditAccount(''); }}
            className="neon-btn w-full rounded-xl py-3 text-sm">
            Новое оформление
          </button>
        </div>
      )}
    </div>
  );
}
