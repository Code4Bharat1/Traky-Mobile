/**
 * API service functions for Traky Mobile — mirrors web frontend service layer.
 * All calls use the shared `client` axios instance which injects the bearer token.
 */
import client from './client';

// ─── Projects ─────────────────────────────────────────────────
export async function getProjects(params = {}) {
  const { data } = await client.get('/projects', { params });
  return data?.projects ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getMyProjects() {
  const { data } = await client.get('/projects/my-projects');
  return data?.projects ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function createProject(payload) {
  const { data } = await client.post('/projects', payload);
  return data?.project ?? data;
}
export async function updateProject(id, payload) {
  const { data } = await client.patch(`/projects/${id}`, payload);
  return data?.project ?? data;
}
export async function deleteProject(id) {
  await client.delete(`/projects/${id}`);
}

// ─── Tasks ────────────────────────────────────────────────────
export async function getTasks(params = {}) {
  const { data } = await client.get('/tasks', { params });
  return data?.tasks ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function createTask(payload) {
  const { data } = await client.post('/tasks', payload);
  return data?.task ?? data;
}
export async function updateTask(id, payload) {
  const { data } = await client.patch(`/tasks/${id}`, payload);
  return data?.task ?? data;
}
export async function deleteTask(id) {
  await client.delete(`/tasks/${id}`);
}

// ─── Bugs / Issues ────────────────────────────────────────────
export async function getAllBugs(params = {}) {
  const { data } = await client.get('/bugs', { params });
  return data?.bugs ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getBugsReportedByMe() {
  const { data } = await client.get('/bugs/reported-by-me');
  return data?.bugs ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function createBug(payload) {
  const { data } = await client.post('/bugs', payload);
  return data?.bug ?? data;
}
export async function updateBug(id, payload) {
  const { data } = await client.patch(`/bugs/${id}`, payload);
  return data?.bug ?? data;
}
export async function deleteBug(id) {
  await client.delete(`/bugs/${id}`);
}

// ─── Users ────────────────────────────────────────────────────
export async function getUsers(params = {}) {
  try {
    const { data } = await client.get('/users', { params });
    return data?.users ?? data?.data ?? (Array.isArray(data) ? data : []);
  } catch (err) {
    if (err?.response?.status === 403) {
      const { data } = await client.get('/users/colleagues');
      return data?.users ?? data?.data ?? (Array.isArray(data) ? data : []);
    }
    throw err;
  }
}
export async function createUser(payload) {
  const { data } = await client.post('/users', payload);
  return data?.user ?? data;
}
export async function updateUser(id, payload) {
  const { data } = await client.patch(`/users/${id}`, payload);
  return data?.user ?? data;
}
export async function deleteUser(id) {
  await client.delete(`/users/${id}`);
}

// ─── Departments ──────────────────────────────────────────────
export async function getDepartments() {
  const { data } = await client.get('/departments');
  return data?.allDepartments ?? data?.departments ?? (Array.isArray(data) ? data : []);
}

// ─── Attendance ───────────────────────────────────────────────
export async function getAllAttendance(params = {}) {
  const { data } = await client.get('/attendance/all', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function updateApprovalStatus(id, approvalStatus, notes) {
  const { data } = await client.patch(`/attendance/${id}/approval`, { approvalStatus, notes });
  return data?.attendance ?? data;
}

// ─── Leaves ───────────────────────────────────────────────────
export async function getLeaveApprovals(params = {}) {
  const { data } = await client.get('/leave/approvals', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function reviewLeave(id, action, approverRemarks = '') {
  const { data } = await client.patch(`/leave/${id}/review`, { action, approverRemarks });
  return data?.leave ?? data;
}

// ─── Expenses ─────────────────────────────────────────────────
export async function getMyExpenses(params = {}) {
  const { data } = await client.get('/expenses/my', { params });
  // Backend returns { records: [...], pagination: {...} }
  return data?.records ?? data?.expenses ?? (Array.isArray(data) ? data : []);
}
export async function getAllExpenses(params = {}) {
  const { data } = await client.get('/expenses/all', { params });
  return data?.records ?? data?.expenses ?? (Array.isArray(data) ? data : []);
}
export async function submitExpense(payload) {
  const { data } = await client.post('/expenses', payload);
  return data;
}
export async function reviewExpense(id, payload) {
  const { data } = await client.patch(`/expenses/${id}/review`, payload);
  return data;
}

// ─── Leaderboard ──────────────────────────────────────────────
export async function getLeaderboard(period = 'all') {
  const { data } = await client.get('/leaderboard', { params: { period } });
  // Backend returns { data: [...], departmentAverage: number }
  return { data: data?.data ?? [], departmentAverage: data?.departmentAverage ?? 0 };
}

// ─── Daily Logs ───────────────────────────────────────────────
export async function getAllLogs(params = {}) {
  const { data } = await client.get('/daily-logs', { params });
  // Backend returns { data: [...], pagination: {...} }
  return data?.data ?? data?.logs ?? (Array.isArray(data) ? data : []);
}

// ─── KT Documents ─────────────────────────────────────────────
export async function getKtDocuments(params = {}) {
  const { data } = await client.get('/kt-documents', { params });
  return data?.data ?? (Array.isArray(data) ? data : []);
}

// ─── Reports ──────────────────────────────────────────────────
export async function getMyReports() {
  const { data } = await client.get('/reports/my-reports');
  return data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getReports() {
  const { data } = await client.get('/reports');
  return data?.data ?? (Array.isArray(data) ? data : []);
}
export async function createReport(payload) {
  const { data } = await client.post('/reports', payload);
  return data?.data ?? data;
}
export async function updateReport(id, payload) {
  const { data } = await client.patch(`/reports/${id}`, payload);
  return data?.data ?? data;
}
export async function deleteReport(id) {
  await client.delete(`/reports/${id}`);
}

// ─── Notifications ────────────────────────────────────────────
export async function getNotifications(params = {}) {
  const { data } = await client.get('/notifications', { params });
  // Backend returns { notifications: [...], unreadCount, total, page, pages }
  return { notifications: data?.notifications ?? [], unreadCount: data?.unreadCount ?? 0, total: data?.total ?? 0 };
}
export async function markAsRead(id) {
  const { data } = await client.patch(`/notifications/${id}/read`);
  return data?.notification ?? data;
}
export async function markAllAsRead() {
  const { data } = await client.patch('/notifications/read-all');
  return data;
}
export async function deleteNotification(id) {
  await client.delete(`/notifications/${id}`);
}
