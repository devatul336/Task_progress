import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { TaskStatusService } from '../../shared/task-status.service';
import { TaskItem, TaskStatusMaster } from '../../shared/models/interfaces';

interface KanbanColumn { id: number; label: string; icon: string; colorClass: string; tasks: TaskItem[]; }
interface Assignee { id: string; name: string; initials: string; color: string; }

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatIconModule,
    MatButtonModule, MatChipsModule, MatProgressBarModule, MatBadgeModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatTooltipModule,
    MatMenuModule, MatDialogModule, MatDividerModule
  ],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss']
})
export class TaskBoardComponent implements OnInit {
  allTasks: TaskItem[] = [];
  loading = true;
  searchText = '';
  filterPriority = '';
  filterEmployee = '';
  filterStatusCategory: number | null = null;
  filterIsOverdue = false;
  
  uniqueAssignees: Assignee[] = [];
  selectedAssigneeIds: Set<string> = new Set();

  columns: KanbanColumn[] = [];

  constructor(
    private service: ProgressTrackerService,
    private authService: AuthService,
    private statusService: TaskStatusService,
    private route: ActivatedRoute
  ) {}

  canEditTask = false;
  activeMenuId: number | null = null;

  ngOnInit(): void {
    this.canEditTask = this.authService.isAdminOrHR() || this.authService.isManager();
    this.statusService.ensureLoaded();
    
    this.route.queryParams.subscribe(params => {
      if (params['statusCategory']) {
        this.filterStatusCategory = Number(params['statusCategory']);
      } else {
        this.filterStatusCategory = null;
      }
      
      this.filterIsOverdue = params['isOverdue'] === 'true';

      this.statusService.statuses$.subscribe(statuses => {
        if (statuses.length > 0) {
          this.buildColumns(statuses);
          this.loadTasks();
        }
      });
    });
  }

  buildColumns(statuses: TaskStatusMaster[]) {
    let activeStatuses = statuses.filter(s => s.isActive);
    if (this.filterStatusCategory) {
      activeStatuses = activeStatuses.filter(s => s.category === this.filterStatusCategory);
    }
    
    this.columns = activeStatuses.map(s => ({
      id: s.taskStatusId,
      label: s.name,
      icon: s.category === 5 ? 'check_circle' : (s.category === 2 ? 'pending' : 'radio_button_unchecked'),
      colorClass: s.colorClass,
      tasks: []
    }));
  }

  toggleMenu(event: Event, taskId: number) {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeMenuId === taskId) {
      this.activeMenuId = null;
    } else {
      this.activeMenuId = taskId;
    }
  }

  closeMenu() {
    this.activeMenuId = null;
  }

  loadTasks(): void {
    this.loading = true;
    const isManager = this.authService.isManager();
    const isAdmin = this.authService.isAdminOrHR();
    const employeeId = localStorage.getItem('employeeId') || undefined;
    const departmentId = localStorage.getItem('departmentId') || undefined;
    
    let filters: any = {};
    if (isAdmin) {
      // Admin sees all tasks
    } else if (isManager) {
      // We don't filter by departmentId for managers to ensure we see all team tasks
    } else {
      filters.employeeId = employeeId;
    }

    forkJoin({
      tasks: this.service.getTasks(filters),
      employees: this.service.getEmployees()
    }).subscribe({
      next: ({ tasks, employees }) => {
        // Fix any tasks that have an empty assignedToEmployeeName
        tasks.forEach(t => {
          if (!t.assignedToEmployeeName && t.assignedToEmployeeId) {
            const emp = employees.find((e: any) => e.employeeId === t.assignedToEmployeeId);
            if (emp) {
              t.assignedToEmployeeName = `${emp.firstName} ${emp.lastName}`.trim();
            } else {
              t.assignedToEmployeeName = 'Unknown User';
            }
          }
        });

        this.allTasks = tasks;
        this.distributeTasks(tasks);
        this.extractAssignees(tasks);
        this.loading = false;
      },
      error: (err) => { 
        this.loading = false; 
        console.error('Error fetching tasks:', err);
        this.allTasks = [];
        this.distributeTasks([]);
        this.extractAssignees([]);
      }
    });
  }

  distributeTasks(tasks: TaskItem[]): void {
    this.columns.forEach(col => col.tasks = []);
    tasks.forEach(task => {
      if (task.taskType !== 1) { // Hide Epics from the Kanban board (Epic is 1)
        const col = this.columns.find(c => c.id === task.status);
        if (col) col.tasks.push(task);
      }
    });
  }

  extractAssignees(tasks: TaskItem[]): void {
    const map = new Map<string, Assignee>();
    tasks.forEach(t => {
      // Only extract assignees for tasks that are actually visible on the board (not Epics)
      if (t.taskType !== 1 && t.assignedToEmployeeId && t.assignedToEmployeeName) {
        if (!map.has(t.assignedToEmployeeId)) {
          map.set(t.assignedToEmployeeId, {
            id: t.assignedToEmployeeId,
            name: t.assignedToEmployeeName,
            initials: this.getInitials(t.assignedToEmployeeName),
            color: this.getAvatarColor(t.assignedToEmployeeId)
          });
        }
      }
    });
    this.uniqueAssignees = Array.from(map.values());
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(id: string): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  toggleAssigneeFilter(id: string): void {
    if (this.selectedAssigneeIds.has(id)) {
      this.selectedAssigneeIds.delete(id);
    } else {
      this.selectedAssigneeIds.add(id);
    }
  }

  clearAssigneeFilters(): void {
    this.selectedAssigneeIds.clear();
  }

  get filteredColumns(): any[] {
    if (!this.searchText && !this.filterPriority && !this.filterEmployee && this.selectedAssigneeIds.size === 0 && !this.filterIsOverdue) {
      return this.columns.map(col => ({ ...col, totalCount: col.tasks.length }));
    }
    return this.columns.map(col => ({
      ...col,
      totalCount: col.tasks.length,
      tasks: col.tasks.filter(t =>
        (!this.searchText || t.title.toLowerCase().includes(this.searchText.toLowerCase())) &&
        (!this.filterPriority || String(t.priority) === this.filterPriority) &&
        (!this.filterEmployee || t.assignedToEmployeeId.includes(this.filterEmployee)) &&
        (this.selectedAssigneeIds.size === 0 || this.selectedAssigneeIds.has(t.assignedToEmployeeId)) &&
        (!this.filterIsOverdue || this.isOverdue(t))
      )
    }));
  }

  moveTask(task: TaskItem, newStatus: number): void {
    const oldStatus = task.status;
    const newStatusMaster = this.statusService.getStatuses().find(s => s.taskStatusId === newStatus);
    const isCompleted = newStatusMaster?.category === 5; // Completed category
    
    const updateDto = {
      ...task,
      taskItemId: task.taskItemId,
      status: newStatus,
      completionPercentage: isCompleted ? 100 : task.completionPercentage,
      completedDate: isCompleted ? new Date().toISOString() : undefined,
      statusChangeRemark: `Status changed from ${task.statusName} to ${this.columns.find(c => c.id === newStatus)?.label}`
    };

    this.service.updateTask(updateDto as any).subscribe({
      next: (updated) => {
        const oldCol = this.columns.find(c => c.id === oldStatus);
        const newCol = this.columns.find(c => c.id === newStatus);
        if (oldCol) oldCol.tasks = oldCol.tasks.filter(t => t.taskItemId !== task.taskItemId);
        if (newCol) newCol.tasks.push({ ...task, status: newStatus, statusName: newCol.label });
      }
    });
  }

  getTaskTypeColor(type: number): string {
    const map: Record<number, string> = { 
      1: '#6554c0', // Epic (Purple)
      2: '#36b37e', // Story (Green)
      3: '#4c9aff', // Task (Blue)
      4: '#4c9aff', // Sub Task (Light Blue)
      5: '#e5493a'  // Bug (Red)
    };
    return map[type] || '#4c9aff';
  }

  getTaskTypeIcon(type: number): string {
    const map: Record<number, string> = {
      1: 'flash_on',                 // Epic
      2: 'bookmark',                 // Story
      3: 'check_box',                // Task
      4: 'subdirectory_arrow_right', // Sub Task
      5: 'bug_report'                // Bug
    };
    return map[type] || 'check_box';
  }

  getDaysLeft(dueDate: string): string {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `${diff}d`;
  }

  isOverdue(task: TaskItem): boolean {
    if (!task.dueDate) return false;
    const statusMaster = this.statusService.getStatuses().find(s => s.taskStatusId === task.status);
    const isCompletedOrHold = statusMaster?.category === 5 || statusMaster?.category === 6;
    if (isCompletedOrHold) return false;

    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return due < today;
  }

  logClick(event: any, task: any) {
    console.log('Menu button clicked for task:', task.title);
    console.log('Event:', event);
  }
}
