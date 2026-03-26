export type Role = 'operator' | 'senior_operator' | 'client';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  window: string;
  password: string;
}

export interface Account {
  id: string;
  number: string;
  clientId: string;
  balance: number;
  currency: string;
  type: 'текущий' | 'сберегательный' | 'кредитный' | 'карточный';
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  passport: string;
  birthDate: string;
  address: string;
  accounts: string[];
  createdAt: string;
  smsCode?: string;
  verified?: boolean;
}

export interface QueueItem {
  id: string;
  clientId: string;
  ticketNumber: string;
  operation: string;
  operationType: 'cash_out' | 'cash_in' | 'transfer' | 'card_issue' | 'credit' | 'other';
  status: 'waiting' | 'serving' | 'done';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'cash_out' | 'cash_in' | 'transfer' | 'card_issue' | 'credit';
  typeLabel: string;
  amount?: number;
  fromAccount?: string;
  toAccount?: string;
  clientId: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  status: 'success' | 'error' | 'pending';
  createdAt: string;
  docNumber?: string;
}

export interface Card {
  id: string;
  number: string;
  clientId: string;
  accountId: string;
  expiryDate: string;
  status: 'active' | 'blocked' | 'issued';
  createdAt: string;
}

export const EMPLOYEES: Employee[] = [
  {
    id: 'emp1',
    name: 'Иванова Мария Сергеевна',
    role: 'operator',
    roleLabel: 'Операционист',
    window: 'Окно №1',
    password: 'pass123',
  },
  {
    id: 'emp2',
    name: 'Тимофеев Александр Николаевич',
    role: 'senior_operator',
    roleLabel: 'Старший операционист',
    window: 'Окно №2',
    password: '2014',
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    fullName: 'Петров Андрей Викторович',
    phone: '+7 (916) 234-56-78',
    passport: '4512 345678',
    birthDate: '1985-03-15',
    address: 'г. Москва, ул. Ленина, д. 12, кв. 45',
    accounts: ['acc1', 'acc2'],
    createdAt: '2024-01-10',
  },
  {
    id: 'c2',
    fullName: 'Сидорова Елена Михайловна',
    phone: '+7 (903) 987-65-43',
    passport: '4510 123456',
    birthDate: '1990-07-22',
    address: 'г. Москва, ул. Пушкина, д. 5, кв. 12',
    accounts: ['acc3'],
    createdAt: '2024-02-05',
  },
  {
    id: 'c3',
    fullName: 'Козлов Дмитрий Александрович',
    phone: '+7 (926) 111-22-33',
    passport: '4515 678901',
    birthDate: '1978-11-08',
    address: 'г. Москва, Проспект Мира, д. 80, кв. 3',
    accounts: ['acc4'],
    createdAt: '2024-03-01',
  },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc1',
    number: '40817810000001234567',
    clientId: 'c1',
    balance: 125430.50,
    currency: 'RUB',
    type: 'текущий',
    createdAt: '2024-01-10',
  },
  {
    id: 'acc2',
    number: '40817810000009876543',
    clientId: 'c1',
    balance: 500000.00,
    currency: 'RUB',
    type: 'сберегательный',
    createdAt: '2024-01-10',
  },
  {
    id: 'acc3',
    number: '40817810000005555111',
    clientId: 'c2',
    balance: 32100.75,
    currency: 'RUB',
    type: 'текущий',
    createdAt: '2024-02-05',
  },
  {
    id: 'acc4',
    number: '40817810000007777888',
    clientId: 'c3',
    balance: 88250.00,
    currency: 'RUB',
    type: 'карточный',
    createdAt: '2024-03-01',
  },
];

export const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q1',
    clientId: 'c1',
    ticketNumber: 'А001',
    operation: 'Выдача наличных',
    operationType: 'cash_out',
    status: 'waiting',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q2',
    clientId: 'c2',
    ticketNumber: 'А002',
    operation: 'Взнос наличных',
    operationType: 'cash_in',
    status: 'waiting',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q3',
    clientId: 'c3',
    ticketNumber: 'А003',
    operation: 'Перевод со счёта на счёт',
    operationType: 'transfer',
    status: 'waiting',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'cash_out',
    typeLabel: 'Выдача наличных',
    amount: 50000,
    fromAccount: '40817810000001234567',
    clientId: 'c1',
    clientName: 'Петров Андрей Викторович',
    employeeId: 'emp2',
    employeeName: 'Тимофеев А.Н.',
    status: 'success',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    docNumber: 'ВН-2024-001',
  },
  {
    id: 't2',
    type: 'cash_in',
    typeLabel: 'Взнос наличных',
    amount: 20000,
    toAccount: '40817810000005555111',
    clientId: 'c2',
    clientName: 'Сидорова Елена Михайловна',
    employeeId: 'emp1',
    employeeName: 'Иванова М.С.',
    status: 'success',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    docNumber: 'ВЗ-2024-001',
  },
];

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateDocNumber(prefix: string): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${num}`;
}

export function generateSmsCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
