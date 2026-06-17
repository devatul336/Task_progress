import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { AddUpdateFormComponent, FormConfig, FormColumn } from '@fovestta2/web-angular';
import { FormGroup, FormsModule } from '@angular/forms';
import { combineLatest, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatSelectModule,
    AddUpdateFormComponent, FormsModule, QuillModule
  ],
  template: `
<div class="form-container">
  <div class="form-header">
    <button mat-icon-button routerLink="/goals"><mat-icon>arrow_back</mat-icon></button>
    <h1>{{ isEdit ? (bulkIds.length > 1 ? 'Bulk Edit Team Goal' : 'Edit Goal') : 'Create Goal' }}</h1>
  </div>
  
  <div class="form-wrapper" *ngIf="goalFormConfig && !loading">
    <div class="library-form-section">
      <lib-add-update-form 
        #goalForm 
        [config]="goalFormConfig" 
        (validationError)="onValidationError()">
      </lib-add-update-form>
    </div>

    <!-- Custom WYSIWYG Fields styled to look inside the form -->
    <div class="custom-rich-text-fields">
      
      <!-- Custom Multi-Select for Create Mode -->
      <div class="rich-text-field" *ngIf="!isEdit && !isViewOnly">
        <label>Assign To (Employees)</label>
        <mat-form-field appearance="outline" class="custom-multi-select" style="width: 100%;">
          <mat-select [(ngModel)]="assignedToEmployeeIds" multiple placeholder="Select employees">
            <mat-option *ngFor="let emp of employees" [value]="emp.employeeId">
              {{ emp.employeeCode }} - {{ emp.firstName }} {{ emp.lastName }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Informative badge for bulk edit -->
      <div class="rich-text-field" *ngIf="isEdit && bulkIds.length > 1" style="grid-column: span 2;">
        <div style="background: #e0e7ff; color: #4f46e5; padding: 12px; border-radius: 8px; font-weight: 500; display: flex; align-items: center; gap: 8px;">
          <mat-icon>group</mat-icon> You are editing this goal for {{ bulkIds.length }} assigned members simultaneously.
        </div>
      </div>

      <div class="rich-text-field">
        <label>Description</label>
        <quill-editor 
          [(ngModel)]="descriptionText" 
          [readOnly]="isViewOnly"
          [modules]="quillModules" 
          placeholder="Describe the goal...">
        </quill-editor>
      </div>
      <div class="rich-text-field">
        <label>Success Criteria</label>
        <quill-editor 
          [(ngModel)]="successCriteriaText" 
          [readOnly]="isViewOnly"
          [modules]="quillModules" 
          placeholder="Enter success criteria...">
        </quill-editor>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button mat-button type="button" routerLink="/goals">{{ isViewOnly ? 'Back' : 'Cancel' }}</button>
      <button mat-raised-button color="primary" type="button" [disabled]="saving" *ngIf="!isViewOnly" (click)="submitCustom()">
        {{ saving ? 'Saving...' : (isEdit ? (bulkIds.length > 1 ? 'Update for All' : 'Update Goal') : 'Create Goal') }}
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

/* Make Material Select look like Library inputs */
::ng-deep .custom-multi-select {
  --mat-form-field-container-height: 34px !important;
  --mdc-shape-small: 8px !important;
}
::ng-deep .custom-multi-select .mdc-text-field--outlined {
  height: 34px !important;
  display: flex;
  align-items: center;
  border-radius: 8px !important;
  background-color: #fff;
}
::ng-deep .custom-multi-select .mat-mdc-form-field-flex {
  height: 34px !important;
  align-items: center !important;
  padding: 0 10px !important;
}
::ng-deep .custom-multi-select .mat-mdc-form-field-infix {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 34px !important;
  display: flex;
  align-items: center;
}
::ng-deep .custom-multi-select .mat-mdc-select-trigger {
  top: 0px !important;
}
::ng-deep .custom-multi-select .mat-mdc-form-field-subscript-wrapper {
  display: none; /* Hide the empty space below */
}
::ng-deep .custom-multi-select .mdc-text-field--outlined:not(.mdc-text-field--focused) .mdc-notched-outline__leading,
::ng-deep .custom-multi-select .mdc-text-field--outlined:not(.mdc-text-field--focused) .mdc-notched-outline__notch,
::ng-deep .custom-multi-select .mdc-text-field--outlined:not(.mdc-text-field--focused) .mdc-notched-outline__trailing {
  border-color: #cfcfcf !important;
  border-width: 0.5px !important;
}
::ng-deep .custom-multi-select .mdc-notched-outline__leading {
  border-top-left-radius: 8px !important;
  border-bottom-left-radius: 8px !important;
}
::ng-deep .custom-multi-select .mdc-notched-outline__trailing {
  border-top-right-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
}
  `]
})
export class GoalFormComponent implements OnInit {
  @ViewChild(AddUpdateFormComponent) formComponent!: AddUpdateFormComponent;

  goalFormConfig!: FormConfig;
  isEdit = false;
  goalId?: number;
  employees: any[] = [];
  isViewOnly = false;
  canEditGoal = false;
  loading = true;
  saving = false;
  bulkIds: number[] = [];

  descriptionText = '';
  successCriteriaText = '';
  assignedToEmployeeIds: string[] = [];

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
    this.canEditGoal = this.authService.isAdminOrHR() || this.authService.isManager();

    this.service.getEmployees().subscribe((data: any) => {
      this.employees = data.value ? data.value : data;
      this.setupRouteAndData();
    });
  }

  setupRouteAndData() {
    combineLatest([
      this.route.queryParamMap,
      this.route.paramMap
    ]).subscribe(([qParams, params]) => {
      const bulkIdsParam = qParams.get('bulkIds');
      if (bulkIdsParam) {
        this.bulkIds = bulkIdsParam.split(',').map(id => Number(id));
      }

      const mode = qParams.get('mode');
      if (mode === 'view') {
        this.isViewOnly = true;
      } else if (mode === 'edit' && !this.canEditGoal) {
        this.isViewOnly = true;
      } else {
        this.isViewOnly = false;
      }

      const id = params.get('id');
      if (id && id !== 'create') {
        this.isEdit = true;
        this.goalId = Number(id);
        this.service.getGoalById(this.goalId).subscribe({
          next: (goal) => {
            const initialData: any = { ...goal };
            if (goal.targetDate) {
              initialData.targetDate = goal.targetDate.split('T')[0];
            }
            if (goal.startDate) {
              initialData.startDate = goal.startDate.split('T')[0];
            }
            // For editing a single goal, it belongs to one employee
            initialData.assignedToEmployeeId = goal.employeeId;
            this.buildFormConfig(initialData);
            this.loading = false;
          },
          error: (err) => {
            console.error('Error fetching goal details:', err);
            console.error('Failed to load goal details.');
            this.loading = false;
          }
        });
      } else {
        this.isEdit = false;
        this.goalId = undefined;
        this.buildFormConfig({
          goalType: 1,
          priority: 2,
          status: 1,
          targetValue: 100,
          unit: 'Units',
          weightage: 10,
          assignedToEmployeeIds: []
        });
        this.loading = false;
      }
    });
  }

  buildFormConfig(initialData: any) {
    this.descriptionText = initialData.description || '';
    this.successCriteriaText = initialData.successCriteria || '';

    const fields: FormColumn[] = [
      {
        name: 'title',
        label: 'Goal Title',
        type: 'text',
        placeholder: 'Enter goal title',
        value: initialData.title,
        validations: [{ type: 'required', message: 'Title is required' }],
        disabled: this.isViewOnly,
        colSpan: 2
      },
      {
        name: 'category',
        label: 'Category',
        type: 'text',
        placeholder: 'e.g. Professional Development',
        value: initialData.category,
        validations: [{ type: 'required', message: 'Category is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
      },
      {
        name: 'goalType',
        label: 'Goal Type',
        type: 'select',
        options: [
          { label: 'Numeric', value: 1 },
          { label: 'Percentage', value: 2 },
          { label: 'Binary', value: 3 },
          { label: 'Milestone', value: 4 }
        ],
        value: initialData.goalType,
        validations: [{ type: 'required', message: 'Goal type is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
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
        disabled: this.isViewOnly,
        colSpan: 1
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Draft', value: 1 },
          { label: 'Not Started', value: 2 },
          { label: 'In Progress', value: 3 },
          { label: 'On Hold', value: 4 },
          { label: 'Pending Review', value: 5 },
          { label: 'Completed', value: 6 },
          { label: 'Rejected', value: 7 },
          { label: 'Cancelled', value: 8 }
        ],
        value: initialData.status,
        disabled: this.isViewOnly || !this.isEdit,
        colSpan: 1
      },
      {
        name: 'targetValue',
        label: 'Target Value',
        type: 'number',
        value: initialData.targetValue,
        validations: [{ type: 'required', message: 'Target Value is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
      },
      {
        name: 'unit',
        label: 'Unit',
        type: 'text',
        placeholder: 'e.g., Certifications, %, Leads',
        value: initialData.unit,
        validations: [{ type: 'required', message: 'Unit is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
      },
      {
        name: 'weightage',
        label: 'Weightage (%)',
        type: 'number',
        value: initialData.weightage,
        validations: [{ type: 'required', message: 'Weightage is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
      },
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        value: initialData.startDate,
        validations: [{ type: 'required', message: 'Start date is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
      },
      {
        name: 'targetDate',
        label: 'Target Date',
        type: 'date',
        value: initialData.targetDate,
        validations: [{ type: 'required', message: 'Target date is required' }],
        disabled: this.isViewOnly,
        colSpan: 1
      }
    ];

    if (!this.isEdit) {
      // In create mode, assignment is handled via custom multi-select in the template
      this.assignedToEmployeeIds = initialData.assignedToEmployeeIds || [];
    } else {
      if (this.bulkIds.length <= 1) {
        fields.push({
          name: 'assignedToEmployeeId',
          label: 'Assigned To',
          type: 'select',
          options: this.employees.map(e => ({ label: `${e.employeeCode} - ${e.firstName} ${e.lastName}`, value: e.employeeId })),
          value: initialData.assignedToEmployeeId,
          validations: [{ type: 'required', message: 'Assignment is required' }],
          disabled: this.isViewOnly,
          colSpan: 1
        });
      }
    }

    this.goalFormConfig = {
      formTitle: '',
      maxColsPerRow: 2,
      sections: [{ fields }],
      hideSubmit: true,
      hideCancel: true,
      onSubmit: (data: any) => this.save(data),
      onCancel: () => this.router.navigate(['/goals'])
    };
  }

  onValidationError() {
    console.error('Validation error in form');
  }

  submitCustom() {
    if (this.formComponent) {
      this.formComponent.handleSubmit();
    }
  }

  save(formData: any) {
    this.saving = true;

    const payload = {
      ...formData,
      description: this.descriptionText,
      successCriteria: this.successCriteriaText
    };

    if (!this.isEdit) {
      payload.assignedToEmployeeIds = this.assignedToEmployeeIds;

      if (!payload.assignedToEmployeeIds || payload.assignedToEmployeeIds.length === 0) {
        alert("Please assign at least one employee.");
        this.saving = false;
        return;
      }

      const selectedNames = payload.assignedToEmployeeIds.map((id: string) => {
        const e = this.employees.find((emp: any) => emp.employeeId === id);
        return e ? `${e.employeeCode} - ${e.firstName} ${e.lastName}` : '';
      });

      payload.assignedToEmployeeNames = selectedNames;
      payload.assignedByEmployeeId = localStorage.getItem('employeeId') || '2D4C0F4E-6BCB-4F52-B3D4-FD29B9258882';
      payload.assignedByEmployeeName = 'Current User';

      this.service.createGoal(payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/goals']);
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
        }
      });
    } else {
      if (this.bulkIds && this.bulkIds.length > 1) {
        // Bulk update
        const requests = this.bulkIds.map(id => {
          return this.service.getGoalById(id).pipe(
            switchMap(existingGoal => {
              const updatedPayload = {
                ...existingGoal,
                ...payload,
                employeeGoalId: id,
                employeeId: existingGoal.employeeId,
                employeeName: existingGoal.employeeName,
                // Make sure we keep the target date in ISO format if the form didn't touch it
                targetDate: payload.targetDate ? new Date(payload.targetDate).toISOString() : existingGoal.targetDate,
                startDate: payload.startDate ? new Date(payload.startDate).toISOString() : existingGoal.startDate,
              };
              return this.service.updateGoal(id, updatedPayload);
            })
          );
        });

        forkJoin(requests).subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/goals']);
          },
          error: (err) => {
            console.error('Error during bulk update:', err);
            this.saving = false;
          }
        });

      } else {
        // Single update
        payload.employeeGoalId = this.goalId;
        payload.employeeId = payload.assignedToEmployeeId;

        this.service.updateGoal(this.goalId!, payload).subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/goals']);
          },
          error: (err) => {
            console.error(err);
            this.saving = false;
          }
        });
      }
    }
  }
}
