import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';

@Component({
  selector: 'app-milestone-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Create New Milestone</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="milestone-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project</mat-label>
          <mat-select formControlName="projectId">
            <mat-option *ngFor="let proj of projects" [value]="proj.projectId">
              {{ proj.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Milestone Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter milestone name">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Describe the milestone..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Due Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" [min]="minDate">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .milestone-form { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; min-width: 400px; }
    .full-width { width: 100%; }
  `]
})
export class MilestoneDialogComponent implements OnInit {
  form: FormGroup;
  projects: any[] = [];
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MilestoneDialogComponent>,
    private service: ProgressTrackerService,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number }
  ) {
    this.form = this.fb.group({
      projectId: [{ value: data?.projectId || null, disabled: !!data?.projectId }, Validators.required],
      name: ['', Validators.required],
      description: [''],
      dueDate: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.service.getProjects().subscribe(projs => {
      this.projects = projs;
    });
  }

  save(): void {
    if (this.form.valid) {
      const payload = {
        ...this.form.value,
        projectId: this.form.getRawValue().projectId
      };
      this.dialogRef.close(payload);
    }
  }
}
