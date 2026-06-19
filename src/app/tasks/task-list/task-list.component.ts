import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TaskStatusService } from '../../shared/task-status.service';
import { AuthService } from '../../shared/auth.service';
import { TaskItem, TaskStatusMaster } from '../../shared/models/interfaces';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, MatTooltipModule, FormsModule
  ],
  providers: [DatePipe],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  loading = true;
  tasks: TaskItem[] = [];
  filteredTasks: TaskItem[] = [];
  statuses: TaskStatusMaster[] = [];
  
  activeFilterId: string = 'all_work_items';
  searchQuery: string = '';
  currentEmployeeId: string | null = null;
  
  displayedColumns: string[] = ['type', 'work', 'assignee', 'reporter', 'priority', 'status', 'resolution', 'created'];

  constructor(
    private service: ProgressTrackerService,
    private statusService: TaskStatusService,
    private datePipe: DatePipe,
    private authService: AuthService
  ) {
    this.currentEmployeeId = this.authService.getUserInfo().id;
  }

  ngOnInit(): void {
    this.statusService.ensureLoaded();
    this.statusService.statuses$.subscribe(statuses => {
      this.statuses = statuses;
      this.loadTasks();
    });
  }

  loadTasks() {
    this.loading = true;
    this.service.getTasks({}).subscribe({
      next: (tasks) => {
        this.service.getEmployees().subscribe(employees => {
          tasks.forEach(t => {
            if (!t.assignedToEmployeeName && t.assignedToEmployeeId) {
              const emp = employees.find((e: any) => e.employeeId === t.assignedToEmployeeId);
              if (emp) t.assignedToEmployeeName = `${emp.firstName} ${emp.lastName}`.trim();
              else t.assignedToEmployeeName = 'Unassigned';
            }
          });
          this.tasks = tasks.filter(t => t.taskType !== 1); // Exclude Epics
          this.applyFilter(); // Apply initial filter
          this.loading = false;
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setFilter(filterId: string) {
    this.activeFilterId = filterId;
    this.applyFilter();
  }

  applyFilter() {
    let filtered = [...this.tasks];

    // Apply Sidebar preset filter
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    switch (this.activeFilterId) {
      case 'reported_by_me':
        // Assuming system sets 'Reported by me' based on some logic, for now simulate with current user assigned or logic.
        // We don't have a reporterId in TaskItem currently, so fallback to assigned or mock
        // If we want it to be accurate, we need reporterId. We'll leave it empty or return all for now to simulate.
        break;
      case 'all_work_items':
        // No filter
        break;
      case 'open_work_items':
        filtered = filtered.filter(t => t.status !== 4);
        break;
      case 'done_work_items':
        filtered = filtered.filter(t => t.status === 4);
        break;
      case 'created_recently':
        filtered = filtered.filter(t => new Date(t.createdDate) >= sevenDaysAgo);
        break;
    }

    // Apply Search
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.assignedToEmployeeName && t.assignedToEmployeeName.toLowerCase().includes(q))
      );
    }

    this.filteredTasks = filtered;
  }

  getStatusName(statusId: number): string {
    const s = this.statuses.find(x => x.taskStatusId === statusId);
    return s ? s.name : 'Unknown';
  }

  getStatusColor(statusId: number): string {
    const s = this.statuses.find(x => x.taskStatusId === statusId);
    return s ? s.colorClass : '#888';
  }

  getInitials(name: string): string {
    if (!name || name === 'Unassigned') return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getTaskTypeColor(typeId: number) {
    if (typeId === 1) return '#904ee2'; // Epic (purple)
    if (typeId === 2) return '#4bade8'; // Task (blue)
    if (typeId === 3) return '#e5493a'; // Bug (red)
    return '#888';
  }
}
