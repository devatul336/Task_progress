import { Component, OnInit, Directive, ElementRef } from '@angular/core';
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
import { TaskStatusService } from '../../shared/task-status.service';
import { TaskItem } from '../../shared/models/interfaces';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements OnInit {
  constructor(private el: ElementRef) {}
  ngOnInit() {
    setTimeout(() => this.el.nativeElement.focus(), 0);
  }
}

@Component({
  selector: 'app-epic-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatTableModule, MatProgressBarModule, MatChipsModule, FormsModule, AutoFocusDirective
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
          <div class="epic-title-cell" (dblclick)="startEditTitle(epic, $event)">
            <mat-icon style="color: #6554c0; vertical-align: middle; margin-right: 8px;">flash_on</mat-icon>
            <span class="epic-title-text" *ngIf="editingEpicId !== epic.taskItemId">{{ epic.title }}</span>
            <input *ngIf="editingEpicId === epic.taskItemId" type="text" [(ngModel)]="epic.title" 
                   (blur)="saveEpicTitle(epic)" (keyup.enter)="saveEpicTitle(epic)" 
                   (click)="$event.stopPropagation()" appAutoFocus
                   style="width: 200px; padding: 4px 8px; border: 2px solid #4C9AFF; border-radius: 3px; outline: none; font-size: 14px; font-family: inherit;">
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
        <th mat-header-cell *matHeaderCellDef style="text-align: right;"> Quick Actions </th>
        <td mat-cell *matCellDef="let epic" style="text-align: right;">
          <div style="display: flex; justify-content: flex-end; gap: 8px; align-items: center;">
            <button mat-stroked-button color="primary" class="quick-action-btn"
                    *ngFor="let opt of getNextStatusOptions(epic.status)"
                    (click)="changeEpicStatus(epic, opt.id, $event)">
              {{ opt.label }}
            </button>
            <button mat-icon-button color="primary" [routerLink]="['/tasks', epic.taskItemId]" [queryParams]="{mode: 'edit'}" (click)="$event.stopPropagation()" matTooltip="Edit Epic">
              <mat-icon>edit</mat-icon>
            </button>
          </div>
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
                <div *ngFor="let child of epic.children" class="child-item" [style.margin-left.px]="child.level * 32">
                  <mat-icon [style.color]="getTaskTypeColor(child.taskType)" style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">
                    {{ getTaskTypeIcon(child.taskType) }}
                  </mat-icon>
                  <span style="font-size: 11px; color: #626F86; font-weight: 500; min-width: 65px; display: inline-block;">{{ getTaskTypeName(child.taskType) }}</span>
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
.page-container { padding: 32px 40px; background: var(--bg-color, #FFFFFF); color: var(--text-color, #172B4D); min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; transition: background-color 0.3s, color 0.3s; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 500; color: var(--text-color, #172B4D); margin: 0; line-height: 28px; }
.jira-btn-primary { background-color: #0052CC !important; color: white !important; font-weight: 500; box-shadow: none !important; border-radius: 3px; height: 32px; padding: 0 12px; font-size: 14px; line-height: 32px; }
.jira-btn-primary:hover { background-color: #0065FF !important; }

.filters-row { margin-bottom: 16px; display: flex; gap: 16px; }
.search-box { position: relative; width: 220px; }
.search-box input { width: 100%; height: 36px; border: 2px solid var(--border-color, #DFE1E6); border-radius: 3px; padding: 0 8px 0 32px; font-size: 14px; color: var(--text-color, #172B4D); transition: background-color 0.2s, border-color 0.2s; background: var(--hover-color, #FAFBFC); box-sizing: border-box; }
.search-box input:hover { background: var(--border-color, #EBECF0); border-color: var(--border-color, #DFE1E6); }
.search-box input:focus { background: var(--surface-color, #FFFFFF); border-color: #4C9AFF; outline: none; }
.search-box mat-icon { position: absolute; left: 8px; top: 8px; font-size: 20px; color: #626F86; pointer-events: none; }

.table-container { border: 1px solid var(--border-color, #DFE1E6); border-radius: 4px; overflow-x: auto; background: var(--surface-color, white); }
.jira-table { width: 100%; box-shadow: none; border-collapse: separate; border-spacing: 0; background: transparent; }
.jira-table th.mat-header-cell { color: #626F86; font-size: 12px; font-weight: 600; text-transform: none; border-bottom: 2px solid var(--border-color, #DFE1E6); padding: 12px 16px; background: var(--hover-color, #FAFBFC); }
.jira-table td.mat-cell { color: var(--text-color, #172B4D); font-size: 14px; border-bottom: 1px solid var(--border-color, #DFE1E6); padding: 12px 16px; transition: background-color 0.1s; }
.jira-row:hover td { background-color: var(--hover-color, #F4F5F7); }

.epic-title-cell { display: flex; align-items: center; cursor: pointer; text-decoration: none; }
.epic-title-text { color: #0052CC; font-weight: 500; font-size: 14px; }
.epic-title-cell:hover .epic-title-text { text-decoration: underline; color: #0065FF; }

.lead-cell { display: flex; align-items: center; gap: 8px; }
.lead-avatar { width: 24px; height: 24px; border-radius: 50%; background: #0052CC; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }

.empty-cell { text-align: center; padding: 48px !important; border-bottom: none !important; }
.empty-state { color: #626F86; font-size: 14px; }

.status-todo { background-color: #DFE1E6; color: #42526E; font-weight: 700; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }
.status-progress { background-color: #0052CC; color: #FFFFFF; font-weight: 700; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }
.status-done { background-color: #00875A; color: #FFFFFF; font-weight: 700; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }
.status-hold { background-color: #FF991F; color: #172B4D; font-weight: 700; font-size: 11px; text-transform: uppercase; border-radius: 3px; padding: 2px 4px; min-height: 20px; }

/* Expandable Rows Styles */
.epic-element-row { cursor: pointer; }
.epic-element-row:hover td { background-color: var(--hover-color, #F4F5F7); }
.epic-expanded-row td { border-bottom-color: transparent !important; }
.epic-detail-row { height: 0; }
.epic-detail-wrapper { overflow: hidden; display: flex; flex-direction: column; }
.epic-detail-inner { padding: 16px 24px; background: var(--hover-color, #FAFBFC); border-bottom: 1px solid var(--border-color, #DFE1E6); box-shadow: inset 0 3px 6px -6px rgba(0,0,0,0.1); }
.empty-children { color: #626F86; font-size: 13px; font-style: italic; }
.child-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--surface-color, white); border: 1px solid var(--border-color, #DFE1E6); border-radius: 3px; margin-bottom: 8px; transition: box-shadow 0.2s; }
.child-item:hover { box-shadow: 0 1px 3px rgba(9, 30, 66, 0.13); }
.child-item:last-child { margin-bottom: 0; }
.child-link { flex: 1; color: #0052CC; text-decoration: none; font-size: 14px; font-weight: 500; }
.child-link:hover { text-decoration: underline; color: #0065FF; }
.child-status-badge { display: inline-block; padding: 2px 6px; font-size: 10px; }
.child-assignee { width: 150px; font-size: 13px; color: var(--text-color, #42526E); text-align: right; }

.quick-action-btn { height: 28px; line-height: 26px; font-size: 12px; padding: 0 8px; border-radius: 4px; }
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
  editingEpicId: number | null = null;
  
  displayedColumns: string[] = ['title', 'status', 'priority', 'stories', 'tasks', 'progress', 'assignee', 'dueDate', 'actions'];

  constructor(
    private service: ProgressTrackerService,
    private statusService: TaskStatusService
  ) {}

  ngOnInit(): void {
    this.statusService.ensureLoaded();
    this.loadEpics();
  }

  loadEpics(): void {
    this.loading = true;
    this.service.getTasks({}).subscribe({
      next: (tasks) => {
        const allEpics = tasks.filter(t => t.taskType === 1);
        
        this.epics = allEpics.map(epic => {
          const getDescendants = (parentId: number, level: number): any[] => {
            const directChildren = tasks.filter(t => t.parentTaskId === parentId);
            let descendants: any[] = [];
            for (const child of directChildren) {
              descendants.push({ ...child, level });
              descendants.push(...getDescendants(child.taskItemId, level + 1));
            }
            return descendants;
          };

          const children = getDescendants(epic.taskItemId, 0);
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
    return this.statusService.getStatusName(status) || 'Unknown';
  }

  getStatusClass(status: number): string {
    if (status === 1) return 'status-todo';
    if (status === 4) return 'status-done';
    if (status === 5) return 'status-hold';
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

  getTaskTypeName(type: number): string {
    const map: Record<number, string> = {
      1: 'Epic',
      2: 'Story',
      3: 'Task',
      4: 'Sub-Task',
      5: 'Bug'
    };
    return map[type] || 'Task';
  }

  getNextStatusOptions(status: number): {id: number, label: string}[] {
    switch (status) {
      case 1: return [{id: 2, label: 'Start Progress'}, {id: 5, label: 'Hold'}];
      case 2: return [{id: 3, label: 'Review'}, {id: 5, label: 'Hold'}];
      case 3: return [{id: 4, label: 'Approve'}, {id: 5, label: 'Hold'}];
      case 5: return [{id: 1, label: 'To Do'}, {id: 2, label: 'Resume'}];
      case 4: return [{id: 2, label: 'Reopen'}];
      default: return [];
    }
  }

  changeEpicStatus(epic: any, newStatus: number, event: Event): void {
    event.stopPropagation();
    
    const updateDto = {
      ...epic,
      status: newStatus,
      statusChangeRemark: `Status changed via quick action`
    };

    this.service.updateTask(updateDto).subscribe({
      next: () => {
        epic.status = newStatus;
      },
      error: (err) => {
        console.error('Failed to change status:', err);
      }
    });
  }

  startEditTitle(epic: any, event: Event) {
    event.stopPropagation();
    this.editingEpicId = epic.taskItemId;
  }

  saveEpicTitle(epic: any) {
    if (this.editingEpicId === null) return;
    this.editingEpicId = null;
    
    this.service.updateTask(epic).subscribe({
      next: () => {
        // Title updated successfully
      },
      error: (err) => {
        console.error('Failed to update title:', err);
      }
    });
  }
}
