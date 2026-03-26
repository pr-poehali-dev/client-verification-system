import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { EMPLOYEES, Employee } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface LoginPageProps {
  onLogin: (employee: Employee) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'login' | 'sms'>('login');
  const [smsCode, setSmsCode] = useState('');
  const [generatedCode] = useState('1472');
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    const emp = EMPLOYEES.find(
      (e) => e.id.toLowerCase() === employeeId.toLowerCase() && e.password === password
    );
    if (!emp) {
      toast({ title: 'Ошибка входа', description: 'Неверный идентификатор или пароль', variant: 'destructive' });
      return;
    }
    setFoundEmployee(emp);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'СМС отправлен',
        description: `Код подтверждения отправлен на номер сотрудника. Код: ${generatedCode}`,
      });
      setStep('sms');
    }, 1200);
  };

  const handleSms = () => {
    if (smsCode !== generatedCode) {
      toast({ title: 'Неверный код', description: 'Проверьте SMS и введите 4-значный код', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (foundEmployee) onLogin(foundEmployee);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="scanlines" />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo Block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: 'var(--neon-glow)' }}>
            <Icon name="Shield" size={28} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold neon-text tracking-wide">АС ЕФС СБОЛ.про</h1>
          <p className="text-muted-foreground text-sm mt-1 mono">Автоматизированная система единого финансового сервиса</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="badge-secure">TLS 1.3</span>
            <span className="badge-secure">256-BIT AES</span>
            <span className="badge-secure">2FA</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-xl p-6 border border-border">
          {step === 'login' ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Icon name="KeyRound" size={18} className="text-green-400" />
                <h2 className="font-semibold text-foreground">Вход в систему</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase tracking-wider">
                    Идентификатор сотрудника
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Введите ID (напр. emp1)"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase tracking-wider">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !employeeId || !password}
                  className="neon-btn w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <Icon name="LogIn" size={16} />
                      Войти в систему
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mono">
                  <span className="text-yellow-400">⚠ </span>
                  Доступ только для авторизованных сотрудников банка
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="MessageSquare" size={18} className="text-green-400" />
                <h2 className="font-semibold text-foreground">Подтверждение личности</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                СМС с кодом отправлен на телефон сотрудника <span className="text-foreground font-medium">{foundEmployee?.name}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase tracking-wider">
                    Код из СМС (4 цифры)
                  </label>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    maxLength={4}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-center text-xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors tracking-widest mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleSms()}
                  />
                </div>

                <button
                  onClick={handleSms}
                  disabled={loading || smsCode.length !== 4}
                  className="neon-btn w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      Входим...
                    </>
                  ) : (
                    <>
                      <Icon name="ShieldCheck" size={16} />
                      Подтвердить
                    </>
                  )}
                </button>

                <button
                  onClick={() => { setStep('login'); setSmsCode(''); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
                >
                  ← Вернуться к вводу пароля
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mono mt-4">
          АС ЕФС СБОЛ.про © 2024 • Все права защищены • ГОСТ Р 57580
        </p>
      </div>
    </div>
  );
}
