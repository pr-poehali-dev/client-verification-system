"""CRUD клиентов и счетов АС ЕФС СБОЛ.про"""
import json, os, psycopg2, time, datetime
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'clients')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Clients
    if resource == 'clients':
        if method == 'GET':
            search = params.get('search', '')
            if search:
                s = search.replace("'", "''")
                cur.execute(
                    "SELECT * FROM clients WHERE full_name ILIKE '%" + s + "%' OR phone LIKE '%" + s + "%' OR passport LIKE '%" + s + "%' ORDER BY created_at DESC"
                )
            else:
                cur.execute("SELECT * FROM clients ORDER BY created_at DESC")
            rows = cur.fetchall()
            result = []
            for r in rows:
                cur.execute("SELECT id FROM accounts WHERE client_id = '" + r['id'] + "'")
                acc_ids = [a['id'] for a in cur.fetchall()]
                result.append({
                    'id': r['id'],
                    'fullName': r['full_name'],
                    'phone': r['phone'],
                    'passport': r['passport'],
                    'birthDate': r['birth_date'],
                    'address': r['address'],
                    'createdAt': str(r['created_at']),
                    'accounts': acc_ids,
                })
            conn.close()
            return ok(result)

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            cid = 'c' + str(int(time.time() * 1000))
            today = datetime.date.today().isoformat()
            cur.execute(
                "INSERT INTO clients (id, full_name, phone, passport, birth_date, address, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (cid, body['fullName'], body.get('phone',''), body.get('passport',''), body.get('birthDate',''), body.get('address',''), today)
            )
            conn.commit()
            conn.close()
            return ok({'id': cid, 'fullName': body['fullName'], 'phone': body.get('phone',''), 'passport': body.get('passport',''), 'birthDate': body.get('birthDate',''), 'address': body.get('address',''), 'createdAt': today, 'accounts': []})

    # Accounts
    if resource == 'accounts':
        if method == 'GET':
            client_id = params.get('clientId')
            if client_id:
                cur.execute("SELECT * FROM accounts WHERE client_id = '" + client_id.replace("'","''") + "' ORDER BY created_at")
            else:
                cur.execute("SELECT * FROM accounts ORDER BY created_at")
            rows = cur.fetchall()
            result = [{
                'id': r['id'],
                'number': r['number'],
                'clientId': r['client_id'],
                'balance': float(r['balance']),
                'currency': r['currency'],
                'type': r['account_type'],
                'createdAt': str(r['created_at']),
            } for r in rows]
            conn.close()
            return ok(result)

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            aid = 'acc' + str(int(time.time() * 1000))
            num = '40817810' + str(int(time.time() * 1000))[-12:]
            today = datetime.date.today().isoformat()
            cur.execute(
                "INSERT INTO accounts (id, number, client_id, balance, currency, account_type, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (aid, num, body['clientId'], 0, 'RUB', body.get('type','текущий'), today)
            )
            conn.commit()
            conn.close()
            return ok({'id': aid, 'number': num, 'clientId': body['clientId'], 'balance': 0, 'currency': 'RUB', 'type': body.get('type','текущий'), 'createdAt': today})

    conn.close()
    return err('Not found', 404)
