import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TaskItem } from '../../shared/models/interfaces';

interface KanbanColumn { id: number; label: string; icon: string; colorClass: string; tasks: TaskItem[]; }

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatIconModule,
    MatButtonModule, MatChipsModule, MatProgressBarModule, MatBadgeModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatTooltipModule,
    MatMenuModule, MatDialogModule
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

  columns: KanbanColumn[] = [
    { id: 1, label: 'To Do', icon: 'radio_button_unchecked', colorClass: 'col-todo', tasks: [] },
    { id: 2, label: 'In Progress', icon: 'pending', colorClass: 'col-progress', tasks: [] },
    { id: 3, label: 'Under Review', icon: 'rate_review', colorClass: 'col-review', tasks: [] },
    { id: 4, label: 'Completed', icon: 'check_circle', colorClass: 'col-done', tasks: [] },
    { id: 5, label: 'On Hold', icon: 'pause_circle', colorClass: 'col-hold', tasks: [] }
  ];

  constructor(private service: ProgressTrackerService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    const employeeId = localStorage.getItem('employeeId') || undefined;
    this.service.getTasks({ employeeId }).subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.distributeTasks(tasks);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  distributeTasks(tasks: TaskItem[]): void {
    this.columns.forEach(col => col.tasks = []);
    tasks.forEach(task => {
      const col = this.columns.find(c => c.id === task.status);
      if (col) col.tasks.push(task);
    });
  }

  get filteredColumns(): KanbanColumn[] {
    if (!this.searchText && !this.filterPriority && !this.filterEmployee) return this.columns;
    return this.columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t =>
        (!this.searchText || t.title.toLowerCase().includes(this.searchText.toLowerCase())) &&
        (!this.filterPriority || String(t.priority) === this.filterPriority) &&
        (!this.filterEmployee || t.assignedToEmployeeId.includes(this.filterEmployee))
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

  getPriorityClass(priority: number): string {
    const map: Record<number, string> = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return `priority-${map[priority] || 'medium'}`;
  }

  getPriorityLabel(priority: number): string {
    const map: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return map[priority] || 'Medium';
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
}
