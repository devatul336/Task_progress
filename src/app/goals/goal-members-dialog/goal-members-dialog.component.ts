import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-goal-members-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, RouterModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>Assigned Members</h2>
    <mat-dialog-content>
      <div class="goal-info">
        <strong>{{ data.goalTitle }}</strong>
      </div>
      <div class="custom-list">
        <div *ngFor="let member of data.members" class="custom-list-item">
          <div class="item-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <div class="item-content">
            <div class="item-title">{{ member.employeeName || 'Unknown Employee' }}</div>
            <div class="item-details">
              <div class="progress-wrapper">
                <mat-progress-bar mode="determinate" [value]="member.progressPercentage"></mat-progress-bar>
                <span>{{ member.progressPercentage }}%</span>
              </div>
              <span class="status-badge status-{{ member.status }}">{{ member.statusName }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button mat-icon-button color="primary" [routerLink]="['/goals', member.employeeGoalId]" (click)="close()">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button color="accent" [routerLink]="['/goals', member.employeeGoalId, 'edit']" (click)="close()">
              <mat-icon>edit</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .goal-info { margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; color: #1e293b; }
    .custom-list { display: flex; flex-direction: column; gap: 12px; }
    .custom-list-item { display: flex; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .custom-list-item:last-child { border-bottom: none; }
    .item-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; justify-content: center; align-items: center; margin-right: 12px; color: #64748b; }
    .item-content { flex: 1; }
    .item-title { font-weight: 600; color: #1e293b; margin-bottom: 6px; font-size: 14px; }
    .item-details { display: flex; align-items: center; gap: 12px; }
    .progress-wrapper { display: flex; align-items: center; gap: 8px; }
    .progress-wrapper mat-progress-bar { width: 100px; }
    .progress-wrapper span { font-size: 12px; font-weight: 500; }
    .status-badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; font-weight: 500; }
    .status-3 { background: #d1fae5; color: #065f46; }
    .item-actions { display: flex; }
  `]
})
export class GoalMembersDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<GoalMembersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { goalTitle: string, members: any[] }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
