import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function TerminalPage() {
  const { toast } = useToast();
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8888');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [terminalId, setTerminalId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString('ru-RU')}] ${msg}`, ...prev.slice(0, 49)]);

  const handleConnect = () => {
    if (!ip) { toast({ title: 'Введите IP адрес', variant: 'destructive' }); return; }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) { toast({ title: 'Неверный формат IP', variant: 'destructive' }); return; }
    setStatus('connecting');
    addLog(`Попытка подключения к ${ip}:${port}...`);
    setTimeout(() => {
      setStatus('connected');
      const tid = 'SBR-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setTerminalId(tid);
      addLog(`Подключено к терминалу Сбербанк`);
      addLog(`ID терминала: ${tid}`);
      addLog(`Протокол: TCP/IP v4 • TLS 1.3`);
      addLog(`Статус: ГОТОВ К РАБОТЕ`);
      toast({ title: 'Терминал подключён', description: `${ip}:${port} — ${tid}` });
    }, 2000);
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    setTerminalId('');
    addLog('Соединение разорвано');
    toast({ title: 'Терминал отключён' });
  };

  const handleTest = () => {
    addLog('Тестовый запрос → OK');
    toast({ title: 'Тест прошёл успешно' });
  };

  const statusConfig = {
    disconnected: { label: 'НЕ ПОДКЛЮЧЁН', color: 'text-muted-foreground', dot: 'bg-gray-500' },
    connecting: { label: 'ПОДКЛЮЧЕНИЕ...', color: 'text-yellow-400', dot: 'bg-yellow-500' },
    connected: { label: 'ПОДКЛЮЧЁН', color: 'text-green-400', dot: 'bg-green-500' },
    error: { label: 'ОШИБКА', color: 'text-red-400', dot: 'bg-red-500' },
  }[status];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <Icon name="Wifi" size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Терминал Сбербанк</h1>
          <p className="text-xs text-muted-foreground">Подключение по IP-адресу</p>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className={`text-sm font-semibold mono ${statusConfig.color}`}>{statusConfig.label}</span>
          {terminalId && <span className="badge-secure">{terminalId}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">IP Адрес терминала</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" disabled={status === 'connected'}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 mono uppercase">Порт</label>
            <input type="text" value={port} onChange={(e) => setPort(e.target.value)} disabled={status === 'connected'}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-green-500 mono disabled:opacity-50" />
          </div>
        </div>

        <div className="flex gap-2">
          {status !== 'connected' ? (
            <button onClick={handleConnect} disabled={status === 'connecting'}
              className="neon-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">
              {status === 'connecting' ? (
                <><Icon name="Loader2" size={16} className="animate-spin" />Подключение...</>
              ) : (
                <><Icon name="Plug" size={16} />Подключить</>
              )}
            </button>
          ) : (
            <>
              <button onClick={handleTest} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-all text-sm">
                <Icon name="Activity" size={16} />
                Тест
              </button>
              <button onClick={handleDisconnect} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-sm">
                <Icon name="PlugZap" size={16} />
                Отключить
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info cards */}
      {status === 'connected' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          {[
            { label: 'Протокол', value: 'TCP/IP', icon: 'Network' },
            { label: 'Шифрование', value: 'TLS 1.3', icon: 'Lock' },
            { label: 'Задержка', value: '12 мс', icon: 'Gauge' },
            { label: 'Операций', value: '0', icon: 'Activity' },
          ].map((item, i) => (
            <div key={i} className="glass-card rounded-xl border border-border p-3 text-center">
              <Icon name={item.icon} fallback="Circle" size={16} className="text-green-400 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold mono neon-text">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      <div className="glass-card rounded-xl border border-border p-4">
        <h3 className="text-xs font-semibold mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Icon name="Terminal" size={13} className="text-green-400" />
          Журнал соединения
        </h3>
        <div className="bg-black/40 rounded-lg p-3 h-40 overflow-y-auto font-mono text-xs space-y-0.5">
          {logs.length === 0 ? (
            <span className="text-muted-foreground">_ Ожидание подключения...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-green-400/80">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
