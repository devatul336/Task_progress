import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';

@Component({
  selector: 'app-kpi-definition-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Define New KPI</h2>
    <mat-dialog-content>
      <form [formGroup]="kpiForm" class="kpi-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>KPI Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Lines of Code, Code Coverage">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Category</mat-label>
            <input matInput formControlName="category" placeholder="e.g., Development, QA, HR">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Unit</mat-label>
            <input matInput formControlName="unit" placeholder="e.g., %, Count, Hours">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Frequency (Target Type)</mat-label>
            <mat-select formControlName="targetType">
              <mat-option [value]="1">Daily</mat-option>
              <mat-option [value]="2">Weekly</mat-option>
              <mat-option [value]="3">Monthly</mat-option>
              <mat-option [value]="4">Quarterly</mat-option>
              <mat-option [value]="5">Yearly</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row toggles">
          <mat-slide-toggle formControlName="isHigherBetter" color="primary">
            Higher Value is Better
          </mat-slide-toggle>
          <mat-slide-toggle formControlName="isGlobal" color="primary">
            Global KPI (Org-wide)
          </mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="kpiForm.invalid || saving" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .kpi-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; min-width: 400px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
    .toggles { flex-direction: column; gap: 12px; margin-top: 8px; margin-bottom: 8px; }
  `]
})
export class KpiDefinitionDialogComponent {
  kpiForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<KpiDefinitionDialogComponent>,
    private service: ProgressTrackerService
  ) {
    this.kpiForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      unit: ['', Validators.required],
      targetType: [3, Validators.required],
      isHigherBetter: [true],
      isGlobal: [true]
    });
  }

  save() {
    if (this.kpiForm.invalid) return;
    this.saving = true;
    
    this.service.createKPIDefinition(this.kpiForm.value).subscribe({
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
