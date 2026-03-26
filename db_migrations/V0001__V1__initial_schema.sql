
-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_label TEXT NOT NULL,
  window_name TEXT NOT NULL,
  password TEXT NOT NULL
);

INSERT INTO employees (id, name, role, role_label, window_name, password) VALUES
  ('emp1', 'Иванова Мария Сергеевна', 'operator', 'Операционист', 'Окно №1', 'pass123'),
  ('emp2', 'Тимофеев Александр Николаевич', 'senior_operator', 'Старший операционист', 'Окно №2', '2014')
ON CONFLICT (id) DO NOTHING;

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  passport TEXT,
  birth_date TEXT,
  address TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO clients (id, full_name, phone, passport, birth_date, address, created_at) VALUES
  ('c1', 'Петров Андрей Викторович', '+7 (916) 234-56-78', '4512 345678', '1985-03-15', 'г. Москва, ул. Ленина, д. 12, кв. 45', '2024-01-10'),
  ('c2', 'Сидорова Елена Михайловна', '+7 (903) 987-65-43', '4510 123456', '1990-07-22', 'г. Москва, ул. Пушкина, д. 5, кв. 12', '2024-02-05'),
  ('c3', 'Козлов Дмитрий Александрович', '+7 (926) 111-22-33', '4515 678901', '1978-11-08', 'г. Москва, Проспект Мира, д. 80, кв. 3', '2024-03-01')
ON CONFLICT (id) DO NOTHING;

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES clients(id),
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB',
  account_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT INTO accounts (id, number, client_id, balance, currency, account_type, created_at) VALUES
  ('acc1', '40817810000001234567', 'c1', 125430.50, 'RUB', 'текущий', '2024-01-10'),
  ('acc2', '40817810000009876543', 'c1', 500000.00, 'RUB', 'сберегательный', '2024-01-10'),
  ('acc3', '40817810000005555111', 'c2', 32100.75, 'RUB', 'текущий', '2024-02-05'),
  ('acc4', '40817810000007777888', 'c3', 88250.00, 'RUB', 'карточный', '2024-03-01')
ON CONFLICT (id) DO NOTHING;

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  type_label TEXT NOT NULL,
  amount NUMERIC(15,2),
  from_account TEXT,
  to_account TEXT,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  doc_number TEXT
);

-- Queue
CREATE TABLE IF NOT EXISTS queue_items (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  operation TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO queue_items (id, client_id, ticket_number, operation, operation_type, status) VALUES
  ('q1', 'c1', 'А001', 'Выдача наличных', 'cash_out', 'waiting'),
  ('q2', 'c2', 'А002', 'Взнос наличных', 'cash_in', 'waiting'),
  ('q3', 'c3', 'А003', 'Перевод со счёта на счёт', 'transfer', 'waiting')
ON CONFLICT (id) DO NOTHING;
