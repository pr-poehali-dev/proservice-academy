const BASE = "https://functions.poehali.dev/5156f7c7-3220-4846-954c-deaaf784817a";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const get = <T>(path: string) => req<T>(path);
const post = <T>(path: string, body: unknown) => req<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => req<T>(path, { method: "PATCH", body: JSON.stringify(body) });

// Auth
export const apiLogin = (email: string, password: string) =>
  post<Record<string, unknown>>("/auth/login", { email, password });

// Users / Students
export const apiGetStudents = () => get<Record<string, unknown>[]>("/users");
export const apiCreateStudent = (data: { name: string; email: string; password: string }) =>
  post<Record<string, unknown>>("/users", { ...data, role: "student" });

// Student meta (trainer notes, candidate status)
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
export const apiGetCourses = () => get<Record<string, unknown>[]>("/courses");
export const apiCreateCourse = (title: string, description: string) =>
  post<Record<string, unknown>>("/courses", { title, description });
export const apiUpdateCourse = (courseId: number, data: Record<string, unknown>) =>
  patch<Record<string, unknown>>(`/courses/${courseId}`, data);
export const apiCreateLesson = (courseId: number, data: Record<string, unknown>) =>
  post<Record<string, unknown>>(`/courses/${courseId}/lessons`, data);
export const apiUpdateLesson = (lessonId: number, data: Record<string, unknown>) =>
  patch<Record<string, unknown>>(`/lessons/${lessonId}`, data);
export const apiReorderLessons = (items: { id: number; sort_order: number }[]) =>
  post<Record<string, unknown>>("/lessons/reorder", { items });

// Lesson progress
export const apiGetProgress = (userId: number) =>
  get<number[]>(`/lesson-progress?user_id=${userId}`);
export const apiMarkLessonDone = (userId: number, lessonId: number) =>
  post<Record<string, unknown>>("/lesson-progress", { user_id: userId, lesson_id: lessonId });

// Homeworks
export const apiGetHomeworks = (studentId?: number) =>
  get<Record<string, unknown>[]>(studentId ? `/homeworks?student_id=${studentId}` : "/homeworks");
export const apiSubmitHomework = (data: { student_id: number; lesson_title: string; text: string }) =>
  post<Record<string, unknown>>("/homeworks", data);
export const apiGradeHomework = (hwId: number, data: { status: string; grade?: number; trainer_comment?: string }) =>
  patch<Record<string, unknown>>(`/homeworks/${hwId}`, data);

// Notifications
export const apiGetNotifications = (studentId: number) =>
  get<Record<string, unknown>[]>(`/notifications?student_id=${studentId}`);
export const apiCreateNotification = (data: { student_id: number; lesson_title: string; status: string; grade?: number }) =>
  post<Record<string, unknown>>("/notifications", data);
export const apiMarkNotificationsRead = (studentId: number) =>
  post<Record<string, unknown>>("/notifications/read", { student_id: studentId });

// Student docs
export const apiGetStudentDocs = (studentId: number) =>
  get<Record<string, unknown>[]>(`/student-docs/${studentId}`);
export const apiUploadStudentDoc = (data: Record<string, unknown>) =>
  post<Record<string, unknown>>("/student-docs", data);

// Forum
export const apiGetForumTopics = () => get<Record<string, unknown>[]>("/forum/topics");
export const apiGetTopicPosts = (topicId: number) =>
  get<Record<string, unknown>[]>(`/forum/topics/${topicId}`);
export const apiCreateTopic = (data: { title: string; author_id: number; text: string }) =>
  post<Record<string, unknown>>("/forum/topics", data);
export const apiUpdateTopic = (topicId: number, data: { pinned?: boolean; closed?: boolean }) =>
  patch<Record<string, unknown>>(`/forum/topics/${topicId}`, data);
export const apiPostMessage = (topicId: number, data: { author_id: number; text: string }) =>
  post<Record<string, unknown>>(`/forum/topics/${topicId}/posts`, data);
export const apiLikePost = (postId: number, userId: number) =>
  post<Record<string, unknown>>(`/forum/posts/${postId}/like`, { user_id: userId });
