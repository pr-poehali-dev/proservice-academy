INSERT INTO psa_users (name, email, password_hash, role, avatar, progress, courses_completed) VALUES
  ('Александр Тренеров', 'trainer@proservice.ru', '123456', 'trainer', 'АТ', 0, 0),
  ('Иван Мастеров', 'ivan@proservice.ru', '123456', 'student', 'ИМ', 67, 2),
  ('Сергей Приёмов', 'sergey@proservice.ru', '123456', 'student', 'СП', 34, 1),
  ('Олег Диагностов', 'oleg@proservice.ru', '123456', 'student', 'ОД', 89, 3),
  ('Проектор', 'present@proservice.ru', '123456', 'presentation', 'П', 0, 0);

INSERT INTO psa_courses (title, description, progress, students_count, sort_order) VALUES
  ('Мастер-приёмщик: базовый курс', 'Основы работы с клиентом, документооборот, техника продаж услуг', 65, 8, 1),
  ('Продвинутый уровень: сложные ситуации', 'Конфликтные клиенты, страховые случаи, техническая экспертиза', 20, 5, 2);