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
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TrackerProject, Milestone } from '../../shared/models/interfaces';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressBarModule, MatTabsModule, MatTableModule],
  template: `
<div class="page-container" *ngIf="project">
  <div class="proj-hero">
    <div>
      <h1>{{ project.name }}</h1>
      <p>{{ project.description }}</p>
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
.big-pct { font-size: 3rem; font-weight: 700; color: #6366f1; }
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
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: TrackerProject | null = null;

  constructor(private service: ProgressTrackerService, private route: ActivatedRoute) {}

  ngOnInit(): void {
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
      });
    });
  }
}
