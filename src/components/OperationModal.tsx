import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Client, Account, formatMoney, generateDocNumber, generateSmsCode } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface OperationModalProps {
  type: string;
  client: Client;
  onClose: () => void;
  accounts?: Account[];
  allAccounts?: Account[];
  onAddTransaction?: (tx: object) => void;
  onAddAccount?: (acc: Account) => void;
}

function generateOKUD0402009(data: { clientName: string; account: string; amount: number; docNumber: string; date: string }) {
  const content = `
ФОРМА ПО ОКУД 0402009
РАСХОДНЫЙ КАССОВЫЙ ОРДЕР

Номер документа: ${data.docNumber}
Дата: ${data.date}

Организация: АС ЕФС СБОЛ.про
ИНН/КПП: 7700000000/770001001

Выдать: ${data.clientName}
Сумма: ${data.amount.toFixed(2)} руб.
(${numToWords(data.amount)} рублей)

Счёт дебета: ${data.account}
Назначение платежа: Выдача наличных по заявлению клиента

Подпись кассира: _______________
Подпись клиента: _______________

Документ сформирован системой АС ЕФС СБОЛ.про
  `.trim();
  return content;
}

function generateOKUD0402008(data: { clientName: string; account: string; amount: number; docNumber: string; date: string }) {
  const content = `
ФОРМА ПО ОКУД 0402008
ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР

Номер документа: ${data.docNumber}
Дата: ${data.date}

Организация: АС ЕФС СБОЛ.про
ИНН/КПП: 7700000000/770001001

Принято от: ${data.clientName}
Сумма: ${data.amount.toFixed(2)} руб.
(${numToWords(data.amount)} рублей)

Счёт кредита: ${data.account}
Назначение платежа: Взнос наличных на счёт клиента

Подпись кассира: _______________
Подпись клиента: _______________

Документ сформирован системой АС ЕФС СБОЛ.про
  `.trim();
  return content;
}

function numToWords(n: number): string {
  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
    'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
    'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  const whole = Math.floor(n);
  if (whole === 0) return 'ноль';
  if (whole < 20) return ones[whole];
  if (whole < 100) return `${tens[Math.floor(whole / 10)]} ${ones[whole % 10]}`.trim();
  if (whole < 1000) return `${hundreds[Math.floor(whole / 100)]} ${numToWords(whole % 100)}`.trim();
  if (whole < 1000000) return `${numToWords(Math.floor(whole / 1000))} тысяч ${numToWords(whole % 1000)}`.trim();
  return String(whole);
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OperationModal({ type, client, onClose, accounts = [], allAccounts = [], onAddTransaction, onAddAccount }: OperationModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [step, setStep] = useState<'form' | 'sms' | 'done' | 'create_account'>('form');
  const [smsCode, setSmsCode] = useState('');
  const [generatedSms] = useState(generateSmsCode());
  const [docNumber] = useState(generateDocNumber(type === 'cash_out' ? 'ВН' : type === 'cash_in' ? 'ВЗ' : 'ТР'));
  const [lastDocData, setLastDocData] = useState<{ clientName: string; account: string; amount: number; docNumber: string; date: string } | null>(null);

  // Card issue fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardPassport, setCardPassport] = useState(client.passport);
  const [cardPhone, setCardPhone] = useState(client.phone);

  // Credit fields
  const [creditPassport, setCreditPassport] = useState(client.passport);
  const [creditAccount, setCreditAccount] = useState('');
  const [creditTerm, setCreditTerm] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  // New account
  const [newAccountType, setNewAccountType] = useState<Account['type']>('текущий');

  const clientAccounts = allAccounts.filter((a) => a.clientId === client.id);

  const handleSendSms = () => {
    let valid = true;
    if (type === 'cash_out' || type === 'cash_in') {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toast({ title: 'Ошибка', description: 'Введите корректную сумму', variant: 'destructive' });
        valid = false;
      }
      if (!accountNumber) {
        toast({ title: 'Ошибка', description: 'Введите номер счёта', variant: 'destructive' });
        valid = false;
      }
    }
    if (type === 'transfer') {
      if (!amount || !accountNumber || !toAccountNumber) {
        toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
        valid = false;
      }
    }
    if (!valid) return;
    toast({
      title: 'СМС отправлен клиенту',
      description: `Код: ${generatedSms} — отправлен на ${client.phone}`,
    });
    setStep('sms');
  };

  const handleConfirmSms = () => {
    if (smsCode !== generatedSms) {
      toast({ title: 'Неверный код', description: 'Проверьте SMS и повторите', variant: 'destructive' });
      return;
    }
    const amountNum = Number(amount);
    const date = new Date().toLocaleDateString('ru-RU');
    const docData = { clientName: client.fullName, account: accountNumber, amount: amountNum, docNumber, date };
    setLastDocData(docData);
    if (onAddTransaction) {
      onAddTransaction({
        id: 't' + Date.now(),
        type,
        typeLabel: type === 'cash_out' ? 'Выдача наличных' : type === 'cash_in' ? 'Взнос наличных' : 'Перевод',
        amount: amountNum,
        fromAccount: type === 'cash_out' || type === 'transfer' ? accountNumber : undefined,
        toAccount: type === 'cash_in' ? accountNumber : type === 'transfer' ? toAccountNumber : undefined,
        clientId: client.id,
        clientName: client.fullName,
        employeeId: 'emp2',
        employeeName: 'Тимофеев А.Н.',
        status: 'success',
        createdAt: new Date().toISOString(),
        docNumber,
      });
    }
    toast({ title: '✓ Операция выполнена', description: `${docNumber} — ${formatMoney(amountNum)}` });
    setStep('done');
  };

  const handleDownloadDoc = () => {
    if (!lastDocData) return;
    if (type === 'cash_out') {
      downloadText(generateOKUD0402009(lastDocData), `ВН_ОКУД0402009_${docNumber}.txt`);
      toast({ title: 'Документ скачан', description: 'ОКУД 0402009 — Расходный кассовый ордер' });
    } else if (type === 'cash_in') {
      downloadText(generateOKUD0402008(lastDocData), `ВЗ_ОКУД0402008_${docNumber}.txt`);
      toast({ title: 'Документ скачан', description: 'ОКУД 0402008 — Приходный кассовый ордер' });
    }
  };

  const handleCreateAccount = () => {
    const newAcc: Account = {
      id: 'acc' + Date.now(),
      number: '40817810' + String(Date.now()).slice(-12),
      clientId: client.id,
      balance: 0,
      currency: 'RUB',
      type: newAccountType,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (onAddAccount) onAddAccount(newAcc);
    setAccountNumber(newAcc.number);
    toast({ title: 'Счёт открыт', description: `${newAcc.number} — ${newAccountType}` });
    setStep('form');
  };

  const checkAccount = () => {
    const exists = allAccounts.find((a) => a.number === accountNumber);
    if (!exists) {
      toast({ title: 'Счёт не найден', description: 'Создать новый счёт?', variant: 'destructive' });
      setStep('create_account');
    }
  };

  const typeConfig: Record<string, { title: string; icon: string; color: string }> = {
    cash_out: { title: 'Выдача наличных', icon: 'ArrowUpFromLine', color: 'text-red-400' },
    cash_in: { title: 'Взнос наличных', icon: 'ArrowDownToLine', color: 'text-green-400' },
    transfer: { title: 'Перевод со счёта на счёт', icon: 'ArrowLeftRight', color: 'text-blue-400' },
    card_issue: { title: 'Выпуск карты', icon: 'CreditCard', color: 'text-purple-400' },
    credit: { title: 'Кредит / рассрочка', icon: 'Landmark', color: 'text-orange-400' },
  };
  const cfg = typeConfig[type] || { title: type, icon: 'Circle', color: 'text-foreground' };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-border w-full max-w-lg animate-scale-in" style={{ borderColor: 'rgba(34,197,94,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <Icon name={cfg.icon} fallback="Circle" size={18} className={cfg.color} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{cfg.title}</h2>
              <p className="text-xs text-muted-foreground">{client.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Create account step */}
          {step === 'create_account' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-400">Счёт не найден в системе. Создать новый счёт для клиента?</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Тип счёта</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as Account['type'])}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500"
                >
                  <option value="текущий">Текущий</option>
                  <option value="сберегательный">Сберегательный</option>
                  <option value="кредитный">Кредитный</option>
                  <option value="карточный">Карточный</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateAccount} className="neon-btn flex-1 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                  <Icon name="Plus" size={16} />
                  Открыть счёт
                </button>
                <button onClick={() => setStep('form')} className="flex-1 rounded-lg py-2.5 text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Form step */}
          {step === 'form' && (
            <div className="space-y-4 animate-fade-in">
              {(type === 'cash_out' || type === 'cash_in') && (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Сумма (руб.)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Номер счёта клиента</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="40817810..."
                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono"
                      />
                      <button onClick={checkAccount} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-green-500/50 transition-all">
                        Проверить
                      </button>
                    </div>
                    {clientAccounts.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-muted-foreground mono">Счета клиента:</p>
                        {clientAccounts.map((acc) => (
                          <button key={acc.id} onClick={() => setAccountNumber(acc.number)}
                            className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted border border-border/50 mono">
                            {acc.number} — {formatMoney(acc.balance)} ({acc.type})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {type === 'transfer' && (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Сумма (руб.)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Счёт списания</label>
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="40817810..."
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Счёт зачисления</label>
                    <input type="text" value={toAccountNumber} onChange={(e) => setToAccountNumber(e.target.value)} placeholder="40817810..."
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                </>
              )}

              {type === 'card_issue' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Паспорт</label>
                      <input type="text" value={cardPassport} onChange={(e) => setCardPassport(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Телефон</label>
                      <input type="text" value={cardPhone} onChange={(e) => setCardPhone(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">ФИО клиента</label>
                    <input type="text" defaultValue={client.fullName}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Номер карты</label>
                      <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Срок действия</label>
                      <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                    </div>
                  </div>
                </>
              )}

              {type === 'credit' && (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Номер паспорта</label>
                    <input type="text" value={creditPassport} onChange={(e) => setCreditPassport(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">ФИО клиента</label>
                    <input type="text" defaultValue={client.fullName}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Сумма кредита (руб.)</label>
                    <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0.00"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Счёт/карта зачисления</label>
                    <input type="text" value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} placeholder="40817810..."
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Срок погашения (мес.)</label>
                    <input type="number" value={creditTerm} onChange={(e) => setCreditTerm(e.target.value)} placeholder="12"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono" />
                  </div>
                </>
              )}

              <button onClick={handleSendSms} className="neon-btn w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2">
                <Icon name="MessageSquare" size={16} />
                Отправить SMS клиенту для подтверждения
              </button>
            </div>
          )}

          {/* SMS step */}
          {step === 'sms' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl border text-center" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
                <Icon name="MessageSquare" size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Код отправлен на {client.phone}</p>
                <p className="text-xs text-muted-foreground mt-1">Попросите клиента назвать 4-значный код</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Код подтверждения</label>
                <input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="• • • •"
                  maxLength={4}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-center text-2xl font-bold text-foreground focus:outline-none focus:border-green-500 tracking-widest mono"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleConfirmSms} disabled={smsCode.length !== 4}
                  className="neon-btn flex-1 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Icon name="ShieldCheck" size={16} />
                  Подтвердить
                </button>
                <button onClick={() => setStep('form')} className="px-4 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Назад
                </button>
              </div>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', boxShadow: 'var(--neon-glow)' }}>
                <Icon name="CheckCircle2" size={32} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold neon-text">Операция выполнена!</h3>
                <p className="text-xs text-muted-foreground mono mt-1">{docNumber}</p>
                {lastDocData && (
                  <p className="text-sm text-foreground mt-2">{formatMoney(lastDocData.amount)}</p>
                )}
              </div>
              {(type === 'cash_out' || type === 'cash_in') && (
                <button onClick={handleDownloadDoc}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-all text-sm mx-auto">
                  <Icon name="Download" size={16} />
                  Скачать {type === 'cash_out' ? 'ОКУД 0402009' : 'ОКУД 0402008'}
                </button>
              )}
              <button onClick={onClose} className="neon-btn w-full rounded-lg py-2.5 text-sm">
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
