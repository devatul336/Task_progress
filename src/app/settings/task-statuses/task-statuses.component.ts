import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskStatusService } from '../../shared/task-status.service';
import { TaskStatusMaster } from '../../shared/models/interfaces';

@Component({
  selector: 'app-task-statuses',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatInputModule, MatSelectModule, MatCheckboxModule, ReactiveFormsModule
  ],
  templateUrl: './task-statuses.component.html',
  styleUrls: ['./task-statuses.component.scss']
})
export class TaskStatusesComponent implements OnInit {
  
  statuses: TaskStatusMaster[] = [];
  displayedColumns = ['displayOrder', 'name', 'category', 'colorClass', 'isActive', 'actions'];
  
  isEditing = false;
  editingId: number | null = null;
  statusForm!: FormGroup;
  categories: {value: number, label: string}[] = [];

  constructor(private taskStatusService: TaskStatusService, private fb: FormBuilder) {
    this.statusForm = this.fb.group({
      name: ['', Validators.required],
      category: [1, Validators.required],
      colorClass: ['#6366f1', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Fetch categories from backend API
    this.taskStatusService.getCategories().subscribe(cats => {
      this.categories = cats;
    });

    this.taskStatusService.ensureLoaded();
    this.taskStatusService.statuses$.subscribe(data => {
      this.statuses = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
    });
  }

  getCategoryLabel(categoryId: number): string {
    return this.categories.find(c => c.value === categoryId)?.label || 'Unknown';
  }

  startAdd() {
    this.isEditing = true;
    this.editingId = null;
    
    this.statusForm.patchValue({
      name: '',
      category: 1, // Default to To Do
      colorClass: '#6366f1',
      isActive: true
    });
  }

  editStatus(status: TaskStatusMaster) {
    this.isEditing = true;
    this.editingId = status.taskStatusId;
    this.statusForm.patchValue({
      name: status.name,
      category: status.category,
      colorClass: status.colorClass,
      isActive: status.isActive
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingId = null;
  }

  saveStatus() {
    if (this.statusForm.invalid) return;
    
    const data = this.statusForm.value;

    // Auto-calculate Display Order
    if (!this.editingId) {
      data.displayOrder = this.statuses.length > 0 ? Math.max(...this.statuses.map(s => s.displayOrder)) + 1 : 1;
    } else {
      const existing = this.statuses.find(s => s.taskStatusId === this.editingId);
      data.displayOrder = existing ? existing.displayOrder : 1;
    }

    if (this.editingId) {
      this.taskStatusService.updateStatus(this.editingId, data).subscribe(() => {
        this.cancelEdit();
      });
    } else {
      this.taskStatusService.createStatus(data).subscribe(() => {
        this.cancelEdit();
      });
    }
  }

  onColorChange(event: any) {
    this.statusForm.patchValue({ colorClass: event.target.value });
  }

  deleteStatus(id: number) {
    if (confirm('Are you sure you want to delete this status? Tasks with this status might break.')) {
      this.taskStatusService.deleteStatus(id).subscribe();
    }
  }
}
