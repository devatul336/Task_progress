import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TaskItem, CreateTaskItem, UpdateTaskItem, TaskComment, TaskSummary,
  TrackerProject, Milestone, KPIDefinition, EmployeeKPI, EmployeeGoal,
  ProgressReview, EmployeeDashboard, ManagerDashboard, OrgDashboard,
  EmployeePerformanceSummary, DepartmentPerformance, MonthlyTrend, ChartData
} from './models/interfaces';

@Injectable({ providedIn: 'root' })
export class ProgressTrackerService {
  private baseUrl = 'http://localhost:5010/api';

  constructor(private http: HttpClient) {}

  private buildParams(obj: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    Object.entries(obj).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return params;
  }

  // Tasks
  getTasks(filters: {
    employeeId?: string; departmentId?: string; branchId?: string;
    status?: number; type?: number; fromDate?: string; toDate?: string; projectId?: number;
  } = {}): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.baseUrl}/Task`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  getTaskById(id: number): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.baseUrl}/Task/${id}`);
  }

  getTodayTasks(employeeId: string): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.baseUrl}/Task/today/${employeeId}`);
  }

  getOverdueTasks(employeeId?: string): Observable<TaskItem[]> {
    const params = employeeId ? this.buildParams({ employeeId }) : undefined;
    return this.http.get<TaskItem[]>(`${this.baseUrl}/Task/overdue`, { params });
  }

  getUpcomingDeadlines(employeeId: string, days = 7): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.baseUrl}/Task/upcoming/${employeeId}`, { params: this.buildParams({ days }) });
  }

  getTaskSummary(filters: { employeeId?: string; departmentId?: string; fromDate?: string; toDate?: string } = {}): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(`${this.baseUrl}/Task/summary`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  createTask(task: CreateTaskItem): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.baseUrl}/Task`, task);
  }

  updateTask(task: UpdateTaskItem): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.baseUrl}/Task/${task.taskItemId}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Task/${id}`);
  }

  addComment(taskId: number, comment: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.baseUrl}/Task/${taskId}/comments`, JSON.stringify(comment), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.baseUrl}/Task/${taskId}/comments`);
  }

  bulkUpdateStatus(taskIds: number[], status: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/Task/bulk-status`, { taskIds, status });
  }

  // Projects
  getProjects(filters: { departmentId?: string; managerId?: string; status?: number } = {}): Observable<TrackerProject[]> {
    return this.http.get<TrackerProject[]>(`${this.baseUrl}/Project`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  getProjectById(id: number): Observable<TrackerProject> {
    return this.http.get<TrackerProject>(`${this.baseUrl}/Project/${id}`);
  }

  createProject(project: Partial<TrackerProject>): Observable<TrackerProject> {
    return this.http.post<TrackerProject>(`${this.baseUrl}/Project`, project);
  }

  updateProject(id: number, project: Partial<TrackerProject>): Observable<TrackerProject> {
    return this.http.put<TrackerProject>(`${this.baseUrl}/Project/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Project/${id}`);
  }

  getMilestones(projectId: number): Observable<Milestone[]> {
    return this.http.get<Milestone[]>(`${this.baseUrl}/Project/${projectId}/milestones`);
  }

  createMilestone(projectId: number, milestone: Partial<Milestone>): Observable<Milestone> {
    return this.http.post<Milestone>(`${this.baseUrl}/Project/${projectId}/milestones`, milestone);
  }

  updateMilestone(milestoneId: number, milestone: Partial<Milestone>): Observable<Milestone> {
    return this.http.put<Milestone>(`${this.baseUrl}/Project/milestones/${milestoneId}`, milestone);
  }

  // KPIs
  getKPIDefinitions(activeOnly = true): Observable<KPIDefinition[]> {
    return this.http.get<KPIDefinition[]>(`${this.baseUrl}/KPI/definitions`, { params: this.buildParams({ activeOnly }) });
  }

  createKPIDefinition(kpi: Partial<KPIDefinition>): Observable<KPIDefinition> {
    return this.http.post<KPIDefinition>(`${this.baseUrl}/KPI/definitions`, kpi);
  }

  getEmployeeKPIs(filters: { employeeId?: string; departmentId?: string; periodStart?: string; periodEnd?: string } = {}): Observable<EmployeeKPI[]> {
    return this.http.get<EmployeeKPI[]>(`${this.baseUrl}/KPI/employee`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  assignKPI(kpi: Partial<EmployeeKPI>): Observable<EmployeeKPI> {
    return this.http.post<EmployeeKPI>(`${this.baseUrl}/KPI/employee`, kpi);
  }

  updateEmployeeKPI(id: number, achievedValue: number, score: number, remarks?: string): Observable<EmployeeKPI> {
    return this.http.put<EmployeeKPI>(`${this.baseUrl}/KPI/employee/${id}`, { employeeKPIId: id, achievedValue, score, remarks });
  }

  // Goals
  getGoals(filters: { employeeId?: string; status?: number } = {}): Observable<EmployeeGoal[]> {
    return this.http.get<EmployeeGoal[]>(`${this.baseUrl}/Goal`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  createGoal(goal: Partial<EmployeeGoal>): Observable<EmployeeGoal> {
    return this.http.post<EmployeeGoal>(`${this.baseUrl}/Goal`, goal);
  }

  updateGoal(id: number, goal: Partial<EmployeeGoal>): Observable<EmployeeGoal> {
    return this.http.put<EmployeeGoal>(`${this.baseUrl}/Goal/${id}`, goal);
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Goal/${id}`);
  }

  // Reviews
  getReviews(filters: { employeeId?: string; reviewerId?: string; status?: number } = {}): Observable<ProgressReview[]> {
    return this.http.get<ProgressReview[]>(`${this.baseUrl}/Review`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  createReview(review: Partial<ProgressReview>): Observable<ProgressReview> {
    return this.http.post<ProgressReview>(`${this.baseUrl}/Review`, review);
  }

  acknowledgeReview(id: number, comments: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/Review/${id}/acknowledge`, JSON.stringify(comments), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Dashboards
  getEmployeeDashboard(employeeId: string): Observable<EmployeeDashboard> {
    return this.http.get<EmployeeDashboard>(`${this.baseUrl}/Dashboard/employee/${employeeId}`);
  }

  getManagerDashboard(managerId: string, departmentId?: string): Observable<ManagerDashboard> {
    const params = departmentId ? this.buildParams({ departmentId }) : undefined;
    return this.http.get<ManagerDashboard>(`${this.baseUrl}/Dashboard/manager/${managerId}`, { params });
  }

  getOrgDashboard(branchId?: string): Observable<OrgDashboard> {
    const params = branchId ? this.buildParams({ branchId }) : undefined;
    return this.http.get<OrgDashboard>(`${this.baseUrl}/Dashboard/organization`, { params });
  }

  getEmployeePerformanceList(filters: { departmentId?: string; branchId?: string; fromDate?: string; toDate?: string } = {}): Observable<EmployeePerformanceSummary[]> {
    return this.http.get<EmployeePerformanceSummary[]>(`${this.baseUrl}/Dashboard/performance/employees`, { params: this.buildParams(filters as Record<string, unknown>) });
  }

  getEmployeePerformanceSummary(employeeId: string, fromDate?: string, toDate?: string): Observable<EmployeePerformanceSummary> {
    return this.http.get<EmployeePerformanceSummary>(`${this.baseUrl}/Dashboard/performance/employee/${employeeId}`, {
      params: this.buildParams({ fromDate, toDate } as Record<string, unknown>)
    });
  }

  getDepartmentPerformance(branchId?: string): Observable<DepartmentPerformance[]> {
    const params = branchId ? this.buildParams({ branchId }) : undefined;
    return this.http.get<DepartmentPerformance[]>(`${this.baseUrl}/Dashboard/performance/departments`, { params });
  }

  getMonthlyTrend(months = 6, departmentId?: string): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`${this.baseUrl}/Dashboard/trend/monthly`, {
      params: this.buildParams({ months, departmentId } as Record<string, unknown>)
    });
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/Employee`);
  }
}
