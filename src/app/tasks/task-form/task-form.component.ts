import { Component, OnInit, ViewChild, AfterViewChecked, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { TaskStatusService } from '../../shared/task-status.service';
import { AddUpdateFormComponent, FormConfig, FormColumn } from '@fovestta2/web-angular';
import { FormGroup, FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatCheckboxModule,
    AddUpdateFormComponent, FormsModule, QuillModule
  ],
  template: `
<div class="form-container">
  <div class="form-header">
    <button mat-icon-button type="button" (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
    <h1>{{ isEdit ? getTaskTypeName() + ' Details' : 'Create ' + getTaskTypeName() }}</h1>
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

      <!-- Attachment Upload -->
      <div class="rich-text-field" style="grid-column: span 2;">
        <label>Task Attachment</label>
        <div class="attachment-container">
          <input type="file" (change)="onAttachmentSelected($event)" [disabled]="isViewOnly || uploadingAttachment" id="fileUpload" style="display: none;">
          <button mat-stroked-button color="primary" type="button" (click)="triggerFileInput()" *ngIf="!isViewOnly" [disabled]="uploadingAttachment">
            <mat-icon>cloud_upload</mat-icon> {{ uploadingAttachment ? 'Uploading...' : (attachmentUrl ? 'Upload New File' : 'Upload File') }}
          </button>
          
          <div *ngIf="attachmentUrl" class="attachment-preview">
            <mat-icon color="accent">visibility</mat-icon>
            <a [href]="attachmentUrl" target="_blank" class="attachment-link">View Attachment</a>
            <button mat-icon-button color="warn" type="button" *ngIf="!isViewOnly" (click)="removeAttachment()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Checklist / Sub-Tasks Section -->
    <div class="checklist-section" *ngIf="isEdit && currentTaskType !== 1 && currentTaskType !== 2">
      <h3>Checklist / Sub-Tasks</h3>
      
      <div class="checklist-add">
        <input type="text" [(ngModel)]="newSubTaskTitle" placeholder="Add a sub-task..." (keyup.enter)="addSubTask()" [disabled]="isViewOnly" />
        <button mat-flat-button color="primary" (click)="addSubTask()" [disabled]="!newSubTaskTitle.trim() || isViewOnly || savingSubTask">Add</button>
      </div>

      <div class="checklist-items">
        <div class="checklist-item" *ngFor="let st of subTasks" [class.completed]="st.status === 3">
          <mat-checkbox 
            [checked]="st.status === 3" 
            (change)="toggleSubTask(st, $event.checked)"
            [disabled]="isViewOnly">
          </mat-checkbox>
          <span class="st-title">{{ st.title }}</span>
        </div>
      </div>
    </div>

    <!-- Comments & Activity Section -->
    <div class="comments-section" *ngIf="isEdit">
      <h3>Comments & Activity</h3>
      
      <div class="comments-list">
        <div class="comment-item" *ngFor="let comment of comments">
          <div class="comment-avatar">{{ comment.commentByEmployeeName?.charAt(0) || 'U' }}</div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.commentByEmployeeName }}</span>
              <span class="comment-time">{{ comment.createdDate | date:'short' }}</span>
            </div>
            <div class="comment-text">{{ comment.commentText }}</div>
          </div>
        </div>
        <div class="no-comments" *ngIf="comments.length === 0">No comments yet. Start the conversation!</div>
      </div>

      <div class="comment-input-area">
        <div class="comment-avatar current-user">Me</div>
        <div class="comment-input-wrapper">
          <textarea [(ngModel)]="newCommentText" placeholder="Write a comment..." rows="2" [disabled]="isViewOnly"></textarea>
          <button mat-icon-button color="primary" (click)="addComment()" [disabled]="!newCommentText.trim() || isViewOnly || savingComment">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button mat-button type="button" (click)="goBack()">{{ isViewOnly ? 'Back' : 'Cancel' }}</button>
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

.attachment-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px dashed #cfcfcf;
  border-radius: 8px;
  background: #f8fafc;
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.attachment-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.attachment-link:hover { text-decoration: underline; }


.checklist-section {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}
.checklist-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 12px;
}
.checklist-add {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.checklist-add input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
}
.checklist-add input:focus {
  outline: none;
  border-color: #6366f1;
}
.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  transition: all 0.2s;
}
.checklist-item.completed {
  background: #f1f5f9;
}
.checklist-item.completed .st-title {
  text-decoration: line-through;
  color: #94a3b8;
}
.st-title {
  font-size: 14px;
  color: #334155;
}

.comments-section {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}
.comments-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 16px;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}
.comment-item {
  display: flex;
  gap: 12px;
}
.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}
.comment-avatar.current-user {
  background: #10b981;
}
.comment-content {
  flex: 1;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.comment-time {
  font-size: 12px;
  color: #94a3b8;
}
.comment-text {
  font-size: 14px;
  color: #475569;
  white-space: pre-wrap;
}
.no-comments {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 20px 0;
}
.comment-input-area {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.comment-input-wrapper {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px;
}
.comment-input-wrapper:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.2);
}
.comment-input-wrapper textarea {
  flex: 1;
  border: none;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  padding: 4px;
}
.comment-input-wrapper button {
  flex-shrink: 0;
}
  `]
})
export class TaskFormComponent implements OnInit, AfterViewChecked {
  @ViewChild(AddUpdateFormComponent) formComponent!: AddUpdateFormComponent;

  taskFormConfig!: FormConfig;
  isEdit = false;
  taskId?: number;
  initialDueDate: string | null = null;
  employees: any[] = [];
  projects: any[] = [];
  milestones: any[] = [];
  epics: any[] = [];
  stories: any[] = [];
  parentTasks: any[] = [];
  
  isViewOnly = false;
  canEditTask = false;
  loading = true;
  saving = false;
  subTasks: any[] = [];
  newSubTaskTitle: string = '';
  savingSubTask = false;

  comments: any[] = [];
  newCommentText: string = '';
  savingComment = false;
  bulkIds: number[] = [];
  
  currentTaskType: number = 1;
  isTaskTypeLocked: boolean = false;

  descriptionText = '';
  acceptanceCriteriaText = '';
  attachmentUrl = '';
  uploadingAttachment = false;

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
    private authService: AuthService,
    private location: Location,
    private statusService: TaskStatusService
  ) { }

  goBack(): void {
    this.location.back();
  }

  ngAfterViewChecked(): void {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      let minDateStr = `${yyyy}-${mm}-${dd}`;

      // If editing and the original date is in the past, allow up to that date 
      // so the form doesn't become natively invalid on load
      if (this.isEdit && this.initialDueDate) {
        if (this.initialDueDate < minDateStr) {
          minDateStr = this.initialDueDate.split('T')[0];
        }
      }

      dateInputs.forEach(input => {
        if (input.getAttribute('min') !== minDateStr) {
          input.setAttribute('min', minDateStr);
        }
      });
    }
  }

  getTaskTypeName(): string {
    const map: any = { 1: 'Epic', 2: 'Story', 3: 'Task', 4: 'Sub Task', 5: 'Bug' };
    return map[this.currentTaskType] || 'Task';
  }

  ngOnInit(): void {
    this.canEditTask = this.authService.isAdminOrHR() || this.authService.isManager();
    this.statusService.ensureLoaded();

    let empsLoaded = false;
    let projsLoaded = false;

    this.service.getEmployees().subscribe({
      next: (emps) => {
        this.employees = emps;
        empsLoaded = true;
        this.checkLoadStatus(empsLoaded, projsLoaded);
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        this.employees = [];
        empsLoaded = true;
        this.checkLoadStatus(empsLoaded, projsLoaded);
      }
    });

    this.service.getProjects().subscribe({
      next: (projs) => {
        this.projects = projs;
        projsLoaded = true;
        this.checkLoadStatus(empsLoaded, projsLoaded);
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.projects = [];
        projsLoaded = true;
        this.checkLoadStatus(empsLoaded, projsLoaded);
      }
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
      
      const taskTypeParam = qParams.get('taskType');
      this.isTaskTypeLocked = !!taskTypeParam;
      const defaultTaskType = taskTypeParam ? Number(taskTypeParam) : 3;

      const id = params.get('id');
      if (id && id !== 'create') {
        this.isEdit = true;
        this.taskId = Number(id);
        this.loadTaskData(this.taskId);
        this.loadSubTasks(this.taskId);
        this.loadComments(this.taskId);
      } else {
        this.isEdit = false;
        this.taskId = undefined;
        this.buildFormConfig({
          taskType: defaultTaskType,
          priority: 2,
          isRecurring: false,
          status: 1,
          completionPercentage: 0
        });
        this.loading = false;
      }
    });
  }

  loadTaskData(taskId: number) {
    this.service.getTaskById(taskId).subscribe({
      next: (task) => {
        const initialData: any = { ...task };
        if (task.dueDate) {
          initialData.dueDate = task.dueDate.split('T')[0];
        }
        
        // Ensure we load project tasks for hierarchy
        if (task.projectId) {
          const proj = this.projects.find(p => p.projectId === task.projectId);
          if (proj && proj.status === 4) {
            this.isViewOnly = true;
          }

          this.service.getTasks({ projectId: task.projectId }).subscribe({
            next: (tasks) => {
              this.epics = tasks.filter(t => t.taskType === 1);
              this.stories = tasks.filter(t => t.taskType === 2);
              this.parentTasks = tasks.filter(t => t.taskType === 3 || t.taskType === 5);
              
              this.service.getMilestones(task.projectId!).subscribe(m => {
                this.milestones = m;
                this.buildFormConfig(initialData);
                this.loading = false;
              });
            }
          });
        } else {
          this.buildFormConfig(initialData);
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching task details:', err);
        this.loading = false;
      }
    });
  }

  buildFormConfig(initialData: any) {
    this.currentTaskType = initialData.taskType || 1;
    this.descriptionText = initialData.description || '';
    this.acceptanceCriteriaText = initialData.acceptanceCriteria || '';
    this.attachmentUrl = initialData.attachmentUrl || '';
    if (initialData.dueDate) {
      this.initialDueDate = initialData.dueDate.split('T')[0];
    }

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
          { label: 'Epic', value: 1 },
          { label: 'Story', value: 2 },
          { label: 'Task', value: 3 },
          { label: 'Sub Task', value: 4 },
          { label: 'Bug', value: 5 }
        ],
        value: initialData.taskType,
        validations: [{ type: 'required', message: 'Task type is required' }],
        disabled: this.isViewOnly || this.isEdit || this.isTaskTypeLocked,
        onChange: (value: any, formGroup: FormGroup) => {
          this.onTaskTypeSelected(value, formGroup);
        }
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
          ...this.projects.map(p => ({ label: p.name, value: p.projectId }))
        ],
        value: initialData.projectId,
        validations: [{ type: 'required', message: 'Project is required' }],
        disabled: this.isViewOnly,
        onChange: (value: any, formGroup: FormGroup) => {
          this.onProjectSelected(value, formGroup);
          this.loadEpicsAndParentTasks(value, formGroup);
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
        name: 'parentTaskId',
        label: initialData.taskType === 1 ? 'Link to Parent (Optional)' : (initialData.taskType === 3 ? 'Link to Story (Optional)' : (initialData.taskType === 4 ? 'Link to Parent Task (Optional)' : 'Link to Epic (Optional)')),
        type: 'select',
        options: [
          { label: 'None', value: null },
          ...(initialData.taskType === 1 ? [] : (initialData.taskType === 3 ? this.stories : (initialData.taskType === 4 ? this.parentTasks : this.epics))).map(t => ({ label: t.title, value: t.taskItemId }))
        ],
        value: initialData.parentTaskId,
        disabled: this.isViewOnly,
        hidden: initialData.taskType === 1
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
        validations: [
          { type: 'required', message: 'Due date is required' },
          {
            type: 'custom' as any,
            message: 'Due date cannot be in the past',
            validator: (value: any) => {
              if (!value) return true;
              const selectedDate = new Date(value);
              selectedDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (this.isEdit && value === initialData.dueDate) {
                return true;
              }
              
              return selectedDate >= today;
            }
          }
        ],
        disabled: this.isViewOnly,
        onChange: (value: any, formGroup: FormGroup) => {
          if (value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let workingDays = 0;
            // Iterate from today to selected date
            let currentDate = new Date(today);
            while (currentDate <= selectedDate) {
              // Skip weekends (0 = Sunday, 6 = Saturday)
              if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                workingDays++;
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Assume 8 hours per working day
            const calculatedHours = workingDays > 0 ? workingDays * 8 : 8; // default to at least 8 hours
            formGroup.get('estimatedHours')?.setValue(calculatedHours);
          }
        }
      },
      {
        name: 'estimatedHours',
        label: 'Estimated Hours',
        type: 'text',
        value: initialData.estimatedHours !== undefined ? initialData.estimatedHours : '',
        validations: [{ type: 'required', message: 'Estimated hours is required' }],
        disabled: this.isViewOnly
      }
    ];

    if (this.isEdit) {
      fields.push(
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: this.statusService.getStatuses().filter(s => s.isActive).map(s => ({
            label: s.name,
            value: s.taskStatusId
          })),
          value: initialData.status,
          disabled: this.isViewOnly
        }
      );
    }

    fields.push(
      {
        name: 'tags',
        label: 'Labels / Tags',
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

  onEmployeeSelected(employeeId: string, formGroup: FormGroup) {
    if (employeeId) {
      const emp = this.employees.find(e => e.employeeId === employeeId);
      if (emp) {
        formGroup.patchValue({ assignedToEmployeeName: `${emp.firstName} ${emp.lastName}` });
      }
    } else {
      formGroup.patchValue({ assignedToEmployeeName: '' });
    }
  }

  onTaskTypeSelected(taskType: number, formGroup: FormGroup) {
    this.currentTaskType = taskType;
    if (!this.taskFormConfig || !this.taskFormConfig.sections || !this.taskFormConfig.sections[0]) return;
    
    const parentTaskCol = this.taskFormConfig.sections[0].fields.find((c: any) => c.name === 'parentTaskId');
    if (parentTaskCol) {
      let optionsList: any[] = [];
      if (taskType === 1) {
        // Epic
        parentTaskCol.hidden = true;
        parentTaskCol.label = 'Link to Parent (Optional)';
        parentTaskCol.options = [{ label: 'None', value: null }];
        formGroup.patchValue({ parentTaskId: null });
      } else {
        parentTaskCol.hidden = false;
        if (taskType === 3) {
          // Task -> Links to Story
          parentTaskCol.label = 'Link to Story (Optional)';
          optionsList = this.stories;
          parentTaskCol.options = [
            { label: 'None', value: null },
            ...optionsList.map((t: any) => ({ label: t.title, value: t.taskItemId }))
          ];
        } else {
          parentTaskCol.label = taskType === 4 ? 'Link to Parent Task (Optional)' : 'Link to Epic (Optional)';
          optionsList = taskType === 4 ? this.parentTasks : this.epics;
          parentTaskCol.options = [
            { label: 'None', value: null },
            ...optionsList.map((t: any) => ({ label: t.title, value: t.taskItemId }))
          ];
        }
      }
      
      // If current value is not in options, clear it
      const currentVal = formGroup.get('parentTaskId')?.value;
      if (currentVal && !optionsList.find((t: any) => t.taskItemId === currentVal)) {
        formGroup.patchValue({ parentTaskId: null });
      }
    }
  }

  loadEpicsAndParentTasks(projectId: any, formGroup?: FormGroup) {
    if (projectId) {
      this.service.getTasks({ projectId: projectId }).subscribe({
        next: (tasks) => {
          this.epics = tasks.filter(t => t.taskType === 1);
          this.stories = tasks.filter(t => t.taskType === 2);
          this.parentTasks = tasks.filter(t => t.taskType === 3 || t.taskType === 5); // Task, Bug
          
          if (formGroup) {
            const currentType = formGroup.get('taskType')?.value;
            this.onTaskTypeSelected(currentType, formGroup);
          }
        },
        error: (err) => console.error('Failed to load project tasks for hierarchy:', err)
      });
    } else {
      this.epics = [];
      this.stories = [];
      this.parentTasks = [];
      if (formGroup) {
        const currentType = formGroup.get('taskType')?.value;
        this.onTaskTypeSelected(currentType, formGroup);
      }
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
    const estHours = Number(val.estimatedHours);
    if (!val.estimatedHours || isNaN(estHours) || estHours <= 0) {
      alert('Please enter a valid Estimated Hours greater than 0.');
      this.saving = false;
      return;
    }
    val.estimatedHours = estHours;

    val.isRecurring = val.isRecurring || false;
    val.actualHours = val.actualHours || 0;

    val.milestoneId = (val.milestoneId === '' || val.milestoneId === 'null' || val.milestoneId == null) ? null : Number(val.milestoneId);
    val.parentTaskId = (val.parentTaskId === '' || val.parentTaskId === 'null' || val.parentTaskId == null) ? null : Number(val.parentTaskId);
    val.projectId = (val.projectId === '' || val.projectId === 'null' || val.projectId == null) ? null : Number(val.projectId);

    const selectedEmp = this.employees.find(e => e.employeeId === val.assignedToEmployeeId);
    if (selectedEmp) {
      val.assignedToEmployeeName = `${selectedEmp.firstName} ${selectedEmp.lastName}`.trim();
    }

    val.description = this.descriptionText;
    val.acceptanceCriteria = this.acceptanceCriteriaText;
    if (this.attachmentUrl) {
      val.attachmentUrl = this.attachmentUrl;
    }

    if (this.isEdit) {
      this.service.updateTask({ ...val, taskItemId: this.taskId! }).subscribe({
        next: () => {
          this.saving = false;
          if (this.currentTaskType === 1) {
            this.router.navigate(['/epics']);
          } else {
            this.router.navigate(['/tasks']);
          }
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
          if (this.currentTaskType === 1) {
            this.router.navigate(['/epics']);
          } else {
            this.router.navigate(['/tasks']);
          }
        },
        error: (err) => {
          console.error('Create Task failed:', err);
          this.saving = false;
        }
      });
    }
  }

  loadSubTasks(taskId: number) {
    this.service.getSubTasks(taskId).subscribe({
      next: (data: any) => {
        this.subTasks = data.value ? data.value : data;
      },
      error: (err) => console.error('Failed to load sub-tasks', err)
    });
  }

  addSubTask() {
    if (!this.newSubTaskTitle.trim() || !this.taskId) return;
    this.savingSubTask = true;

    // We can't access formComponent.formGroup directly easily if it's protected or doesn't exist,
    // but we can just use the current task's id. The priority/assignment can be defaulted.
    
    const newSubTask = {
      title: this.newSubTaskTitle.trim(),
      taskType: 1, // Bug/SubTask
      priority: 1, // Default Medium
      status: 0, // ToDo
      parentTaskId: this.taskId,
      projectId: undefined,
      milestoneId: undefined,
      assignedToEmployeeId: '',
      assignedToEmployeeName: '',
      dueDate: new Date().toISOString(),
      estimatedHours: 0,
      isRecurring: false
    };

    this.service.createTask(newSubTask).subscribe({
      next: () => {
        this.newSubTaskTitle = '';
        this.savingSubTask = false;
        this.loadSubTasks(this.taskId!);
      },
      error: (err) => {
        console.error('Failed to create sub-task', err);
        this.savingSubTask = false;
      }
    });
  }

  toggleSubTask(subTask: any, isChecked: boolean) {
    const newStatus = isChecked ? 3 : 0; // Completed (3) or ToDo (0)
    subTask.status = newStatus; // Optimistic update
    
    // updateTask takes a single UpdateTaskItem object
    const updatePayload = {
      ...subTask,
      status: newStatus,
      completionPercentage: isChecked ? 100 : 0
    };

    this.service.updateTask(updatePayload).subscribe({
      next: () => {
        // Successfully updated
        this.loadSubTasks(this.taskId!);
      },
      error: (err) => {
        console.error('Failed to update sub-task status', err);
        // Revert optimistic update
        subTask.status = isChecked ? 0 : 3;
      }
    });
  }

  loadComments(taskId: number) {
    this.service.getComments(taskId).subscribe({
      next: (data: any) => {
        this.comments = data.value ? data.value : data;
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  addComment() {
    if (!this.newCommentText.trim() || !this.taskId) return;
    this.savingComment = true;

    // Use JSON string for body as expected by the API
    this.service.addComment(this.taskId, this.newCommentText.trim()).subscribe({
      next: () => {
        this.newCommentText = '';
        this.savingComment = false;
        this.loadComments(this.taskId!);
      },
      error: (err) => {
        console.error('Failed to add comment', err);
        this.savingComment = false;
      }
    });
  }

  triggerFileInput() {
    document.getElementById('fileUpload')?.click();
  }

  onAttachmentSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadingAttachment = true;
      this.service.uploadFile(file).subscribe({
        next: (res: any) => {
          this.attachmentUrl = res.url;
          this.uploadingAttachment = false;
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.uploadingAttachment = false;
          alert('Failed to upload file.');
        }
      });
    }
  }

  removeAttachment() {
    this.attachmentUrl = '';
  }
}
