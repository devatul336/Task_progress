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
import { KPIDefinition } from '../../shared/models/interfaces';

@Component({
  selector: 'app-assign-kpi-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Assign KPI to Employee</h2>
    <mat-dialog-content>
      <form [formGroup]="assignForm" class="kpi-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Employee</mat-label>
          <mat-select formControlName="employeeId">
            <mat-option *ngFor="let emp of employees" [value]="emp.employeeId">
              {{ emp.firstName }} {{ emp.lastName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select KPI Definition</mat-label>
          <mat-select formControlName="kpiDefinitionId">
            <mat-option *ngFor="let def of definitions" [value]="def.kpiDefinitionId">
              {{ def.name }} ({{ def.unit }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Period Start</mat-label>
            <input matInput [matDatepicker]="picker1" formControlName="periodStart">
            <mat-datepicker-toggle matSuffix [for]="picker1"></mat-datepicker-toggle>
            <mat-datepicker #picker1></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Period End</mat-label>
            <input matInput [matDatepicker]="picker2" formControlName="periodEnd">
            <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
            <mat-datepicker #picker2></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Target Value</mat-label>
          <input matInput type="number" formControlName="targetValue" placeholder="Enter target number">
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="assignForm.invalid || saving" (click)="save()">Assign</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .kpi-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; min-width: 400px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
  `]
})
export class AssignKpiDialogComponent implements OnInit {
  assignForm: FormGroup;
  employees: any[] = [];
  definitions: KPIDefinition[] = [];
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignKpiDialogComponent>,
    private service: ProgressTrackerService
  ) {
    this.assignForm = this.fb.group({
      employeeId: ['', Validators.required],
      kpiDefinitionId: ['', Validators.required],
      periodStart: [new Date(), Validators.required],
      periodEnd: [new Date(), Validators.required],
      targetValue: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.service.getEmployees().subscribe((data: any) => {
      this.employees = data.value ? data.value : data;
    });

    this.service.getKPIDefinitions().subscribe(data => {
      this.definitions = data;
    });
  }

  save() {
    if (this.assignForm.invalid) return;
    this.saving = true;
    const val = this.assignForm.value;
    
    // Find employee name
    const emp = this.employees.find(e => e.employeeId === val.employeeId);
    
    const payload = {
      ...val,
      employeeName: emp ? emp.firstName + ' ' + emp.lastName : val.employeeId
    };

    this.service.assignKPI(payload).subscribe({
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
