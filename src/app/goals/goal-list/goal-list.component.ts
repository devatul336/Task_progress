import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { EmployeeGoal } from '../../shared/models/interfaces';

@Component({
  selector: 'app-goal-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1><mat-icon>emoji_events</mat-icon> My Goals</h1>
    <button mat-raised-button color="primary"><mat-icon>add</mat-icon> Add Goal</button>
  </div>
  <div class="goals-grid" *ngIf="goals.length">
    <mat-card class="goal-card" *ngFor="let goal of goals" [class.achieved]="goal.status === 3" [class.overdue-card]="goal.isOverdue">
      <mat-card-header>
        <mat-icon mat-card-avatar [class.icon-achieved]="goal.status === 3" [class.icon-overdue]="goal.isOverdue">
          {{ goal.status === 3 ? 'check_circle' : goal.isOverdue ? 'warning' : 'flag' }}
        </mat-icon>
        <mat-card-title>{{ goal.title }}</mat-card-title>
        <mat-card-subtitle>{{ goal.category }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="goal-desc" *ngIf="goal.description">{{ goal.description }}</p>
        <div class="goal-progress">
          <mat-progress-bar mode="determinate" [value]="goal.progressPercentage"
            [color]="goal.status === 3 ? 'primary' : goal.isOverdue ? 'warn' : 'accent'"></mat-progress-bar>
          <span class="pct-label">{{ goal.progressPercentage }}%</span>
        </div>
        <div class="goal-footer">
          <mat-chip [class]="'status-' + goal.status">{{ goal.statusName }}</mat-chip>
          <span class="due-info" [class.overdue]="goal.isOverdue">
            {{ goal.achievedDate ? ('Achieved: ' + (goal.achievedDate | date:'dd MMM yyyy')) : ('Due: ' + (goal.targetDate | date:'dd MMM yyyy')) }}
          </span>
        </div>
        <div class="reviewer-note" *ngIf="goal.reviewerComments">
          <mat-icon>rate_review</mat-icon> {{ goal.reviewerComments }}
        </div>
      </mat-card-content>
    </mat-card>
  </div>
  <div class="empty" *ngIf="!goals.length && !loading">No goals set yet. Add your first goal!</div>
</div>`,
  styles: [`
.page-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  h1 { display: flex; align-items: center; gap: 8px; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; mat-icon { color: #6366f1; } } }
.goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.goal-card { border-radius: 16px !important; &.achieved { border-left: 4px solid #10b981 !important; } &.overdue-card { border-left: 4px solid #ef4444 !important; } }
.goal-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 12px; }
.goal-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; mat-progress-bar { flex: 1; } }
.pct-label { font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
.goal-footer { display: flex; justify-content: space-between; align-items: center; }
.due-info { font-size: 0.75rem; color: #94a3b8; &.overdue { color: #ef4444; } }
.reviewer-note { margin-top: 8px; font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 4px; mat-icon { font-size: 16px; } }
.icon-achieved { color: #10b981 !important; } .icon-overdue { color: #ef4444 !important; }
.status-3 { background: #d1fae5 !important; color: #065f46 !important; }
.empty { text-align: center; color: #94a3b8; padding: 48px; }
  `]
})
export class GoalListComponent implements OnInit {
  goals: EmployeeGoal[] = [];
  loading = true;

  constructor(private service: ProgressTrackerService) {}

  ngOnInit(): void {
    const employeeId = localStorage.getItem('employeeId') || 'EMP001';
    this.service.getGoals({ employeeId }).subscribe({ next: (g) => { this.goals = g; this.loading = false; }, error: () => { this.loading = false; } });
  }
}
