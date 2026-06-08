import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Create Performance Review</h2>
    <mat-dialog-content>
      <form [formGroup]="reviewForm" class="review-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Employee</mat-label>
          <mat-select formControlName="employeeId">
            <mat-option *ngFor="let emp of employees" [value]="emp.employeeId">
              {{ emp.firstName }} {{ emp.lastName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Review Period</mat-label>
            <input matInput formControlName="reviewPeriod" placeholder="e.g., Q1 2026">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Review Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="reviewDate">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Overall Rating (1-5)</mat-label>
          <mat-select formControlName="overallRating">
            <mat-option [value]="1">1 - Needs Improvement</mat-option>
            <mat-option [value]="2">2 - Below Expectations</mat-option>
            <mat-option [value]="3">3 - Meets Expectations</mat-option>
            <mat-option [value]="4">4 - Exceeds Expectations</mat-option>
            <mat-option [value]="5">5 - Outstanding</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Strengths</mat-label>
          <textarea matInput formControlName="strengths" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Areas of Improvement</mat-label>
          <textarea matInput formControlName="areasOfImprovement" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Goals for Next Period</mat-label>
          <textarea matInput formControlName="goalsForNextPeriod" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Additional Comments</mat-label>
          <textarea matInput formControlName="comments" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="reviewForm.invalid || saving" (click)="save()">Save Review</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .review-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; min-width: 400px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
  `]
})
export class ReviewDialogComponent implements OnInit {
  reviewForm: FormGroup;
  employees: any[] = [];
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReviewDialogComponent>,
    private service: ProgressTrackerService
  ) {
    this.reviewForm = this.fb.group({
      employeeId: ['', Validators.required],
      reviewPeriod: ['', Validators.required],
      reviewDate: [new Date(), Validators.required],
      overallRating: [3, Validators.required],
      strengths: [''],
      areasOfImprovement: [''],
      goalsForNextPeriod: [''],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.service.getEmployees().subscribe((data: any) => {
      this.employees = data.value ? data.value : data;
    });
  }

  save() {
    if (this.reviewForm.invalid) return;
    this.saving = true;
    
    const val = this.reviewForm.value;
    const emp = this.employees.find(e => e.employeeId === val.employeeId);
    
    // We also need reviewerId and reviewerName, defaulting to system/logged in user
    const payload = {
      ...val,
      employeeName: emp ? emp.firstName + ' ' + emp.lastName : val.employeeId,
      reviewerId: localStorage.getItem('employeeId') || '2D4C0F4E-6BCB-4F52-B3D4-FD29B9258882',
      reviewerName: 'Manager/HR' // Should be fetched from auth context
    };

    this.service.createReview(payload).subscribe({
      next: (res: any) => {
        this.dialogRef.close(res);
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
      }
    });
  }
}
