import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;
const CLIENTS_URL = func2url.clients;
const TX_URL = func2url.transactions;

async function req(url: string, params?: Record<string, string>, options?: RequestInit) {
  const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url;
  const res = await fetch(fullUrl, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const api = {
  auth: {
    login: (employeeId: string, password: string) =>
      req(AUTH_URL, undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      }),
  },

  clients: {
    list: (search?: string) =>
      req(CLIENTS_URL, { resource: 'clients', ...(search ? { search } : {}) }),
    create: (data: object) =>
      req(CLIENTS_URL + '?resource=clients', undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },

  accounts: {
    list: (clientId?: string) =>
      req(CLIENTS_URL, { resource: 'accounts', ...(clientId ? { clientId } : {}) }),
    create: (data: object) =>
      req(CLIENTS_URL + '?resource=accounts', undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },

  transactions: {
    list: () => req(TX_URL, { resource: 'transactions' }),
    create: (data: object) =>
      req(TX_URL + '?resource=transactions', undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },

  queue: {
    list: () => req(TX_URL, { resource: 'queue' }),
    create: (data: object) =>
      req(TX_URL + '?resource=queue', undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: string, status: string) =>
      req(TX_URL + '?resource=queue', undefined, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      }),
  },
};
