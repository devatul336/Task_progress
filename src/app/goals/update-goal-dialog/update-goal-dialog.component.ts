import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';

@Component({
  selector: 'app-update-goal-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSliderModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Update Goal Progress</h2>
    <mat-dialog-content>
      <form [formGroup]="updateForm" class="update-form">
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option [value]="1">Not Started</mat-option>
            <mat-option [value]="2">In Progress</mat-option>
            <mat-option [value]="3">Achieved</mat-option>
            <mat-option [value]="4">Missed</mat-option>
            <mat-option [value]="5">Deferred</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="slider-container">
          <label>Progress: {{ updateForm.get('progressPercentage')?.value }}%</label>
          <mat-slider min="0" max="100" step="1" class="full-width">
            <input matSliderThumb formControlName="progressPercentage">
          </mat-slider>
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="updateForm.invalid || saving" (click)="save()">Update</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .update-form { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; min-width: 350px; }
    .full-width { width: 100%; }
    .slider-container { display: flex; flex-direction: column; gap: 8px; }
    .slider-container label { font-weight: 500; color: #475569; }
  `]
})
export class UpdateGoalDialogComponent implements OnInit {
  updateForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateGoalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private service: ProgressTrackerService
  ) {
    this.updateForm = this.fb.group({
      status: [data.goal.status, Validators.required],
      progressPercentage: [data.goal.progressPercentage, Validators.required]
    });
  }

  ngOnInit(): void {
    // If status becomes Achieved, we might auto-set progress to 100
    this.updateForm.get('status')?.valueChanges.subscribe(val => {
      if (val === 3) {
        this.updateForm.patchValue({ progressPercentage: 100 });
      }
    });
  }

  save() {
    if (this.updateForm.invalid) return;
    this.saving = true;
    
    // We need to pass the full DTO as required by UpdateEmployeeGoalDto, which extends CreateEmployeeGoalDto
    const payload = {
      ...this.data.goal,
      status: this.updateForm.value.status,
      progressPercentage: this.updateForm.value.progressPercentage,
      achievedDate: this.updateForm.value.status === 3 ? new Date() : null
    };

    this.service.updateGoal(this.data.goal.employeeGoalId, payload).subscribe({
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
