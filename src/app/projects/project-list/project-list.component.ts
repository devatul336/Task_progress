import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TrackerProject } from '../../shared/models/interfaces';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressBarModule, MatBadgeModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1><mat-icon>account_tree</mat-icon> Projects</h1>
    <button mat-raised-button color="primary"><mat-icon>add</mat-icon> New Project</button>
  </div>
  <div class="projects-grid">
    <mat-card class="project-card" *ngFor="let proj of projects" [routerLink]="['/projects', proj.projectId]">
      <mat-card-header>
        <mat-icon mat-card-avatar [class]="'status-icon-' + proj.statusName.toLowerCase()">account_tree</mat-icon>
        <mat-card-title>{{ proj.name }}</mat-card-title>
        <mat-card-subtitle>{{ proj.projectManagerName }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="proj-desc">{{ proj.description }}</p>
        <div class="proj-progress-row">
          <mat-progress-bar mode="determinate" [value]="proj.completionPercentage"
            [color]="proj.completionPercentage >= 80 ? 'primary' : proj.isOverdue ? 'warn' : 'accent'"></mat-progress-bar>
          <span class="pct">{{ proj.completionPercentage }}%</span>
        </div>
        <div class="proj-stats">
          <span><mat-icon>task_alt</mat-icon>{{ proj.completedTasks }}/{{ proj.totalTasks }} tasks</span>
          <span><mat-icon>people</mat-icon>{{ proj.teamMemberCount }} members</span>
          <span><mat-icon>calendar_today</mat-icon>{{ proj.endDate | date:'dd MMM yyyy' }}</span>
        </div>
        <div class="proj-footer">
          <mat-chip [class]="'proj-' + proj.statusName.toLowerCase()">{{ proj.statusName }}</mat-chip>
          <mat-chip class="priority-chip" [class]="'prio-' + proj.priorityName.toLowerCase()">{{ proj.priorityName }}</mat-chip>
          <span class="overdue-tag" *ngIf="proj.isOverdue">Overdue</span>
        </div>
      </mat-card-content>
    </mat-card>
  </div>
  <div class="empty" *ngIf="!projects.length && !loading">No projects yet.</div>
</div>`,
  styles: [`
.page-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  h1 { display: flex; align-items: center; gap: 8px; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; mat-icon { color: #6366f1; } } }
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.project-card { border-radius: 16px !important; cursor: pointer; transition: transform 0.2s; &:hover { transform: translateY(-2px); } }
.proj-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 12px; }
.proj-progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; mat-progress-bar { flex: 1; } }
.pct { font-size: 0.85rem; font-weight: 700; white-space: nowrap; }
.proj-stats { display: flex; gap: 16px; font-size: 0.8rem; color: #64748b; margin-bottom: 10px;
  span { display: flex; align-items: center; gap: 4px; mat-icon { font-size: 16px; } } }
.proj-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.overdue-tag { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
.empty { text-align: center; color: #94a3b8; padding: 48px; }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: TrackerProject[] = [];
  loading = true;

  constructor(private service: ProgressTrackerService) {}

  ngOnInit(): void {
    this.service.getProjects().subscribe({ next: (p) => { this.projects = p; this.loading = false; }, error: () => { this.loading = false; } });
  }
}
