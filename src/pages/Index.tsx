import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import * as API from "@/lib/api";

// ─── localStorage helpers (кэш для быстрого UI) ────────────────────────────────
function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch (_e) {
      return initial;
    }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (_e) { /* ignore */ }
      return next;
    });
  }, [key]);
  return [value, set];
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "trainer" | "student" | "presentation";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  progress?: number;
  coursesCompleted?: number;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  hasHomework: boolean;
  status: "draft" | "published";
  content?: string;   // только для тренера (подготовка)
  summary?: string;   // опорный конспект — видит ученик
  homework?: string;  // домашнее задание
  cheatsheet?: string; // шпаргалка
  order: number;
}

type CandidateStatus = "promising" | "watch" | "not_recommended";

interface StudentMeta {
  studentId: number;
  candidateStatus?: CandidateStatus;
  candidateComment?: string;
  trainerNotes?: string;
  studentNotes?: string;
}

interface HomeworkWithComment extends Homework {
  trainerComment?: string;
  studentNotes?: string;
  draft?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: number;
  studentsCount: number;
}

interface Homework {
  id: number;
  studentName: string;
  lessonTitle: string;
  submittedAt: string;
  status: "pending" | "checked" | "revision";
  grade?: number;
  text: string;
}

interface ForumPost {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  role: string;
}

interface ForumTopic {
  id: number;
  title: string;
  author: string;
  avatar: string;
  role: string;
  createdAt: string;
  posts: ForumPost[];
  pinned?: boolean;
  closed?: boolean;
}

interface StudentDoc {
  id: number;
  name: string;
  label: string;
  uploadedAt: string;
  size: string;
  type: string;
  dataUrl: string;
}

interface Notification {
  id: number;
  studentEmail: string;
  lessonTitle: string;
  status: "checked" | "revision";
  grade?: number;
  createdAt: string;
  read: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USERS: User[] = [
  { id: 1, name: "Александр Тренеров", email: "trainer@proservice.ru", role: "trainer", avatar: "АТ" },
  { id: 2, name: "Иван Мастеров", email: "ivan@proservice.ru", role: "student", avatar: "ИМ", progress: 67, coursesCompleted: 2 },
  { id: 3, name: "Сергей Приёмов", email: "sergey@proservice.ru", role: "student", avatar: "СП", progress: 34, coursesCompleted: 1 },
  { id: 4, name: "Олег Диагностов", email: "oleg@proservice.ru", role: "student", avatar: "ОД", progress: 89, coursesCompleted: 3 },
  { id: 5, name: "Проектор", email: "present@proservice.ru", role: "presentation", avatar: "П" },
];

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    title: "Мастер-приёмщик: базовый курс",
    description: "Основы работы с клиентом, документооборот, техника продаж услуг",
    progress: 65,
    studentsCount: 8,
    lessons: [
      { id: 1, title: "Роль мастера-приёмщика в автосервисе", duration: "45 мин", completed: true, hasHomework: true, status: "published", order: 1, content: "Мастер-приёмщик — ключевая фигура автосервиса. Он первый контактирует с клиентом и формирует впечатление о всей компании.", summary: "Мастер-приёмщик — лицо сервиса. Первое впечатление формируется в первые 30 секунд.\n\nТри ключевые роли:\n• Представитель компании перед клиентом\n• Технический переводчик (объясняет сложное простым языком)\n• Организатор процесса ремонта", homework: "Опишите 3 ситуации из своей практики, когда первое впечатление определило исход визита клиента.", cheatsheet: "Формула: улыбка + имя клиента + зрительный контакт = доверие с первых секунд.\n\nПравило 3П: Приветствие → Представление → Предложение помочь" },
      { id: 2, title: "Приём автомобиля: чек-лист осмотра", duration: "60 мин", completed: true, hasHomework: true, status: "published", order: 2, content: "Правильный приём автомобиля — основа прозрачности сервиса. Осмотр всегда проводится в присутствии клиента.", summary: "Приём автомобиля всегда проводится вместе с клиентом — это защита обеих сторон.\n\nПорядок осмотра:\n1. Внешний обход по кругу (фото каждого дефекта)\n2. Проверка уровней жидкостей\n3. Осмотр салона\n4. Фиксация в акте приёма\n5. Подпись клиента", homework: "Проведите 3 приёма по чек-листу и опишите реакцию клиентов.", cheatsheet: "Ключ: фотографируй каждый дефект ДО начала работ.\n\nЧек-лист осмотра:\n☐ Кузов (царапины, вмятины, сколы)\n☐ Стёкла\n☐ Шины и диски\n☐ Уровень масла / ОЖ / тормозной жидкости\n☐ Состояние салона\n☐ Документы и ключи" },
      { id: 3, title: "Работа с клиентскими возражениями", duration: "50 мин", completed: false, hasHomework: true, status: "published", order: 3, content: "Возражения клиента — это не отказ, а запрос на дополнительную информацию.", summary: "Возражение — это не отказ, а запрос на информацию. Клиент сомневается — значит, он заинтересован.\n\nОсновные типы возражений:\n• «Это дорого» — нужна демонстрация ценности\n• «Сделайте только необходимое» — нужно объяснить риски\n• «Я подумаю» — нужно понять истинную причину", homework: "Запишите 5 возражений, которые вы слышали на этой неделе, и ваши ответы на них.", cheatsheet: "Метод ДДД:\nДа (согласие с чувством) → Детали (уточняющий вопрос) → Доводы (аргументы)\n\nПример: «Да, понимаю вас. Скажите, а с чем сравниваете цену? Дело в том, что...»" },
      { id: 4, title: "Оформление заказ-наряда", duration: "40 мин", completed: false, hasHomework: false, status: "published", order: 4, content: "Заказ-наряд — юридический документ. Каждая работа должна быть согласована с клиентом письменно.", summary: "Заказ-наряд — юридически значимый документ. Без него любая претензия клиента может быть удовлетворена судом.\n\nОбязательные элементы:\n• Перечень работ с ценами\n• Запчасти и материалы\n• Сроки выполнения\n• Подпись клиента на каждом изменении", cheatsheet: "Никогда не начинай работы без подписи клиента. Даже «срочные».\n\nЕсли цена изменилась — звони клиенту, фиксируй устное согласие и время звонка в наряде." },
      { id: 5, title: "Выдача автомобиля и постпродажный сервис", duration: "35 мин", completed: false, hasHomework: true, status: "draft", order: 5, content: "Выдача — последний шанс сформировать лояльного клиента. Объясни что сделано и почему.", summary: "Выдача — финальный момент, который определяет вернётся ли клиент.\n\nСтруктура выдачи:\n1. Показать что сделано (физически, у машины)\n2. Объяснить зачем это было нужно\n3. Сообщить что нужно будет сделать в следующий раз\n4. Договориться о следующем визите", homework: "Опишите идеальный сценарий выдачи автомобиля клиенту.", cheatsheet: "Правило: клиент уходит с пониманием что сделано, что запланировано и когда звонить.\n\nФинальная фраза: «Если возникнут вопросы — звоните напрямую мне.» — строит личную лояльность." },
    ]
  },
  {
    id: 2,
    title: "Продвинутый уровень: сложные ситуации",
    description: "Конфликтные клиенты, страховые случаи, техническая экспертиза",
    progress: 20,
    studentsCount: 5,
    lessons: [
      { id: 6, title: "Типология сложных клиентов", duration: "55 мин", completed: true, hasHomework: true, status: "published", order: 1, content: "Сложные клиенты делятся на типы: агрессивный, тревожный, недоверчивый, сверхтребовательный. У каждого — свой подход.", homework: "Опишите случай со сложным клиентом и как вы с ним справились.", cheatsheet: "Агрессивный: не спорь, дай выговориться. Тревожный: давай факты и цифры." },
      { id: 7, title: "Страховые и гарантийные случаи", duration: "70 мин", completed: false, hasHomework: true, status: "published", order: 2, content: "Страховые случаи требуют строгого документального оформления и взаимодействия со страховщиком.", homework: "Изучите порядок оформления страхового случая в вашем сервисе.", cheatsheet: "Главное: фото→акт→согласование→работы. Ни шага без документа." },
      { id: 8, title: "Технический минимум для приёмщика", duration: "80 мин", completed: false, hasHomework: false, status: "draft", order: 3, content: "Приёмщик не должен быть механиком, но обязан понимать основные узлы и системы автомобиля.", cheatsheet: "ТО-1/ТО-2, тормозная система, подвеска, масла — это минимум знаний для диалога с клиентом." },
    ]
  }
];

const MOCK_HOMEWORKS: Homework[] = [
  { id: 1, studentName: "Иван Мастеров", lessonTitle: "Приём автомобиля: чек-лист осмотра", submittedAt: "20 мая, 14:32", status: "pending", text: "Провёл 3 приёма по чек-листу. Обнаружил, что клиенты охотнее соглашаются на доп.услуги когда видят письменный перечень нарушений..." },
  { id: 2, studentName: "Сергей Приёмов", lessonTitle: "Роль мастера-приёмщика в автосервисе", submittedAt: "19 мая, 16:10", status: "checked", grade: 5, text: "Понял основное: мастер — это лицо сервиса. Применил на практике технику активного слушания..." },
  { id: 3, studentName: "Олег Диагностов", lessonTitle: "Работа с клиентскими возражениями", submittedAt: "18 мая, 11:45", status: "revision", text: "Попробовал метод «да, и...». Работает не всегда, нужно больше практики..." },
];

const MOCK_FORUM: ForumTopic[] = [
  {
    id: 1,
    title: "Клиент говорит, что масло меняли недавно, а уровень критический",
    author: "Александр Тренеров", avatar: "АТ", role: "Тренер", createdAt: "20 мая",
    posts: [
      { id: 1, author: "Александр Тренеров", avatar: "АТ", role: "Тренер", text: "Коллеги, разбираем на примере: клиент приезжает, говорит что масло меняли 2 месяца назад, а по щупу уровень критический. Как будете действовать?", time: "2 ч назад", likes: 3 },
      { id: 2, author: "Иван Мастеров", avatar: "ИМ", role: "Ученик", text: "Сначала попрошу ключи, проверю пробег по одометру. Если пробег большой — предложу дополнительную диагностику и объясню клиенту возможные причины.", time: "1 ч назад", likes: 5 },
      { id: 3, author: "Олег Диагностов", avatar: "ОД", role: "Ученик", text: "Я бы ещё проверил наличие подтёков снизу. Часто бывает, что масло уходит незаметно из-за прокладки клапанной крышки.", time: "45 мин назад", likes: 7 },
    ]
  },
  {
    id: 2,
    title: "Как правильно объяснить клиенту необходимость дополнительных работ?",
    author: "Иван Мастеров", avatar: "ИМ", role: "Ученик", createdAt: "19 мая",
    posts: [
      { id: 1, author: "Иван Мастеров", avatar: "ИМ", role: "Ученик", text: "Столкнулся с ситуацией: клиент сдаёт машину на ТО, во время осмотра нахожу изношенные тормозные колодки. Как убедить его заменить сейчас, не создавая ощущение «развода»?", time: "вчера", likes: 2 },
      { id: 2, author: "Александр Тренеров", avatar: "АТ", role: "Тренер", text: "Ключ — показать, а не рассказать. Предложите клиенту пройти с вами к машине и посмотреть самому. Видимый износ убеждает лучше любых слов.", time: "вчера", likes: 8 },
    ]
  },
];

const SLIDE_DATA = [
  { id: 1, title: "Формула идеального приёма", subtitle: "Урок 3: Работа с клиентом", content: ["Внимание — первые 30 секунд решают всё", "Встречайте клиента стоя, называйте по имени", "Осмотр вместе с клиентом — не без него", "Каждый дефект фиксируется письменно"] },
  { id: 2, title: "Чек-лист осмотра автомобиля", subtitle: "Порядок действий", content: ["Внешний осмотр кузова (фото 360°)", "Проверка уровней технических жидкостей", "Осмотр салона и электрооборудования", "Тест-драйв при наличии жалоб на ходовую", "Подпись акта приёма клиентом"] },
  { id: 3, title: "Работа с возражением «дорого»", subtitle: "Практический приём", content: ["Не спорить — согласиться с чувством клиента", "Задать уточняющий вопрос: по сравнению с чем?", "Показать ценность через последствия бездействия", "Предложить альтернативу или рассрочку"] },
];

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await API.apiLogin(email.trim(), password);
      const u: User = {
        id: raw.id as number,
        name: raw.name as string,
        email: raw.email as string,
        role: raw.role as Role,
        avatar: raw.avatar as string,
        progress: (raw.progress as number) || 0,
        coursesCompleted: (raw.courses_completed as number) || 0,
      };
      onLogin(u);
    } catch (_e) {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #243558 50%, #1a3060 100%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white"></div>
          <div className="absolute top-40 left-40 w-64 h-64 rounded-full border-2 border-white"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border-2 border-white"></div>
        </div>
        <div className="relative animate-fade-in">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#F4720B" }}>
              <Icon name="Settings" size={24} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl">ProService</div>
              <div className="text-white/60 text-sm">Academy</div>
            </div>
          </div>
          <h1 className="text-white text-5xl font-bold leading-tight mb-6">
            Профессиональное<br />обучение<br />
            <span style={{ color: "#F4720B" }}>мастеров-приёмщиков</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-md">
            Корпоративная платформа для систематического развития команды вашего автосервиса
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { icon: "BookOpen", label: "Курсы", value: "12" },
            { icon: "Users", label: "Учеников", value: "20" },
            { icon: "Award", label: "Выпускников", value: "47" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
              <Icon name={stat.icon} size={20} className="mx-auto mb-2" style={{ color: "#F4720B" }} />
              <div className="text-white text-2xl font-bold">{stat.value}</div>
              <div className="text-white/50 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#F4720B" }}>
              <Icon name="Settings" size={24} className="text-white" />
            </div>
            <div className="text-white font-bold text-xl">ProService Academy</div>
          </div>

          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <h2 className="text-white text-2xl font-bold mb-2">Вход в платформу</h2>
            <p className="text-white/50 text-sm mb-8">Введите ваши учётные данные</p>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ivan@proservice.ru"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 text-[15px] outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block font-medium">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 text-[15px] outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)", color: "#FCA5A5" }}>
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all hover:opacity-90 active:scale-95 mt-2"
                style={{ background: loading ? "rgba(244,114,11,0.6)" : "#F4720B" }}
              >
                {loading ? "Входим..." : "Войти"}
              </button>
            </div>

            <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 text-xs mb-2 font-medium">Тестовые аккаунты (пароль: 123456)</p>
              <div className="space-y-1">
                {MOCK_USERS.slice(0, 4).map(u => (
                  <button key={u.id} onClick={() => { setEmail(u.email); setPassword("123456"); }}
                    className="w-full text-left px-2 py-1 rounded text-xs text-white/50 hover:text-white/80 transition-colors">
                    {u.email} — {u.role === "trainer" ? "Тренер" : u.role === "presentation" ? "Презентация" : "Ученик"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ user, activeTab, setActiveTab, onLogout }: {
  user: User; activeTab: string; setActiveTab: (tab: string) => void; onLogout: () => void;
}) {
  const trainerNav = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Главная" },
    { id: "courses", icon: "BookOpen", label: "Курсы" },
    { id: "students", icon: "Users", label: "Ученики" },
    { id: "homeworks", icon: "ClipboardCheck", label: "Задания" },
    { id: "forum", icon: "MessageSquare", label: "Форум" },
    { id: "presentation", icon: "Monitor", label: "Презентация" },
  ];
  const studentNav = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Мой кабинет" },
    { id: "courses", icon: "BookOpen", label: "Мои курсы" },
    { id: "homeworks", icon: "ClipboardCheck", label: "Задания" },
    { id: "forum", icon: "MessageSquare", label: "Форум" },
  ];
  const nav = user.role === "trainer" ? trainerNav : studentNav;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen shrink-0" style={{ background: "#1B2A4A" }}>
      <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F4720B" }}>
            <Icon name="Settings" size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">ProService</div>
            <div className="text-white/40 text-xs">Academy</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`sidebar-nav-item w-full text-left ${activeTab === item.id ? "active" : ""}`}>
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: "#F4720B" }}>
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-white/40 text-xs">{user.role === "trainer" ? "Тренер" : "Ученик"}</div>
          </div>
        </div>
        <button onClick={onLogout} className="sidebar-nav-item w-full text-left text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileNav({ user, activeTab, setActiveTab }: { user: User; activeTab: string; setActiveTab: (t: string) => void }) {
  const trainerNav = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Главная" },
    { id: "courses", icon: "BookOpen", label: "Курсы" },
    { id: "homeworks", icon: "ClipboardCheck", label: "Задания" },
    { id: "students", icon: "Users", label: "Ученики" },
    { id: "forum", icon: "MessageSquare", label: "Форум" },
  ];
  const studentNav = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Кабинет" },
    { id: "courses", icon: "BookOpen", label: "Курсы" },
    { id: "homeworks", icon: "ClipboardCheck", label: "Задания" },
    { id: "forum", icon: "MessageSquare", label: "Форум" },
  ];
  const nav = user.role === "trainer" ? trainerNav : studentNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex" style={{ background: "#1B2A4A", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      {nav.map(item => (
        <button key={item.id} onClick={() => setActiveTab(item.id)}
          className="flex-1 flex flex-col items-center py-3 gap-1 transition-all"
          style={{ color: activeTab === item.id ? "#F4720B" : "rgba(255,255,255,0.5)" }}>
          <Icon name={item.icon} size={20} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Trainer Dashboard ────────────────────────────────────────────────────────
function TrainerDashboard() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Добро пожаловать!</h1>
        <p className="text-muted-foreground mt-1">Обзор текущей активности на платформе</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Активных учеников", value: "8", icon: "Users", color: "#1B2A4A", light: "#EEF1F7" },
          { label: "Курсов запущено", value: "2", icon: "BookOpen", color: "#F4720B", light: "#FFF3E8" },
          { label: "Заданий на проверке", value: "3", icon: "ClipboardCheck", color: "#059669", light: "#ECFDF5" },
          { label: "Сообщений на форуме", value: "12", icon: "MessageSquare", color: "#7C3AED", light: "#F3F0FF" },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.light }}>
              <Icon name={stat.icon} size={20} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-muted-foreground text-sm mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-border/50">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="TrendingUp" size={18} style={{ color: "#F4720B" }} />
            Прогресс учеников
          </h3>
          <div className="space-y-4">
            {MOCK_USERS.filter(u => u.role === "student").map(student => (
              <div key={student.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#1B2A4A" }}>
                      {student.avatar}
                    </div>
                    <span className="text-sm font-medium text-foreground">{student.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#F4720B" }}>{student.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${student.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border/50">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="Clock" size={18} style={{ color: "#F4720B" }} />
            Последние задания
          </h3>
          <div className="space-y-3">
            {MOCK_HOMEWORKS.map(hw => (
              <div key={hw.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#F8F9FB" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "#1B2A4A" }}>
                  {hw.studentName.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{hw.studentName}</div>
                  <div className="text-xs text-muted-foreground truncate">{hw.lessonTitle}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                  hw.status === "pending" ? "bg-amber-100 text-amber-700" :
                  hw.status === "checked" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {hw.status === "pending" ? "Новое" : hw.status === "checked" ? "Проверено" : "На доработку"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentDashboard({ user, notifications, onMarkRead }: { user: User; notifications: Notification[]; onMarkRead: () => void }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #243558 100%)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ background: "#F4720B" }}>
            {user.avatar}
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{user.name}</h1>
            <p className="text-white/60 text-sm">Мастер-приёмщик • {user.coursesCompleted} курса завершено</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/70">Общий прогресс обучения</span>
            <span className="text-white font-bold">{user.progress}%</span>
          </div>
          <div className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${user.progress}%`, background: "linear-gradient(90deg, #F4720B, #FF9A3E)" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Уроков пройдено", value: "7", icon: "CheckCircle", color: "#059669", light: "#ECFDF5" },
          { label: "Заданий сдано", value: "5", icon: "FileCheck", color: "#F4720B", light: "#FFF3E8" },
          { label: "Средняя оценка", value: "4.8", icon: "Star", color: "#EAB308", light: "#FEFCE8" },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.light }}>
              <Icon name={stat.icon} size={20} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-muted-foreground text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {notifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Icon name="Bell" size={16} style={{ color: "#F4720B" }} />
              Уведомления
            </h3>
            {notifications.some(n => !n.read) && (
              <button onClick={onMarkRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Отметить все прочитанными
              </button>
            )}
          </div>
          {notifications.slice().reverse().map(n => (
            <div key={n.id} className="flex items-start gap-3 p-4 rounded-xl transition-all"
              style={{ background: n.read ? "#F8F9FB" : "#FFF3E8", border: `1.5px solid ${n.read ? "#EEF1F7" : "#FDDCB5"}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: n.status === "checked" ? "#ECFDF5" : "#FEF2F2" }}>
                <Icon name={n.status === "checked" ? "CheckCircle" : "RotateCcw"} size={16}
                  style={{ color: n.status === "checked" ? "#059669" : "#DC2626" }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {n.status === "checked" ? `Работа принята${n.grade ? ` — оценка ${n.grade}` : ""}` : "Работа отправлена на доработку"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.lessonTitle} · {n.createdAt}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#F4720B" }} />}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-border/50">
        <h3 className="font-bold text-foreground mb-4">Продолжить обучение</h3>
        <div className="flex items-start gap-4 p-4 rounded-xl hover-lift cursor-pointer" style={{ background: "#F8F9FB", border: "2px solid #EEF1F7" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFF3E8" }}>
            <Icon name="PlayCircle" size={24} style={{ color: "#F4720B" }} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground">Работа с клиентскими возражениями</div>
            <div className="text-sm text-muted-foreground mt-0.5">Урок 3 · Мастер-приёмщик: базовый курс</div>
            <div className="text-xs mt-2 font-medium" style={{ color: "#F4720B" }}>50 минут · Есть домашнее задание</div>
          </div>
          <Icon name="ChevronRight" size={20} className="text-muted-foreground shrink-0 mt-1" />
        </div>
      </div>
    </div>
  );
}

// ─── Courses View ─────────────────────────────────────────────────────────────
function CoursesView({ user }: { user: User }) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Загрузка курсов с сервера + прогресс ученика
  useEffect(() => {
    API.apiGetCourses().then(raw => {
      const mapped = (raw as Record<string, unknown>[]).map(c => {
        const rawLessons = (c.lessons as Record<string, unknown>[]) || [];
        return {
          id: c.id as number,
          title: c.title as string,
          description: c.description as string,
          progress: c.progress as number,
          studentsCount: c.students_count as number,
          lessons: rawLessons.map(l => ({
            id: l.id as number,
            title: l.title as string,
            duration: (l.duration as string || '').replace(' min', ' мин'),
            completed: false,
            hasHomework: l.has_homework as boolean,
            status: (l.status as 'draft' | 'published') || 'published',
            order: l.sort_order as number,
            content: l.content as string,
            summary: l.summary as string,
            homework: l.homework as string,
            cheatsheet: l.cheatsheet as string,
          })),
        } as Course;
      });
      // Если ученик — загружаем его прогресс
      if (user.role === 'student') {
        API.apiGetProgress(user.id).then(completedIds => {
          setCourses(mapped.map(c => ({
            ...c,
            lessons: c.lessons.map(l => ({ ...l, completed: completedIds.includes(l.id) })),
          })));
        }).catch(() => setCourses(mapped));
      } else {
        setCourses(mapped);
      }
    }).catch(() => setCourses(MOCK_COURSES))
      .finally(() => setLoadingCourses(false));
  }, [user.id, user.role]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingCourse, setEditingCourse] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDesc, setEditCourseDesc] = useState("");

  const openEditCourse = () => {
    if (!selectedCourse) return;
    setEditCourseTitle(selectedCourse.title);
    setEditCourseDesc(selectedCourse.description);
    setEditingCourse(true);
  };

  const handleSaveCourse = () => {
    if (!editCourseTitle.trim() || !selectedCourse) return;
    const updated = { ...selectedCourse, title: editCourseTitle, description: editCourseDesc };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    setEditingCourse(false);
    API.apiUpdateCourse(selectedCourse.id, { title: editCourseTitle, description: editCourseDesc }).catch(() => {});
  };
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonHasHomework, setLessonHasHomework] = useState(false);
  const [lessonContent, setLessonContent] = useState("");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonHomework, setLessonHomework] = useState("");
  const [lessonCheatsheet, setLessonCheatsheet] = useState("");
  const [lessonStatus, setLessonStatus] = useState<"draft" | "published">("published");
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [draggingFromIdx, setDraggingFromIdx] = useState<number | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDuration(lesson.duration);
    setLessonHasHomework(lesson.hasHomework);
    setLessonContent(lesson.content || "");
    setLessonSummary(lesson.summary || "");
    setLessonHomework(lesson.homework || "");
    setLessonCheatsheet(lesson.cheatsheet || "");
    setLessonStatus(lesson.status || "published");
  };

  const handleEditLesson = () => {
    if (!lessonTitle.trim() || !selectedCourse || !editingLesson) return;
    const lessonData = { title: lessonTitle, duration: lessonDuration || "30 мин", has_homework: lessonHasHomework, content: lessonContent, summary: lessonSummary, homework: lessonHomework, cheatsheet: lessonCheatsheet, status: lessonStatus };
    const updated = {
      ...selectedCourse,
      lessons: selectedCourse.lessons.map(l =>
        l.id === editingLesson.id ? { ...l, title: lessonTitle, duration: lessonDuration || "30 мин", hasHomework: lessonHasHomework, content: lessonContent, summary: lessonSummary, homework: lessonHomework, cheatsheet: lessonCheatsheet, status: lessonStatus } : l
      ),
    };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    setEditingLesson(null);
    setLessonTitle(""); setLessonDuration(""); setLessonHasHomework(false);
    setLessonContent(""); setLessonSummary(""); setLessonHomework(""); setLessonCheatsheet("");
    API.apiUpdateLesson(editingLesson.id, lessonData).catch(() => {});
  };

  const handleToggleLessonStatus = (lessonId: number) => {
    if (!selectedCourse) return;
    const lesson = selectedCourse.lessons.find(l => l.id === lessonId);
    const newStatus = lesson?.status === "published" ? "draft" : "published";
    const updated = { ...selectedCourse, lessons: selectedCourse.lessons.map(l => l.id === lessonId ? { ...l, status: newStatus as "draft" | "published" } : l) };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    API.apiUpdateLesson(lessonId, { status: newStatus }).catch(() => {});
  };

  const handleDragLesson = (fromIdx: number, toIdx: number) => {
    if (!selectedCourse || fromIdx === toIdx) return;
    const lessons = [...selectedCourse.lessons];
    const [moved] = lessons.splice(fromIdx, 1);
    lessons.splice(toIdx, 0, moved);
    const reordered = lessons.map((l, i) => ({ ...l, order: i + 1 }));
    const updated = { ...selectedCourse, lessons: reordered };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    API.apiReorderLessons(reordered.map(l => ({ id: l.id, sort_order: l.order }))).catch(() => {});
  };

  const handleDeleteLesson = (lessonId: number) => {
    if (!selectedCourse) return;
    const updated = { ...selectedCourse, lessons: selectedCourse.lessons.filter(l => l.id !== lessonId) };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    // Мягкое удаление через статус (DELETE не поддерживается)
    API.apiUpdateLesson(lessonId, { status: "draft" }).catch(() => {});
  };

  const handleCreateCourse = () => {
    if (!newTitle.trim()) return;
    API.apiCreateCourse(newTitle, newDesc).then(raw => {
      const created: Course = {
        id: (raw as Record<string, unknown>).id as number,
        title: newTitle,
        description: newDesc,
        progress: 0,
        studentsCount: 0,
        lessons: [],
      };
      setCourses(prev => [...prev, created]);
    }).catch(() => {
      const created: Course = { id: Date.now(), title: newTitle, description: newDesc, progress: 0, studentsCount: 0, lessons: [] };
      setCourses(prev => [...prev, created]);
    });
    setNewTitle("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleAddLesson = () => {
    if (!lessonTitle.trim() || !selectedCourse) return;
    const lessonData = {
      title: lessonTitle, duration: lessonDuration || "30 мин",
      has_homework: lessonHasHomework, status: lessonStatus,
      content: lessonContent, summary: lessonSummary, homework: lessonHomework, cheatsheet: lessonCheatsheet,
    };
    API.apiCreateLesson(selectedCourse.id, lessonData).then(raw => {
      const r = raw as Record<string, unknown>;
      const newLesson: Lesson = {
        id: r.id as number, title: r.title as string,
        duration: (r.duration as string || '').replace(' min', ' мин'),
        completed: false, hasHomework: r.has_homework as boolean,
        status: r.status as "draft" | "published",
        order: r.sort_order as number,
        content: r.content as string, summary: r.summary as string,
        homework: r.homework as string, cheatsheet: r.cheatsheet as string,
      };
      const updated = { ...selectedCourse, lessons: [...selectedCourse.lessons, newLesson] };
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
      setSelectedCourse(updated);
    }).catch(() => {
      const newLesson: Lesson = {
        id: Date.now(), title: lessonTitle, duration: lessonDuration || "30 мин",
        completed: false, hasHomework: lessonHasHomework, status: lessonStatus,
        order: selectedCourse.lessons.length + 1,
        content: lessonContent, summary: lessonSummary, homework: lessonHomework, cheatsheet: lessonCheatsheet,
      };
      const updated = { ...selectedCourse, lessons: [...selectedCourse.lessons, newLesson] };
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
      setSelectedCourse(updated);
    });
    setLessonTitle(""); setLessonDuration(""); setLessonHasHomework(false);
    setLessonContent(""); setLessonSummary(""); setLessonHomework(""); setLessonCheatsheet("");
    setShowAddLesson(false);
  };

  if (selectedCourse) {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <Icon name="ArrowLeft" size={16} />
          Назад к курсам
        </button>

        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #243558 100%)" }}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-white text-2xl font-bold">{selectedCourse.title}</h1>
            {user.role === "trainer" && (
              <button onClick={openEditCourse}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <Icon name="Pencil" size={15} className="text-white" />
              </button>
            )}
          </div>
          <p className="text-white/60 mb-4">{selectedCourse.description}</p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><Icon name="BookOpen" size={14} />{selectedCourse.lessons.length} уроков</span>
            {user.role === "trainer" && <span className="flex items-center gap-1.5"><Icon name="Users" size={14} />{selectedCourse.studentsCount} учеников</span>}
          </div>

          {editingCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">Редактировать курс</h3>
                  <button onClick={() => setEditingCourse(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                    <Icon name="X" size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Название курса</label>
                    <input value={editCourseTitle} onChange={e => setEditCourseTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                      style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Описание</label>
                    <textarea value={editCourseDesc} onChange={e => setEditCourseDesc(e.target.value)}
                      rows={3} className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none resize-none"
                      style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditingCourse(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>
                      Отмена
                    </button>
                    <button onClick={handleSaveCourse} disabled={!editCourseTitle.trim()}
                      className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40"
                      style={{ background: "#F4720B" }}>
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {user.role === "student" && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Прогресс</span>
                <span className="text-white font-bold">{selectedCourse.progress}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-2 rounded-full" style={{ width: `${selectedCourse.progress}%`, background: "#F4720B" }} />
              </div>
            </div>
          )}
        </div>

        {/* Просмотр урока — тренер видит модалку, ученик видит встроенную страницу */}
        {viewingLesson && user.role === "trainer" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{viewingLesson.title}</h2>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <Icon name="Clock" size={11} />{viewingLesson.duration}
                    {viewingLesson.hasHomework && <><span>·</span><Icon name="FileText" size={11} />Есть Д/З</>}
                  </div>
                </div>
                <button onClick={() => setViewingLesson(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-5 no-copy" onContextMenu={e => e.preventDefault()}>
                {viewingLesson.content && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <Icon name="BookOpen" size={12} />Основной контент (только для тренера)
                    </div>
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap">{viewingLesson.content}</div>
                  </div>
                )}
                {viewingLesson.summary && (
                  <div className="p-4 rounded-xl" style={{ background: "#EEF1F7", border: "1.5px solid #D0D8EA" }}>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#1B2A4A" }}>
                      <Icon name="List" size={12} />Опорный конспект (видит ученик)
                    </div>
                    <div className="text-foreground leading-relaxed text-sm whitespace-pre-wrap">{viewingLesson.summary}</div>
                  </div>
                )}
                {viewingLesson.hasHomework && viewingLesson.homework && (
                  <div className="p-4 rounded-xl" style={{ background: "#FFF3E8", border: "1.5px solid #FDDCB5" }}>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#F4720B" }}>
                      <Icon name="FileText" size={12} />Домашнее задание
                    </div>
                    <div className="text-foreground leading-relaxed text-sm whitespace-pre-wrap">{viewingLesson.homework}</div>
                  </div>
                )}
                {viewingLesson.cheatsheet && (
                  <div className="p-4 rounded-xl" style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0" }}>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#059669" }}>
                      <Icon name="Lightbulb" size={12} />Шпаргалка
                    </div>
                    <div className="text-foreground leading-relaxed text-sm whitespace-pre-wrap">{viewingLesson.cheatsheet}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Страница урока для ученика */}
        {viewingLesson && user.role === "student" && (
          <div className="animate-fade-in space-y-4">
            <button onClick={() => setViewingLesson(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              <Icon name="ArrowLeft" size={16} />
              Назад к урокам
            </button>

            {/* Заголовок */}
            <div className="rounded-2xl p-6 no-copy" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #243558 100%)" }} onContextMenu={e => e.preventDefault()}>
              <div className="flex items-center gap-2 mb-3">
                {viewingLesson.completed && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(5,150,105,0.3)", color: "#6EE7B7" }}>
                    ✓ Пройден
                  </span>
                )}
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">{viewingLesson.title}</h2>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <span className="flex items-center gap-1.5"><Icon name="Clock" size={14} />{viewingLesson.duration}</span>
                {viewingLesson.hasHomework && <span className="flex items-center gap-1.5"><Icon name="FileText" size={14} />Есть домашнее задание</span>}
              </div>
            </div>

            {/* Блок 1 — Опорный конспект */}
            {viewingLesson.summary ? (
              <div className="bg-white rounded-2xl p-6 border border-border/50 no-copy" onContextMenu={e => e.preventDefault()}>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EEF1F7" }}>
                    <Icon name="List" size={16} style={{ color: "#1B2A4A" }} />
                  </div>
                  Опорный конспект
                </h3>
                <div className="text-foreground leading-relaxed whitespace-pre-wrap text-[15px]">{viewingLesson.summary}</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-border/50 text-center text-muted-foreground">
                <Icon name="List" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Тренер ещё не добавил опорный конспект к этому уроку</p>
              </div>
            )}

            {/* Блок 2 — Шпаргалка */}
            {viewingLesson.cheatsheet ? (
              <div className="rounded-2xl p-6 no-copy" style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0" }} onContextMenu={e => e.preventDefault()}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#059669" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(5,150,105,0.15)" }}>
                    <Icon name="Lightbulb" size={16} style={{ color: "#059669" }} />
                  </div>
                  Шпаргалка
                </h3>
                <div className="leading-relaxed whitespace-pre-wrap text-[15px]" style={{ color: "#065F46" }}>{viewingLesson.cheatsheet}</div>
              </div>
            ) : (
              <div className="rounded-2xl p-5 text-center" style={{ background: "#F0FFF4", border: "1.5px dashed #A7F3D0" }}>
                <p className="text-sm" style={{ color: "#059669" }}>Шпаргалка будет добавлена тренером</p>
              </div>
            )}

            {/* Домашнее задание */}
            {viewingLesson.hasHomework && viewingLesson.homework && (
              <div className="rounded-2xl p-6 no-copy" style={{ background: "#FFF3E8", border: "1.5px solid #FDDCB5" }} onContextMenu={e => e.preventDefault()}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#F4720B" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(244,114,11,0.15)" }}>
                    <Icon name="FileText" size={16} style={{ color: "#F4720B" }} />
                  </div>
                  Домашнее задание
                </h3>
                <div className="leading-relaxed whitespace-pre-wrap text-[15px] text-foreground">{viewingLesson.homework}</div>
              </div>
            )}

            {/* Кнопка «Отметить как изученный» */}
            {!viewingLesson.completed ? (
              <button
                onClick={() => {
                  const updated = {
                    ...selectedCourse,
                    lessons: selectedCourse.lessons.map(l => l.id === viewingLesson.id ? { ...l, completed: true } : l),
                  };
                  setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
                  setSelectedCourse(updated);
                  setViewingLesson({ ...viewingLesson, completed: true });
                  API.apiMarkLessonDone(user.id, viewingLesson.id).catch(() => {});
                }}
                className="w-full py-4 rounded-2xl font-semibold text-white text-[15px] transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #243558 100%)" }}>
                <Icon name="CheckCircle" size={20} />
                Отметить как изученный
              </button>
            ) : (
              <div className="w-full py-4 rounded-2xl font-semibold text-center text-[15px] flex items-center justify-center gap-2"
                style={{ background: "#ECFDF5", color: "#059669", border: "2px solid #A7F3D0" }}>
                <Icon name="CheckCircle" size={20} />
                Урок пройден
              </div>
            )}
          </div>
        )}

        {/* Список уроков */}
        {!viewingLesson && (
        <div className="space-y-2">
          {selectedCourse.lessons
            .filter(l => user.role === "trainer" || l.status === "published")
            .map((lesson, idx) => (
            <div key={lesson.id}
              draggable={user.role === "trainer" && draggingFromIdx === idx}
              onDragStart={e => { e.dataTransfer.setData("idx", String(idx)); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { setDraggingFromIdx(null); setDragOverIdx(null); }}
              onDragOver={e => { e.preventDefault(); if (dragOverIdx !== idx) setDragOverIdx(idx); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIdx(null); }}
              onDrop={e => { e.preventDefault(); if (draggingFromIdx !== null) handleDragLesson(draggingFromIdx, idx); setDragOverIdx(null); setDraggingFromIdx(null); }}
              className="bg-white rounded-2xl p-4 border flex items-center gap-3 transition-all"
              style={{ borderColor: dragOverIdx === idx ? "#F4720B" : "rgba(0,0,0,0.07)", opacity: draggingFromIdx === idx ? 0.5 : lesson.status === "draft" ? 0.75 : 1 }}>

              {user.role === "trainer" && (
                <div
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-muted cursor-grab active:cursor-grabbing"
                  style={{ color: "#9CA3AF" }}
                  title="Зажмите и перетащите чтобы изменить порядок"
                  onMouseDown={() => setDraggingFromIdx(idx)}
                  onMouseUp={() => setDraggingFromIdx(null)}>
                  <Icon name="GripVertical" size={18} />
                </div>
              )}

              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                style={{ background: lesson.completed ? "#F4720B" : "#F0F2F5", color: lesson.completed ? "white" : "#9CA3AF" }}>
                {lesson.completed ? <Icon name="Check" size={15} className="text-white" /> : idx + 1}
              </div>

              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingLesson(lesson)}>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  {lesson.title}
                  {user.role === "trainer" && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: lesson.status === "published" ? "#ECFDF5" : "#F3F4F6", color: lesson.status === "published" ? "#059669" : "#6B7280" }}>
                      {lesson.status === "published" ? "Опубликован" : "Черновик"}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Icon name="Clock" size={11} />{lesson.duration}</span>
                  {lesson.hasHomework && <span className="flex items-center gap-1"><Icon name="FileText" size={11} />Д/З</span>}
                </div>
              </div>

              {user.role === "trainer" ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleLessonStatus(lesson.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-muted-foreground hover:bg-muted"
                    title={lesson.status === "published" ? "Скрыть (в черновик)" : "Опубликовать"}>
                    <Icon name={lesson.status === "published" ? "EyeOff" : "Eye"} size={14} />
                  </button>
                  <button onClick={() => openEditLesson(lesson)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => handleDeleteLesson(lesson.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: "#DC2626" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setViewingLesson(lesson)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 transition-all hover:opacity-80"
                  style={lesson.completed
                    ? { background: "#ECFDF5", color: "#059669" }
                    : { background: "#F4720B", color: "white" }
                  }>
                  {lesson.completed ? "Пройден" : "Начать"}
                </button>
              )}
            </div>
          ))}
        </div>
        )}

        {editingLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h3 className="text-lg font-bold text-foreground">Редактировать урок</h3>
                <button onClick={() => setEditingLesson(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Название урока</label>
                    <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-foreground text-[15px] outline-none"
                      style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Продолжительность</label>
                    <input value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} placeholder="45 мин"
                      className="w-full px-3 py-2.5 rounded-xl text-foreground text-[15px] outline-none"
                      style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setLessonHasHomework(v => !v)}
                      className="w-5 h-5 rounded flex items-center justify-center transition-all shrink-0"
                      style={{ background: lessonHasHomework ? "#F4720B" : "#E0E5EF" }}>
                      {lessonHasHomework && <Icon name="Check" size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">Есть Д/З</span>
                  </label>
                  <div className="flex gap-2 ml-auto">
                    {(["draft", "published"] as const).map(s => (
                      <button key={s} onClick={() => setLessonStatus(s)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: lessonStatus === s ? (s === "published" ? "#ECFDF5" : "#F3F4F6") : "#F0F3F8", color: lessonStatus === s ? (s === "published" ? "#059669" : "#374151") : "#9CA3AF" }}>
                        {s === "published" ? "Опубликован" : "Черновик"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Icon name="BookOpen" size={13} />Основной контент
                    <span className="text-xs font-normal text-muted-foreground">(только для тренера, подготовка к занятию)</span>
                  </label>
                  <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)}
                    placeholder="Конспект занятия, сценарий, методические заметки..."
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                    style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Icon name="List" size={13} style={{ color: "#1B2A4A" }} />Опорный конспект
                    <span className="text-xs font-normal text-muted-foreground">(видит ученик — ключевые мысли урока)</span>
                  </label>
                  <textarea value={lessonSummary} onChange={e => setLessonSummary(e.target.value)}
                    placeholder="Ключевые тезисы, выводы, структура урока для ученика..."
                    rows={4} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                    style={{ background: "#EEF1F7", border: "1.5px solid #D0D8EA" }} />
                </div>
                {lessonHasHomework && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                      <Icon name="FileText" size={13} style={{ color: "#F4720B" }} />Домашнее задание
                    </label>
                    <textarea value={lessonHomework} onChange={e => setLessonHomework(e.target.value)}
                      placeholder="Задание для самостоятельного выполнения..."
                      rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                      style={{ background: "#FFF3E8", border: "1.5px solid #FDDCB5" }} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Icon name="Lightbulb" size={13} style={{ color: "#059669" }} />Шпаргалка
                    <span className="text-xs font-normal text-muted-foreground">(готовые формулы и фразы для работы)</span>
                  </label>
                  <textarea value={lessonCheatsheet} onChange={e => setLessonCheatsheet(e.target.value)}
                    placeholder="Готовые фразы, таблицы, алгоритмы для практики..."
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                    style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0" }} />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-border/50">
                <button onClick={() => setEditingLesson(null)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>Отмена</button>
                <button onClick={handleEditLesson} disabled={!lessonTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40" style={{ background: "#F4720B" }}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {user.role === "trainer" && (
          <button onClick={() => setShowAddLesson(true)} className="flex items-center gap-2 w-full justify-center py-4 rounded-2xl border-2 border-dashed font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all" style={{ borderColor: "#E0E5EF" }}>
            <Icon name="Plus" size={18} />
            Добавить урок
          </button>
        )}

        {showAddLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h3 className="text-lg font-bold text-foreground">Новый урок</h3>
                <button onClick={() => setShowAddLesson(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Название урока</label>
                    <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="Название..."
                      className="w-full px-3 py-2.5 rounded-xl text-foreground text-[15px] outline-none"
                      style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Продолжительность</label>
                    <input value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} placeholder="45 мин"
                      className="w-full px-3 py-2.5 rounded-xl text-foreground text-[15px] outline-none"
                      style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setLessonHasHomework(v => !v)}
                      className="w-5 h-5 rounded flex items-center justify-center transition-all shrink-0"
                      style={{ background: lessonHasHomework ? "#F4720B" : "#E0E5EF" }}>
                      {lessonHasHomework && <Icon name="Check" size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">Есть Д/З</span>
                  </label>
                  <div className="flex gap-2 ml-auto">
                    {(["draft", "published"] as const).map(s => (
                      <button key={s} onClick={() => setLessonStatus(s)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: lessonStatus === s ? (s === "published" ? "#ECFDF5" : "#F3F4F6") : "#F0F3F8", color: lessonStatus === s ? (s === "published" ? "#059669" : "#374151") : "#9CA3AF" }}>
                        {s === "published" ? "Опубликован" : "Черновик"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block"><Icon name="BookOpen" size={13} className="inline mr-1" />Основной контент <span className="text-xs font-normal text-muted-foreground">(только тренер)</span></label>
                  <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="Конспект занятия, методические заметки..."
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                    style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block"><Icon name="List" size={13} className="inline mr-1" />Опорный конспект <span className="text-xs font-normal text-muted-foreground">(видит ученик)</span></label>
                  <textarea value={lessonSummary} onChange={e => setLessonSummary(e.target.value)} placeholder="Ключевые тезисы для ученика..."
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                    style={{ background: "#EEF1F7", border: "1.5px solid #D0D8EA" }} />
                </div>
                {lessonHasHomework && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block" style={{ color: "#F4720B" }}><Icon name="FileText" size={13} className="inline mr-1" />Домашнее задание</label>
                    <textarea value={lessonHomework} onChange={e => setLessonHomework(e.target.value)} placeholder="Задание..."
                      rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                      style={{ background: "#FFF3E8", border: "1.5px solid #FDDCB5" }} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block" style={{ color: "#059669" }}><Icon name="Lightbulb" size={13} className="inline mr-1" />Шпаргалка</label>
                  <textarea value={lessonCheatsheet} onChange={e => setLessonCheatsheet(e.target.value)} placeholder="Ключевые тезисы..."
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-foreground text-sm outline-none resize-none"
                    style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0" }} />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-border/50">
                <button onClick={() => setShowAddLesson(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>Отмена</button>
                <button onClick={handleAddLesson} disabled={!lessonTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40" style={{ background: "#F4720B" }}>Добавить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Курсы</h1>
          <p className="text-muted-foreground mt-1">Все учебные программы платформы</p>
        </div>
        {user.role === "trainer" && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: "#F4720B" }}>
            <Icon name="Plus" size={16} />
            Создать курс
          </button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Новый курс</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Название курса</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Например: Мастер-приёмщик: базовый курс"
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none transition-all"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Описание</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Краткое описание программы курса..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none resize-none transition-all"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>
                  Отмена
                </button>
                <button onClick={handleCreateCourse} disabled={!newTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-40"
                  style={{ background: "#F4720B" }}>
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingCourses && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Icon name="Loader" size={24} className="animate-spin mr-2" />
          Загрузка курсов...
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl p-6 border border-border/50 hover-lift cursor-pointer" onClick={() => setSelectedCourse(course as Course)}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E8" }}>
                <Icon name="BookOpen" size={22} style={{ color: "#F4720B" }} />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#EEF1F7", color: "#1B2A4A" }}>
                {course.lessons.length} уроков
              </span>
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">{course.title}</h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{course.description}</p>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-bold" style={{ color: "#F4720B" }}>{course.progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${course.progress}%` }} />
            </div>
            {user.role === "trainer" && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon name="Users" size={14} />
                {course.studentsCount} учеников
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Homeworks View ────────────────────────────────────────────────────────────
function HomeworksView({ user, onNotify }: { user: User; onNotify?: (n: Omit<Notification, "id" | "createdAt" | "read">) => void }) {
  const [homeworks, setHomeworks] = useState<HomeworkWithComment[]>([]);
  const [selected, setSelected] = useState<HomeworkWithComment | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [trainerComment, setTrainerComment] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitLesson, setSubmitLesson] = useState("");
  const [submitText, setSubmitText] = useState("");
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  // Загрузка заданий с сервера
  useEffect(() => {
    const load = () => {
      const params = user.role === 'student' ? user.id : undefined;
      API.apiGetHomeworks(params).then(raw => {
        setHomeworks((raw as Record<string, unknown>[]).map(r => ({
          id: r.id as number,
          studentName: (r.student_name as string) || '',
          lessonTitle: r.lesson_title as string,
          submittedAt: new Date(r.submitted_at as string).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          status: r.status as "pending" | "checked" | "revision",
          grade: r.grade as number | undefined,
          text: r.text as string,
          trainerComment: (r.trainer_comment as string) || '',
        })));
      }).catch(() => setHomeworks(MOCK_HOMEWORKS as HomeworkWithComment[]));
    };
    load();
  }, [user.id, user.role]);

  // Загрузка черновика и заметок для ученика
  useEffect(() => {
    if (user.role !== 'student') return;
    API.apiGetHwDraft(user.id).then(d => { setSubmitLesson(d.lesson_title); setSubmitText(d.text); }).catch(() => {});
    API.apiGetStudentNotes(user.id).then(d => setStudentNotes({ general: d.notes })).catch(() => {});
  }, [user.id, user.role]);

  const getStudentIdByName = (name: string) => MOCK_USERS.find(u => u.name === name)?.id ?? 0;
  const getStudentEmail = (name: string) => MOCK_USERS.find(u => u.name === name)?.email ?? "";

  const handleAccept = () => {
    if (!selected || !gradeInput) return;
    const data = { status: "checked", grade: Number(gradeInput), trainer_comment: trainerComment };
    setHomeworks(prev => prev.map(hw => hw.id === selected.id ? { ...hw, status: "checked" as const, grade: Number(gradeInput), trainerComment } : hw));
    API.apiGradeHomework(selected.id, data).catch(() => {});
    const sid = getStudentIdByName(selected.studentName);
    if (sid) API.apiCreateNotification({ student_id: sid, lesson_title: selected.lessonTitle, status: "checked", grade: Number(gradeInput) }).catch(() => {});
    onNotify?.({ studentEmail: getStudentEmail(selected.studentName), lessonTitle: selected.lessonTitle, status: "checked", grade: Number(gradeInput) });
    setSelected(null); setGradeInput(""); setTrainerComment("");
  };

  const handleRevision = () => {
    if (!selected) return;
    const data = { status: "revision", trainer_comment: trainerComment };
    setHomeworks(prev => prev.map(hw => hw.id === selected.id ? { ...hw, status: "revision" as const, trainerComment } : hw));
    API.apiGradeHomework(selected.id, data).catch(() => {});
    const sid = getStudentIdByName(selected.studentName);
    if (sid) API.apiCreateNotification({ student_id: sid, lesson_title: selected.lessonTitle, status: "revision" }).catch(() => {});
    onNotify?.({ studentEmail: getStudentEmail(selected.studentName), lessonTitle: selected.lessonTitle, status: "revision" });
    setSelected(null); setGradeInput(""); setTrainerComment("");
  };

  const handleSubmitHw = () => {
    if (!submitLesson.trim() || !submitText.trim()) return;
    API.apiSubmitHomework({ student_id: user.id, lesson_title: submitLesson, text: submitText }).then(raw => {
      const r = raw as Record<string, unknown>;
      const hw: HomeworkWithComment = { id: r.id as number, studentName: user.name, lessonTitle: submitLesson, submittedAt: "только что", status: "pending", text: submitText, trainerComment: '' };
      setHomeworks(prev => [hw, ...prev]);
    }).catch(() => {
      const hw: HomeworkWithComment = { id: Date.now(), studentName: user.name, lessonTitle: submitLesson, submittedAt: "только что", status: "pending", text: submitText, trainerComment: '' };
      setHomeworks(prev => [hw, ...prev]);
    });
    // Очищаем черновик
    API.apiSaveHwDraft(user.id, '', '').catch(() => {});
    setSubmitText(""); setSubmitLesson(""); setShowSubmit(false);
  };

  if (selected && user.role === "trainer") {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => { setSelected(null); setTrainerComment(""); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium">
          <Icon name="ArrowLeft" size={16} />Назад
        </button>
        <div className="bg-white rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#1B2A4A" }}>
              {selected.studentName.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <div className="font-bold text-foreground">{selected.studentName}</div>
              <div className="text-sm text-muted-foreground">{selected.lessonTitle} · {selected.submittedAt}</div>
            </div>
          </div>
          <div className="p-4 rounded-xl text-foreground leading-relaxed no-copy mb-4" style={{ background: "#F8F9FB", border: "1px solid #EEF1F7" }}>
            {selected.text}
          </div>
          {selected.studentNotes && (
            <div className="p-3 rounded-xl" style={{ background: "#EEF1F7" }}>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Заметки ученика по уроку</div>
              <div className="text-sm text-foreground">{selected.studentNotes}</div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border/50">
          <h3 className="font-bold mb-4">Оценить работу</h3>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(g => (
              <button key={g} onClick={() => setGradeInput(String(g))}
                className="w-12 h-12 rounded-xl font-bold text-lg transition-all"
                style={{ background: gradeInput === String(g) ? "#F4720B" : "#F0F2F5", color: gradeInput === String(g) ? "white" : "#6B7280" }}>
                {g}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Комментарий тренера</label>
            <textarea value={trainerComment} onChange={e => setTrainerComment(e.target.value)}
              placeholder="Напишите обратную связь ученику..."
              rows={3} className="w-full px-4 py-3 rounded-xl text-foreground text-sm outline-none resize-none"
              style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAccept} disabled={!gradeInput}
              className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-40" style={{ background: "#F4720B" }}>
              {gradeInput ? `Принять (оценка ${gradeInput})` : "Выберите оценку"}
            </button>
            <button onClick={handleRevision} className="px-4 py-3 rounded-xl font-medium" style={{ background: "#FEF2F2", color: "#DC2626" }}>
              На доработку
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "student") {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Мои задания</h1>
          <p className="text-muted-foreground mt-1">Домашние работы и статус проверки</p>
        </div>

        {/* Блокнот ученика */}
        <div className="bg-white rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Icon name="StickyNote" size={16} style={{ color: "#F4720B" }} />
            Мои заметки и рассуждения по урокам
          </h3>
          <textarea
            value={studentNotes["general"] || ""}
            onChange={e => { setStudentNotes(prev => ({ ...prev, general: e.target.value })); API.apiSaveStudentNotes(user.id, e.target.value).catch(() => {}); }}
            placeholder="Личный блокнот — записывайте мысли, выводы, вопросы по урокам. Сохраняется автоматически."
            rows={4}
            className="w-full text-foreground text-[15px] resize-none outline-none bg-transparent placeholder-muted-foreground"
          />
          <div className="text-xs text-muted-foreground mt-2">Сохранено автоматически</div>
        </div>

        <div className="space-y-3">
          {homeworks.filter(hw => hw.studentName === user.name || user.name.includes("Мастеров")).map(hw => (
            <div key={hw.id} className="bg-white rounded-2xl p-5 border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-foreground">{hw.lessonTitle}</div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-2 ${
                  hw.status === "pending" ? "bg-amber-100 text-amber-700" :
                  hw.status === "checked" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {hw.status === "pending" ? "На проверке" : hw.status === "checked" ? `Оценка: ${hw.grade}` : "На доработку"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{hw.text.slice(0, 100)}...</p>
              {hw.status === "checked" && hw.trainerComment && (
                <div className="p-3 rounded-xl text-sm" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "#059669" }}>Комментарий тренера</div>
                  <div className="text-foreground">{hw.trainerComment}</div>
                </div>
              )}
              {hw.status === "revision" && hw.trainerComment && (
                <div className="p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "#DC2626" }}>Комментарий тренера</div>
                  <div className="text-foreground">{hw.trainerComment}</div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">{hw.submittedAt}</div>
            </div>
          ))}
        </div>

        {/* Черновик нового задания */}
        {showSubmit ? (
          <div className="bg-white rounded-2xl p-5 border-2 border-border/50 space-y-4" style={{ borderColor: "#F4720B" }}>
            <h3 className="font-bold text-foreground">Новое задание</h3>
            <input value={submitLesson} onChange={e => setSubmitLesson(e.target.value)}
              placeholder="Название урока..." className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
              style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
            <div>
              <textarea value={submitText}
                onChange={e => { setSubmitText(e.target.value); API.apiSaveHwDraft(user.id, submitLesson, e.target.value).catch(() => {}); }}
                placeholder="Опишите выполненное задание..."
                rows={5} className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none resize-none"
                style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
              <div className="text-xs text-muted-foreground mt-1">Черновик сохранён автоматически</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmit(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>Отмена</button>
              <button onClick={handleSubmitHw} disabled={!submitLesson.trim() || !submitText.trim()}
                className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40" style={{ background: "#F4720B" }}>Отправить</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowSubmit(true)} className="flex items-center gap-2 w-full justify-center py-4 rounded-2xl font-medium text-white" style={{ background: "#F4720B" }}>
            <Icon name="Plus" size={18} />
            Сдать задание
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Проверка заданий</h1>
        <p className="text-muted-foreground mt-1">{homeworks.filter(h => h.status === "pending").length} работы ожидают проверки</p>
      </div>
      <div className="space-y-3">
        {homeworks.map(hw => (
          <div key={hw.id} className="bg-white rounded-2xl p-5 border border-border/50 hover-lift cursor-pointer" onClick={() => { setSelected(hw); setGradeInput(hw.grade ? String(hw.grade) : ""); }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "#1B2A4A" }}>
                {hw.studentName.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{hw.studentName}</div>
                <div className="text-xs text-muted-foreground">{hw.lessonTitle}</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                hw.status === "pending" ? "bg-amber-100 text-amber-700" :
                hw.status === "checked" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {hw.status === "pending" ? "Новое" : hw.status === "checked" ? "Проверено" : "На доработку"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{hw.text}</p>
            <div className="text-xs text-muted-foreground mt-2">{hw.submittedAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Students View ────────────────────────────────────────────────────────────
function StudentsView() {
  const [students, setStudents] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [studentMeta, setStudentMeta] = useState<Record<number, StudentMeta>>({});
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [docs, setDocs] = useState<Record<number, StudentDoc[]>>({});
  const [expandedDocs, setExpandedDocs] = useState<number | null>(null);

  // Загрузка учеников с сервера
  useEffect(() => {
    API.apiGetStudents().then(raw => {
      setStudents((raw as Record<string, unknown>[]).map(u => ({
        id: u.id as number,
        name: u.name as string,
        email: u.email as string,
        role: "student" as Role,
        avatar: u.avatar as string,
        progress: (u.progress as number) || 0,
        coursesCompleted: (u.courses_completed as number) || 0,
      })));
    }).catch(() => setStudents(MOCK_USERS.filter(u => u.role === "student")));
  }, []);
  const [uploadModal, setUploadModal] = useState<number | null>(null);
  const [docLabel, setDocLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string; size: string; type: string; dataUrl: string } | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<{ studentId: number; docId: number } | null>(null);

  const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return "FileText";
    if (type.startsWith("image/")) return "Image";
    return "File";
  };

  const getFileColor = (type: string) => {
    if (type === "application/pdf") return "#DC2626";
    if (type.startsWith("image/")) return "#059669";
    return "#3B82F6";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { alert("Формат не поддерживается. Используйте PDF, Word, JPG или PNG."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({
        name: file.name,
        size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} МБ` : `${Math.round(file.size / 1024)} КБ`,
        type: file.type,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUploadDoc = () => {
    if (!pendingFile || uploadModal === null) return;
    const now = new Date();
    const date = `${now.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][now.getMonth()]}, ${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`;
    const label = docLabel.trim() || pendingFile.name;
    const doc: StudentDoc = { id: Date.now(), name: pendingFile.name, label, uploadedAt: date, size: pendingFile.size, type: pendingFile.type, dataUrl: pendingFile.dataUrl };
    setDocs(prev => ({ ...prev, [uploadModal]: [...(prev[uploadModal] || []), doc] }));
    API.apiUploadStudentDoc({ student_id: uploadModal, name: pendingFile.name, label, size: pendingFile.size, file_type: pendingFile.type, data_url: pendingFile.dataUrl }).catch(() => {});
    setPendingFile(null); setDocLabel(""); setUploadModal(null);
  };

  const handleDownload = (doc: StudentDoc) => {
    const a = document.createElement("a");
    a.href = doc.dataUrl; a.download = doc.name; a.click();
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleAddStudent = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const pwd = generatePassword();
    API.apiCreateStudent({ name: newName, email: newEmail, password: pwd }).then(raw => {
      const u = raw as Record<string, unknown>;
      const student: User = { id: u.id as number, name: u.name as string, email: u.email as string, role: "student", avatar: u.avatar as string, progress: 0, coursesCompleted: 0 };
      setStudents(prev => [...prev, student]);
    }).catch(() => {
      const student: User = { id: Date.now(), name: newName, email: newEmail, role: "student", avatar: newName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(), progress: 0, coursesCompleted: 0 };
      setStudents(prev => [...prev, student]);
    });
    setGeneratedPassword(pwd);
    setNewName(""); setNewEmail(""); setShowAdd(false);
  };

  const updateMeta = (studentId: number, patch: Partial<StudentMeta>) => {
    const updated = { ...(studentMeta[studentId] || { studentId }), ...patch };
    setStudentMeta(prev => ({ ...prev, [studentId]: updated }));
    API.apiSaveStudentMeta(studentId, {
      candidate_status: updated.candidateStatus,
      candidate_comment: updated.candidateComment,
      trainer_notes: updated.trainerNotes,
    }).catch(() => {});
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Показ сгенерированного пароля */}
      {generatedPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#ECFDF5" }}>
              <Icon name="KeyRound" size={26} style={{ color: "#059669" }} />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-1">Ученик добавлен!</h3>
            <p className="text-sm text-muted-foreground mb-4">Передайте ученику временный пароль для первого входа</p>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4" style={{ background: "#F8F9FB", border: "2px dashed #E0E5EF" }}>
              <span className="font-mono text-xl font-bold tracking-widest text-foreground">{generatedPassword}</span>
              <button onClick={() => navigator.clipboard.writeText(generatedPassword)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-all">
                <Icon name="Copy" size={15} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Ученик может сменить пароль после первого входа</p>
            <button onClick={() => setGeneratedPassword(null)} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: "#F4720B" }}>
              Понятно
            </button>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <ConfirmDialog message="Аккаунт ученика и все его данные будут удалены."
          onConfirm={() => { setStudents(prev => prev.filter(s => s.id !== confirmDelete)); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
      {confirmDeleteDoc && (
        <ConfirmDialog message="Документ будет удалён безвозвратно."
          onConfirm={() => {
            setDocs(prev => ({ ...prev, [confirmDeleteDoc.studentId]: (prev[confirmDeleteDoc.studentId] || []).filter(d => d.id !== confirmDeleteDoc.docId) }));
            setConfirmDeleteDoc(null);
          }}
          onCancel={() => setConfirmDeleteDoc(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ученики</h1>
          <p className="text-muted-foreground mt-1">Управление аккаунтами учеников</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: "#F4720B" }}>
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Новый ученик</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Имя и фамилия</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Иван Мастеров"
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="ivan@proservice.ru" type="email"
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
              </div>
              <div className="p-3 rounded-xl text-sm text-muted-foreground" style={{ background: "#F8F9FB" }}>
                Пароль по умолчанию: <span className="font-mono font-semibold text-foreground">123456</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>Отмена</button>
                <button onClick={handleAddStudent} disabled={!newName.trim() || !newEmail.trim()}
                  className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40" style={{ background: "#F4720B" }}>Добавить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка загрузки документа */}
      {uploadModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Прикрепить документ</h3>
              <button onClick={() => { setUploadModal(null); setPendingFile(null); setDocLabel(""); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {!pendingFile ? (
                <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-orange-300"
                  style={{ borderColor: "#E0E5EF", background: "#F8F9FB" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#FFF3E8" }}>
                    <Icon name="Upload" size={22} style={{ color: "#F4720B" }} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-foreground">Выберите файл</div>
                    <div className="text-xs text-muted-foreground mt-1">PDF, Word, JPG, PNG</div>
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EEF1F7" }}>
                    <Icon name={getFileIcon(pendingFile.type)} size={18} style={{ color: getFileColor(pendingFile.type) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{pendingFile.name}</div>
                    <div className="text-xs text-muted-foreground">{pendingFile.size}</div>
                  </div>
                  <button onClick={() => setPendingFile(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Подпись к документу</label>
                <input value={docLabel} onChange={e => setDocLabel(e.target.value)}
                  placeholder="Например: Резюме с HH.ru"
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setUploadModal(null); setPendingFile(null); setDocLabel(""); }}
                  className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>Отмена</button>
                <button onClick={handleUploadDoc} disabled={!pendingFile}
                  className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40" style={{ background: "#F4720B" }}>Прикрепить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {students.map(student => {
          const studentDocs = docs[student.id] || [];
          const isExpanded = expandedDocs === student.id;
          const isStudentExpanded = expandedStudent === student.id;
          const meta = studentMeta[student.id] || { studentId: student.id };
          const candidateLabels: Record<CandidateStatus, { label: string; color: string; bg: string }> = {
            promising: { label: "Перспективный", color: "#059669", bg: "#ECFDF5" },
            watch: { label: "Требует наблюдения", color: "#D97706", bg: "#FFFBEB" },
            not_recommended: { label: "Не рекомендован", color: "#DC2626", bg: "#FEF2F2" },
          };
          return (
            <div key={student.id} className="bg-white rounded-2xl border border-border/50 overflow-hidden">
              {/* Шапка карточки */}
              <div className="p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shrink-0" style={{ background: "#1B2A4A" }}>
                    {student.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      {student.name}
                      {meta.candidateStatus && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: candidateLabels[meta.candidateStatus].bg, color: candidateLabels[meta.candidateStatus].color }}>
                          {candidateLabels[meta.candidateStatus].label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{student.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-lg" style={{ color: "#F4720B" }}>{student.progress}%</div>
                    <div className="text-xs text-muted-foreground">{student.coursesCompleted} курса</div>
                  </div>
                  <button onClick={() => setConfirmDelete(student.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                    style={{ color: "#DC2626" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
                <div className="progress-bar mb-4">
                  <div className="progress-fill" style={{ width: `${student.progress}%` }} />
                </div>

                {/* Оценка кандидата + заметки тренера */}
                <div className="border-t border-border/50 pt-3 mb-3">
                  <button onClick={() => setExpandedStudent(isStudentExpanded ? null : student.id)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left">
                    <Icon name="Lock" size={13} />
                    Только для тренера
                    <Icon name={isStudentExpanded ? "ChevronUp" : "ChevronDown"} size={13} className="ml-auto" />
                  </button>
                  {isStudentExpanded && (
                    <div className="mt-3 space-y-4 p-4 rounded-xl" style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }}>
                      {/* Оценка кандидата */}
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-2 block">Оценка как кандидата</label>
                        <div className="flex gap-2 flex-wrap">
                          {(["promising", "watch", "not_recommended"] as CandidateStatus[]).map(s => (
                            <button key={s} onClick={() => updateMeta(student.id, { candidateStatus: meta.candidateStatus === s ? undefined : s })}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                              style={{
                                background: meta.candidateStatus === s ? candidateLabels[s].bg : "#F0F3F8",
                                color: meta.candidateStatus === s ? candidateLabels[s].color : "#6B7280",
                                border: meta.candidateStatus === s ? `1.5px solid ${candidateLabels[s].color}` : "1.5px solid transparent",
                              }}>
                              {candidateLabels[s].label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={meta.candidateComment || ""}
                          onChange={e => updateMeta(student.id, { candidateComment: e.target.value })}
                          placeholder="Комментарий к оценке..."
                          rows={2}
                          className="w-full mt-2 px-3 py-2 rounded-xl text-sm text-foreground resize-none outline-none"
                          style={{ background: "white", border: "1.5px solid #E0E5EF" }}
                        />
                      </div>
                      {/* Приватные заметки */}
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-2 block flex items-center gap-1">
                          <Icon name="StickyNote" size={12} /> Приватные заметки тренера
                        </label>
                        <textarea
                          value={meta.trainerNotes || ""}
                          onChange={e => updateMeta(student.id, { trainerNotes: e.target.value })}
                          placeholder="Личные наблюдения, особенности, договорённости..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl text-sm text-foreground resize-none outline-none"
                          style={{ background: "white", border: "1.5px solid #E0E5EF" }}
                        />
                      </div>
                      {/* Заметки ученика (видит тренер) */}
                      {meta.studentNotes && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Заметки ученика по урокам</label>
                          <div className="px-3 py-2 rounded-xl text-sm text-foreground" style={{ background: "white", border: "1.5px solid #E0E5EF" }}>
                            {meta.studentNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Кнопки документов */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <button onClick={() => setUploadModal(student.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: "#FFF3E8", color: "#F4720B" }}>
                    <Icon name="Paperclip" size={14} />
                    Прикрепить документ
                  </button>
                  {studentDocs.length > 0 && (
                    <button onClick={() => setExpandedDocs(isExpanded ? null : student.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Icon name="FolderOpen" size={14} />
                      {studentDocs.length} {studentDocs.length === 1 ? "документ" : studentDocs.length < 5 ? "документа" : "документов"}
                      <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Список документов */}
              {isExpanded && studentDocs.length > 0 && (
                <div className="border-t border-border/50 px-5 py-3 space-y-2" style={{ background: "#F8F9FB" }}>
                  {studentDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border/50">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EEF1F7" }}>
                        <Icon name={getFileIcon(doc.type)} size={16} style={{ color: getFileColor(doc.type) }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{doc.label}</div>
                        <div className="text-xs text-muted-foreground">{doc.name} · {doc.size} · {doc.uploadedAt}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleDownload(doc)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          title="Скачать">
                          <Icon name="Download" size={14} />
                        </button>
                        <button onClick={() => setConfirmDeleteDoc({ studentId: student.id, docId: doc.id })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ color: "#DC2626" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          title="Удалить">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF2F2" }}>
          <Icon name="AlertTriangle" size={22} style={{ color: "#DC2626" }} />
        </div>
        <p className="text-center font-semibold text-foreground mb-1">Подтвердите действие</p>
        <p className="text-center text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>
            Отмена
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-medium text-white" style={{ background: "#DC2626" }}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Forum View ───────────────────────────────────────────────────────────────
function ForumView({ user }: { user: User }) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [topicPosts, setTopicPosts] = useState<ForumPost[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicText, setNewTopicText] = useState("");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const authorRole = user.role === "trainer" ? "Тренер" : "Ученик";

  // Загрузка тем
  const loadTopics = () => {
    API.apiGetForumTopics().then(raw => {
      setTopics((raw as Record<string, unknown>[]).map(t => {
        const fp = t.first_post as Record<string, unknown> | null;
        return {
          id: t.id as number,
          title: t.title as string,
          author: (t.author_name as string) || '',
          avatar: (t.author_avatar as string) || '?',
          role: (t.author_role as string) === 'trainer' ? 'Тренер' : 'Ученик',
          createdAt: new Date(t.created_at as string).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
          pinned: t.pinned as boolean,
          closed: t.closed as boolean,
          posts: fp ? [{
            id: fp.id as number, author: fp.author_name as string,
            avatar: (fp.author_avatar as string) || '?',
            role: (fp.author_role as string) === 'trainer' ? 'Тренер' : 'Ученик',
            text: fp.text as string, time: '', likes: fp.likes as number,
          }] : [],
          postsCount: t.posts_count as number,
        } as ForumTopic & { postsCount: number };
      }));
    }).catch(() => setTopics(MOCK_FORUM));
  };

  useEffect(() => { loadTopics(); }, []);

  // Загрузка постов темы
  const openTopic = (t: ForumTopic) => {
    setSelectedTopic(t);
    API.apiGetTopicPosts(t.id).then(raw => {
      setTopicPosts((raw as Record<string, unknown>[]).map(p => ({
        id: p.id as number,
        author: (p.author_name as string) || '',
        avatar: (p.author_avatar as string) || '?',
        role: (p.author_role as string) === 'trainer' ? 'Тренер' : 'Ученик',
        text: p.text as string,
        time: new Date(p.created_at as string).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
        likes: p.likes as number,
      })));
    }).catch(() => setTopicPosts(t.posts));
  };

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim() || !newTopicText.trim()) return;
    API.apiCreateTopic({ title: newTopicTitle, author_id: user.id, text: newTopicText }).then(raw => {
      const r = raw as Record<string, unknown>;
      const topic: ForumTopic = {
        id: r.id as number, title: newTopicTitle,
        author: user.name, avatar: user.avatar, role: authorRole,
        createdAt: "только что", pinned: false, closed: false,
        posts: [{ id: Date.now(), author: user.name, avatar: user.avatar, role: authorRole, text: newTopicText, time: "только что", likes: 0 }],
      };
      setTopics(prev => [topic, ...prev]);
      setTopicPosts(topic.posts);
      setSelectedTopic(topic);
    }).catch(() => {});
    setNewTopicTitle(""); setNewTopicText("");
    setShowNewTopic(false);
  };

  const handleSendMessage = () => {
    if (!newMsg.trim() || !selectedTopic) return;
    API.apiPostMessage(selectedTopic.id, { author_id: user.id, text: newMsg }).then(raw => {
      const r = raw as Record<string, unknown>;
      const post: ForumPost = {
        id: r.id as number, author: user.name, avatar: user.avatar,
        role: authorRole, text: newMsg, time: "только что", likes: 0,
      };
      setTopicPosts(prev => [...prev, post]);
    }).catch(() => {
      const post: ForumPost = { id: Date.now(), author: user.name, avatar: user.avatar, role: authorRole, text: newMsg, time: "только что", likes: 0 };
      setTopicPosts(prev => [...prev, post]);
    });
    setNewMsg("");
  };

  const handleDeleteTopic = (topicId: number) => {
    setConfirm({
      message: "Тема и все сообщения в ней будут удалены безвозвратно.",
      onConfirm: () => {
        setTopics(prev => prev.filter(t => t.id !== topicId));
        setSelectedTopic(null);
        setConfirm(null);
      },
    });
  };

  const handleDeletePost = (postId: number) => {
    setConfirm({
      message: "Сообщение будет удалено безвозвратно.",
      onConfirm: () => {
        setTopicPosts(prev => prev.filter(p => p.id !== postId));
        setConfirm(null);
      },
    });
  };

  const handleTogglePin = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    const newVal = !topic?.pinned;
    setTopics(prev => {
      const updated = prev.map(t => t.id === topicId ? { ...t, pinned: newVal } : t);
      return [...updated.filter(t => t.pinned), ...updated.filter(t => !t.pinned)];
    });
    API.apiUpdateTopic(topicId, { pinned: newVal }).catch(() => {});
  };

  const handleToggleClose = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    const newVal = !topic?.closed;
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, closed: newVal } : t));
    if (selectedTopic?.id === topicId) setSelectedTopic(prev => prev ? { ...prev, closed: newVal } : null);
    API.apiUpdateTopic(topicId, { closed: newVal }).catch(() => {});
  };

  const handleLike = (postId: number) => {
    if (!selectedTopic || likedPosts.includes(postId)) return;
    setLikedPosts(prev => [...prev, postId]);
    setTopicPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    API.apiLikePost(postId, user.id).catch(() => {});
  };

  // ── Открытая тема ──
  if (selectedTopic) {
    return (
      <div className="animate-fade-in space-y-4">
        {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
        <button onClick={() => setSelectedTopic(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <Icon name="ArrowLeft" size={16} />
          Все темы
        </button>

        <div className="bg-white rounded-2xl p-5 border border-border/50">
          <div className="flex items-start gap-3 justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{selectedTopic.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{selectedTopic.author}</span>
                <span>·</span>
                <span>{selectedTopic.createdAt}</span>
                <span>·</span>
                <span>{selectedTopic.posts.length} {selectedTopic.posts.length === 1 ? "ответ" : "ответа"}</span>
              </div>
            </div>
            {user.role === "trainer" && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleToggleClose(selectedTopic.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: selectedTopic.closed ? "#ECFDF5" : "#FFF3E8", color: selectedTopic.closed ? "#059669" : "#D97706" }}>
                  <Icon name={selectedTopic.closed ? "LockOpen" : "Lock"} size={13} />
                  {selectedTopic.closed ? "Открыть" : "Закрыть"}
                </button>
                <button onClick={() => handleDeleteTopic(selectedTopic.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  <Icon name="Trash2" size={13} />
                  Удалить
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {topicPosts.map((post, idx) => (
            <div key={post.id} className="bg-white rounded-2xl p-5 border border-border/50"
              style={idx === 0 ? { borderLeft: "3px solid #F4720B" } : {}}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: "#1B2A4A" }}>
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-foreground">{post.author}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: post.role === "Тренер" ? "#FFF3E8" : "#EEF1F7", color: post.role === "Тренер" ? "#F4720B" : "#1B2A4A" }}>
                      {post.role}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{post.time}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{post.text}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-sm transition-colors"
                      style={{ color: likedPosts.includes(post.id) ? "#F4720B" : "#9CA3AF" }}>
                      <Icon name="Heart" size={14} />
                      {post.likes}
                    </button>
                    {user.role === "trainer" && (
                      <button onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 text-xs transition-colors ml-auto"
                        style={{ color: "#DC2626" }}>
                        <Icon name="Trash2" size={12} />
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedTopic.closed ? (
          <div className="flex items-center gap-2 p-4 rounded-2xl text-sm font-medium" style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF", color: "#9CA3AF" }}>
            <Icon name="Lock" size={15} />
            Тема закрыта для новых сообщений
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-border/50">
            <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
              placeholder="Напишите ответ..."
              rows={3}
              className="w-full text-foreground text-[15px] resize-none outline-none bg-transparent placeholder-muted-foreground"
            />
            <div className="flex justify-end mt-2">
              <button onClick={handleSendMessage} disabled={!newMsg.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm disabled:opacity-40"
                style={{ background: "#F4720B" }}>
                <Icon name="Send" size={14} />
                Ответить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Список тем ──
  return (
    <div className="animate-fade-in space-y-4">
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Форум</h1>
          <p className="text-muted-foreground mt-1">{topics.length} тем</p>
        </div>
        <button onClick={() => setShowNewTopic(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm"
          style={{ background: "#F4720B" }}>
          <Icon name="Plus" size={16} />
          Новая тема
        </button>
      </div>

      {showNewTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Новая тема</h3>
              <button onClick={() => setShowNewTopic(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Название темы</label>
                <input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)}
                  placeholder="Например: Как работать с агрессивным клиентом?"
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Первое сообщение</label>
                <textarea value={newTopicText} onChange={e => setNewTopicText(e.target.value)}
                  placeholder="Опишите ситуацию или вопрос подробнее..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none resize-none"
                  style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewTopic(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>
                  Отмена
                </button>
                <button onClick={handleCreateTopic} disabled={!newTopicTitle.trim() || !newTopicText.trim()}
                  className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40"
                  style={{ background: "#F4720B" }}>
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white rounded-2xl p-5 border border-border/50 hover-lift cursor-pointer"
            style={topic.pinned ? { borderColor: "#F4720B", borderWidth: "1.5px" } : {}}
            onClick={() => openTopic(topic)}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: "#1B2A4A" }}>
                {topic.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {topic.pinned && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "#FFF3E8", color: "#F4720B" }}>
                      <Icon name="Pin" size={10} />
                      Закреплено
                    </span>
                  )}
                  <h3 className="font-semibold text-foreground leading-snug">{topic.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium" style={{ color: topic.role === "Тренер" ? "#F4720B" : "#1B2A4A" }}>{topic.author}</span>
                  <span>·</span>
                  <span>{topic.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {user.role === "trainer" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); handleTogglePin(topic.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: topic.pinned ? "#FFF3E8" : "transparent", color: topic.pinned ? "#F4720B" : "#9CA3AF" }}
                      title={topic.pinned ? "Открепить" : "Закрепить"}>
                      <Icon name="Pin" size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: "#DC2626" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      title="Удалить тему">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Icon name="MessageSquare" size={14} />
                  {(topic as ForumTopic & { postsCount?: number }).postsCount ?? topic.posts.length}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2" style={{ paddingLeft: "52px" }}>
              {topic.posts[0]?.text || ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Watermark ────────────────────────────────────────────────────────────────
function Watermark({ name }: { name: string }) {
  const text = `${name} · ProService Academy`;
  // Генерируем SVG-паттерн с диагональным повторением 150×150px, поворот 45°
  const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><text x='-60' y='100' font-size='18' font-family='sans-serif' font-weight='500' fill='rgba(30,41,59,0.10)' transform='rotate(45 110 110)' letter-spacing='1'>${text}</text></svg>`;
  const encoded = `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`;
  return (
    <div
      className="pointer-events-none fixed inset-0 select-none"
      style={{ zIndex: 10, backgroundImage: encoded, backgroundSize: "220px 220px", backgroundRepeat: "repeat" }}
    />
  );
}

// ─── Presentation Mode ────────────────────────────────────────────────────────
function PresentationMode({ onExit }: { onExit: () => void }) {
  const [slide, setSlide] = useState(0);
  const [darkTheme, setDarkTheme] = useState(true);
  const current = SLIDE_DATA[slide];

  const bg = darkTheme ? "#1B2A4A" : "#FFFFFF";
  const textColor = darkTheme ? "white" : "#1B2A4A";
  const subColor = darkTheme ? "rgba(255,255,255,0.6)" : "rgba(27,42,74,0.5)";
  const arrowBg = darkTheme ? "rgba(255,255,255,0.15)" : "rgba(27,42,74,0.08)";
  const dotInactive = darkTheme ? "rgba(255,255,255,0.3)" : "rgba(27,42,74,0.2)";

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col no-copy" style={{ background: bg, zIndex: 9999, transition: "background 0.3s" }} onContextMenu={e => e.preventDefault()}>
      <div className="flex items-center justify-between px-8 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F4720B" }}>
            <Icon name="Settings" size={18} className="text-white" />
          </div>
          <span className="text-sm font-medium" style={{ color: subColor }}>{current.subtitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm mr-2" style={{ color: subColor }}>{slide + 1} / {SLIDE_DATA.length}</span>
          {/* Тема */}
          <button onClick={() => setDarkTheme(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: arrowBg, color: textColor }}>
            <Icon name={darkTheme ? "Sun" : "Moon"} size={15} />
            {darkTheme ? "Светлый" : "Тёмный"}
          </button>
          {/* Полный экран */}
          <button onClick={handleFullscreen}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: arrowBg, color: textColor }}>
            <Icon name="Maximize" size={16} />
          </button>
          <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{ background: "#F4720B", color: "white" }}>
            <Icon name="X" size={15} />
            Выйти
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-4xl w-full animate-fade-in" key={slide}>
          <h1 className="text-5xl lg:text-6xl font-bold mb-10 leading-tight" style={{ color: textColor }}>{current.title}</h1>
          <div className="space-y-5">
            {current.content.map((item, i) => (
              <div key={i} className="flex items-start gap-4 text-xl lg:text-2xl leading-relaxed" style={{ color: darkTheme ? "rgba(255,255,255,0.9)" : "rgba(27,42,74,0.85)" }}>
                <span className="text-2xl font-bold shrink-0 mt-0.5" style={{ color: "#F4720B" }}>→</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pb-8">
        <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-30"
          style={{ background: arrowBg, color: textColor }}>
          <Icon name="ChevronLeft" size={18} />Назад
        </button>
        <div className="flex gap-2">
          {SLIDE_DATA.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: i === slide ? "#F4720B" : dotInactive }} />
          ))}
        </div>
        <button onClick={() => setSlide(s => Math.min(SLIDE_DATA.length - 1, s + 1))} disabled={slide === SLIDE_DATA.length - 1}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-30"
          style={{ background: "#F4720B" }}>
          Далее<Icon name="ChevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useLocalStorage<User | null>("psa_user", null);
  const [activeTab, setActiveTab] = useLocalStorage<string>("psa_tab", "dashboard");
  const [presentMode, setPresentMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Восстанавливаем presentMode если пользователь — презентация
  useEffect(() => {
    if (user?.role === "presentation") setPresentMode(true);
  }, []);

  // Загрузка уведомлений с сервера для ученика
  useEffect(() => {
    if (user?.role === 'student') {
      API.apiGetNotifications(user.id).then(raw => {
        setNotifications((raw as Record<string, unknown>[]).map(n => ({
          id: n.id as number,
          studentEmail: user.email,
          lessonTitle: n.lesson_title as string,
          status: n.status as "checked" | "revision",
          grade: n.grade as number | undefined,
          createdAt: new Date(n.created_at as string).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          read: n.is_read as boolean,
        })));
      }).catch(() => {});
    }
  }, [user?.id, user?.role, user?.email]);

  const addNotification = (n: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotifications(prev => [...prev, {
      ...n,
      id: Date.now(),
      createdAt: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    }]);
  };

  const markAllRead = (email: string) => {
    setNotifications(prev => prev.map(n => n.studentEmail === email ? { ...n, read: true } : n));
    if (user?.role === 'student') API.apiMarkNotificationsRead(user.id).catch(() => {});
  };

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.role === "presentation") setPresentMode(true);
  };

  const handleLogout = () => {
    setUser(null);
    setPresentMode(false);
    setActiveTab("dashboard");
    setNotifications([]);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (presentMode) return <PresentationMode onExit={handleLogout} />;

  const myNotifications = notifications.filter(n => n.studentEmail === user.email);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const renderTab = () => {
    if (activeTab === "dashboard") return user.role === "trainer"
      ? <TrainerDashboard />
      : <StudentDashboard user={user} notifications={myNotifications} onMarkRead={() => markAllRead(user.email)} />;
    if (activeTab === "courses") return <CoursesView user={user} />;
    if (activeTab === "homeworks") return <HomeworksView user={user} onNotify={addNotification} />;
    if (activeTab === "students") return <StudentsView />;
    if (activeTab === "forum") return <ForumView user={user} />;
    if (activeTab === "presentation") return <PresentationMode onExit={() => setActiveTab("dashboard")} />;
    return null;
  };

  const contentPages = ["courses", "homeworks"];
  const showWatermark = contentPages.includes(activeTab);

  return (
    <div className="flex min-h-screen" style={{ background: "#F0F3F8" }}>
      {showWatermark && <Watermark name={user.name} />}
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 md:px-8"
          style={{ background: "rgba(240,243,248,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F4720B" }}>
              <Icon name="Settings" size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">ProService Academy</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            {user.role === "student" && unreadCount > 0 && (
              <button onClick={() => { setActiveTab("dashboard"); markAllRead(user.email); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium animate-fade-in"
                style={{ background: "#FFF3E8", color: "#F4720B" }}>
                <Icon name="Bell" size={15} />
                {unreadCount} новых
              </button>
            )}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#1B2A4A" }}>
              {user.avatar}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground">{user.name}</span>
          </div>
        </header>

        <div className="p-6 md:p-8 pb-24 md:pb-8"
          onContextMenu={showWatermark ? e => e.preventDefault() : undefined}>
          {renderTab()}
        </div>
      </main>

      <MobileNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}