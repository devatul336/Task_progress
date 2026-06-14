import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';
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
import { TaskItem } from '../../shared/models/interfaces';

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
  
  uniqueAssignees: Assignee[] = [];
  selectedAssigneeIds: Set<string> = new Set();

  columns: KanbanColumn[] = [
    { id: 1, label: 'To Do', icon: 'radio_button_unchecked', colorClass: 'col-todo', tasks: [] },
    { id: 2, label: 'In Progress', icon: 'pending', colorClass: 'col-progress', tasks: [] },
    { id: 3, label: 'Under Review', icon: 'rate_review', colorClass: 'col-review', tasks: [] },
    { id: 4, label: 'Completed', icon: 'check_circle', colorClass: 'col-done', tasks: [] },
    { id: 5, label: 'On Hold', icon: 'pause_circle', colorClass: 'col-hold', tasks: [] }
  ];

  constructor(private service: ProgressTrackerService, private authService: AuthService) {}

  canEditTask = false;
  activeMenuId: number | null = null;

  ngOnInit(): void {
    this.canEditTask = this.authService.isAdminOrHR() || this.authService.isManager();
    this.loadTasks();
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
        if (err.status === 401) {
          alert('You are not logged in or your session expired. Please log in first.');
        } else {
          alert('Failed to load tasks. Check the console for errors.');
        }
      }
    });
  }

  distributeTasks(tasks: TaskItem[]): void {
    this.columns.forEach(col => col.tasks = []);
    tasks.forEach(task => {
      const col = this.columns.find(c => c.id === task.status);
      if (col) col.tasks.push(task);
    });
  }

  extractAssignees(tasks: TaskItem[]): void {
    const map = new Map<string, Assignee>();
    tasks.forEach(t => {
      if (t.assignedToEmployeeId && t.assignedToEmployeeName) {
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
    if (!this.searchText && !this.filterPriority && !this.filterEmployee && this.selectedAssigneeIds.size === 0) {
      return this.columns.map(col => ({ ...col, totalCount: col.tasks.length }));
    }
    return this.columns.map(col => ({
      ...col,
      totalCount: col.tasks.length,
      tasks: col.tasks.filter(t =>
        (!this.searchText || t.title.toLowerCase().includes(this.searchText.toLowerCase())) &&
        (!this.filterPriority || String(t.priority) === this.filterPriority) &&
        (!this.filterEmployee || t.assignedToEmployeeId.includes(this.filterEmployee)) &&
        (this.selectedAssigneeIds.size === 0 || this.selectedAssigneeIds.has(t.assignedToEmployeeId))
      )
    }));
  }

  moveTask(task: TaskItem, newStatus: number): void {
    const oldStatus = task.status;
    const updateDto = {
      ...task,
      taskItemId: task.taskItemId,
      status: newStatus,
      completionPercentage: newStatus === 4 ? 100 : task.completionPercentage,
      completedDate: newStatus === 4 ? new Date().toISOString() : undefined,
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
      1: '#e5493a', // Bug (Red)
      2: '#6554c0', // Epic (Purple)
      3: '#36b37e', // Story (Green)
      4: '#4c9aff', // Sub Task (Light Blue)
      5: '#4c9aff'  // Task (Blue)
    };
    return map[type] || '#4c9aff';
  }

  getTaskTypeIcon(type: number): string {
    const map: Record<number, string> = {
      1: 'bug_report',
      2: 'flash_on',
      3: 'bookmark',
      4: 'subdirectory_arrow_right',
      5: 'check_box'
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
    return task.status !== 4 && task.status !== 6 && new Date(task.dueDate) < new Date();
  }

  logClick(event: any, task: any) {
    console.log('Menu button clicked for task:', task.title);
    console.log('Event:', event);
  }
}
