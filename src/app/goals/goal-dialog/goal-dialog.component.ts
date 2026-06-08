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
  selector: 'app-goal-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Goal</h2>
    <mat-dialog-content>
      <form [formGroup]="goalForm" class="goal-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Goal Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Complete AWS Certification">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Category</mat-label>
            <input matInput formControlName="category" placeholder="e.g., Professional Development">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Target Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="targetDate">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Success Criteria</mat-label>
          <textarea matInput formControlName="successCriteria" rows="2" placeholder="How do you measure success?"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="goalForm.invalid || saving" (click)="save()">Save Goal</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .goal-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; min-width: 400px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
  `]
})
export class GoalDialogComponent implements OnInit {
  goalForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GoalDialogComponent>,
    private service: ProgressTrackerService
  ) {
    this.goalForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      targetDate: [new Date(), Validators.required],
      successCriteria: ['']
    });
  }

  ngOnInit(): void {}

  save() {
    if (this.goalForm.invalid) return;
    this.saving = true;
    
    // Using hardcoded employeeId to match the lists for now
    const employeeId = localStorage.getItem('employeeId') || '2D4C0F4E-6BCB-4F52-B3D4-FD29B9258882';

    const payload = {
      ...this.goalForm.value,
      employeeId: employeeId,
      employeeName: 'Current User' // or fetch real name
    };

    this.service.createGoal(payload).subscribe({
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
