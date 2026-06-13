export interface TaskItem {
  taskItemId: number;
  title: string;
  description?: string;
  taskType: number;
  taskTypeName: string;
  status: number;
  statusName: string;
  priority: number;
  priorityName: string;
  assignedToEmployeeId: string;
  assignedToEmployeeName: string;
  assignedByEmployeeId: string;
  assignedByEmployeeName: string;
  projectId?: number;
  projectName?: string;
  milestoneId?: number;
  milestoneName?: string;
  departmentId?: string;
  departmentName?: string;
  dueDate: string;
  startDate?: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours: number;
  completionPercentage: number;
  tags?: string;
  isRecurring: boolean;
  isOverdue: boolean;
  createdDate: string;
  createdBy: string;
  parentTaskId?: number;
  comments: TaskComment[];
  histories: TaskHistory[];
}

export interface CreateTaskItem {
  title: string;
  description?: string;
  taskType: number;
  priority: number;
  assignedToEmployeeId: string;
  assignedToEmployeeName: string;
  projectId?: number;
  milestoneId?: number;
  departmentId?: string;
  dueDate: string;
  startDate?: string;
  estimatedHours: number;
  tags?: string;
  acceptanceCriteria?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
}

export interface UpdateTaskItem extends CreateTaskItem {
  taskItemId: number;
  status: number;
  completionPercentage: number;
  actualHours: number;
  completedDate?: string;
  statusChangeRemark?: string;
}

export interface TaskComment {
  taskCommentId: number;
  taskItemId: number;
  comment: string;
  commentByEmployeeId: string;
  commentByEmployeeName: string;
  createdDate: string;
}

export interface TaskHistory {
  taskHistoryId: number;
  oldStatus: string;
  newStatus: string;
  changedByEmployeeName: string;
  remarks?: string;
  changedDate: string;
  oldCompletionPercentage?: number;
  newCompletionPercentage?: number;
}

export interface TaskSummary {
  total: number;
  toDo: number;
  inProgress: number;
  underReview: number;
  completed: number;
  onHold: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
}

export interface TrackerProject {
  projectId: number;
  name: string;
  description?: string;
  status: number;
  statusName: string;
  priority: number;
  priorityName: string;
  projectManagerId: string;
  projectManagerName: string;
  departmentName?: string;
  startDate: string;
  endDate: string;
  actualEndDate?: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  budget?: number;
  tags?: string;
  isOverdue: boolean;
  teamMemberCount: number;
  createdDate: string;
  modifiedDate?: string;
  milestones: Milestone[];
  teamMembers: ProjectTeamMember[];
  _cleanDescription?: string;
  _attachmentUrl?: string | null;
}

export interface Milestone {
  milestoneId: number;
  projectId: number;
  projectName?: string;
  name: string;
  description?: string;
  status: number;
  statusName: string;
  dueDate: string;
  achievedDate?: string;
  completionPercentage: number;
  isOverdue: boolean;
}

export interface ProjectTeamMember {
  projectTeamMemberId: number;
  employeeId: string;
  employeeName: string;
  role: string;
  joinedDate: string;
  isActive: boolean;
}

export interface KPIDefinition {
  kpiDefinitionId: number;
  name: string;
  description?: string;
  category: string;
  unit: string;
  targetType: number;
  targetTypeName: string;
  isHigherBetter: boolean;
  isGlobal: boolean;
  isActive: boolean;
}

export interface EmployeeKPI {
  employeeKPIId: number;
  employeeId: string;
  employeeName: string;
  kpiDefinitionId: number;
  kpiName: string;
  category: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  achievedValue: number;
  score: number;
  achievementPercentage: number;
  remarks?: string;
  isActive: boolean;
}

export interface EmployeeGoal {
  employeeGoalId: number;
  employeeId: string;
  employeeName: string;
  title: string;
  description?: string;
  category: string;
  status: number;
  statusName: string;
  progressPercentage: number;
  targetDate: string;
  achievedDate?: string;
  reviewerName?: string;
  reviewerComments?: string;
  successCriteria?: string;
  isOverdue: boolean;
  createdDate: string;
  // Assignment fields
  assignedToEmployeeIds?: string[];
  assignedToEmployeeNames?: string[];
  assignedByEmployeeId?: string;
  assignedByEmployeeName?: string;
}

export interface ProgressReview {
  progressReviewId: number;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  reviewPeriod: string;
  reviewDate: string;
  status: number;
  statusName: string;
  overallRating: number;
  strengths?: string;
  areasOfImprovement?: string;
  goalsForNextPeriod?: string;
  comments?: string;
  taskCompletionRate: number;
  kpiAchievementRate: number;
  goalAchievementRate: number;
  acknowledgedDate?: string;
  employeeComments?: string;
  createdDate: string;
}

export interface EmployeeDashboard {
  employeeId: string;
  employeeName: string;
  todayTasks: TaskSummary;
  weekTasks: TaskSummary;
  monthTasks: TaskSummary;
  upcomingDeadlines: TaskItem[];
  overdueTasks: TaskItem[];
  recentlyCompleted: TaskItem[];
  activeKPIs: EmployeeKPI[];
  activeGoals: EmployeeGoal[];
  overallProductivityScore: number;
  taskCompletionRate: number;
  onTimeCompletionRate: number;
  averageKPIAchievement: number;
  productivityTrend: DailyProductivity[];
  tasksByStatus: ChartData[];
  tasksByPriority: ChartData[];
}

export interface ManagerDashboard {
  managerId: string;
  managerName: string;
  departmentId?: string;
  departmentName?: string;
  totalTeamMembers: number;
  teamTaskSummary: TaskSummary;
  activeProjects: number;
  overdueMilestones: number;
  teamPerformance: EmployeePerformanceSummary[];
  activeProjectsList: TrackerProject[];
  teamOverdueTasks: TaskItem[];
  upcomingMilestones: Milestone[];
  taskCompletionByEmployee: ChartData[];
  tasksByDepartment: ChartData[];
  weeklyTeamProgress: WeeklyProgress[];
}

export interface OrgDashboard {
  totalEmployees: number;
  activeProjects: number;
  totalTasksThisMonth: number;
  completedTasksThisMonth: number;
  organizationTaskCompletionRate: number;
  organizationKPIAchievementRate: number;
  overdueTasks: number;
  overdueProjects: number;
  departmentPerformance: DepartmentPerformance[];
  topPerformers: EmployeePerformanceSummary[];
  atRiskEmployees: EmployeePerformanceSummary[];
  criticalProjects: TrackerProject[];
  tasksByStatus: ChartData[];
  tasksByDepartment: ChartData[];
  monthlyCompletionTrend: MonthlyTrend[];
  kpiAchievementByDepartment: ChartData[];
  weeklyOrgProgress: WeeklyProgress[];
}

export interface EmployeePerformanceSummary {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  designation?: string;
  totalTasks: number;
  completedTasks: number;
  toDoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  onHoldTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  onTimeCompletionRate: number;
  kpiAchievementRate: number;
  goalAchievementRate: number;
  overallScore: number;
  performanceBand: string;
  tasks?: any[];
}

export interface DepartmentPerformance {
  departmentId?: string;
  departmentName: string;
  employeeCount: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  averageKPIAchievement: number;
  overallScore: number;
}

export interface DailyProductivity {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  hoursWorked: number;
}

export interface WeeklyProgress {
  week: string;
  weekStart: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export const TASK_STATUS = {
  1: 'Backlog',
  2: 'To Do',
  3: 'In Progress',
  4: 'Code Review',
  5: 'Testing',
  6: 'UAT',
  7: 'Done'
};

export const TASK_PRIORITY = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical'
};

export const TASK_TYPE = {
  1: 'Epic',
  2: 'Story',
  3: 'Task',
  4: 'SubTask',
  5: 'Bug'
};

export const GOAL_STATUS = {
  1: 'Not Started',
  2: 'In Progress',
  3: 'Achieved',
  4: 'Missed',
  5: 'Deferred'
};
