import { Component, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TaskItem } from '../../shared/models/interfaces';

@Component({
  selector: 'app-epic-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatTableModule, MatProgressBarModule, MatChipsModule, FormsModule
  ],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Epics</h1>
    <div style="display: flex; gap: 12px;">
      <button mat-raised-button color="primary" class="jira-btn-primary" routerLink="/tasks/create" [queryParams]="{ taskType: 1 }">Create Epic</button>
    </div>
  </div>

  <div class="filters-row">
    <div class="search-box">
      <input type="text" placeholder="Search epics" [(ngModel)]="searchQuery" (input)="filterEpics()">
      <mat-icon>search</mat-icon>
    </div>
  </div>

  <div class="table-container" *ngIf="!loading">
    <table mat-table [dataSource]="filteredEpics" class="jira-table" multiTemplateDataRows>
      
      <!-- Title Column -->
      <ng-container matColumnDef="title">
        <th mat-header-cell *matHeaderCellDef> Title </th>
        <td mat-cell *matCellDef="let epic">
          <div class="epic-title-cell">
            <mat-icon style="color: #6554c0; vertical-align: middle; margin-right: 8px;">flash_on</mat-icon>
            <span class="epic-title-text">{{ epic.title }}</span>
          </div>
        </td>
      </ng-container>

      <!-- Status Column -->
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef> Status </th>
        <td mat-cell *matCellDef="let epic">
          <mat-chip [ngClass]="getStatusClass(epic.status)">
            {{ getStatusName(epic.status) }}
          </mat-chip>
        </td>
      </ng-container>

      <!-- Stories Column -->
      <ng-container matColumnDef="stories">
        <th mat-header-cell *matHeaderCellDef> Stories </th>
        <td mat-cell *matCellDef="let epic">
          {{ epic.storyCount || 0 }}
        </td>
      </ng-container>

      <!-- Tasks Column -->
      <ng-container matColumnDef="tasks">
        <th mat-header-cell *matHeaderCellDef> Tasks </th>
        <td mat-cell *matCellDef="let epic">
          {{ epic.taskCount || 0 }}
        </td>
      </ng-container>

      <!-- Progress Column -->
      <ng-container matColumnDef="progress">
        <th mat-header-cell *matHeaderCellDef style="width: 150px;"> Progress </th>
        <td mat-cell *matCellDef="let epic">
          <div style="display: flex; align-items: center; gap: 8px;">
            <mat-progress-bar mode="determinate" [value]="epic.progress" style="flex: 1;"></mat-progress-bar>
            <span style="font-size: 12px; color: #626F86; width: 35px; text-align: right;">{{ epic.progress | number:'1.0-0' }}%</span>
          </div>
        </td>
      </ng-container>

      <!-- Priority Column -->
      <ng-container matColumnDef="priority">
        <th mat-header-cell *matHeaderCellDef> Priority </th>
        <td mat-cell *matCellDef="let epic">
          <mat-icon [style.color]="getPriorityColor(epic.priority)" style="vertical-align: middle; font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">{{ getPriorityIcon(epic.priority) }}</mat-icon>
          {{ getPriorityName(epic.priority) }}
        </td>
      </ng-container>

      <!-- Assignee Column -->
      <ng-container matColumnDef="assignee">
        <th mat-header-cell *matHeaderCellDef> Assignee </th>
        <td mat-cell *matCellDef="let epic">
          <div class="lead-cell" *ngIf="epic.assignedToEmployeeName">
            <div class="lead-avatar">{{ getInitials(epic.assignedToEmployeeName) }}</div>
            <span>{{ epic.assignedToEmployeeName }}</span>
          </div>
          <span *ngIf="!epic.assignedToEmployeeName">Unassigned</span>
        </td>
      </ng-container>

      <!-- Due Date Column -->
      <ng-container matColumnDef="dueDate">
        <th mat-header-cell *matHeaderCellDef> Due Date </th>
        <td mat-cell *matCellDef="let epic">
          {{ epic.dueDate | date:'mediumDate' }}
        </td>
      </ng-container>

      <!-- Actions Column -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef style="width: 80px; text-align: right;"></th>
        <td mat-cell *matCellDef="let epic" style="text-align: right;">
          <button mat-button color="primary" [routerLink]="['/tasks', epic.taskItemId]" [queryParams]="{mode: 'edit'}">Edit</button>
        </td>
      </ng-container>

      <!-- Expanded Content Column -->
      <ng-container matColumnDef="expandedDetail">
        <td mat-cell *matCellDef="let epic" [attr.colspan]="displayedColumns.length" style="padding: 0; border-bottom: none;">
          <div class="epic-detail-wrapper" [@detailExpand]="epic == expandedElement ? 'expanded' : 'collapsed'">
            <div class="epic-detail-inner">
              <div *ngIf="epic.children?.length === 0" class="empty-children">No stories or tasks mapped to this Epic yet.</div>
              <div *ngIf="epic.children?.length > 0" class="children-list">
                <h4 style="margin: 0 0 12px 0; color: #172B4D; font-size: 14px;">Epic Items:</h4>
                <div *ngFor="let child of epic.children" class="child-item">
                  <mat-icon [style.color]="child.taskType === 2 ? '#36B37E' : '#4C9AFF'" style="font-size: 18px; width: 18px; height: 18px;">
                    {{ child.taskType === 2 ? 'bookmark' : 'check_box' }}
                  </mat-icon>
                  <a [routerLink]="['/tasks', child.taskItemId]" [queryParams]="{mode:'view'}" class="child-link" (click)="$event.stopPropagation()">{{ child.title }}</a>
                  <span class="child-status-badge" [ngClass]="getStatusClass(child.status)">{{ getStatusName(child.status) }}</span>
                  <div class="child-assignee">{{ child.assignedToEmployeeName || 'Unassigned' }}</div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let epic; columns: displayedColumns;"
          class="jira-row epic-element-row"
          [class.epic-expanded-row]="expandedElement === epic"
          (click)="expandedElement = expandedElement === epic ? null : epic">
      </tr>
      <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="epic-detail-row"></tr>
      
      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell empty-cell" colspan="9">
          <div class="empty-state">No epics found.</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="loading-state" *ngIf="loading" style="padding: 40px; text-align: center;">
    <mat-progress-bar mode="indeterminate" style="max-width: 400px; margin: 0 auto;"></mat-progress-bar>
  </div>
</div>
  `,
  styles: [`
.page-container { padding: 32px 40px; background: #FFFFFF; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 500; color: #172B4D; margin: 0; line-height: 28px; }
.jira-btn-primary { background-color: #0052CC !important; color: white !important; font-weight: 500; box-shadow: none !important; border-radius: 3px; height: 32px; padding: 0 12px; font-size: 14px; line-height: 32px; }
.jira-btn-primary:hover { background-color: #0065FF !important; }

.filters-row { margin-bottom: 16px; display: flex; gap: 16px; }
.search-box { position: relative; width: 220px; }
.search-box input { width: 100%; height: 36px; border: 2px solid #DFE1E6; border-radius: 3px; padding: 0 8px 0 32px; font-size: 14px; color: #172B4D; transition: background-color 0.2s, border-color 0.2s; background: #FAFBFC; box-sizing: border-box; }
.search-box input:hover { background: #EBECF0; border-color: #DFE1E6; }
.search-box input:focus { background: #FFFFFF; border-color: #4C9AFF; outline: none; }
.search-box mat-icon { position: absolute; left: 8px; top: 8px; font-size: 20px; color: #626F86; pointer-events: none; }

.table-container { border: none; overflow-x: auto; }
.jira-table { width: 100%; box-shadow: none; border-collapse: separate; border-spacing: 0; }
.jira-table th.mat-header-cell { color: #626F86; font-size: 12px; font-weight: 600; text-transform: none; border-bottom: 2px solid #DFE1E6; padding: 12px 16px; background: white; }
.jira-table td.mat-cell { color: #172B4D; font-size: 14px; border-bottom: 1px solid #DFE1E6; padding: 12px 16px; transition: background-color 0.1s; }
.jira-row:hover td { background-color: #F4F5F7; }

.epic-title-cell { display: flex; align-items: center; cursor: pointer; text-decoration: none; }
.epic-title-text { color: #0052CC; font-weight: 500; font-size: 14px; }
.epic-title-cell:hover .epic-title-text { text-decoration: underline; color: #0065FF; }

.lead-cell { display: flex; align-items: center; gap: 8px; }
.lead-avatar { width: 24px; height: 24px; border-radius: 50%; background: #0052CC; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }

.empty-cell { text-align: center; padding: 48px !important; border-bottom: none !important; }
.empty-state { color: #626F86; font-size: 14px; }

.status-todo { background-color: #DFE1E6; color: #42526E; font-weight: 600; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }
.status-progress { background-color: #DEEBFF; color: #0052CC; font-weight: 600; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }
.status-done { background-color: #E3FCEF; color: #006644; font-weight: 600; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }

/* Expandable Rows Styles */
.epic-element-row { cursor: pointer; }
.epic-element-row:hover td { background-color: #F4F5F7; }
.epic-expanded-row td { border-bottom-color: transparent !important; }
.epic-detail-row { height: 0; }
.epic-detail-wrapper { overflow: hidden; display: flex; flex-direction: column; }
.epic-detail-inner { padding: 16px 24px; background: #FAFBFC; border-bottom: 1px solid #DFE1E6; box-shadow: inset 0 3px 6px -6px rgba(0,0,0,0.1); }
.empty-children { color: #626F86; font-size: 13px; font-style: italic; }
.child-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: white; border: 1px solid #DFE1E6; border-radius: 3px; margin-bottom: 8px; transition: box-shadow 0.2s; }
.child-item:hover { box-shadow: 0 1px 3px rgba(9, 30, 66, 0.13); }
.child-item:last-child { margin-bottom: 0; }
.child-link { flex: 1; color: #0052CC; text-decoration: none; font-size: 14px; font-weight: 500; }
.child-link:hover { text-decoration: underline; color: #0065FF; }
.child-status-badge { display: inline-block; padding: 2px 6px; font-size: 10px; }
.child-assignee { width: 150px; font-size: 13px; color: #42526E; text-align: right; }
  `],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class EpicListComponent implements OnInit {
  epics: any[] = [];
  filteredEpics: any[] = [];
  loading = true;
  searchQuery = '';
  expandedElement: any | null = null;
  
  displayedColumns: string[] = ['title', 'status', 'priority', 'stories', 'tasks', 'progress', 'assignee', 'dueDate', 'actions'];

  constructor(private service: ProgressTrackerService) {}

  ngOnInit(): void {
    this.loadEpics();
  }

  loadEpics(): void {
    this.loading = true;
    this.service.getTasks({}).subscribe({
      next: (tasks) => {
        const allEpics = tasks.filter(t => t.taskType === 1);
        
        this.epics = allEpics.map(epic => {
          const children = tasks.filter(t => t.parentTaskId === epic.taskItemId);
          const stories = children.filter(t => t.taskType === 2);
          const standardTasks = children.filter(t => t.taskType === 3);
          
          const storyCount = stories.length;
          const taskCount = standardTasks.length;
          
          const totalChildren = children.length;
          const completedChildren = children.filter(t => t.status === 4 || t.status === 9).length; // Check both frontend mapping 4 (Completed) or backend 9
          const progress = totalChildren === 0 ? 0 : Math.round((completedChildren / totalChildren) * 100);

          return {
            ...epic,
            storyCount,
            taskCount,
            progress,
            children
          };
        });
        
        this.filterEpics();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.epics = [];
        this.filterEpics();
      }
    });
  }

  filterEpics(): void {
    if (!this.searchQuery) {
      this.filteredEpics = [...this.epics];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredEpics = this.epics.filter(e => 
        e.title.toLowerCase().includes(q) ||
        (e.assignedToEmployeeName && e.assignedToEmployeeName.toLowerCase().includes(q))
      );
    }
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStatusName(status: number): string {
    const map: any = { 1: 'To Do', 2: 'In Progress', 3: 'Under Review', 4: 'Completed', 5: 'On Hold' };
    return map[status] || 'Unknown';
  }

  getStatusClass(status: number): string {
    if (status === 1) return 'status-todo';
    if (status === 4) return 'status-done';
    return 'status-progress';
  }

  getPriorityName(priority: number): string {
    const map: any = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return map[priority] || 'Medium';
  }

  getPriorityIcon(priority: number): string {
    if (priority === 4) return 'keyboard_double_arrow_up';
    if (priority === 3) return 'keyboard_arrow_up';
    if (priority === 1) return 'keyboard_arrow_down';
    return 'drag_handle';
  }

  getPriorityColor(priority: number): string {
    if (priority === 4) return '#DE350B';
    if (priority === 3) return '#FF991F';
    if (priority === 1) return '#006644';
    return '#FF991F';
  }
}
