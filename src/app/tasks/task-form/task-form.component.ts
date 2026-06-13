import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { AddUpdateFormComponent, FormConfig, FormColumn } from '@fovestta2/web-angular';
import { FormGroup, FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule,
    AddUpdateFormComponent, FormsModule, QuillModule
  ],
  template: `
<div class="form-container">
  <div class="form-header">
    <button mat-icon-button routerLink="/tasks"><mat-icon>arrow_back</mat-icon></button>
    <h1>{{ isEdit ? 'Task Details' : 'Create Task' }}</h1>
  </div>
  
  <div class="form-wrapper" *ngIf="taskFormConfig && !loading">
    <div class="library-form-section">
      <lib-add-update-form 
        #taskForm 
        [config]="taskFormConfig" 
        (validationError)="onValidationError()">
      </lib-add-update-form>
    </div>

    <!-- Custom WYSIWYG Fields styled to look inside the form -->
    <div class="custom-rich-text-fields">
      <div class="rich-text-field">
        <label>Description</label>
        <quill-editor 
          [(ngModel)]="descriptionText" 
          [readOnly]="isViewOnly"
          [modules]="quillModules" 
          placeholder="Describe the task...">
        </quill-editor>
      </div>
      <div class="rich-text-field">
        <label>Acceptance Criteria</label>
        <quill-editor 
          [(ngModel)]="acceptanceCriteriaText" 
          [readOnly]="isViewOnly"
          [modules]="quillModules" 
          placeholder="Enter acceptance criteria...">
        </quill-editor>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button mat-button type="button" routerLink="/tasks">{{ isViewOnly ? 'Back' : 'Cancel' }}</button>
      <button mat-raised-button color="primary" type="button" [disabled]="saving" *ngIf="!isViewOnly" (click)="submitCustom()">
        {{ saving ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task') }}
      </button>
    </div>
  </div>
</div>`,
  styles: [`
.form-container { padding-top:10px !important; padding: 24px; background: #f8fafc; min-height: 100vh; }
.form-header { display: flex; align-items: center; }
.form-header h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; }

.form-wrapper {
  background: white;
  border-radius: 12px;
  border: 0.5px solid #cfcfcf;
  box-shadow: 0 2px 5px #0000001a;
  max-width: 1000px;
  margin: 0 auto;
}

/* Strip the internal box styling from the library so it merges perfectly with our wrapper */
::ng-deep lib-add-update-form .form-content,
::ng-deep lib-add-update-form .form-container {
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  margin: 0 !important;
}

/* The library already has its own padding, so we just let it sit flush */
.library-form-section {
  padding: 0;
}

.custom-rich-text-fields {
  padding: 0 10px 10px 10px; /* Match the library's 10px padding */
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px; /* Match the library's 12px gap */
}

.rich-text-field label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.rich-text-field quill-editor {
  display: block;
  width: 100%;
}

.rich-text-field ::ng-deep .ql-container {
  min-height: 150px;
  font-size: 14px;
  font-family: inherit;
  border: 0.5px solid #cfcfcf;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.rich-text-field ::ng-deep .ql-toolbar {
  border: 0.5px solid #cfcfcf;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  background: #f8fafc;
}

.rich-text-field ::ng-deep .ql-editor {
  min-height: 150px;
}

.form-actions { 
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  padding: 20px; 
  border-top: 0.5px solid #cfcfcf; 
  background: white;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
  `]
})
export class TaskFormComponent implements OnInit {
  @ViewChild(AddUpdateFormComponent) formComponent!: AddUpdateFormComponent;

  taskFormConfig!: FormConfig;
  isEdit = false;
  taskId?: number;
  employees: any[] = [];
  projects: any[] = [];
  milestones: any[] = [];
  isViewOnly = false;
  canEditTask = false;
  loading = true;
  saving = false;

  descriptionText = '';
  acceptanceCriteriaText = '';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  constructor(
    private service: ProgressTrackerService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.canEditTask = this.authService.isAdminOrHR() || this.authService.isManager();

    let empsLoaded = false;
    let projsLoaded = false;

    this.service.getEmployees().subscribe(emps => {
      this.employees = emps;
      empsLoaded = true;
      this.checkLoadStatus(empsLoaded, projsLoaded);
    });
    this.service.getProjects().subscribe(projs => {
      this.projects = projs;
      projsLoaded = true;
      this.checkLoadStatus(empsLoaded, projsLoaded);
    });
  }

  checkLoadStatus(empsLoaded: boolean, projsLoaded: boolean) {
    if (empsLoaded && projsLoaded) {
      this.setupRouteAndData();
    }
  }

  setupRouteAndData() {
    combineLatest([
      this.route.queryParamMap,
      this.route.paramMap
    ]).subscribe(([qParams, params]) => {
      const mode = qParams.get('mode');
      if (mode === 'view') {
        this.isViewOnly = true;
      } else if (mode === 'edit' && !this.canEditTask) {
        this.isViewOnly = true;
      } else {
        this.isViewOnly = false;
      }

      const id = params.get('id');
      if (id && id !== 'create') {
        this.isEdit = true;
        this.taskId = Number(id);
        this.service.getTaskById(this.taskId).subscribe({
          next: (task) => {
            const initialData: any = { ...task };
            if (task.dueDate) {
              initialData.dueDate = task.dueDate.split('T')[0];
            }
            if (task.projectId) {
              this.service.getMilestones(task.projectId).subscribe(m => {
                this.milestones = m;
                this.buildFormConfig(initialData);
                this.loading = false;
              });
            } else {
              this.buildFormConfig(initialData);
              this.loading = false;
            }
          },
          error: (err) => {
            console.error('Error fetching task details:', err);
            alert('Failed to load task details.');
            this.loading = false;
          }
        });
      } else {
        this.isEdit = false;
        this.taskId = undefined;
        this.buildFormConfig({
          taskType: 1,
          priority: 2,
          estimatedHours: 0,
          isRecurring: false,
          status: 1,
          completionPercentage: 0,
          actualHours: 0
        });
        this.loading = false;
      }
    });
  }

  buildFormConfig(initialData: any) {
    this.descriptionText = initialData.description || '';
    this.acceptanceCriteriaText = initialData.acceptanceCriteria || '';

    const fields: FormColumn[] = [
      {
        name: 'title',
        label: 'Task Title',
        type: 'text',
        placeholder: 'Enter task title',
        value: initialData.title,
        validations: [{ type: 'required', message: 'Title is required' }],
        disabled: this.isViewOnly,
        colSpan: 2
      },
      {
        name: 'taskType',
        label: 'Task Type',
        type: 'select',
        options: [
          { label: 'Bug', value: 1 },
          { label: 'Epic', value: 2 },
          { label: 'Story', value: 3 },
          { label: 'Sub Task', value: 4 },
          { label: 'Task', value: 5 }
        ],
        value: initialData.taskType,
        validations: [{ type: 'required', message: 'Task type is required' }],
        disabled: this.isViewOnly
      },
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { label: 'Low', value: 1 },
          { label: 'Medium', value: 2 },
          { label: 'High', value: 3 },
          { label: 'Critical', value: 4 }
        ],
        value: initialData.priority,
        validations: [{ type: 'required', message: 'Priority is required' }],
        disabled: this.isViewOnly
      },
      {
        name: 'projectId',
        label: 'Link to Project',
        type: 'select',
        options: [
          { label: 'None', value: null },
          ...this.projects.map(p => ({ label: p.name, value: p.projectId }))
        ],
        value: initialData.projectId,
        disabled: this.isViewOnly,
        onChange: (value: any, formGroup: FormGroup) => {
          this.onProjectSelected(value, formGroup);
        }
      },
      {
        name: 'milestoneId',
        label: 'Link to Milestone',
        type: 'select',
        options: [
          { label: 'None', value: null },
          ...this.milestones.map(m => ({ label: m.name, value: m.milestoneId }))
        ],
        value: initialData.milestoneId,
        disabled: this.isViewOnly,
        hidden: !initialData.projectId && this.milestones.length === 0
      },
      {
        name: 'assignedToEmployeeId',
        label: 'Assign To (Employee)',
        type: 'select',
        colSpan: 1,
        options: this.employees.map(e => ({ label: `${e.employeeCode} - ${e.firstName} ${e.lastName}`, value: e.employeeId })),
        value: initialData.assignedToEmployeeId,
        validations: [{ type: 'required', message: 'Employee assignment is required' }],
        disabled: this.isViewOnly,
        onChange: (value: any, formGroup: FormGroup) => {
          this.onEmployeeSelected(value, formGroup);
        }
      },
      {
        name: 'dueDate',
        label: 'Due Date',
        type: 'date',
        value: initialData.dueDate,
        validations: [{ type: 'required', message: 'Due date is required' }],
        disabled: this.isViewOnly || this.isEdit
      },
      {
        name: 'estimatedHours',
        label: 'Estimated Hours',
        type: 'number',
        value: initialData.estimatedHours,
        disabled: this.isViewOnly
      }
    ];

    if (this.isEdit) {
      fields.push(
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'To Do', value: 1 },
            { label: 'In Progress', value: 2 },
            { label: 'Under Review', value: 3 },
            { label: 'Completed', value: 4 },
            { label: 'On Hold', value: 5 }
          ],
          value: initialData.status,
          disabled: this.isViewOnly
        }
      );
    }

    fields.push(
      {
        name: 'tags',
        label: 'Tags',
        type: 'text',
        value: initialData.tags,
        disabled: this.isViewOnly,
        colSpan: 1
      }
    );

    this.taskFormConfig = {
      formTitle: '',
      maxColsPerRow: 2,
      sections: [{ fields }],
      hideSubmit: true,
      hideCancel: true,
      onSubmit: (data: any) => this.save(data),
      onCancel: () => this.router.navigate(['/tasks'])
    };
  }

  onProjectSelected(projectId: number | null, formGroup: FormGroup): void {
    formGroup.patchValue({ milestoneId: null });
    this.milestones = [];
    if (projectId) {
      this.service.getMilestones(projectId).subscribe(m => {
        this.milestones = m;
        const newFields = [...this.taskFormConfig.sections[0].fields];
        const milestoneIndex = newFields.findIndex((f: FormColumn) => f.name === 'milestoneId');

        if (milestoneIndex > -1) {
          newFields[milestoneIndex] = {
            ...newFields[milestoneIndex],
            options: [
              { label: 'None', value: null },
              ...this.milestones.map(milestone => ({ label: milestone.name, value: milestone.milestoneId }))
            ],
            hidden: false
          };
        }

        // Auto-select the first milestone if it exists
        if (this.milestones.length > 0) {
          formGroup.patchValue({ milestoneId: this.milestones[0].milestoneId });
        }

        this.taskFormConfig = {
          ...this.taskFormConfig,
          sections: [{ ...this.taskFormConfig.sections[0], fields: newFields }]
        };
      });
    } else {
      const newFields = [...this.taskFormConfig.sections[0].fields];
      const milestoneIndex = newFields.findIndex((f: FormColumn) => f.name === 'milestoneId');

      if (milestoneIndex > -1) {
        newFields[milestoneIndex] = {
          ...newFields[milestoneIndex],
          options: [{ label: 'None', value: null }],
          hidden: true
        };
      }

      this.taskFormConfig = {
        ...this.taskFormConfig,
        sections: [{ ...this.taskFormConfig.sections[0], fields: newFields }]
      };
    }
  }

  onEmployeeSelected(employeeId: string, formGroup: FormGroup): void {
    const selectedEmp = this.employees.find(e => e.employeeId === employeeId);
    if (selectedEmp) {
      formGroup.patchValue({
        assignedToEmployeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`.trim()
      });
    }
  }

  onValidationError() {
    this.saving = false;
  }

  submitCustom() {
    this.saving = true;
    this.formComponent.handleSubmit();
  }

  save(val: any): void {
    val.isRecurring = val.isRecurring || false;
    val.actualHours = val.actualHours || 0;

    const selectedEmp = this.employees.find(e => e.employeeId === val.assignedToEmployeeId);
    if (selectedEmp) {
      val.assignedToEmployeeName = `${selectedEmp.firstName} ${selectedEmp.lastName}`.trim();
    }

    val.description = this.descriptionText;
    val.acceptanceCriteria = this.acceptanceCriteriaText;

    if (this.isEdit) {
      this.service.updateTask({ ...val, taskItemId: this.taskId! }).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          console.error('Update Task failed:', err);
          this.saving = false;
        }
      });
    } else {
      const departmentId = localStorage.getItem('departmentId') || undefined;
      const payload = { ...val, departmentId };
      this.service.createTask(payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          console.error('Create Task failed:', err);
          this.saving = false;
        }
      });
    }
  }
}
