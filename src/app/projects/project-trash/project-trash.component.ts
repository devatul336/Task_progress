import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TrackerProject } from '../../shared/models/interfaces';

@Component({
  selector: 'app-project-trash',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule
  ],
  template: `
<div class="page-container">
  <div class="page-header">
    <div style="display: flex; align-items: center; gap: 16px;">
      <button mat-icon-button routerLink="/projects" color="primary">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>Trash (Deleted Projects)</h1>
    </div>
  </div>

  <div class="table-container" *ngIf="!loading">
    <table mat-table [dataSource]="trashedProjects" class="jira-table">
      
      <!-- Name Column -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef> Name </th>
        <td mat-cell *matCellDef="let proj">
          <div class="project-name-cell">
            <span class="project-name-text">{{ proj.name }}</span>
          </div>
        </td>
      </ng-container>

      <!-- Key Column -->
      <ng-container matColumnDef="key">
        <th mat-header-cell *matHeaderCellDef> Key </th>
        <td mat-cell *matCellDef="let proj"> {{ getProjectKey(proj.name) }} </td>
      </ng-container>

      <!-- Deleted Date Column (Using ModifiedDate) -->
      <ng-container matColumnDef="deletedDate">
        <th mat-header-cell *matHeaderCellDef> Deleted On </th>
        <td mat-cell *matCellDef="let proj"> {{ proj.modifiedDate | date:'mediumDate' }} </td>
      </ng-container>

      <!-- Actions Column -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef style="width: 120px; text-align: right;"></th>
        <td mat-cell *matCellDef="let proj" style="text-align: right;">
          <button mat-stroked-button color="primary" (click)="restoreProject(proj)">
            <mat-icon>restore</mat-icon> Restore
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="jira-row"></tr>
      
      <!-- Row shown when there is no matching data. -->
      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell empty-cell" colspan="4">
          <div class="empty-state">Trash is empty.</div>
        </td>
      </tr>
    </table>
  </div>
</div>
  `,
  styles: [`
.page-container { padding: 32px 40px; background: #FFFFFF; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 500; color: #172B4D; margin: 0; line-height: 28px; }

.table-container { border: none; overflow-x: auto; }
.jira-table { width: 100%; box-shadow: none; border-collapse: separate; border-spacing: 0; }
.jira-table th.mat-header-cell { color: #626F86; font-size: 12px; font-weight: 600; text-transform: none; border-bottom: 2px solid #DFE1E6; padding: 12px 16px; background: white; }
.jira-table td.mat-cell { color: #172B4D; font-size: 14px; border-bottom: 1px solid #DFE1E6; padding: 12px 16px; transition: background-color 0.1s; }
.jira-row:hover td { background-color: #F4F5F7; }

.project-name-cell { display: flex; align-items: center; gap: 12px; }
.project-name-text { color: #172B4D; font-weight: 500; font-size: 14px; }

.empty-cell { text-align: center; padding: 48px !important; border-bottom: none !important; }
.empty-state { color: #626F86; font-size: 14px; }
  `]
})
export class ProjectTrashComponent implements OnInit {
  trashedProjects: TrackerProject[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'key', 'deletedDate', 'actions'];

  constructor(private service: ProgressTrackerService) {}

  ngOnInit(): void {
    this.loadTrashedProjects();
  }

  loadTrashedProjects(): void {
    this.loading = true;
    this.service.getTrashedProjects().subscribe({
      next: (projects) => {
        this.trashedProjects = projects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load trash', err);
        this.loading = false;
      }
    });
  }

  restoreProject(proj: TrackerProject): void {
    if (confirm(`Are you sure you want to restore "${proj.name}"?`)) {
      this.service.restoreProject(proj.projectId).subscribe({
        next: () => {
          this.loadTrashedProjects();
        },
        error: (err) => {
          console.error('Failed to restore project', err);
          console.error('Failed to restore project');
        }
      });
    }
  }

  getProjectKey(name: string): string {
    if (!name) return 'PRJ';
    const words = name.split(' ');
    if (words.length > 1) {
        return words.map(w => w.charAt(0).toUpperCase()).join('').substring(0, 4);
    }
    return name.substring(0, 3).toUpperCase();
  }
}
