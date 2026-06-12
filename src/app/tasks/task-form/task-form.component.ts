import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TaskItem } from '../../shared/models/interfaces';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatProgressBarModule
  ],
  template: `
<div class="form-container">
  <div class="form-header">
    <button mat-icon-button routerLink="/tasks"><mat-icon>arrow_back</mat-icon></button>
    <h1>{{ isEdit ? 'Task Details' : 'Create Task' }}</h1>
  </div>

  <mat-card class="form-card">
    <mat-card-content>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Task Title *</mat-label>
            <input matInput formControlName="title" placeholder="Enter task title">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Describe the task..."></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Task Type</mat-label>
            <mat-select formControlName="taskType">
              <mat-option [value]="1">Daily</mat-option>
              <mat-option [value]="2">Weekly</mat-option>
              <mat-option [value]="3">Project</mat-option>
              <mat-option [value]="4">Milestone</mat-option>
              <mat-option [value]="5">Training</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option [value]="1">Low</mat-option>
              <mat-option [value]="2">Medium</mat-option>
              <mat-option [value]="3">High</mat-option>
              <mat-option [value]="4">Critical</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Link to Project</mat-label>
            <mat-select formControlName="projectId">
              <mat-option [value]="null">None</mat-option>
              <mat-option *ngFor="let proj of projects" [value]="proj.projectId">
                {{ proj.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Assign To (Employee) *</mat-label>
            <mat-select formControlName="assignedToEmployeeId" (selectionChange)="onEmployeeSelected($event.value)">
              <mat-option *ngFor="let emp of employees" [value]="emp.employeeId">
                {{ emp.employeeCode }} - {{ emp.firstName }} {{ emp.lastName }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Employee Name *</mat-label>
            <input matInput formControlName="assignedToEmployeeName" readonly>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Due Date *</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dueDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estimated Hours</mat-label>
            <input matInput type="number" formControlName="estimatedHours">
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="isEdit">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option [value]="1">To Do</mat-option>
              <mat-option [value]="2">In Progress</mat-option>
              <mat-option [value]="3">Under Review</mat-option>
              <mat-option [value]="4">Completed</mat-option>
              <mat-option [value]="5">On Hold</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="isEdit">
            <mat-label>Completion %</mat-label>
            <input matInput type="number" formControlName="completionPercentage" min="0" max="100">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tags (comma separated)</mat-label>
            <input matInput formControlName="tags">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Acceptance Criteria</mat-label>
            <textarea matInput formControlName="acceptanceCriteria" rows="2"></textarea>
          </mat-form-field>
        </div>

        <div class="form-actions">
          <button mat-button type="button" routerLink="/tasks">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="saving">
            {{ saving ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task') }}
          </button>
        </div>
      </form>
    </mat-card-content>
  </mat-card>
</div>`,
  styles: [`
.form-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
.form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; } }
.form-card { border-radius: 16px !important; max-width: 900px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.full-width { grid-column: 1 / -1; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
mat-form-field { width: 100%; }
  `]
})
export class TaskFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  saving = false;
  taskId?: number;
  employees: any[] = [];
  projects: any[] = [];

  constructor(private fb: FormBuilder, private service: ProgressTrackerService, private router: Router, private route: ActivatedRoute) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      taskType: [1, Validators.required],
      priority: [2, Validators.required],
      assignedToEmployeeId: ['', Validators.required],
      assignedToEmployeeName: ['', Validators.required],
      dueDate: [null, Validators.required],
      estimatedHours: [0],
      tags: [''],
      acceptanceCriteria: [''],
      isRecurring: [false],
      status: [1],
      completionPercentage: [0],
      actualHours: [0],
      projectId: [null]
    });
  }

  ngOnInit(): void {
    this.service.getEmployees().subscribe(emps => {
      this.employees = emps;
    });
    this.service.getProjects().subscribe(projs => {
      this.projects = projs;
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create') {
      this.isEdit = true;
      this.taskId = Number(id);
      this.service.getTaskById(this.taskId).subscribe({
        next: (task) => {
          console.log('Task fetched successfully:', task);
          const patchData: any = { ...task };
          if (task.dueDate) {
            patchData.dueDate = new Date(task.dueDate);
          }
          this.form.patchValue(patchData);
        },
        error: (err) => {
          console.error('Error fetching task details:', err);
          alert('Failed to load task details. See console for error.');
        }
      });
    }
  }

  onEmployeeSelected(employeeId: string): void {
    const selectedEmp = this.employees.find(e => e.employeeId === employeeId);
    if (selectedEmp) {
      this.form.patchValue({
        assignedToEmployeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`.trim()
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    if (this.isEdit) {
      this.service.updateTask({ ...val, taskItemId: this.taskId! }).subscribe({
        next: () => { this.router.navigate(['/tasks']); },
        error: () => { this.saving = false; }
      });
    } else {
      this.service.createTask(val).subscribe({
        next: () => { this.router.navigate(['/tasks']); },
        error: () => { this.saving = false; }
      });
    }
  }
}
