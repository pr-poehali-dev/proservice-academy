"""
ProService Academy — главный API
Обрабатывает все запросы платформы: авторизация, курсы, уроки, задания, форум, ученики.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}

def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, default=str)}

def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    # Читаем тело — метод и путь передаются в нём
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    # _method и _path — виртуальная маршрутизация через тело запроса
    method = body.pop('_method', event.get('httpMethod', 'GET')).upper()
    raw_path = body.pop('_path', event.get('path', '/'))

    # Разбираем путь и query string
    if '?' in raw_path:
        path_part, qs_part = raw_path.split('?', 1)
        path = path_part
        qs = dict(p.split('=', 1) for p in qs_part.split('&') if '=' in p)
    else:
        path = raw_path
        qs = event.get('queryStringParameters') or {}

    # ── AUTH ──────────────────────────────────────────────────────────────────
    if path == '/auth/login' and method == 'POST':
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM psa_users WHERE LOWER(email)=%s AND password_hash=%s", (email, password))
        user = cur.fetchone()
        conn.close()
        if not user:
            return err('Неверный email или пароль', 401)
        return ok(dict(user))

    # ── USERS ─────────────────────────────────────────────────────────────────
    if path == '/users' and method == 'GET':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM psa_users WHERE role='student' ORDER BY id")
        users = cur.fetchall()
        conn.close()
        return ok([dict(u) for u in users])

    if path == '/users' and method == 'POST':
        name = body.get('name', '').strip()
        email = body.get('email', '').strip()
        password = body.get('password', '')
        avatar = ''.join([w[0] for w in name.split()][:2]).upper()
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_users (name, email, password_hash, role, avatar) VALUES (%s,%s,%s,'student',%s) RETURNING *",
            (name, email, password, avatar)
        )
        user = cur.fetchone()
        conn.commit()
        conn.close()
        return ok(dict(user), 201)

    if path.startswith('/users/') and method == 'PATCH':
        uid = path.split('/')[2]
        fields = []
        vals = []
        for k in ['candidate_status', 'candidate_comment', 'trainer_notes']:
            if k in body:
                fields.append(k)
                vals.append(body[k])
        if fields:
            conn = db()
            cur = conn.cursor()
            vals.append(uid)
            set_clause = ', '.join([f"{f}=%s" for f in fields])
            cur.execute(f"UPDATE psa_users SET {set_clause} WHERE id=%s", vals)
            conn.commit()
            conn.close()
        return ok({'ok': True})

    # ── STUDENT META ──────────────────────────────────────────────────────────
    if path.startswith('/student-meta/') and method == 'GET':
        sid = path.split('/')[2]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM psa_student_meta WHERE student_id=%s", (sid,))
        row = cur.fetchone()
        conn.close()
        return ok(dict(row) if row else {})

    if path.startswith('/student-meta/') and method in ('POST', 'PUT', 'PATCH'):
        sid = path.split('/')[2]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id FROM psa_student_meta WHERE student_id=%s", (sid,))
        exists = cur.fetchone()
        if exists:
            sets = []
            vals = []
            for k in ['candidate_status', 'candidate_comment', 'trainer_notes']:
                if k in body:
                    sets.append(f"{k}=%s")
                    vals.append(body[k] or None if k == 'candidate_status' else body[k])
            if sets:
                vals += [sid]
                cur.execute(f"UPDATE psa_student_meta SET {', '.join(sets)}, updated_at=NOW() WHERE student_id=%s", vals)
        else:
            cur.execute(
                "INSERT INTO psa_student_meta (student_id, candidate_status, candidate_comment, trainer_notes) VALUES (%s,%s,%s,%s)",
                (sid, body.get('candidate_status') or None, body.get('candidate_comment',''), body.get('trainer_notes',''))
            )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ── STUDENT NOTES ─────────────────────────────────────────────────────────
    if path.startswith('/student-notes/') and method == 'GET':
        uid = path.split('/')[2]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT notes FROM psa_student_notes WHERE user_id=%s", (uid,))
        row = cur.fetchone()
        conn.close()
        return ok({'notes': row['notes'] if row else ''})

    if path.startswith('/student-notes/') and method in ('POST', 'PUT', 'PATCH'):
        uid = path.split('/')[2]
        notes = body.get('notes', '')
        conn = db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO psa_student_notes (user_id, notes) VALUES (%s,%s) ON CONFLICT (user_id) DO UPDATE SET notes=%s, updated_at=NOW()",
            (uid, notes, notes)
        )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ── HW DRAFTS ─────────────────────────────────────────────────────────────
    if path.startswith('/hw-draft/') and method == 'GET':
        uid = path.split('/')[2]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM psa_hw_drafts WHERE user_id=%s", (uid,))
        row = cur.fetchone()
        conn.close()
        return ok(dict(row) if row else {'lesson_title': '', 'text': ''})

    if path.startswith('/hw-draft/') and method in ('POST', 'PUT', 'PATCH'):
        uid = path.split('/')[2]
        lt = body.get('lesson_title', '')
        txt = body.get('text', '')
        conn = db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO psa_hw_drafts (user_id, lesson_title, text) VALUES (%s,%s,%s) ON CONFLICT (user_id) DO UPDATE SET lesson_title=%s, text=%s, updated_at=NOW()",
            (uid, lt, txt, lt, txt)
        )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ── COURSES ───────────────────────────────────────────────────────────────
    if path == '/courses' and method == 'GET':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Исключаем мягко удалённые курсы (title='__deleted__' или is_deleted=true)
        cur.execute("""
            SELECT * FROM psa_courses
            WHERE title != '__deleted__'
            ORDER BY sort_order, id
        """)
        courses = [dict(c) for c in cur.fetchall()]
        cur.execute("""
            SELECT l.* FROM psa_lessons l
            JOIN psa_courses c ON c.id = l.course_id
            WHERE c.title != '__deleted__' AND l.status != 'deleted'
            ORDER BY l.sort_order, l.id
        """)
        lessons = [dict(l) for l in cur.fetchall()]
        conn.close()
        for c in courses:
            c['lessons'] = [l for l in lessons if l['course_id'] == c['id']]
        return ok(courses)

    if path == '/courses' and method == 'POST':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_courses (title, description) VALUES (%s,%s) RETURNING *",
            (body.get('title',''), body.get('description',''))
        )
        course = dict(cur.fetchone())
        conn.commit()
        conn.close()
        course['lessons'] = []
        return ok(course, 201)

    if path.startswith('/courses/') and '/lessons' not in path and method == 'PATCH':
        cid = path.split('/')[2]
        # Если передан флаг удаления — помечаем title='__deleted__'
        if body.get('_delete'):
            conn = db()
            cur = conn.cursor()
            cur.execute("UPDATE psa_courses SET title='__deleted__' WHERE id=%s", (cid,))
            # Помечаем все уроки курса как удалённые
            cur.execute("UPDATE psa_lessons SET status='deleted' WHERE course_id=%s", (cid,))
            conn.commit()
            conn.close()
            return ok({'ok': True})
        sets, vals = [], []
        for k in ['title', 'description', 'progress', 'students_count']:
            if k in body:
                sets.append(f"{k}=%s")
                vals.append(body[k])
        if sets:
            vals.append(cid)
            conn = db()
            cur = conn.cursor()
            cur.execute(f"UPDATE psa_courses SET {', '.join(sets)} WHERE id=%s", vals)
            conn.commit()
            conn.close()
        return ok({'ok': True})

    # ── LESSONS ───────────────────────────────────────────────────────────────
    if path.startswith('/courses/') and '/lessons' in path and method == 'POST':
        cid = path.split('/')[2]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT COALESCE(MAX(sort_order),0)+1 as next FROM psa_lessons WHERE course_id=%s", (cid,))
        next_order = cur.fetchone()['next']
        cur.execute(
            "INSERT INTO psa_lessons (course_id,title,duration,has_homework,status,sort_order,content,summary,homework,cheatsheet) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
            (cid, body.get('title',''), body.get('duration','30 min'), body.get('has_homework',False),
             body.get('status','published'), next_order,
             body.get('content',''), body.get('summary',''), body.get('homework',''), body.get('cheatsheet',''))
        )
        lesson = dict(cur.fetchone())
        conn.commit()
        conn.close()
        lesson['completed'] = False
        return ok(lesson, 201)

    if path.startswith('/lessons/') and method == 'PATCH':
        lid = path.split('/')[2]
        sets, vals = [], []
        for k in ['title','duration','has_homework','status','sort_order','content','summary','homework','cheatsheet']:
            if k in body:
                sets.append(f"{k}=%s")
                vals.append(body[k])
        if sets:
            vals.append(lid)
            conn = db()
            cur = conn.cursor()
            cur.execute(f"UPDATE psa_lessons SET {', '.join(sets)} WHERE id=%s", vals)
            conn.commit()
            conn.close()
        return ok({'ok': True})

    # Обновление порядка уроков
    if path == '/lessons/reorder' and method == 'POST':
        items = body.get('items', [])  # [{id, sort_order}]
        conn = db()
        cur = conn.cursor()
        for item in items:
            cur.execute("UPDATE psa_lessons SET sort_order=%s WHERE id=%s", (item['sort_order'], item['id']))
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ── LESSON PROGRESS ───────────────────────────────────────────────────────
    if path == '/lesson-progress' and method == 'GET':
        uid = qs.get('user_id')
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT lesson_id FROM psa_lesson_progress WHERE user_id=%s AND completed=true", (uid,))
        rows = cur.fetchall()
        conn.close()
        return ok([r['lesson_id'] for r in rows])

    if path == '/lesson-progress' and method == 'POST':
        conn = db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO psa_lesson_progress (user_id, lesson_id, completed, completed_at) VALUES (%s,%s,true,NOW()) ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed=true, completed_at=NOW()",
            (body.get('user_id'), body.get('lesson_id'))
        )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ── HOMEWORKS ─────────────────────────────────────────────────────────────
    if path == '/homeworks' and method == 'GET':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if 'student_id' in qs:
            cur.execute("SELECT h.*, u.name as student_name, u.avatar FROM psa_homeworks h JOIN psa_users u ON u.id=h.student_id WHERE h.student_id=%s ORDER BY h.submitted_at DESC", (qs['student_id'],))
        else:
            cur.execute("SELECT h.*, u.name as student_name, u.avatar FROM psa_homeworks h JOIN psa_users u ON u.id=h.student_id ORDER BY h.submitted_at DESC")
        rows = cur.fetchall()
        conn.close()
        return ok([dict(r) for r in rows])

    if path == '/homeworks' and method == 'POST':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_homeworks (student_id, lesson_title, text) VALUES (%s,%s,%s) RETURNING *",
            (body.get('student_id'), body.get('lesson_title',''), body.get('text',''))
        )
        hw = dict(cur.fetchone())
        conn.commit()
        conn.close()
        return ok(hw, 201)

    if path.startswith('/homeworks/') and method == 'PATCH':
        hid = path.split('/')[2]
        sets, vals = [], []
        for k in ['status','grade','trainer_comment']:
            if k in body:
                sets.append(f"{k}=%s")
                vals.append(body[k])
        if sets:
            vals.append(hid)
            conn = db()
            cur = conn.cursor()
            cur.execute(f"UPDATE psa_homeworks SET {', '.join(sets)} WHERE id=%s", vals)
            conn.commit()
            conn.close()
        return ok({'ok': True})

    # ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    if path == '/notifications' and method == 'GET':
        uid = qs.get('student_id')
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM psa_notifications WHERE student_id=%s ORDER BY created_at DESC", (uid,))
        rows = cur.fetchall()
        conn.close()
        return ok([dict(r) for r in rows])

    if path == '/notifications' and method == 'POST':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_notifications (student_id, lesson_title, status, grade) VALUES (%s,%s,%s,%s) RETURNING *",
            (body.get('student_id'), body.get('lesson_title',''), body.get('status'), body.get('grade'))
        )
        n = dict(cur.fetchone())
        conn.commit()
        conn.close()
        return ok(n, 201)

    if path == '/notifications/read' and method == 'POST':
        uid = body.get('student_id')
        conn = db()
        cur = conn.cursor()
        cur.execute("UPDATE psa_notifications SET is_read=true WHERE student_id=%s", (uid,))
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ── STUDENT DOCS ──────────────────────────────────────────────────────────
    if path.startswith('/student-docs/') and method == 'GET':
        sid = path.split('/')[2]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM psa_student_docs WHERE student_id=%s ORDER BY uploaded_at DESC", (sid,))
        rows = cur.fetchall()
        conn.close()
        return ok([dict(r) for r in rows])

    if path == '/student-docs' and method == 'POST':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_student_docs (student_id, name, label, size, file_type, data_url) VALUES (%s,%s,%s,%s,%s,%s) RETURNING *",
            (body.get('student_id'), body.get('name',''), body.get('label',''), body.get('size',''), body.get('file_type',''), body.get('data_url',''))
        )
        doc = dict(cur.fetchone())
        conn.commit()
        conn.close()
        return ok(doc, 201)

    # ── FORUM ─────────────────────────────────────────────────────────────────
    if path == '/forum/topics' and method == 'GET':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT t.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role,
                   (SELECT COUNT(*) FROM psa_forum_posts p WHERE p.topic_id=t.id) as posts_count
            FROM psa_forum_topics t
            LEFT JOIN psa_users u ON u.id=t.author_id
            ORDER BY t.pinned DESC, t.created_at DESC
        """)
        topics = [dict(r) for r in cur.fetchall()]
        # Первый пост для превью
        for topic in topics:
            cur.execute("""
                SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
                FROM psa_forum_posts p LEFT JOIN psa_users u ON u.id=p.author_id
                WHERE p.topic_id=%s ORDER BY p.created_at LIMIT 1
            """, (topic['id'],))
            first = cur.fetchone()
            topic['first_post'] = dict(first) if first else None
        conn.close()
        return ok(topics)

    if path.startswith('/forum/topics/') and '/posts' not in path and method == 'GET':
        tid = path.split('/')[3]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
            FROM psa_forum_posts p LEFT JOIN psa_users u ON u.id=p.author_id
            WHERE p.topic_id=%s ORDER BY p.created_at
        """, (tid,))
        posts = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok(posts)

    if path == '/forum/topics' and method == 'POST':
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_forum_topics (title, author_id) VALUES (%s,%s) RETURNING *",
            (body.get('title',''), body.get('author_id'))
        )
        topic = dict(cur.fetchone())
        cur.execute(
            "INSERT INTO psa_forum_posts (topic_id, author_id, text) VALUES (%s,%s,%s) RETURNING *",
            (topic['id'], body.get('author_id'), body.get('text',''))
        )
        conn.commit()
        conn.close()
        return ok(topic, 201)

    if path.startswith('/forum/topics/') and method == 'PATCH':
        tid = path.split('/')[3]
        sets, vals = [], []
        for k in ['pinned','closed']:
            if k in body:
                sets.append(f"{k}=%s")
                vals.append(body[k])
        if sets:
            vals.append(tid)
            conn = db()
            cur = conn.cursor()
            cur.execute(f"UPDATE psa_forum_topics SET {', '.join(sets)} WHERE id=%s", vals)
            conn.commit()
            conn.close()
        return ok({'ok': True})

    if path.startswith('/forum/topics/') and '/posts' in path and method == 'POST':
        tid = path.split('/')[3]
        conn = db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO psa_forum_posts (topic_id, author_id, text) VALUES (%s,%s,%s) RETURNING *",
            (tid, body.get('author_id'), body.get('text',''))
        )
        post = dict(cur.fetchone())
        conn.commit()
        conn.close()
        return ok(post, 201)

    if path.startswith('/forum/posts/') and '/like' in path and method == 'POST':
        pid = path.split('/')[3]
        uid = body.get('user_id')
        conn = db()
        cur = conn.cursor()
        cur.execute("INSERT INTO psa_forum_likes (user_id, post_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (uid, pid))
        if cur.rowcount > 0:
            cur.execute("UPDATE psa_forum_posts SET likes=likes+1 WHERE id=%s", (pid,))
        conn.commit()
        conn.close()
        return ok({'ok': True})

    return err('Not found', 404)