import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { ProgressReview } from '../../shared/models/interfaces';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressBarModule, MatTableModule, MatDialogModule, MatFormFieldModule, MatInputModule],
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
        <mat-card-title>{{ review.reviewPeriod }} - For {{ review.employeeName || 'Employee' }}</mat-card-title>
        <mat-card-subtitle>Reviewed By {{ review.reviewerName || 'Manager' }} | {{ review.reviewDate | date:'dd MMM yyyy' }}</mat-card-subtitle>
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
        <div class="review-sections" *ngIf="review.strengths || review.areasOfImprovement || review.goalsForNextPeriod || review.comments">
          <p *ngIf="review.strengths"><strong>Strengths:</strong> {{ review.strengths }}</p>
          <p *ngIf="review.areasOfImprovement"><strong>Areas to Improve:</strong> {{ review.areasOfImprovement }}</p>
          <p *ngIf="review.goalsForNextPeriod"><strong>Next Period Goals:</strong> {{ review.goalsForNextPeriod }}</p>
          <p *ngIf="review.comments"><strong>Manager Comments:</strong> {{ review.comments }}</p>
        </div>
        <div class="review-sections employee-feedback-display" *ngIf="review.employeeComments && review.status === 3">
          <p><strong>Employee Feedback:</strong> {{ review.employeeComments }}</p>
        </div>
        
        <div class="employee-feedback-input" *ngIf="review.status === 2 && !canManage" style="margin-top: 15px;">
           <mat-form-field appearance="outline" style="width: 100%;">
             <mat-label>Your Feedback (Optional)</mat-label>
             <textarea matInput [(ngModel)]="review.employeeComments" rows="2" placeholder="Write your feedback here..."></textarea>
           </mat-form-field>
        </div>

        <div class="review-footer">
          <mat-chip [class]="'status-' + (review.statusName ? review.statusName.toLowerCase() : 'draft')">{{ review.statusName || 'Draft' }}</mat-chip>
          <span class="ack-date" *ngIf="review.acknowledgedDate">Acknowledged: {{ review.acknowledgedDate | date:'dd MMM yyyy' }}</span>
          <button mat-button color="accent" *ngIf="review.status === 1 && canManage" (click)="submitReview(review)">Submit</button>
          <button mat-button color="primary" *ngIf="review.status === 2 && !canManage" (click)="acknowledge(review)">Acknowledge</button>
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

  constructor(private service: ProgressTrackerService, private dialog: MatDialog, private authService: AuthService) { }

  ngOnInit(): void {
    this.canManage = this.authService.isAdminOrHR() || this.authService.isManager();
    this.loadReviews();
  }

  loadReviews() {
    let employeeId = localStorage.getItem('employeeId');
    if (!employeeId || employeeId === 'undefined') {
      employeeId = localStorage.getItem('EmployeeId');
    }
    if (!employeeId || employeeId === 'undefined') {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          employeeId = userObj.employeId || userObj.EmployeeId || userObj.employeeId;
        } catch (e) { }
      }
    }

    console.log('[ReviewList] Extracted employeeId:', employeeId);
    console.log('[ReviewList] canManage:', this.canManage);

    this.loading = true;

    if (this.canManage) {
      this.service.getReviews().subscribe({ 
        next: (r) => { 
          console.log('[ReviewList] Manager fetched reviews:', r);
          this.reviews = r; 
          this.loading = false; 
        }, 
        error: (err) => { 
          console.error('[ReviewList] Manager fetch error:', err);
          this.loading = false; 
        } 
      });
    } else {
      let filters: any = {};
      if (employeeId && employeeId !== 'me' && employeeId !== 'undefined') {
        filters.employeeId = employeeId;
      }
      console.log('[ReviewList] Employee fetching with filters:', filters);
      this.service.getReviews(filters).subscribe({ 
        next: (r) => { 
          console.log('[ReviewList] Employee fetched reviews:', r);
          // Only show reviews that are NOT in draft status (status > 1), UNLESS it's the manager viewing.
          // Employees shouldn't see draft reviews. Wait, let's just show all for now to see if data comes.
          this.reviews = r; 
          this.loading = false; 
        }, 
        error: (err) => { 
          console.error('[ReviewList] Employee fetch error:', err);
          this.loading = false; 
        } 
      });
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(ReviewDialogComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadReviews();
    });
  }

  submitReview(review: ProgressReview): void {
    const updated = { ...review, status: 2, statusName: 'Submitted' };
    this.service.updateReview(updated).subscribe({
      next: () => {
        review.status = 2;
        review.statusName = 'Submitted';
      },
      error: (err) => console.error('Failed to submit review', err)
    });
  }

  acknowledge(review: ProgressReview): void {
    const comments = review.employeeComments ? review.employeeComments : '';
    this.service.acknowledgeReview(review.progressReviewId, comments).subscribe(() => {
      review.status = 3;
      review.statusName = 'Acknowledged';
    });
  }
}
