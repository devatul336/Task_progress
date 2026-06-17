import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule,
    MatCheckboxModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Project' : 'Create New Project' }}</h2>
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

        <div class="file-upload-container">
          <span class="file-label">Attach File (Optional): </span>
          <input type="file" (change)="onFileSelected($event)" class="file-input">
          <div *ngIf="existingAttachmentUrl && !selectedFile" class="existing-attachment" style="margin-top: 12px; border-top: 1px solid #eee; padding-top: 12px;">
            <p style="margin: 0 0 8px; font-weight: 500;">Current Attachment:</p>
            <img *ngIf="isImage(existingAttachmentUrl)" [src]="existingAttachmentUrl" alt="Attachment Preview" style="max-width: 100%; max-height: 200px; border-radius: 4px;">
            <a *ngIf="!isImage(existingAttachmentUrl)" [href]="existingAttachmentUrl" target="_blank" style="color: #2563eb; text-decoration: none;">View File</a>
          </div>
        </div>

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
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option [value]="1">Planning</mat-option>
              <mat-option [value]="2">Active</mat-option>
              <mat-option [value]="3">On Hold</mat-option>
              <mat-option [value]="4">Completed</mat-option>
              <mat-option [value]="5">Cancelled</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Project Manager</mat-label>
            <mat-select formControlName="projectManagerId">
              <mat-option *ngFor="let mgr of managers" [value]="mgr.employeeId">
                {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.designation }})
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Completion (%)</mat-label>
            <input matInput type="number" formControlName="completionPercentage" min="0" max="100">
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

        <mat-checkbox *ngIf="!isEdit" formControlName="createTask" class="mt-10" color="primary">Create an initial task for this project</mat-checkbox>
        
        <div *ngIf="showTaskSection && !isEdit" class="task-section">
          <h3>Initial Task Details</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Task Title</mat-label>
            <input matInput formControlName="taskTitle" placeholder="Enter task title">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Task Description</mat-label>
            <textarea matInput formControlName="taskDescription" rows="2" placeholder="Enter task description"></textarea>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="taskPriority">
                <mat-option [value]="1">Low</mat-option>
                <mat-option [value]="2">Medium</mat-option>
                <mat-option [value]="3">High</mat-option>
                <mat-option [value]="4">Critical</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="taskStatus">
                <mat-option [value]="1">Backlog</mat-option>
                <mat-option [value]="2">To Do</mat-option>
                <mat-option [value]="3">In Progress</mat-option>
                <mat-option [value]="4">Code Review</mat-option>
                <mat-option [value]="5">Testing</mat-option>
                <mat-option [value]="6">UAT</mat-option>
                <mat-option [value]="7">Done</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Completion (%)</mat-label>
              <input matInput type="number" formControlName="taskCompletion" min="0" max="100">
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Assign To</mat-label>
              <mat-select formControlName="taskAssignedTo">
                <mat-option *ngFor="let emp of employees" [value]="emp.employeeId">
                  {{ emp.firstName }} {{ emp.lastName }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="taskPicker" formControlName="taskDueDate">
            <mat-datepicker-toggle matSuffix [for]="taskPicker"></mat-datepicker-toggle>
            <mat-datepicker #taskPicker></mat-datepicker>
          </mat-form-field>
        </div>

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
    .file-upload-container { margin: 5px 0 15px; padding: 12px; border: 1px dashed #ccc; border-radius: 4px; background: #fafafa; }
    .file-label { font-size: 14px; color: #555; margin-right: 10px; font-weight: 500; }
    .task-section { margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee; }
    .task-section h3 { margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #333; font-weight: 500; }
    .mt-10 { margin-top: 10px; display: block; }
  `]
})
export class ProjectDialogComponent implements OnInit {
  projectForm: FormGroup;
  employees: any[] = [];
  managers: any[] = [];
  saving = false;
  selectedFile: File | null = null;
  isEdit = false;
  projectId?: number;
  existingAttachmentUrl: string | null = null;

  isImage(url: string | null): boolean {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
  }

  get showTaskSection() {
    return this.projectForm.get('createTask')?.value === true;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProjectDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private service: ProgressTrackerService,
    private snackBar: MatSnackBar
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      priority: [2, Validators.required],
      status: [1, Validators.required],
      completionPercentage: [0],
      projectManagerId: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      teamMemberIds: [[]],
      createTask: [false],
      taskTitle: [''],
      taskDescription: [''],
      taskAssignedTo: [''],
      taskDueDate: [new Date()],
      taskPriority: [2],
      taskStatus: [1],
      taskCompletion: [0]
    });
  }

  ngOnInit(): void {
    this.service.getEmployees().subscribe((data: any) => {
      this.employees = data.value ? data.value : data;
      this.managers = this.employees;
      
      if (this.data && this.data.project) {
        this.isEdit = true;
        this.projectId = this.data.project.projectId;
        const p = this.data.project;
        
        let cleanDesc = p.description || '';
        const match = cleanDesc.match(/\n*\s*Attachment:\s*(http[^\n]+)/);
        if (match) {
            this.existingAttachmentUrl = match[1].trim();
        }
        cleanDesc = cleanDesc.replace(/\n*\s*Attachment:\s*http[^\n]+/, '');

        this.projectForm.patchValue({
          name: p.name,
          description: cleanDesc,
          priority: p.priority,
          status: p.status,
          completionPercentage: p.completionPercentage,
          projectManagerId: p.projectManagerId,
          startDate: p.startDate ? new Date(p.startDate) : new Date(),
          endDate: p.endDate ? new Date(p.endDate) : new Date(),
          teamMemberIds: p.teamMembers ? p.teamMembers.map((tm: any) => tm.employeeId) : []
        });
        this.projectForm.get('createTask')?.disable();
      }
    });

    // Project Status -> Completion
    this.projectForm.get('status')?.valueChanges.subscribe(status => {
      if (status === 1) this.projectForm.patchValue({ completionPercentage: 0 }, { emitEvent: false });
      else if (status === 2) this.projectForm.patchValue({ completionPercentage: 10 }, { emitEvent: false });
      else if (status === 3) this.projectForm.patchValue({ completionPercentage: 90 }, { emitEvent: false });
      else if (status === 4) this.projectForm.patchValue({ completionPercentage: 100 }, { emitEvent: false });
    });

    // Project Completion -> Status
    this.projectForm.get('completionPercentage')?.valueChanges.subscribe(comp => {
      if (comp === 0) this.projectForm.patchValue({ status: 1 }, { emitEvent: false });
      else if (comp > 0 && comp < 90) this.projectForm.patchValue({ status: 2 }, { emitEvent: false });
      else if (comp >= 90 && comp < 100) this.projectForm.patchValue({ status: 3 }, { emitEvent: false });
      else if (comp === 100) this.projectForm.patchValue({ status: 4 }, { emitEvent: false });
    });

    // Task Status -> Completion
    this.projectForm.get('taskStatus')?.valueChanges.subscribe(status => {
      if (status === 1 || status === 2) this.projectForm.patchValue({ taskCompletion: 0 }, { emitEvent: false });
      else if (status === 3) this.projectForm.patchValue({ taskCompletion: 50 }, { emitEvent: false });
      else if (status === 4 || status === 5 || status === 6) this.projectForm.patchValue({ taskCompletion: 90 }, { emitEvent: false });
      else if (status === 7) this.projectForm.patchValue({ taskCompletion: 100 }, { emitEvent: false });
    });

    // Task Completion -> Status
    this.projectForm.get('taskCompletion')?.valueChanges.subscribe(comp => {
      if (comp === 0) this.projectForm.patchValue({ taskStatus: 2 }, { emitEvent: false });
      else if (comp > 0 && comp < 90) this.projectForm.patchValue({ taskStatus: 3 }, { emitEvent: false });
      else if (comp >= 90 && comp < 100) this.projectForm.patchValue({ taskStatus: 4 }, { emitEvent: false });
      else if (comp === 100) this.projectForm.patchValue({ taskStatus: 7 }, { emitEvent: false });
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  save() {
    if (this.projectForm.invalid) return;
    this.saving = true;
    const val = this.projectForm.value;

    const finalizeSave = (fileUrl?: string) => {
      // Find manager name
      const manager = this.employees.find(e => e.employeeId === val.projectManagerId);

      let finalDescription = val.description || '';
      if (fileUrl) {
        finalDescription = finalDescription ? `${finalDescription}\n\nAttachment: ${fileUrl}` : `Attachment: ${fileUrl}`;
      }

      const payload: any = {
        name: val.name,
        description: finalDescription,
        priority: val.priority,
        status: val.status,
        completionPercentage: val.completionPercentage,
        projectManagerId: val.projectManagerId,
        startDate: val.startDate,
        endDate: val.endDate,
        teamMemberIds: val.teamMemberIds,
        projectManagerName: manager ? manager.firstName + ' ' + manager.lastName : val.projectManagerId
      };

      if (this.isEdit) {
        payload.projectId = this.projectId;
      }

    if (this.isEdit) {
      this.service.updateProject(this.projectId!, payload).subscribe({
        next: (res: any) => this.dialogRef.close(res),
        error: (err) => { console.error(err); this.saving = false; }
      });
    } else {
      this.service.createProject(payload).subscribe({
      next: (res: any) => {
        if (val.createTask && val.taskTitle && val.taskAssignedTo) {
          const assignee = this.employees.find(e => e.employeeId === val.taskAssignedTo);
          const taskPayload = {
            title: val.taskTitle,
            description: val.taskDescription,
            taskType: 3, // Project
            priority: val.taskPriority || 2,
            assignedToEmployeeId: val.taskAssignedTo,
            assignedToEmployeeName: assignee ? assignee.firstName + ' ' + assignee.lastName : val.taskAssignedTo,
            projectId: res.projectId,
            dueDate: val.taskDueDate,
            estimatedHours: 0,
            isRecurring: false
          };
          this.service.createTask(taskPayload).subscribe({
            next: (createdTask: any) => {
              // If status is not 'To Do' or completion is > 0, we need to update it
              if (val.taskStatus > 1 || val.taskCompletion > 0) {
                 const updatePayload = {
                    ...taskPayload,
                    taskItemId: createdTask.taskItemId,
                    status: val.taskStatus,
                    completionPercentage: val.taskCompletion,
                    actualHours: 0
                 };
                 this.service.updateTask(updatePayload).subscribe({
                    next: () => this.dialogRef.close(res),
                    error: (err) => { console.error('Error updating task status', err); this.dialogRef.close(res); }
                 });
              } else {
                 this.dialogRef.close(res);
              }
            },
            error: (err) => {
              console.error('Error creating task', err);
              this.dialogRef.close(res); // Still close because project was created
            }
          });
        } else {
          this.dialogRef.close(res);
        }
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
      }
    });
    }
    }; // end of finalizeSave

    if (this.selectedFile) {
      this.service.uploadFile(this.selectedFile).subscribe({
        next: (res) => {
          finalizeSave(res.url);
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.saving = false;
          this.snackBar.open('File upload failed. Did you restart the backend server?', 'Close', { duration: 5000 });
        }
      });
    } else {
      finalizeSave(this.existingAttachmentUrl || undefined);
    }
  }
}
