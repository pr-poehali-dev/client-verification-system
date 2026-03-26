import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Client, Account, Transaction, formatMoney, generateDocNumber, generateSmsCode } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface TransferPageProps {
  clients: Client[];
  accounts: Account[];
  onAddTransaction: (tx: Transaction) => void;
}

export default function TransferPage({ clients, accounts, onAddTransaction }: TransferPageProps) {
  const { toast } = useToast();
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'sms' | 'done'>('form');
  const [smsCode, setSmsCode] = useState('');
  const [generatedSms] = useState(generateSmsCode());
  const [docNumber] = useState(generateDocNumber('ТР'));

  const filteredClients = clients.filter((c) =>
    c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)
  );
  const clientAccounts = selectedClient ? accounts.filter((a) => a.clientId === selectedClient.id) : [];
  const fromAcc = accounts.find((a) => a.number === fromAccount);
  const toAcc = accounts.find((a) => a.number === toAccount);

  const handleSendSms = () => {
    if (!fromAccount || !toAccount || !amount || !selectedClient) {
      toast({ title: 'Заполните все поля', variant: 'destructive' }); return;
    }
    if (!fromAcc) { toast({ title: 'Счёт списания не найден', variant: 'destructive' }); return; }
    if (!toAcc) { toast({ title: 'Счёт зачисления не найден', variant: 'destructive' }); return; }
    if (Number(amount) <= 0) { toast({ title: 'Введите сумму', variant: 'destructive' }); return; }
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
      type: 'transfer',
      typeLabel: 'Перевод',
      amount: amountNum,
      fromAccount,
      toAccount,
      clientId: selectedClient!.id,
      clientName: selectedClient!.fullName,
      employeeId: 'emp2',
      employeeName: 'Тимофеев А.Н.',
      status: 'success',
      createdAt: new Date().toISOString(),
      docNumber,
    };
    onAddTransaction(tx);
    toast({ title: '✓ Перевод выполнен', description: `${docNumber} — ${formatMoney(amountNum)}` });
    setStep('done');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
          <Icon name="ArrowLeftRight" size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Перевод со счёта на счёт</h1>
          <p className="text-xs text-muted-foreground mono">{docNumber}</p>
        </div>
      </div>

      {step === 'form' && (
        <div className="space-y-4">
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
                    <button key={c.id} onClick={() => setSelectedClient(c)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 transition-all text-left">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold neon-text flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>{c.fullName[0]}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{c.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.phone}</p>
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

          <div className="glass-card rounded-xl border border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Параметры перевода</h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Сумма (руб.)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-green-500 mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Счёт списания</label>
              <input type="text" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} placeholder="40817810..."
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
              {fromAcc && <p className="text-xs neon-text mt-1 mono">Баланс: {formatMoney(fromAcc.balance)}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Icon name="ArrowDown" size={14} className="text-blue-400" />
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Счёт зачисления</label>
              <input type="text" value={toAccount} onChange={(e) => setToAccount(e.target.value)} placeholder="40817810..."
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
              {toAcc && <p className="text-xs neon-text mt-1 mono">Получатель: {clients.find((c) => c.id === toAcc.clientId)?.fullName || '—'}</p>}
            </div>
            {clientAccounts.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Счета клиента:</p>
                {clientAccounts.map((acc) => (
                  <button key={acc.id} onClick={() => setFromAccount(acc.number)}
                    className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted border border-border/50 mono flex justify-between">
                    <span>{acc.number}</span>
                    <span className="neon-text">{formatMoney(acc.balance)}</span>
                  </button>
                ))}
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
          <Icon name="MessageSquare" size={40} className="text-blue-400 mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Код отправлен на {selectedClient?.phone}</p>
            <p className="text-sm text-muted-foreground mt-1">Назовите код клиенту</p>
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
        <div className="glass-card rounded-xl border p-8 text-center space-y-4 animate-scale-in" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.4)' }}>
            <Icon name="CheckCircle2" size={40} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-400">Перевод выполнен!</h2>
            <p className="text-3xl font-bold mono text-foreground mt-2">{formatMoney(Number(amount))}</p>
            <p className="text-xs mono text-muted-foreground mt-1">{docNumber}</p>
            <p className="text-xs text-muted-foreground mt-2">{fromAccount} → {toAccount}</p>
          </div>
          <button onClick={() => { setStep('form'); setAmount(''); setSmsCode(''); setSelectedClient(null); setFromAccount(''); setToAccount(''); }}
            className="neon-btn w-full rounded-xl py-3 text-sm">
            Новый перевод
          </button>
        </div>
      )}
    </div>
  );
}
