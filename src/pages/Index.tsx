import { useState } from "react";
import Icon from "@/components/ui/icon";

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
      { id: 1, title: "Роль мастера-приёмщика в автосервисе", duration: "45 мин", completed: true, hasHomework: true },
      { id: 2, title: "Приём автомобиля: чек-лист осмотра", duration: "60 мин", completed: true, hasHomework: true },
      { id: 3, title: "Работа с клиентскими возражениями", duration: "50 мин", completed: false, hasHomework: true },
      { id: 4, title: "Оформление заказ-наряда", duration: "40 мин", completed: false, hasHomework: false },
      { id: 5, title: "Выдача автомобиля и постпродажный сервис", duration: "35 мин", completed: false, hasHomework: true },
    ]
  },
  {
    id: 2,
    title: "Продвинутый уровень: сложные ситуации",
    description: "Конфликтные клиенты, страховые случаи, техническая экспертиза",
    progress: 20,
    studentsCount: 5,
    lessons: [
      { id: 6, title: "Типология сложных клиентов", duration: "55 мин", completed: true, hasHomework: true },
      { id: 7, title: "Страховые и гарантийные случаи", duration: "70 мин", completed: false, hasHomework: true },
      { id: 8, title: "Технический минимум для приёмщика", duration: "80 мин", completed: false, hasHomework: false },
    ]
  }
];

const MOCK_HOMEWORKS: Homework[] = [
  { id: 1, studentName: "Иван Мастеров", lessonTitle: "Приём автомобиля: чек-лист осмотра", submittedAt: "20 мая, 14:32", status: "pending", text: "Провёл 3 приёма по чек-листу. Обнаружил, что клиенты охотнее соглашаются на доп.услуги когда видят письменный перечень нарушений..." },
  { id: 2, studentName: "Сергей Приёмов", lessonTitle: "Роль мастера-приёмщика в автосервисе", submittedAt: "19 мая, 16:10", status: "checked", grade: 5, text: "Понял основное: мастер — это лицо сервиса. Применил на практике технику активного слушания..." },
  { id: 3, studentName: "Олег Диагностов", lessonTitle: "Работа с клиентскими возражениями", submittedAt: "18 мая, 11:45", status: "revision", text: "Попробовал метод «да, и...». Работает не всегда, нужно больше практики..." },
];

const MOCK_FORUM: ForumPost[] = [
  { id: 1, author: "Александр Тренеров", avatar: "АТ", role: "Тренер", text: "Коллеги, разбираем сегодня на примере: клиент приезжает, говорит что масло меняли 2 месяца назад, а по щупу уровень критический. Как будете действовать?", time: "2 ч назад", likes: 3 },
  { id: 2, author: "Иван Мастеров", avatar: "ИМ", role: "Ученик", text: "Сначала попрошу ключи, проверю пробег по одометру. Если пробег большой — предложу дополнительную диагностику и объясню клиенту возможные причины.", time: "1 ч назад", likes: 5 },
  { id: 3, author: "Олег Диагностов", avatar: "ОД", role: "Ученик", text: "Я бы ещё проверил наличие подтёков снизу. Часто бывает, что масло уходит незаметно из-за прокладки клапанной крышки.", time: "45 мин назад", likes: 7 },
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

  const handleLogin = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      if (user && password === "123456") {
        onLogin(user);
      } else {
        setError("Неверный email или пароль");
      }
      setLoading(false);
    }, 600);
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
function StudentDashboard({ user }: { user: User }) {
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
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonHasHomework, setLessonHasHomework] = useState(false);

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDuration(lesson.duration);
    setLessonHasHomework(lesson.hasHomework);
  };

  const handleEditLesson = () => {
    if (!lessonTitle.trim() || !selectedCourse || !editingLesson) return;
    const updated = {
      ...selectedCourse,
      lessons: selectedCourse.lessons.map(l =>
        l.id === editingLesson.id ? { ...l, title: lessonTitle, duration: lessonDuration || "30 мин", hasHomework: lessonHasHomework } : l
      ),
    };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    setEditingLesson(null);
    setLessonTitle(""); setLessonDuration(""); setLessonHasHomework(false);
  };

  const handleDeleteLesson = (lessonId: number) => {
    if (!selectedCourse) return;
    const updated = { ...selectedCourse, lessons: selectedCourse.lessons.filter(l => l.id !== lessonId) };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
  };

  const handleCreateCourse = () => {
    if (!newTitle.trim()) return;
    const created: Course = {
      id: courses.length + 10,
      title: newTitle,
      description: newDesc,
      progress: 0,
      studentsCount: 0,
      lessons: [],
    };
    setCourses(prev => [...prev, created]);
    setNewTitle("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleAddLesson = () => {
    if (!lessonTitle.trim() || !selectedCourse) return;
    const newLesson: Lesson = {
      id: Date.now(),
      title: lessonTitle,
      duration: lessonDuration || "30 мин",
      completed: false,
      hasHomework: lessonHasHomework,
    };
    const updated = { ...selectedCourse, lessons: [...selectedCourse.lessons, newLesson] };
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updated : c));
    setSelectedCourse(updated);
    setLessonTitle("");
    setLessonDuration("");
    setLessonHasHomework(false);
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
          <h1 className="text-white text-2xl font-bold mb-2">{selectedCourse.title}</h1>
          <p className="text-white/60 mb-4">{selectedCourse.description}</p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><Icon name="BookOpen" size={14} />{selectedCourse.lessons.length} уроков</span>
            {user.role === "trainer" && <span className="flex items-center gap-1.5"><Icon name="Users" size={14} />{selectedCourse.studentsCount} учеников</span>}
          </div>
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

        <div className="space-y-3">
          {selectedCourse.lessons.map((lesson, idx) => (
            <div key={lesson.id} className="bg-white rounded-2xl p-5 border border-border/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                style={{ background: lesson.completed ? "#F4720B" : "#F0F2F5", color: lesson.completed ? "white" : "#9CA3AF" }}>
                {lesson.completed ? <Icon name="Check" size={16} className="text-white" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{lesson.title}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Icon name="Clock" size={12} />{lesson.duration}</span>
                  {lesson.hasHomework && <span className="flex items-center gap-1"><Icon name="FileText" size={12} />Д/З</span>}
                </div>
              </div>
              {user.role === "trainer" ? (
                <div className="flex items-center gap-1 shrink-0">
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
              ) : lesson.completed
                ? <span className="text-xs px-2 py-1 rounded-full font-medium shrink-0" style={{ background: "#ECFDF5", color: "#059669" }}>Пройден</span>
                : <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-white shrink-0" style={{ background: "#F4720B" }}>Начать</button>
              }
            </div>
          ))}
        </div>

        {editingLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Редактировать урок</h3>
                <button onClick={() => setEditingLesson(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Название урока</label>
                  <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                    style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} autoFocus />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Продолжительность</label>
                  <input value={lessonDuration} onChange={e => setLessonDuration(e.target.value)}
                    placeholder="Например: 45 мин"
                    className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                    style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }} />
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div onClick={() => setLessonHasHomework(v => !v)}
                    className="w-5 h-5 rounded flex items-center justify-center transition-all shrink-0"
                    style={{ background: lessonHasHomework ? "#F4720B" : "#E0E5EF" }}>
                    {lessonHasHomework && <Icon name="Check" size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">Есть домашнее задание</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingLesson(null)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>
                    Отмена
                  </button>
                  <button onClick={handleEditLesson} disabled={!lessonTitle.trim()}
                    className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-40"
                    style={{ background: "#F4720B" }}>
                    Сохранить
                  </button>
                </div>
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
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Новый урок</h3>
                <button onClick={() => setShowAddLesson(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Название урока</label>
                  <input
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    placeholder="Например: Приём автомобиля по чек-листу"
                    className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                    style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Продолжительность</label>
                  <input
                    value={lessonDuration}
                    onChange={e => setLessonDuration(e.target.value)}
                    placeholder="Например: 45 мин"
                    className="w-full px-4 py-3 rounded-xl text-foreground text-[15px] outline-none"
                    style={{ background: "#F8F9FB", border: "1.5px solid #E0E5EF" }}
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors hover:bg-muted/50">
                  <div onClick={() => setLessonHasHomework(v => !v)}
                    className="w-5 h-5 rounded flex items-center justify-center transition-all shrink-0"
                    style={{ background: lessonHasHomework ? "#F4720B" : "#E0E5EF" }}>
                    {lessonHasHomework && <Icon name="Check" size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">Есть домашнее задание</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddLesson(false)} className="flex-1 py-3 rounded-xl font-medium text-foreground" style={{ background: "#F0F3F8" }}>
                    Отмена
                  </button>
                  <button onClick={handleAddLesson} disabled={!lessonTitle.trim()}
                    className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-40"
                    style={{ background: "#F4720B" }}>
                    Добавить
                  </button>
                </div>
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
function HomeworksView({ user }: { user: User }) {
  const [selected, setSelected] = useState<Homework | null>(null);
  const [gradeInput, setGradeInput] = useState("");

  if (selected && user.role === "trainer") {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium">
          <Icon name="ArrowLeft" size={16} />
          Назад
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
          <div className="p-4 rounded-xl text-foreground leading-relaxed no-copy" style={{ background: "#F8F9FB", border: "1px solid #EEF1F7" }}>
            {selected.text}
          </div>
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
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl font-medium text-white" style={{ background: "#F4720B" }}>
              Принять {gradeInput ? `(оценка ${gradeInput})` : ""}
            </button>
            <button className="px-4 py-3 rounded-xl font-medium" style={{ background: "#FEF2F2", color: "#DC2626" }}>
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
        <div className="space-y-3">
          {MOCK_HOMEWORKS.slice(0, 2).map(hw => (
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
              <p className="text-sm text-muted-foreground">{hw.text.slice(0, 100)}...</p>
              <div className="text-xs text-muted-foreground mt-2">{hw.submittedAt}</div>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-2 w-full justify-center py-4 rounded-2xl font-medium text-white" style={{ background: "#F4720B" }}>
          <Icon name="Plus" size={18} />
          Сдать новое задание
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Проверка заданий</h1>
        <p className="text-muted-foreground mt-1">{MOCK_HOMEWORKS.filter(h => h.status === "pending").length} работы ожидают проверки</p>
      </div>
      <div className="space-y-3">
        {MOCK_HOMEWORKS.map(hw => (
          <div key={hw.id} className="bg-white rounded-2xl p-5 border border-border/50 hover-lift cursor-pointer" onClick={() => setSelected(hw)}>
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
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ученики</h1>
          <p className="text-muted-foreground mt-1">Управление аккаунтами учеников</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: "#F4720B" }}>
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_USERS.filter(u => u.role === "student").map(student => (
          <div key={student.id} className="bg-white rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold" style={{ background: "#1B2A4A" }}>
                {student.avatar}
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">{student.name}</div>
                <div className="text-sm text-muted-foreground">{student.email}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: "#F4720B" }}>{student.progress}%</div>
                <div className="text-xs text-muted-foreground">{student.coursesCompleted} курса</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${student.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Forum View ───────────────────────────────────────────────────────────────
function ForumView({ user }: { user: User }) {
  const [posts, setPosts] = useState(MOCK_FORUM);
  const [newMsg, setNewMsg] = useState("");

  const send = () => {
    if (!newMsg.trim()) return;
    setPosts(prev => [...prev, {
      id: prev.length + 1,
      author: user.name,
      avatar: user.avatar,
      role: user.role === "trainer" ? "Тренер" : "Ученик",
      text: newMsg,
      time: "только что",
      likes: 0,
    }]);
    setNewMsg("");
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Форум</h1>
        <p className="text-muted-foreground mt-1">Обсуждение рабочих ситуаций</p>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl p-5 border border-border/50">
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
                <button className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Heart" size={14} />
                  {post.likes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border/50">
        <textarea
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="Напишите сообщение или вопрос..."
          rows={3}
          className="w-full text-foreground text-[15px] resize-none outline-none bg-transparent placeholder-muted-foreground"
        />
        <div className="flex justify-end mt-2">
          <button onClick={send} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm" style={{ background: "#F4720B" }}>
            <Icon name="Send" size={14} />
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Presentation Mode ────────────────────────────────────────────────────────
function PresentationMode({ onExit }: { onExit: () => void }) {
  const [slide, setSlide] = useState(0);
  const current = SLIDE_DATA[slide];

  return (
    <div className="fixed inset-0 flex flex-col no-copy" style={{ background: "#1B2A4A", zIndex: 9999 }} onContextMenu={e => e.preventDefault()}>
      <div className="flex items-center justify-between px-8 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F4720B" }}>
            <Icon name="Settings" size={18} className="text-white" />
          </div>
          <span className="text-white/70 text-sm font-medium">{current.subtitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm">{slide + 1} / {SLIDE_DATA.length}</span>
          <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <Icon name="X" size={16} />
            Выйти из презентации
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-4xl w-full animate-fade-in" key={slide}>
          <h1 className="text-white text-5xl lg:text-6xl font-bold mb-10 leading-tight">{current.title}</h1>
          <div className="space-y-5">
            {current.content.map((item, i) => (
              <div key={i} className="flex items-start gap-4 text-white/90 text-xl lg:text-2xl leading-relaxed">
                <span className="text-2xl font-bold shrink-0 mt-0.5" style={{ color: "#F4720B" }}>→</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pb-8">
        <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <Icon name="ChevronLeft" size={18} />
          Назад
        </button>
        <div className="flex gap-2">
          {SLIDE_DATA.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: i === slide ? "#F4720B" : "rgba(255,255,255,0.3)" }} />
          ))}
        </div>
        <button onClick={() => setSlide(s => Math.min(SLIDE_DATA.length - 1, s + 1))} disabled={slide === SLIDE_DATA.length - 1}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-30"
          style={{ background: "#F4720B" }}>
          Далее
          <Icon name="ChevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [presentMode, setPresentMode] = useState(false);

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.role === "presentation") {
      setPresentMode(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPresentMode(false);
    setActiveTab("dashboard");
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (presentMode) return <PresentationMode onExit={handleLogout} />;

  const renderTab = () => {
    if (activeTab === "dashboard") return user.role === "trainer" ? <TrainerDashboard /> : <StudentDashboard user={user} />;
    if (activeTab === "courses") return <CoursesView user={user} />;
    if (activeTab === "homeworks") return <HomeworksView user={user} />;
    if (activeTab === "students") return <StudentsView />;
    if (activeTab === "forum") return <ForumView user={user} />;
    if (activeTab === "presentation") return <PresentationMode onExit={() => setActiveTab("dashboard")} />;
    return null;
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F0F3F8" }}>
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
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#1B2A4A" }}>
              {user.avatar}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground">{user.name}</span>
          </div>
        </header>

        <div className="p-6 md:p-8 pb-24 md:pb-8">
          {renderTab()}
        </div>
      </main>

      <MobileNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}