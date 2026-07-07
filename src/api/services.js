/**
 * API service functions for Traky Mobile — mirrors web frontend service layer.
 * All calls use the shared `client` axios instance which injects the bearer token.
 *
 * Every backend route is represented here so screens never import `client` directly.
 */
import client from './client';

// ─── Helpers ──────────────────────────────────────────────────
const arr = (data, ...keys) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of keys) { if (Array.isArray(data[k])) return data[k]; }
  if (Array.isArray(data.data)) return data.data;
  return [];
};

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}
export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data.user ?? data.data?.user ?? data;
}
export async function changePassword(newPassword, tempToken) {
  const config = tempToken ? { headers: { Authorization: `Bearer ${tempToken}` } } : {};
  const { data } = await client.post('/auth/change-password', { newPassword }, config);
  return data;
}
export async function forgotPassword(email) {
  const { data } = await client.post('/auth/forgot', { email });
  return data;
}
export async function refreshToken(token) {
  const { data } = await client.post('/auth/refresh', { refreshToken: token });
  return data;
}
export async function sendEmailOtp(email) {
  const { data } = await client.post('/auth/send-email-otp', { email });
  return data;
}
export async function verifyEmailOtp(email, otp) {
  const { data } = await client.post('/auth/verify-email-otp', { email, otp });
  return data;
}
export async function checkPermissions() {
  const { data } = await client.get('/auth/check-permissions');
  return data;
}

// ═══════════════════════════════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════════════════════════════
export async function getSessions() {
  const { data } = await client.get('/sessions');
  return data?.sessions ?? [];
}
export async function revokeSession(id) {
  const { data } = await client.delete(`/sessions/${id}`);
  return data;
}
export async function revokeAllSessions() {
  const { data } = await client.delete('/sessions');
  return data;
}

// ═══════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════
export async function getProjects(params = {}) {
  const { data } = await client.get('/projects', { params });
  return data?.projects ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getMyProjects() {
  const { data } = await client.get('/projects/my-projects');
  return data?.projects ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getProjectById(id) {
  const { data } = await client.get(`/projects/${id}`);
  return data?.project ?? data;
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
export async function assignProjectTeam(id, teamPayload) {
  const { data } = await client.patch(`/projects/${id}/team`, teamPayload);
  return data?.project ?? data;
}
export async function updateTestingPhase(id, phaseIndex, status) {
  const { data } = await client.patch(`/projects/${id}/testing-phases`, { phaseIndex, status });
  return data?.project ?? data;
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════
export async function getTasks(params = {}) {
  const { data } = await client.get('/tasks', { params });
  return data?.tasks ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getTaskById(id) {
  const { data } = await client.get(`/tasks/${id}`);
  return data?.task ?? data;
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
export async function advanceTask(id) {
  const { data } = await client.patch(`/tasks/${id}/advance`);
  return data?.task ?? data;
}
export async function pauseTask(id) {
  const { data } = await client.patch(`/tasks/${id}/pause`);
  return data?.task ?? data;
}
export async function resumeTask(id) {
  const { data } = await client.patch(`/tasks/${id}/resume`);
  return data?.task ?? data;
}
export async function submitTaskProof(id, note) {
  const { data } = await client.patch(`/tasks/${id}/proof`, { note });
  return data?.task ?? data;
}
export async function completeTask(id, formData) {
  const { data } = await client.post(`/tasks/${id}/complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.task ?? data;
}
export async function startTesterReview(id) {
  const { data } = await client.patch(`/tasks/${id}/start-review`);
  return data?.task ?? data;
}
export async function assignTask(id, payload) {
  const { data } = await client.patch(`/tasks/${id}/assign`, payload);
  return data?.task ?? data;
}
export async function getEmployeeTaskProgress(id, userId) {
  const { data } = await client.get(`/tasks/${id}/progress`, {
    params: userId ? { userId } : {},
  });
  return data;
}
export async function getMyTaskProgress(params = {}) {
  const { data } = await client.get('/tasks/progress/my', { params });
  return data?.data ?? data?.tasks ?? (Array.isArray(data) ? data : []);
}
export async function updateEmployeeTaskProgress(id, payload) {
  const { data } = await client.patch(`/tasks/${id}/progress`, payload);
  return data?.task ?? data;
}
export async function uploadTaskAttachment(id, formData) {
  const { data } = await client.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.task ?? data;
}
export async function deleteTaskAttachment(id, publicId) {
  const { data } = await client.delete(`/tasks/${id}/attachments`, {
    data: { publicId },
  });
  return data?.task ?? data;
}
export async function addTaskNote(id, text, authorName) {
  const { data } = await client.post(`/tasks/${id}/notes`, { text, authorName });
  return data?.task ?? data;
}

// ═══════════════════════════════════════════════════════════════
// BUGS / ISSUES
// ═══════════════════════════════════════════════════════════════
export async function getAllBugs(params = {}) {
  const { data } = await client.get('/bugs', { params });
  return data?.bugs ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getMyBugs() {
  const { data } = await client.get('/bugs/my-bugs');
  return data?.bugs ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getBugsReportedByMe() {
  const { data } = await client.get('/bugs/reported-by-me');
  return data?.bugs ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getBugById(id) {
  const { data } = await client.get(`/bugs/${id}`);
  return data?.bug ?? data;
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

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════
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
export async function getColleagues() {
  const { data } = await client.get('/users/colleagues');
  return data?.users ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getUserById(id) {
  const { data } = await client.get(`/users/${id}`);
  return data?.user ?? data;
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
export async function updateMe(payload) {
  const { data } = await client.patch('/users/me', payload);
  return data?.user ?? data;
}
export async function updateUserPermissions(userId, customPermissions) {
  const { data } = await client.patch(`/users/${userId}/permissions`, { customPermissions });
  return data?.user ?? data;
}
export async function uploadProfilePic(userId, formData) {
  const { data } = await client.post(`/users/${userId}/profile-pic`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.user ?? data;
}
export async function getProfilePic(userId) {
  const { data } = await client.get(`/users/${userId}/profile-pic`);
  return data;
}
export async function deleteProfilePic(userId) {
  const { data } = await client.delete(`/users/${userId}/profile-pic`);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════════════════════════
export async function getDepartments() {
  const { data } = await client.get('/departments');
  return data?.allDepartments ?? data?.departments ?? (Array.isArray(data) ? data : []);
}
export async function getDepartmentById(id) {
  const { data } = await client.get(`/departments/${id}`);
  return data?.department ?? data;
}
export async function getDepartmentMembers(id) {
  const { data } = await client.get(`/departments/${id}/members`);
  return data?.members ?? data?.users ?? (Array.isArray(data) ? data : []);
}
export async function createDepartment(payload) {
  const { data } = await client.post('/departments', payload);
  return data;
}
export async function updateDepartment(id, payload) {
  const { data } = await client.patch(`/departments/${id}`, payload);
  return data?.department ?? data;
}
export async function deleteDepartment(id) {
  await client.delete(`/departments/${id}`);
}

// ═══════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════
export async function getTodayAttendance() {
  const { data } = await client.get('/attendance/today');
  return data?.attendance ?? null;
}
export async function punchIn(formData) {
  const { data } = await client.post('/attendance/punch-in', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.attendance ?? data;
}
export async function punchOut(formData) {
  const { data } = await client.post('/attendance/punch-out', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.attendance ?? data;
}
export async function getMyAttendance(params = {}) {
  const { data } = await client.get('/attendance/my-records', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function getAttendanceSummary(month, year) {
  const { data } = await client.get('/attendance/summary', { params: { month, year } });
  return data;
}
export async function getReverseGeocode(lat, lng) {
  const { data } = await client.get('/attendance/reverse-geocode', { params: { lat, lng } });
  return data?.address ?? data;
}
export async function getAllAttendance(params = {}) {
  const { data } = await client.get('/attendance/all', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function getAttendanceById(id) {
  const { data } = await client.get(`/attendance/${id}`);
  return data?.attendance ?? data;
}
export async function updateApprovalStatus(id, approvalStatus, notes) {
  const { data } = await client.patch(`/attendance/${id}/approval`, { approvalStatus, notes });
  return data?.attendance ?? data;
}
export async function createAttendance(payload) {
  const { data } = await client.post('/attendance', payload);
  return data?.attendance ?? data;
}
export async function updateAttendance(id, payload) {
  const { data } = await client.put(`/attendance/${id}`, payload);
  return data?.attendance ?? data;
}
export async function deleteAttendance(id) {
  await client.delete(`/attendance/${id}`);
}
export async function deleteTodayAttendance() {
  await client.delete('/attendance/today');
}

// ═══════════════════════════════════════════════════════════════
// LEAVES
// ═══════════════════════════════════════════════════════════════
export async function applyLeave(formData) {
  const { data } = await client.post('/leave', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.leave ?? data;
}
export async function getMyLeaves(params = {}) {
  const { data } = await client.get('/leave/my', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function cancelLeave(id) {
  const { data } = await client.patch(`/leave/${id}/cancel`);
  return data?.leave ?? data;
}
export async function getLeaveApprovals(params = {}) {
  const { data } = await client.get('/leave/approvals', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function reviewLeave(id, action, approverRemarks = '') {
  const { data } = await client.patch(`/leave/${id}/review`, { action, approverRemarks });
  return data?.leave ?? data;
}
export async function getAllLeaves(params = {}) {
  const { data } = await client.get('/leave/all', { params });
  return { records: data?.records ?? [], pagination: data?.pagination };
}
export async function getLeaveById(id) {
  const { data } = await client.get(`/leave/${id}`);
  return data?.leave ?? data;
}

// ═══════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════
export async function getMyExpenses(params = {}) {
  const { data } = await client.get('/expenses/my', { params });
  return data;
}
export async function getAllExpenses(params = {}) {
  const { data } = await client.get('/expenses/all', { params });
  return data;
}
export async function getExpenseById(id) {
  const { data } = await client.get(`/expenses/${id}`);
  return data;
}
export async function submitExpense(formData) {
  const { data } = await client.post('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
export async function reviewExpense(id, payload) {
  const { data } = await client.patch(`/expenses/${id}/review`, payload);
  return data;
}
export async function processExpensePayment(id, payload) {
  const { data } = await client.patch(`/expenses/${id}/pay`, payload);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD / SCORING
// ═══════════════════════════════════════════════════════════════
export async function getLeaderboard(period = 'all') {
  const { data } = await client.get('/leaderboard', { params: { period } });
  return data;
}
export async function getTeamLeaderboard(projectId, period = 'all') {
  const { data } = await client.get(`/leaderboard/team/${projectId}`, { params: { period } });
  return data;
}
export async function recalculateLeaderboard() {
  const { data } = await client.post('/leaderboard/recalculate');
  return data;
}

// ═══════════════════════════════════════════════════════════════
// DAILY LOGS
// ═══════════════════════════════════════════════════════════════
export async function getAllLogs(params = {}) {
  const { data } = await client.get('/daily-logs', { params });
  return data?.logs ?? data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getTodayLog() {
  const { data } = await client.get('/daily-logs/today');
  return data?.log ?? data?.data ?? null;
}
export async function getPrefilledTodos() {
  const { data } = await client.get('/daily-logs/prefilled-todos');
  return data?.todos ?? [];
}
export async function getDailyLogById(id) {
  const { data } = await client.get(`/daily-logs/${id}`);
  return data?.log ?? data;
}
export async function createDailyLog(payload) {
  const { data } = await client.post('/daily-logs', payload);
  return data?.log ?? data;
}
export async function updateDailyLog(id, payload) {
  const { data } = await client.patch(`/daily-logs/${id}`, payload);
  return data?.log ?? data;
}
export async function deleteDailyLog(id) {
  await client.delete(`/daily-logs/${id}`);
}
export async function uploadEntryScreenshot(logId, entryId, formData) {
  const { data } = await client.post(
    `/daily-logs/${logId}/entries/${entryId}/screenshot`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data?.log ?? data;
}
export async function generateSummary(filters = {}) {
  const { data } = await client.post('/daily-logs/summaries', filters);
  return data;
}
export async function downloadSummary(params = {}) {
  const res = await client.get('/daily-logs/summaries/download', {
    params,
    responseType: 'blob',
  });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// KT DOCUMENTS
// ═══════════════════════════════════════════════════════════════
export async function getKtDocuments(params = {}) {
  const { data } = await client.get('/kt-documents', { params });
  return data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getKtDocumentById(id) {
  const { data } = await client.get(`/kt-documents/${id}`);
  return data?.document ?? data;
}
export async function createKtDocument(formData) {
  const { data } = await client.post('/kt-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.document ?? data;
}
export async function updateKtDocument(id, formData) {
  const { data } = await client.patch(`/kt-documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.document ?? data;
}
export async function deleteKtDocument(id) {
  await client.delete(`/kt-documents/${id}`);
}

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════
export async function getMyReports() {
  const { data } = await client.get('/reports/my-reports');
  return data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getReports() {
  const { data } = await client.get('/reports');
  return data?.data ?? (Array.isArray(data) ? data : []);
}
export async function getReportById(id) {
  const { data } = await client.get(`/reports/${id}`);
  return data?.data ?? data;
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
export async function sendReportEmail(payload) {
  const { data } = await client.post('/reports/send-email', payload);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
export async function getNotifications(params = {}) {
  const { data } = await client.get('/notifications', { params });
  return data;
}
export async function getUnreadCount() {
  const { data } = await client.get('/notifications/unread-count');
  return data?.count ?? 0;
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
export async function clearAllNotifications() {
  await client.delete('/notifications');
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════
export async function getCategories() {
  const { data } = await client.get('/categories');
  return data?.categories ?? (Array.isArray(data) ? data : []);
}
export async function getCategoryById(id) {
  const { data } = await client.get(`/categories/${id}`);
  return data?.category ?? data;
}
export async function createCategory(payload) {
  const { data } = await client.post('/categories', payload);
  return data?.category ?? data;
}
export async function updateCategory(id, payload) {
  const { data } = await client.patch(`/categories/${id}`, payload);
  return data?.category ?? data;
}
export async function deleteCategory(id) {
  await client.delete(`/categories/${id}`);
}

// ═══════════════════════════════════════════════════════════════
// TASK TEMPLATES
// ═══════════════════════════════════════════════════════════════
export async function getTaskTemplates() {
  const { data } = await client.get('/task-templates');
  return data?.data ?? (Array.isArray(data) ? data : []);
}
export async function createTaskTemplate(payload) {
  const { data } = await client.post('/task-templates', payload);
  return data?.data ?? data;
}
export async function deleteTaskTemplate(id) {
  await client.delete(`/task-templates/${id}`);
}

// ═══════════════════════════════════════════════════════════════
// BRANCHES
// ═══════════════════════════════════════════════════════════════
export async function getBranches(params = {}) {
  const { data } = await client.get('/branches', { params });
  return { branches: data?.data ?? [], pagination: data?.pagination ?? {} };
}
export async function getBranchById(id) {
  const { data } = await client.get(`/branches/${id}`);
  return data?.data ?? data;
}
export async function getBranchStats() {
  const { data } = await client.get('/branches/stats');
  return data?.data ?? data;
}
export async function createBranch(payload) {
  const { data } = await client.post('/branches', payload);
  return data?.data ?? data;
}
export async function updateBranch(id, payload) {
  const { data } = await client.put(`/branches/${id}`, payload);
  return data?.data ?? data;
}
export async function deleteBranch(id) {
  await client.delete(`/branches/${id}`);
}

// ═══════════════════════════════════════════════════════════════
// SALARY
// ═══════════════════════════════════════════════════════════════
export async function getConversionSetting() {
  const { data } = await client.get('/salary/settings/conversion');
  return data;
}
export async function updateConversionSetting(pointToRupeeConversion) {
  const { data } = await client.patch('/salary/settings/conversion', { pointToRupeeConversion });
  return data;
}
export async function calculateEmployeeSalary(payload) {
  const { data } = await client.post('/salary/calculate/employee', payload);
  return data;
}
export async function calculateAllSalaries(payload) {
  const { data } = await client.post('/salary/calculate/all', payload);
  return data;
}
export async function getSalaryList(params = {}) {
  const { data } = await client.get('/salary', { params });
  return data;
}
export async function getSalaryStats(params = {}) {
  const { data } = await client.get('/salary/stats', { params });
  return data;
}
export async function getSalaryById(salaryId) {
  const { data } = await client.get(`/salary/${salaryId}`);
  return data;
}
export async function updatePaymentStatus(salaryId, paymentData) {
  const { data } = await client.patch(`/salary/${salaryId}/payment`, paymentData);
  return data;
}
export async function generatePayslip(salaryId, payslipData) {
  const { data } = await client.post(`/salary/${salaryId}/payslip`, payslipData);
  return data;
}
export async function getPayslipById(payslipId) {
  const { data } = await client.get(`/salary/payslips/${payslipId}`);
  return data;
}
export async function getUserPayslips(userId, params = {}) {
  const { data } = await client.get(`/salary/users/${userId}/payslips`, { params });
  return data;
}
export async function getEmployeeSalaryHistory(userId, limit = 12) {
  const { data } = await client.get(`/salary/users/${userId}/history`, { params: { limit } });
  return data;
}
export async function getMySalaryHistory(limit = 12) {
  const { data } = await client.get('/salary/my/history', { params: { limit } });
  return data;
}
export async function getMyPayslips(params = {}) {
  const { data } = await client.get('/salary/my/payslips', { params });
  return data;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════
export async function getActivityLogs(params = {}) {
  const { data } = await client.get('/activity-logs', { params });
  return data;
}
export async function getActivityLogsByEntity(entity, entityId) {
  const { data } = await client.get(`/activity-logs/${entity}/${entityId}`);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// COMPANIES / SETTINGS
// ═══════════════════════════════════════════════════════════════
export async function getCompanyById(id) {
  const { data } = await client.get(`/companies/${id}`);
  return data?.company ?? data;
}
export async function updateCompany(id, payload) {
  const { data } = await client.patch(`/companies/${id}`, payload);
  return data?.company ?? data;
}
export async function getRolePermissions() {
  const { data } = await client.get('/companies/permissions/roles');
  return data?.rolePermissions ?? {};
}
export async function updateRolePermissions(rolePermissions) {
  const { data } = await client.patch('/companies/permissions/roles', { rolePermissions });
  return data;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════
export async function getFeatureFlags() {
  const { data } = await client.get('/feature-flags');
  return data;
}
