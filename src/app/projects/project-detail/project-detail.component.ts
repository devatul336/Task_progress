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
          <div class="milestone-item" *ngFor="let m of project.milestones" [class.achieved]="m.status === 3" [class.overdue]="m.isOverdue">
            <div class="ms-icon"><mat-icon>{{ m.status === 3 ? 'check_circle' : 'flag' }}</mat-icon></div>
            <div class="ms-info">
              <span class="ms-name">{{ m.name }}</span>
              <span class="ms-due">Due: {{ m.dueDate | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="ms-right">
              <mat-progress-bar mode="determinate" [value]="m.completionPercentage" color="primary" class="ms-bar"></mat-progress-bar>
              <mat-chip [class]="'ms-' + m.statusName.toLowerCase()">{{ m.statusName }}</mat-chip>
            </div>
          </div>
        </div>
      </div>
    </mat-tab>
    <mat-tab label="Team">
      <div class="tab-pad">
        <div class="team-grid">
          <div class="member-card" *ngFor="let m of project.teamMembers">
            <div class="m-avatar">{{ m.employeeName.charAt(0) }}</div>
            <div class="m-info"><span class="m-name">{{ m.employeeName }}</span><span class="m-role">{{ m.role }}</span></div>
          </div>
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
              <div class="gantt-label" [matTooltip]="t.title">{{ t.title }}</div>
              <div class="gantt-track">
                <!-- Project Bound line -->
                <div class="gantt-project-bound"></div>
                <!-- Task Bar -->
                <div class="gantt-bar" 
                     [style.left.%]="t.startPct" 
                     [style.width.%]="t.widthPct"
                     [class.completed]="t.status === 3"
                     [class.in-progress]="t.status === 2"
                     [matTooltip]="(t.startDate | date:'MMM dd') + ' - ' + (t.dueDate | date:'MMM dd')">
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
.milestone-item { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);
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
.m-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.m-info { display: flex; flex-direction: column; }
.m-name { font-weight: 500; font-size: 0.9rem; }
.m-role { font-size: 0.75rem; color: #94a3b8; }

/* Gantt Chart CSS */
.gantt-container { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
.gantt-header { display: flex; justify-content: space-between; margin-left: 200px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 600; }
.gantt-grid { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.gantt-row { display: flex; align-items: center; gap: 16px; height: 36px; }
.gantt-label { width: 184px; font-size: 0.85rem; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.gantt-track { flex: 1; height: 100%; position: relative; background: #f8fafc; border-radius: 4px; overflow: hidden; display: flex; align-items: center; }
.gantt-project-bound { position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: #e2e8f0; transform: translateY(-50%); }
.gantt-bar { position: absolute; height: 24px; border-radius: 12px; background: #cbd5e1; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s; }
.gantt-bar.in-progress { background: #bae6fd; }
.gantt-bar.completed { background: #bbf7d0; }
.gantt-progress { height: 100%; background: #6366f1; opacity: 0.8; }
.gantt-bar.in-progress .gantt-progress { background: #0ea5e9; }
.gantt-bar.completed .gantt-progress { background: #10b981; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: TrackerProject | null = null;
  timelineTasks: any[] = [];
  timelineStart: Date = new Date();
  timelineEnd: Date = new Date();

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
    });
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
