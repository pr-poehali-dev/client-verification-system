"""CRUD транзакций и очереди АС ЕФС СБОЛ.про"""
import json, os, psycopg2, time
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
    resource = params.get('resource', 'transactions')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Transactions
    if resource == 'transactions':
        if method == 'GET':
            cur.execute("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200")
            rows = cur.fetchall()
            conn.close()
            return ok([dict(r) for r in rows])

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            tid = 't' + str(int(time.time() * 1000))
            cur.execute(
                "INSERT INTO transactions (id, type, type_label, amount, from_account, to_account, client_id, client_name, employee_id, employee_name, status, created_at, doc_number) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),%s)",
                (
                    tid,
                    body['type'], body['typeLabel'],
                    body.get('amount'), body.get('fromAccount'), body.get('toAccount'),
                    body['clientId'], body['clientName'],
                    body['employeeId'], body['employeeName'],
                    body.get('status', 'success'),
                    body.get('docNumber')
                )
            )
            conn.commit()
            conn.close()
            return ok({'id': tid, 'status': 'success'})

    # Queue
    if resource == 'queue':
        if method == 'GET':
            cur.execute("SELECT * FROM queue_items WHERE status != 'done' ORDER BY created_at")
            rows = cur.fetchall()
            conn.close()
            return ok([dict(r) for r in rows])

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            qid = 'q' + str(int(time.time() * 1000))
            cur.execute(
                "INSERT INTO queue_items (id, client_id, ticket_number, operation, operation_type, status) VALUES (%s,%s,%s,%s,%s,'waiting')",
                (qid, body['clientId'], body['ticketNumber'], body['operation'], body['operationType'])
            )
            conn.commit()
            conn.close()
            return ok({'id': qid})

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            qid = body.get('id')
            status = body.get('status', 'serving')
            cur.execute("UPDATE queue_items SET status = %s WHERE id = %s", (status, qid))
            conn.commit()
            conn.close()
            return ok({'id': qid, 'status': status})

    conn.close()
    return err('Not found', 404)
