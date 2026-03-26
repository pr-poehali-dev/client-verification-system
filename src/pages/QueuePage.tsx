import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { QueueItem, Client, INITIAL_QUEUE, INITIAL_CLIENTS } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import OperationModal from '@/components/OperationModal';

interface QueuePageProps {
  queue: QueueItem[];
  setQueue: (q: QueueItem[]) => void;
  clients: Client[];
  onNavigate: (page: string) => void;
  onOperation: (type: string, clientId: string) => void;
}

export default function QueuePage({ queue, setQueue, clients }: QueuePageProps) {
  const { toast } = useToast();
  const [activeClient, setActiveClient] = useState<{ client: Client; item: QueueItem } | null>(null);
  const [operationModal, setOperationModal] = useState<{ type: string; client: Client } | null>(null);

  const waitingQueue = queue.filter((q) => q.status === 'waiting');
  const servingQueue = queue.filter((q) => q.status === 'serving');

  const takeNext = () => {
    if (waitingQueue.length === 0) {
      toast({ title: 'Очередь пуста', description: 'Нет клиентов в ожидании' });
      return;
    }
    const next = waitingQueue[0];
    const client = clients.find((c) => c.id === next.clientId);
    if (!client) return;
    const updated = queue.map((q) =>
      q.id === next.id ? { ...q, status: 'serving' as const } : q
    );
    setQueue(updated);
    setActiveClient({ client, item: next });
    toast({
      title: `Клиент ${next.ticketNumber}`,
      description: `${client.fullName} — ${next.operation}`,
    });
  };

  const completeClient = () => {
    if (!activeClient) return;
    const updated = queue.map((q) =>
      q.id === activeClient.item.id ? { ...q, status: 'done' as const } : q
    );
    setQueue(updated);
    setActiveClient(null);
    toast({ title: 'Обслуживание завершено', description: 'Клиент отмечен как обслуженный' });
  };

  const operationTypes = [
    { type: 'cash_out', label: 'Выдача наличных', icon: 'ArrowUpFromLine', color: 'text-red-400' },
    { type: 'cash_in', label: 'Взнос наличных', icon: 'ArrowDownToLine', color: 'text-green-400' },
    { type: 'transfer', label: 'Перевод', icon: 'ArrowLeftRight', color: 'text-blue-400' },
    { type: 'card_issue', label: 'Выпуск карты', icon: 'CreditCard', color: 'text-purple-400' },
    { type: 'credit', label: 'Кредит/рассрочка', icon: 'Landmark', color: 'text-orange-400' },
  ];

  const addToQueue = () => {
    const nums = ['А004', 'А005', 'А006', 'А007'];
    const types: QueueItem['operationType'][] = ['cash_out', 'cash_in', 'transfer'];
    const typeLabels = ['Выдача наличных', 'Взнос наличных', 'Перевод со счёта'];
    const idx = Math.floor(Math.random() * 3);
    const clientIdx = Math.floor(Math.random() * clients.length);
    const newItem: QueueItem = {
      id: 'q' + Date.now(),
      clientId: clients[clientIdx]?.id || 'c1',
      ticketNumber: nums[Math.floor(Math.random() * nums.length)],
      operation: typeLabels[idx],
      operationType: types[idx],
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };
    setQueue([...queue, newItem]);
    toast({ title: 'Талон добавлен', description: `${newItem.ticketNumber} — ${newItem.operation}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Электронная очередь</h1>
          <p className="text-sm text-muted-foreground">{waitingQueue.length} в ожидании • {servingQueue.length} обслуживается</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addToQueue} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-green-500/50 transition-all">
            <Icon name="Plus" size={14} />
            Добавить талон
          </button>
          <button
            onClick={takeNext}
            disabled={waitingQueue.length === 0}
            className="neon-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="UserPlus" size={16} />
            Взять следующего
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active client */}
        <div className="lg:col-span-2">
          {activeClient ? (
            <div className="glass-card rounded-xl border p-5 animate-scale-in" style={{ borderColor: 'rgba(34,197,94,0.4)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-secure">ОБСЛУЖИВАЕТСЯ</span>
                    <span className="text-xs mono text-muted-foreground">{activeClient.item.ticketNumber}</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{activeClient.client.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{activeClient.client.phone} • {activeClient.client.passport}</p>
                </div>
                <button onClick={completeClient} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="CheckCircle" size={14} />
                  Завершить
                </button>
              </div>

              <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-xs text-muted-foreground mb-1">Запрошенная операция</p>
                <p className="text-sm font-semibold text-foreground">{activeClient.item.operation}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider mono">Выполнить операцию</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {operationTypes.map((op) => (
                    <button
                      key={op.type}
                      onClick={() => setOperationModal({ type: op.type, client: activeClient.client })}
                      className={`flex items-center gap-2 p-3 rounded-lg border border-border hover:border-green-500/40 bg-muted/30 hover:bg-muted/60 transition-all text-left ${activeClient.item.operationType === op.type ? 'border-green-500/50 bg-green-500/5' : ''}`}
                    >
                      <Icon name={op.icon} fallback="Circle" size={16} className={op.color} />
                      <span className="text-xs text-foreground font-medium">{op.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center">
              <Icon name="Users" size={40} className="text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">Нет активного клиента</p>
              <p className="text-sm text-muted-foreground mt-1">Нажмите «Взять следующего» для начала обслуживания</p>
            </div>
          )}
        </div>

        {/* Queue list */}
        <div className="glass-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="Clock" size={14} className="text-yellow-400" />
            Ожидают ({waitingQueue.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {waitingQueue.map((item, i) => {
              const client = clients.find((c) => c.id === item.clientId);
              return (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <span className="text-xs font-bold neon-text">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-foreground mono">{item.ticketNumber}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{client?.fullName || 'Неизвестно'}</p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">{item.operation}</p>
                  </div>
                </div>
              );
            })}
            {waitingQueue.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Очередь пуста</p>
            )}
          </div>
        </div>
      </div>

      {operationModal && (
        <OperationModal
          type={operationModal.type}
          client={operationModal.client}
          onClose={() => setOperationModal(null)}
        />
      )}
    </div>
  );
}
