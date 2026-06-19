import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { EmployeeGoal } from '../../shared/models/interfaces';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { GoalMembersDialogComponent } from '../goal-members-dialog/goal-members-dialog.component';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { forkJoin } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';

interface Assignee { id: string; name: string; initials: string; color: string; }

@Component({
  selector: 'app-goal-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule,
    MatProgressBarModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    DragDropModule, MatTableModule, MatTooltipModule, MatSortModule, MatDividerModule
  ],
  templateUrl: './goal-list.component.html',
  styleUrl: './goal-list.component.scss'
})
export class GoalListComponent implements OnInit {
  goals: any[] = [];
  filteredGoals: any[] = [];
  loading = true;
  canManage = false;

  // Views & Filters
  currentView: 'grid' | 'kanban' | 'table' = 'grid';
  searchText = '';
  statusFilter = 0;
  priorityFilter = 0;

  // Kanban Arrays
  kanbanDraft: any[] = [];
  kanbanNotStarted: any[] = [];
  kanbanInProgress: any[] = [];
  kanbanOnHold: any[] = [];
  kanbanPendingReview: any[] = [];
  kanbanCompleted: any[] = [];
  kanbanRejected: any[] = [];
  kanbanCancelled: any[] = [];

  // Table Config
  displayedColumns: string[] = ['goalName', 'employee', 'category', 'progress', 'status', 'priority', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(private service: ProgressTrackerService, private dialog: MatDialog, private authService: AuthService) { }

  ngOnInit(): void {
    this.canManage = this.authService.isAdminOrHR() || this.authService.isManager();
    this.loadGoals();
  }

  uniqueAssignees: Assignee[] = [];
  selectedAssigneeIds: Set<string> = new Set();

  loadGoals() {
    const employeeId = localStorage.getItem('employeeId') || '2D4C0F4E-6BCB-4F52-B3D4-FD29B9258882';
    this.loading = true;

    let goalsReq = this.canManage ? this.service.getGoals() : this.service.getGoals({ employeeId });

    forkJoin({
      goals: goalsReq,
      employees: this.service.getEmployees()
    }).subscribe({ 
      next: ({ goals, employees }) => { 
        const emps = (employees as any).value ? (employees as any).value : employees;
        goals.forEach(g => {
          if (g.status === 3) {
            g.progressPercentage = 100;
          }
          if (!g.employeeName || g.employeeName === 'Current User' || g.employeeName === 'Unknown User') {
            const emp = emps.find((e: any) => e.employeeId === g.employeeId);
            if (emp) {
              g.employeeName = `${emp.firstName} ${emp.lastName}`.trim();
            } else {
              g.employeeName = 'Unknown User';
            }
          } else if (g.employeeName && g.employeeName.includes('-')) {
            g.employeeName = g.employeeName.split('-').slice(1).join('-').trim();
            g.employeeName = g.employeeName.split(' ').map((n: string) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ');
          }
        });
        this.goals = this.groupGoals(goals); 
        this.extractAssignees(this.goals);
        this.applyFilters();
        this.loading = false; 
      }, 
      error: () => { this.loading = false; } 
    });
  }

  extractAssignees(groupedGoals: any[]): void {
    const map = new Map<string, Assignee>();
    groupedGoals.forEach(g => {
      g.members.forEach((m: any) => {
        if (m.employeeId && !map.has(m.employeeId)) {
          const name = m.employeeName || 'Unknown User';
          let cleanName = name;
          if (name.includes('-')) {
            cleanName = name.split('-').slice(1).join('-').trim();
          }
          const names = cleanName.split(' ').filter((n: string) => n);
          let initials = names[0]?.[0]?.toUpperCase() || 'U';
          if (names.length > 1) {
            initials += names[names.length - 1]?.[0]?.toUpperCase() || '';
          }
          const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'];
          const color = colors[Math.abs(name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % colors.length];
          
          map.set(m.employeeId, { id: m.employeeId, name, initials, color });
        }
      });
    });
    this.uniqueAssignees = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  toggleAssigneeFilter(id: string): void {
    if (this.selectedAssigneeIds.has(id)) {
      this.selectedAssigneeIds.delete(id);
    } else {
      this.selectedAssigneeIds.add(id);
    }
    this.applyFilters();
  }

  getAssigneeColor(id: string): string {
    const assignee = this.uniqueAssignees.find(a => a.id === id);
    return assignee ? assignee.color : '#cbd5e1';
  }

  getAssigneeInitials(id: string): string {
    const assignee = this.uniqueAssignees.find(a => a.id === id);
    return assignee ? assignee.initials : 'U';
  }

  clearAssigneeFilters(): void {
    this.selectedAssigneeIds.clear();
    this.applyFilters();
  }

  groupGoals(goals: EmployeeGoal[]): any[] {
    const grouped: any[] = [];
    const map = new Map<string, any>();

    goals.forEach(goal => {
      const key = goal.title + '_' + (goal.targetDate ? goal.targetDate.toString() : '');
      if (map.has(key)) {
        const group = map.get(key);
        group.members.push({
          employeeName: goal.employeeName,
          employeeId: goal.employeeId,
          employeeGoalId: goal.employeeGoalId,
          progressPercentage: goal.progressPercentage,
          status: goal.status,
          statusName: goal.statusName
        });
        group.progressPercentage = Math.round(group.members.reduce((sum: number, m: any) => sum + m.progressPercentage, 0) / group.members.length);
      } else {
        const newGroup = {
          ...goal,
          isGrouped: true,
          members: [{
            employeeName: goal.employeeName,
            employeeId: goal.employeeId,
            employeeGoalId: goal.employeeGoalId,
            progressPercentage: goal.progressPercentage,
            status: goal.status,
            statusName: goal.statusName
          }]
        };
        map.set(key, newGroup);
        grouped.push(newGroup);
      }
    });
    return grouped;
  }

  getBulkIds(goal: any): string {
    return goal.members.map((m: any) => m.employeeGoalId).join(',');
  }

  viewMembers(goal: any) {
    this.dialog.open(GoalMembersDialogComponent, {
      width: '500px',
      data: {
        goalTitle: goal.title,
        members: goal.members
      }
    });
  }

  setView(view: 'grid' | 'kanban' | 'table') {
    this.currentView = view;
  }

  // --- Filtering & Kanban Data ---
  applyFilters() {
    let temp = this.goals;

    if (this.searchText.trim()) {
      const s = this.searchText.toLowerCase();
      temp = temp.filter(g => g.title.toLowerCase().includes(s) || g.category.toLowerCase().includes(s));
    }

    if (Number(this.statusFilter) !== 0) {
      temp = temp.filter(g => g.status === Number(this.statusFilter));
    }

    if (Number(this.priorityFilter) !== 0) {
      temp = temp.filter(g => g.priority === Number(this.priorityFilter));
    }

    if (this.selectedAssigneeIds.size > 0) {
      temp = temp.filter(g => g.members.some((m: any) => this.selectedAssigneeIds.has(m.employeeId)));
    }

    this.filteredGoals = temp;
    this.dataSource.data = temp;

    // Custom sorting logic since the columns have different property names than the object keys
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'goalName': return item.title.toLowerCase();
        case 'employee': return item.members.length === 1 ? (item.members[0].employeeName || '') : '';
        case 'category': return item.category;
        case 'progress': return item.progressPercentage;
        case 'status': return item.statusName;
        case 'priority': return item.priority;
        case 'dueDate': return new Date(item.targetDate).getTime();
        default: return item[property];
      }
    };

    this.populateKanban();
  }

  populateKanban() {
    this.kanbanDraft = [];
    this.kanbanNotStarted = this.filteredGoals.filter(g => g.status === 1);
    this.kanbanInProgress = this.filteredGoals.filter(g => g.status === 2);
    this.kanbanCompleted = this.filteredGoals.filter(g => g.status === 3);
    this.kanbanRejected = this.filteredGoals.filter(g => g.status === 4);
    this.kanbanOnHold = this.filteredGoals.filter(g => g.status === 5);
    this.kanbanPendingReview = [];
    this.kanbanCancelled = [];
  }

  drop(event: CdkDragDrop<any[]>, targetStatus: number) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Update the status on the backend
      this.updateGoalStatus(item, targetStatus);
    }
  }

  updateGoalStatus(goal: any, newStatus: number) {
    // If it's a grouped goal, we bulk update the status for all members!
    const bulkIds = goal.members.map((m: any) => m.employeeGoalId);
    
    // Create an array of update observables
    const requests = bulkIds.map((id: number) => {
      // Create partial update payload (the backend might need full payload, so we must fetch first)
      return this.service.updateGoal(id, { ...goal, status: newStatus, employeeGoalId: id, employeeId: goal.members.find((m:any) => m.employeeGoalId === id).employeeId });
    });

    // Fire and forget (or handle loaders ideally)
    forkJoin(requests).subscribe({
      next: () => {
        // Updated locally so it stays in the right column
        goal.status = newStatus;
        // Optionally map status to statusName
        const statusNames: {[key:number]:string} = { 1: 'Not Started', 2: 'In Progress', 3: 'Achieved', 4: 'Missed', 5: 'Deferred' };
        goal.statusName = statusNames[newStatus] || goal.statusName;
        // Refresh full state
        this.loadGoals(); 
      },
      error: (err) => {
        console.error('Failed to drag and drop update status', err);
        this.loadGoals(); // Revert UI
      }
    });
  }

  // --- Computed KPIs ---
  get totalGoals() { return this.goals.length; }
  get inProgressCount() { return this.goals.filter(g => g.status === 2).length; }
  get pendingReviewCount() { return this.goals.filter(g => g.status === 5).length; }
  get completedCount() { return this.goals.filter(g => g.status === 3).length; }
  get overdueCount() { return this.goals.filter(g => g.isOverdue).length; }

  // --- UI Helpers ---
  getPriorityClass(priority: number): string {
    switch(priority) {
      case 4: return 'critical';
      case 3: return 'high';
      case 2: return 'medium';
      case 1: return 'low';
      default: return 'medium';
    }
  }

  getPriorityLabel(priority: number): string {
    switch(priority) {
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Medium';
    }
  }

  getStatusClass(status: number): string {
    switch(status) {
      case 2: return 'in-progress';
      case 3: return 'completed';
      default: return '';
    }
  }

  getStatusColor(status: number): string {
    switch(status) {
      case 3: return '#16a34a'; // Green
      case 2: return '#2563eb'; // Blue
      case 5: return '#d97706'; // Orange
      case 1: return '#64748b'; // Gray
      default: return '#1e293b';
    }
  }
}
