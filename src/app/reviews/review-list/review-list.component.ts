import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { ProgressReview } from '../../shared/models/interfaces';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressBarModule, MatTableModule, MatDialogModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1><mat-icon>star_rate</mat-icon> Performance Reviews</h1>
    <button mat-raised-button color="primary" *ngIf="canManage" (click)="openDialog()"><mat-icon>add</mat-icon> Add Review</button>
  </div>
  <div class="reviews-list" *ngIf="reviews.length">
    <mat-card class="review-card" *ngFor="let review of reviews">
      <mat-card-header>
        <mat-icon mat-card-avatar>assignment_ind</mat-icon>
        <mat-card-title>{{ review.reviewPeriod }}</mat-card-title>
        <mat-card-subtitle>By {{ review.reviewerName }} | {{ review.reviewDate | date:'dd MMM yyyy' }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="rating-big">
          <span class="stars">{{ '★'.repeat(review.overallRating) }}{{ '☆'.repeat(5 - review.overallRating) }}</span>
          <span class="rating-num">{{ review.overallRating }}/5</span>
        </div>
        <div class="metrics-row">
          <div class="m-item"><span class="m-val">{{ review.taskCompletionRate | number:'1.0-1' }}%</span><span class="m-lbl">Task Rate</span></div>
          <div class="m-item"><span class="m-val">{{ review.kpiAchievementRate | number:'1.0-1' }}%</span><span class="m-lbl">KPI Rate</span></div>
          <div class="m-item"><span class="m-val">{{ review.goalAchievementRate | number:'1.0-1' }}%</span><span class="m-lbl">Goal Rate</span></div>
        </div>
        <div class="review-sections" *ngIf="review.strengths">
          <p><strong>Strengths:</strong> {{ review.strengths }}</p>
          <p *ngIf="review.areasOfImprovement"><strong>Areas to Improve:</strong> {{ review.areasOfImprovement }}</p>
          <p *ngIf="review.goalsForNextPeriod"><strong>Next Period Goals:</strong> {{ review.goalsForNextPeriod }}</p>
        </div>
        <div class="review-footer">
          <mat-chip [class]="'status-' + review.statusName.toLowerCase()">{{ review.statusName }}</mat-chip>
          <span class="ack-date" *ngIf="review.acknowledgedDate">Acknowledged: {{ review.acknowledgedDate | date:'dd MMM yyyy' }}</span>
          <button mat-button color="primary" *ngIf="review.status === 2" (click)="acknowledge(review)">Acknowledge</button>
        </div>
      </mat-card-content>
    </mat-card>
  </div>
  <div class="empty" *ngIf="!reviews.length && !loading">No reviews yet.</div>
</div>`,
  styles: [`
.page-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; h1 { display: flex; align-items: center; gap: 8px; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; mat-icon { color: #6366f1; } } }
.reviews-list { display: flex; flex-direction: column; gap: 16px; }
.review-card { border-radius: 16px !important; }
.rating-big { display: flex; align-items: center; gap: 10px; margin: 12px 0; .stars { font-size: 1.5rem; color: #f59e0b; } .rating-num { font-size: 1.2rem; font-weight: 700; } }
.metrics-row { display: flex; gap: 32px; margin-bottom: 12px; }
.m-item { text-align: center; }
.m-val { display: block; font-size: 1.2rem; font-weight: 700; color: #6366f1; }
.m-lbl { font-size: 0.75rem; color: #94a3b8; }
.review-sections { font-size: 0.85rem; color: #475569; p { margin: 4px 0; } }
.review-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
.ack-date { font-size: 0.75rem; color: #94a3b8; }
.status-submitted { background: #dbeafe !important; color: #1e40af !important; }
.status-acknowledged { background: #d1fae5 !important; color: #065f46 !important; }
.status-finalized { background: #f3e8ff !important; color: #6d28d9 !important; }
.empty { text-align: center; color: #94a3b8; padding: 48px; }
  `]
})
export class ReviewListComponent implements OnInit {
  reviews: ProgressReview[] = [];
  loading = true;
  canManage = false;

  constructor(private service: ProgressTrackerService, private dialog: MatDialog, private authService: AuthService) {}

  ngOnInit(): void {
    this.canManage = this.authService.isAdminOrHR() || this.authService.isManager();
    this.loadReviews();
  }

  loadReviews() {
    const employeeId = localStorage.getItem('employeeId') || '2D4C0F4E-6BCB-4F52-B3D4-FD29B9258882';
    this.loading = true;
    
    if (this.canManage) {
      this.service.getReviews().subscribe({ next: (r) => { this.reviews = r; this.loading = false; }, error: () => { this.loading = false; } });
    } else {
      this.service.getReviews({ employeeId }).subscribe({ next: (r) => { this.reviews = r; this.loading = false; }, error: () => { this.loading = false; } });
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(ReviewDialogComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadReviews();
    });
  }

  acknowledge(review: ProgressReview): void {
    this.service.acknowledgeReview(review.progressReviewId, '').subscribe(() => {
      review.status = 3;
      review.statusName = 'Acknowledged';
    });
  }
}
