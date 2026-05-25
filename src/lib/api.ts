const BASE = "https://functions.poehali.dev/5156f7c7-3220-4846-954c-deaaf784817a";

// Все запросы идут на один URL, путь/метод передаются в теле
async function req<T>(method: string, path: string, body?: unknown, qs?: Record<string, string>): Promise<T> {
  const fullPath = qs ? `${path}?${new URLSearchParams(qs)}` : path;
  const payload = { _method: method, _path: fullPath, ...(body && typeof body === 'object' ? body : {}) };
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((e.error as string) || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const get = <T>(path: string, qs?: Record<string, string>) => req<T>('GET', path, undefined, qs);
const post = <T>(path: string, body: unknown) => req<T>('POST', path, body);
const patch = <T>(path: string, body: unknown) => req<T>('PATCH', path, body);

// Auth
export const apiLogin = (email: string, password: string) =>
  post<Record<string, unknown>>('/auth/login', { email, password });

// Users / Students
export const apiGetStudents = () => get<Record<string, unknown>[]>('/users');
export const apiCreateStudent = (data: { name: string; email: string; password: string }) =>
  post<Record<string, unknown>>('/users', { ...data, role: 'student' });

// Student meta
export const apiGetStudentMeta = (studentId: number) =>
  get<Record<string, unknown>>(`/student-meta/${studentId}`);
export const apiSaveStudentMeta = (studentId: number, data: Record<string, unknown>) =>
  post<Record<string, unknown>>(`/student-meta/${studentId}`, data);

// Student notes
export const apiGetStudentNotes = (userId: number) =>
  get<{ notes: string }>(`/student-notes/${userId}`);
export const apiSaveStudentNotes = (userId: number, notes: string) =>
  post<Record<string, unknown>>(`/student-notes/${userId}`, { notes });

// HW Draft
export const apiGetHwDraft = (userId: number) =>
  get<{ lesson_title: string; text: string }>(`/hw-draft/${userId}`);
export const apiSaveHwDraft = (userId: number, lesson_title: string, text: string) =>
  post<Record<string, unknown>>(`/hw-draft/${userId}`, { lesson_title, text });

// Courses + Lessons
export const apiGetCourses = () => get<Record<string, unknown>[]>('/courses');
export const apiCreateCourse = (title: string, description: string) =>
  post<Record<string, unknown>>('/courses', { title, description });
export const apiUpdateCourse = (courseId: number, data: Record<string, unknown>) =>
  patch<Record<string, unknown>>(`/courses/${courseId}`, data);
export const apiCreateLesson = (courseId: number, data: Record<string, unknown>) =>
  post<Record<string, unknown>>(`/courses/${courseId}/lessons`, data);
export const apiUpdateLesson = (lessonId: number, data: Record<string, unknown>) =>
  patch<Record<string, unknown>>(`/lessons/${lessonId}`, data);
export const apiReorderLessons = (items: { id: number; sort_order: number }[]) =>
  post<Record<string, unknown>>('/lessons/reorder', { items });

// Lesson progress
export const apiGetProgress = (userId: number) =>
  get<number[]>('/lesson-progress', { user_id: String(userId) });
export const apiMarkLessonDone = (userId: number, lessonId: number) =>
  post<Record<string, unknown>>('/lesson-progress', { user_id: userId, lesson_id: lessonId });

// Homeworks
export const apiGetHomeworks = (studentId?: number) =>
  studentId
    ? get<Record<string, unknown>[]>('/homeworks', { student_id: String(studentId) })
    : get<Record<string, unknown>[]>('/homeworks');
export const apiSubmitHomework = (data: { student_id: number; lesson_title: string; text: string }) =>
  post<Record<string, unknown>>('/homeworks', data);
export const apiGradeHomework = (hwId: number, data: { status: string; grade?: number; trainer_comment?: string }) =>
  patch<Record<string, unknown>>(`/homeworks/${hwId}`, data);

// Notifications
export const apiGetNotifications = (studentId: number) =>
  get<Record<string, unknown>[]>('/notifications', { student_id: String(studentId) });
export const apiCreateNotification = (data: { student_id: number; lesson_title: string; status: string; grade?: number }) =>
  post<Record<string, unknown>>('/notifications', data);
export const apiMarkNotificationsRead = (studentId: number) =>
  post<Record<string, unknown>>('/notifications/read', { student_id: studentId });

// Student docs
export const apiGetStudentDocs = (studentId: number) =>
  get<Record<string, unknown>[]>(`/student-docs/${studentId}`);
export const apiUploadStudentDoc = (data: Record<string, unknown>) =>
  post<Record<string, unknown>>('/student-docs', data);

// Forum
export const apiGetForumTopics = () => get<Record<string, unknown>[]>('/forum/topics');
export const apiGetTopicPosts = (topicId: number) =>
  get<Record<string, unknown>[]>(`/forum/topics/${topicId}`);
export const apiCreateTopic = (data: { title: string; author_id: number; text: string }) =>
  post<Record<string, unknown>>('/forum/topics', data);
export const apiUpdateTopic = (topicId: number, data: { pinned?: boolean; closed?: boolean }) =>
  patch<Record<string, unknown>>(`/forum/topics/${topicId}`, data);
export const apiPostMessage = (topicId: number, data: { author_id: number; text: string }) =>
  post<Record<string, unknown>>(`/forum/topics/${topicId}/posts`, data);
export const apiLikePost = (postId: number, userId: number) =>
  post<Record<string, unknown>>(`/forum/posts/${postId}/like`, { user_id: userId });

// Slides
export interface SlideData {
  id?: number;
  lesson_id?: number;
  title: string;
  content: string[];
  sort_order?: number;
}
export const apiGetSlides = (lessonId: number) =>
  get<SlideData[]>('/slides', { lesson_id: String(lessonId) });
export const apiSaveSlidesBatch = (lessonId: number, slides: { title: string; content: string[] }[]) =>
  post<SlideData[]>('/slides/batch', { lesson_id: lessonId, slides });

// Direct Messages
export interface DmDialog {
  partner_id: number;
  partner_name: string;
  partner_avatar: string;
  partner_photo_url: string;
  last_text: string;
  last_time: string;
  unread_count: number;
}
export interface DmMessage {
  id: number;
  from_user_id: number;
  to_user_id: number;
  text: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
  sender_photo_url: string;
}
export const apiGetDialogs = (userId: number) =>
  get<DmDialog[]>('/dm/dialogs', { user_id: String(userId) });
export const apiGetMessages = (fromId: number, toId: number) =>
  get<DmMessage[]>('/dm/messages', { from: String(fromId), to: String(toId) });
export const apiSendMessage = (fromUserId: number, toUserId: number, text: string) =>
  post<DmMessage>('/dm/send', { from_user_id: fromUserId, to_user_id: toUserId, text });
export const apiGetUnreadDm = (userId: number) =>
  get<{ count: number }>('/dm/unread', { user_id: String(userId) });

// Public User Profile
export interface UserProfile {
  id: number;
  name: string;
  role: string;
  avatar: string;
  created_at: string;
  display_name: string;
  about: string;
  phone: string;
  vk_url: string;
  photo_url: string;
}
export const apiGetUserProfile = (userId: number) =>
  get<UserProfile>(`/user-profile/${userId}`);

// Student Stats
export interface StudentStats {
  lessons_done: number;
  homeworks_submitted: number;
  avg_grade: number;
  progress_pct: number;
  next_lesson: { id: number; title: string; duration: string; has_homework: boolean; course_title: string } | null;
}
export const apiGetStudentStats = (userId: number) =>
  get<StudentStats>(`/student-stats/${userId}`);

// Trainer Profile
export const apiGetProfile = (userId: number) =>
  get<Record<string, unknown>>(`/profile/${userId}`);
export const apiSaveProfile = (userId: number, data: Record<string, unknown>) =>
  post<Record<string, unknown>>(`/profile/${userId}`, data);
export const apiUploadProfilePhoto = (userId: number, dataUrl: string) =>
  post<Record<string, unknown>>('/profile-photo', { user_id: userId, data_url: dataUrl });