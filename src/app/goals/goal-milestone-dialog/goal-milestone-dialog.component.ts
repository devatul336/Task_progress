import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';

@Component({
  selector: 'app-goal-milestone-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule, AddUpdateFormComponent
  ],
  templateUrl: './goal-milestone-dialog.component.html',
  styleUrls: ['./goal-milestone-dialog.component.scss']
})
export class GoalMilestoneDialogComponent implements OnInit {
  formConfig!: FormConfig;

  constructor(
    public dialogRef: MatDialogRef<GoalMilestoneDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.formConfig = {
      formTitle: 'Add Milestone',
      submitLabel: 'Add Milestone',
      cancelLabel: 'Cancel',
      maxColsPerRow: 1,
      sections: [
        {
          title: '',
          fields: [
            {
              name: 'title',
              label: 'Milestone Title',
              type: 'text',
              placeholder: 'e.g. Gather Requirements',
              required: true,
              colSpan: 12
            },
            {
              name: 'dueDate',
              label: 'Due Date',
              type: 'date',
              required: true,
              colSpan: 12
            }
          ]
        }
      ],
      onSubmit: (formData: any) => {
        this.dialogRef.close({
          title: formData.title,
          dueDate: new Date(formData.dueDate).toISOString()
        });
      },
      onCancel: () => {
        this.dialogRef.close();
      }
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
