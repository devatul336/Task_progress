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
  selector: 'app-project-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <mat-dialog-content>
      <form [formGroup]="projectForm" class="project-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter project name">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Enter description"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option [value]="1">Low</mat-option>
              <mat-option [value]="2">Medium</mat-option>
              <mat-option [value]="3">High</mat-option>
              <mat-option [value]="4">Critical</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Project Manager</mat-label>
            <mat-select formControlName="projectManagerId">
              <mat-option *ngFor="let mgr of managers" [value]="mgr.employeeId">
                {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.designation }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="picker1" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="picker1"></mat-datepicker-toggle>
            <mat-datepicker #picker1></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="picker2" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
            <mat-datepicker #picker2></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Team Members</mat-label>
          <mat-select formControlName="teamMemberIds" multiple>
            <mat-option *ngFor="let emp of employees" [value]="emp.employeeId">
              {{ emp.firstName }} {{ emp.lastName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="projectForm.invalid || saving" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .project-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; min-width: 400px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
  `]
})
export class ProjectDialogComponent implements OnInit {
  projectForm: FormGroup;
  employees: any[] = [];
  managers: any[] = [];
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProjectDialogComponent>,
    private service: ProgressTrackerService
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      priority: [2, Validators.required],
      projectManagerId: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      teamMemberIds: [[]]
    });
  }

  ngOnInit(): void {
    this.service.getEmployees().subscribe((data: any) => {
      this.employees = data.value ? data.value : data;
      this.managers = this.employees.filter(e => {
        const desig = (e.designation || '').toLowerCase();
        return desig.includes('manager') || desig.includes('lead') || desig.includes('admin') || desig.includes('head');
      });
    });
  }

  save() {
    if (this.projectForm.invalid) return;
    this.saving = true;
    const val = this.projectForm.value;
    
    // Find manager name
    const manager = this.employees.find(e => e.employeeId === val.projectManagerId);
    
    const payload = {
      ...val,
      projectManagerName: manager ? manager.firstName + ' ' + manager.lastName : val.projectManagerId,
      status: 1 // Not Started
    };

    this.service.createProject(payload).subscribe({
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
