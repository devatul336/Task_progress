import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { EmployeeKPI } from '../../shared/models/interfaces';

@Component({
  selector: 'app-update-kpi-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Update KPI Progress</h2>
    <mat-dialog-content>
      <div class="kpi-info" *ngIf="kpi">
        <strong>KPI:</strong> {{ kpi.kpiName }} <br/>
        <strong>Target:</strong> {{ kpi.targetValue }} {{ kpi.unit }} <br/>
        <strong>Current Achieved:</strong> {{ kpi.achievedValue }} {{ kpi.unit }}
      </div>

      <form [formGroup]="updateForm" class="kpi-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Achieved Value</mat-label>
          <input matInput type="number" formControlName="achievedValue" placeholder="Enter total achieved">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Remarks (Optional)</mat-label>
          <textarea matInput formControlName="remarks" rows="2" placeholder="Any comments..."></textarea>
        </mat-form-field>
      </form>

      <div class="score-preview" *ngIf="calculatedScore !== null">
        <strong>Estimated Score:</strong> 
        <span [class.green]="calculatedScore >= 80" [class.red]="calculatedScore < 60">
          {{ calculatedScore | number:'1.0-1' }}%
        </span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="updateForm.invalid || saving" (click)="save()">Save Progress</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .kpi-info { background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; color: #334155; }
    .kpi-form { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
    .full-width { width: 100%; }
    .score-preview { margin-top: 16px; margin-bottom: 16px; font-size: 1.1rem; padding: 12px; background: #fafafa; border-radius: 8px; border-left: 4px solid #6366f1; }
    .score-preview span.green { color: #10b981; font-weight: bold; }
    .score-preview span.red { color: #ef4444; font-weight: bold; }
  `]
})
export class UpdateKpiDialogComponent implements OnInit {
  updateForm: FormGroup;
  kpi: EmployeeKPI;
  saving = false;
  calculatedScore: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateKpiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private service: ProgressTrackerService
  ) {
    this.kpi = data.kpi;
    this.updateForm = this.fb.group({
      achievedValue: [this.kpi.achievedValue, [Validators.required, Validators.min(0)]],
      remarks: [this.kpi.remarks || '']
    });

    this.updateForm.get('achievedValue')?.valueChanges.subscribe(val => {
      this.calculateScore(val);
    });
  }

  ngOnInit(): void {
    this.calculateScore(this.kpi.achievedValue);
  }

  calculateScore(achieved: number) {
    if (achieved == null || this.kpi.targetValue === 0) {
      this.calculatedScore = 0;
      return;
    }
    
    // By default, assuming Higher is Better
    let score = (achieved / this.kpi.targetValue) * 100;
    
    // If we have kpi definition details and it's lower-is-better
    if ((this.kpi as any).higherIsBetter === false) {
      // Logic for lower is better: (Target / Achieved) * 100
      if (achieved === 0) score = 100; // avoid infinity
      else score = (this.kpi.targetValue / achieved) * 100;
    }

    if (score > 100) score = 100;
    this.calculatedScore = score;
  }

  save() {
    if (this.updateForm.invalid) return;
    this.saving = true;
    const val = this.updateForm.value;
    const score = this.calculatedScore || 0;

    this.service.updateEmployeeKPI(this.kpi.employeeKPIId, val.achievedValue, score, val.remarks).subscribe({
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
