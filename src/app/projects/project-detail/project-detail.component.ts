import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TrackerProject, Milestone, TaskItem } from '../../shared/models/interfaces';
import { MilestoneDialogComponent } from '../milestone-dialog/milestone-dialog.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressBarModule, MatTabsModule, MatTableModule, MatDialogModule, MatTooltipModule],
  template: `
<div class="page-container" *ngIf="project">
  <div class="proj-hero">
    <div>
      <h1>{{ project.name }}</h1>
      <p>{{ project['_cleanDescription'] || project.description }}</p>
      <div *ngIf="project['_attachmentUrl']" style="margin-bottom: 12px; display: flex; gap: 12px;">
        <a [href]="project['_attachmentUrl']" target="_blank" mat-stroked-button color="primary">
          <mat-icon>visibility</mat-icon> View
        </a>
        <a [href]="project['_attachmentUrl']" download target="_blank" mat-raised-button color="primary">
          <mat-icon>download</mat-icon> Download
        </a>
      </div>
      <div class="hero-meta">
        <mat-chip>{{ project.statusName }}</mat-chip>
        <mat-chip>{{ project.priorityName }}</mat-chip>
        <span>Manager: <strong>{{ project.projectManagerName }}</strong></span>
        <span>Due: <strong>{{ project.endDate | date:'dd MMM yyyy' }}</strong></span>
      </div>
    </div>
    <div class="hero-score">
      <div class="big-pct">{{ project.completionPercentage }}%</div>
      <mat-progress-bar mode="determinate" [value]="project.completionPercentage" color="primary"></mat-progress-bar>
      <div class="task-count">{{ project.completedTasks }}/{{ project.totalTasks }} tasks done</div>
    </div>
  </div>

  <mat-tab-group>
    <mat-tab label="Milestones">
      <div class="tab-pad">
        <div class="milestones-actions" style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
          <button mat-raised-button color="primary" (click)="openMilestoneDialog()">+ Add Milestone</button>
        </div>
        <div class="milestones-list">
          <div class="milestone-wrapper" *ngFor="let m of project.milestones">
            <div class="milestone-item" [class.achieved]="m.status === 3" [class.overdue]="m.isOverdue" 
                 (click)="$any(m).expanded = !$any(m).expanded" style="cursor: pointer; transition: background 0.2s;">
              <div class="ms-icon"><mat-icon>{{ m.status === 3 ? 'check_circle' : 'flag' }}</mat-icon></div>
              <div class="ms-info">
                <span class="ms-name">{{ m.name }} <mat-icon inline style="font-size: 16px; color: #94a3b8; vertical-align: middle;">{{ $any(m).expanded ? 'expand_less' : 'expand_more' }}</mat-icon></span>
                <span class="ms-due">Due: {{ m.dueDate | date:'dd MMM yyyy' }}</span>
                <div class="ms-task-summary" *ngIf="getMilestoneTaskSummary(m.milestoneId)">
                  <mat-icon inline>list_alt</mat-icon> {{ getMilestoneTaskSummary(m.milestoneId) }}
                </div>
              </div>
              <div class="ms-right">
                <mat-progress-bar mode="determinate" [value]="m.completionPercentage" color="primary" class="ms-bar"></mat-progress-bar>
                <mat-chip [class]="'ms-' + m.statusName.toLowerCase()">{{ m.statusName }}</mat-chip>
              </div>
            </div>
            <!-- Expanded Tasks List -->
            <div class="ms-expanded-tasks" *ngIf="$any(m).expanded && hierarchyByMilestone[m.milestoneId]">
              <div class="task-mini-item" *ngFor="let t of hierarchyByMilestone[m.milestoneId]" [style.margin-left.px]="t.level * 32">
                <span class="t-title">
                  <mat-icon [style.color]="getTaskTypeColor(t.taskType)" style="font-size: 16px; width: 16px; height: 16px; margin-right: 8px;">
                    {{ getTaskTypeIcon(t.taskType) }}
                  </mat-icon>
                  <a [routerLink]="['/tasks', t.taskItemId]" [queryParams]="{mode:'view'}" (click)="$event.stopPropagation()" style="text-decoration: none; color: inherit; cursor: pointer;">
                    {{ $any(t).title }}
                  </a>
                  <span class="t-type-badge">{{ $any(t).taskTypeName }}</span>
                </span>
                <span class="t-status" [class]="'s-' + $any(t).statusName.toLowerCase()">{{ $any(t).statusName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-tab>
    <mat-tab label="Team">
      <div class="tab-pad">
        <div class="team-grid">
          <a [routerLink]="['/dashboard/employee', m.employeeId]" class="member-card" *ngFor="let m of project.teamMembers" style="text-decoration: none; color: inherit; cursor: pointer; transition: all 0.2s;">
            <div class="m-avatar">{{ m.employeeName.charAt(0) }}</div>
            <div class="m-info"><span class="m-name">{{ m.employeeName }}</span><span class="m-role">{{ m.role }}</span></div>
          </a>
        </div>
      </div>
    </mat-tab>
    <mat-tab label="Work Items">
      <div class="tab-pad">
        <div class="task-summary-grid">
          <mat-card class="type-card" *ngFor="let type of taskTypeBreakdown">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">{{ getIconForTypeName(type.name) }}</mat-icon>
              <mat-card-title>{{ type.name }}</mat-card-title>
              <mat-card-subtitle>{{ type.count }} total items</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="task-minilist">
                <div class="task-mini-item" *ngFor="let t of type.tasks | slice:0:5">
                  <span class="t-title">
                    <a [routerLink]="['/tasks', $any(t).taskItemId]" [queryParams]="{mode:'view'}" style="text-decoration: none; color: inherit; cursor: pointer;">
                      {{ $any(t).title }}
                    </a>
                  </span>
                  <span class="t-status" [class]="'s-' + $any(t).statusName.toLowerCase()">{{ $any(t).statusName }}</span>
                </div>
                <div *ngIf="type.tasks.length > 5" style="font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">
                  +{{ type.tasks.length - 5 }} more...
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        <div *ngIf="taskTypeBreakdown.length === 0" class="empty-state">
          No tasks found in this project.
        </div>
      </div>
    </mat-tab>
    <mat-tab label="Timeline">
      <div class="tab-pad">
        <div class="gantt-container" *ngIf="timelineTasks.length > 0">
          <!-- Timeline Header Dates -->
          <div class="gantt-header">
            <div class="gantt-date-start">{{ timelineStart | date:'MMM dd' }}</div>
            <div class="gantt-date-end">{{ timelineEnd | date:'MMM dd' }}</div>
          </div>
          <!-- Timeline Grid -->
          <div class="gantt-grid">
            <div class="gantt-row" *ngFor="let t of timelineTasks">
              <div class="gantt-label" [matTooltip]="t.title">
                <a [routerLink]="['/tasks', t.taskItemId]" [queryParams]="{mode:'view'}" style="text-decoration: none; color: inherit;">
                  {{ t.title }}
                </a>
              </div>
              <div class="gantt-track">
                <!-- Project Bound line -->
                <div class="gantt-project-bound"></div>
                <!-- Task Bar -->
                <div class="gantt-bar" 
                     [style.left.%]="t.startPct" 
                     [style.width.%]="t.widthPct"
                     [class.completed]="t.status === 3 || t.status === 4"
                     [class.in-progress]="t.status === 2"
                     [class.on-hold]="t.status === 5"
                     [matTooltip]="((t.startDate || t.createdDate) | date:'MMM dd') + ' - ' + (t.dueDate | date:'MMM dd')">
                  <div class="gantt-progress" [style.width.%]="t.completionPercentage"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div *ngIf="timelineTasks.length === 0" style="padding: 40px; text-align: center; color: #888;">
          No tasks available for timeline view.
        </div>
      </div>
    </mat-tab>
  </mat-tab-group>
</div>`,
  styles: [`
.page-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
.proj-hero { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
  p { color: #64748b; margin: 0 0 12px; }
}
.hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; span { font-size: 0.85rem; color: #64748b; } }
.hero-score { min-width: 200px; text-align: center; }
.big-pct { font-size: 3rem; font-weight: 700; color: #6366f1; line-height: 1; margin-bottom: 8px; }
.task-count { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; }
.tab-pad { padding: 20px 0; }
.milestones-list { display: flex; flex-direction: column; gap: 12px; }
.milestone-wrapper { background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); overflow: hidden; }
.milestone-item { padding: 16px; display: flex; align-items: center; gap: 16px;
  &:hover { background: #f8fafc; }
  &.achieved { border-left: 4px solid #10b981; .ms-icon mat-icon { color: #10b981; } }
  &.overdue { border-left: 4px solid #ef4444; }
}
.ms-info { flex: 1; }
.ms-name { display: block; font-weight: 500; }
.ms-due { font-size: 0.75rem; color: #94a3b8; }
.ms-right { display: flex; flex-direction: column; gap: 6px; min-width: 120px; align-items: flex-end; }
.ms-bar { width: 100px; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.member-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; }
.member-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
.m-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.m-info { display: flex; flex-direction: column; }
.m-name { font-weight: 500; font-size: 0.9rem; }
.m-role { font-size: 0.75rem; color: #94a3b8; }
.ms-task-summary { font-size: 0.75rem; color: #6366f1; margin-top: 4px; display: flex; align-items: center; gap: 4px; font-weight: 500; }
.task-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.type-card { border-radius: 12px !important; }
.task-minilist { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.task-mini-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; padding: 6px; background: #f8fafc; border-radius: 6px; }
.t-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 350px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.t-title a:hover { text-decoration: underline !important; color: #0052CC !important; }
.t-type-badge { font-size: 0.65rem; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: normal; }
.t-status { font-size: 0.7rem; padding: 2px 6px; border-radius: 12px; background: #e2e8f0; }
.t-status.s-completed { background: #bbf7d0; color: #166534; }
.t-status.s-inprogress { background: #bae6fd; color: #0369a1; }
.empty-state { text-align: center; color: #94a3b8; padding: 40px; }
.ms-expanded-tasks { padding: 0 16px 16px 56px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #f1f5f9; background: #fafafa; }

/* Gantt Chart CSS */
.gantt-container { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
.gantt-header { display: flex; justify-content: space-between; margin-left: 200px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 600; }
.gantt-grid { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.gantt-row { display: flex; align-items: center; gap: 16px; height: 36px; }
.gantt-label { width: 184px; font-size: 0.85rem; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.gantt-label a:hover { text-decoration: underline !important; color: #0052CC !important; }
.gantt-track { flex: 1; height: 100%; position: relative; background: #f8fafc; border-radius: 4px; overflow: hidden; display: flex; align-items: center; }
.gantt-project-bound { position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: #e2e8f0; transform: translateY(-50%); }
.gantt-bar { position: absolute; height: 24px; border-radius: 12px; background: #8993A4; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s; }
.gantt-bar.in-progress { background: #4C9AFF; }
.gantt-bar.completed { background: #36B37E; }
.gantt-bar.on-hold { background: #FF5630; }
.gantt-progress { height: 100%; background: #505F79; border-radius: 12px; }
.gantt-bar.in-progress .gantt-progress { background: #0052CC; }
.gantt-bar.completed .gantt-progress { background: #00875A; }
.gantt-bar.on-hold .gantt-progress { background: #DE350B; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: TrackerProject | null = null;
  timelineTasks: any[] = [];
  timelineStart: Date = new Date();
  timelineEnd: Date = new Date();
  taskTypeBreakdown: any[] = [];
  tasksByMilestone: { [milestoneId: number]: any[] } = {};
  hierarchyByMilestone: { [milestoneId: number]: any[] } = {};

  constructor(
    private service: ProgressTrackerService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProject();
  }

  loadProject(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getEmployees().subscribe((data: any) => {
      const employees = data.value ? data.value : data;
      this.service.getProjectById(id).subscribe(p => {
        if (p && p.teamMembers) {
          p.teamMembers.forEach(m => {
            if (m.employeeName === m.employeeId || m.employeeName.length > 30) {
              const emp = employees.find((e: any) => e.employeeId === m.employeeId);
              if (emp) m.employeeName = `${emp.firstName} ${emp.lastName}`;
            }
          });
        }
        this.project = p;
        if (this.project) {
           (this.project as any)['_attachmentUrl'] = this.getAttachmentUrl(p.description);
           (this.project as any)['_cleanDescription'] = this.getCleanDescription(p.description);
           this.loadTimelineTasks(id);
        }
      });
    });
  }

  loadTimelineTasks(projectId: number) {
    this.service.getTasks({ projectId }).subscribe(tasks => {
      if (!tasks || tasks.length === 0) return;
      
      // Calculate global start and end
      let minDate = new Date(this.project?.startDate || tasks[0].startDate || new Date());
      let maxDate = new Date(this.project?.endDate || tasks[0].dueDate || new Date());
      
      tasks.forEach((t: any) => {
        const s = new Date(t.startDate || t.createdDate);
        const d = new Date(t.dueDate || new Date());
        if (s < minDate) minDate = s;
        if (d > maxDate) maxDate = d;
      });

      // Add a small buffer of 1 day to ends
      minDate.setDate(minDate.getDate() - 1);
      maxDate.setDate(maxDate.getDate() + 1);

      this.timelineStart = minDate;
      this.timelineEnd = maxDate;
      const totalDuration = maxDate.getTime() - minDate.getTime();

      this.timelineTasks = tasks.map((t: any) => {
        const s = new Date(t.startDate || t.createdDate);
        const d = new Date(t.dueDate || new Date());
        
        // Calculate percentages
        const startDiff = Math.max(0, s.getTime() - minDate.getTime());
        const startPct = (startDiff / totalDuration) * 100;
        
        const duration = Math.max(0, d.getTime() - s.getTime());
        const widthPct = (duration / totalDuration) * 100;

        return {
          ...t,
          startPct: Math.min(Math.max(startPct, 0), 100),
          widthPct: Math.min(Math.max(widthPct, 1), 100) // min 1% width
        };
      });
      
      this.calculateTaskBreakdowns();
    });
  }

  calculateTaskBreakdowns() {
    const types: any = {};
    this.timelineTasks.forEach(t => {
      const typeName = t.taskTypeName || 'Task';
      if (!types[typeName]) types[typeName] = { name: typeName, count: 0, tasks: [] };
      types[typeName].count++;
      types[typeName].tasks.push(t);
    });
    this.taskTypeBreakdown = Object.values(types);

    this.tasksByMilestone = {};
    this.timelineTasks.forEach(t => {
      if (t.milestoneId) {
        if (!this.tasksByMilestone[t.milestoneId]) {
          this.tasksByMilestone[t.milestoneId] = [];
        }
        this.tasksByMilestone[t.milestoneId].push(t);
      }
    });

    // Calculate Hierarchy
    this.hierarchyByMilestone = {};
    Object.keys(this.tasksByMilestone).forEach(mId => {
       const mIdNum = Number(mId);
       const rawTasks = this.tasksByMilestone[mIdNum];
       const rawIds = new Set(rawTasks.map(t => t.taskItemId));
       const roots = rawTasks.filter(t => !t.parentTaskId || !rawIds.has(t.parentTaskId));

       const getDescendants = (parentId: number, level: number): any[] => {
         const children = rawTasks.filter(t => t.parentTaskId === parentId);
         let res: any[] = [];
         for (const c of children) {
           res.push({ ...c, level });
           res.push(...getDescendants(c.taskItemId, level + 1));
         }
         return res;
       };

       let hierarchy: any[] = [];
       for (const r of roots) {
         hierarchy.push({ ...r, level: 0 });
         hierarchy.push(...getDescendants(r.taskItemId, 1));
       }
       this.hierarchyByMilestone[mIdNum] = hierarchy;
    });
  }

  getMilestoneTaskSummary(milestoneId: number): string {
    const tasks = this.tasksByMilestone[milestoneId];
    if (!tasks || tasks.length === 0) return '';
    const counts: any = {};
    tasks.forEach(t => {
      const type = t.taskTypeName || 'Task';
      counts[type] = (counts[type] || 0) + 1;
    });
    const summary = Object.keys(counts).map(k => `${counts[k]} ${k}`).join(', ');
    
    // Change "Tasks" to "Items" because Epics are not Tasks
    return `${tasks.length} Items (${summary})`;
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

  getIconForTypeName(name: string): string {
    const map: Record<string, string> = {
      'Epic': 'flash_on',
      'Story': 'bookmark',
      'Task': 'check_box',
      'Sub-Task': 'subdirectory_arrow_right',
      'Bug': 'bug_report'
    };
    return map[name] || 'task';
  }

  getAttachmentUrl(desc: string | undefined | null): string | null {
    if (!desc) return null;
    const match = desc.match(/Attachment:\s*(http[^\s]+)/);
    return match ? match[1] : null;
  }
  
  getCleanDescription(desc: string | undefined | null): string {
    if (!desc) return '';
    return desc.replace(/\n*\s*Attachment:\s*http[^\s]+/, '');
  }

  openMilestoneDialog(): void {
    if (!this.project) return;
    const dialogRef = this.dialog.open(MilestoneDialogComponent, {
      width: '500px',
      data: { projectId: this.project.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createMilestone(this.project!.projectId, result).subscribe({
          next: () => {
            this.loadProject(); // Reload project to show new milestone
          },
          error: (err) => console.error('Failed to create milestone', err)
        });
      }
    });
  }
}
