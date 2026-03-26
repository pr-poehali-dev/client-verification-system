"""Аутентификация сотрудников АС ЕФС СБОЛ.про"""
import json, os, psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # POST /auth/login
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        employee_id = body.get('employeeId', '').strip()
        password = body.get('password', '')

        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, role, role_label, window_name FROM employees WHERE LOWER(id) = LOWER('" + employee_id.replace("'","''") + "') AND password = '" + password.replace("'","''") + "'"
        )
        emp = cur.fetchone()
        conn.close()

        if not emp:
            return err('Неверный идентификатор или пароль', 401)

        return ok({
            'id': emp['id'],
            'name': emp['name'],
            'role': emp['role'],
            'roleLabel': emp['role_label'],
            'window': emp['window_name'],
        })

    return err('Method not allowed', 405)
