import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { TrackerProject } from '../../shared/models/interfaces';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, 
    MatChipsModule, MatProgressBarModule, MatDialogModule, MatTableModule, 
    MatMenuModule, MatInputModule, MatFormFieldModule, FormsModule
  ],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Projects</h1>
    <div style="display: flex; gap: 12px;">
      <button mat-icon-button routerLink="/projects/trash" style="color: #626F86; margin-right: 8px;" title="View Trash">
        <mat-icon>delete_outline</mat-icon>
      </button>
      <button mat-raised-button color="primary" class="jira-btn-primary" style="background-color: #E9EAF0 !important; color: #172B4D !important;" (click)="openTaskDialog()">Create issue</button>
      <button mat-raised-button color="primary" class="jira-btn-primary" (click)="openDialog()">Create project</button>
    </div>
  </div>

  <div class="filters-row">
    <div class="search-box">
      <input type="text" placeholder="Search projects" [(ngModel)]="searchQuery" (input)="filterProjects()">
      <mat-icon>search</mat-icon>
    </div>
    <!-- Placeholder for Jira dropdowns -->
  </div>

  <div class="table-container" *ngIf="!loading">
    <table mat-table [dataSource]="filteredProjects" class="jira-table">
      
      <!-- Star Column -->
      <ng-container matColumnDef="star">
        <th mat-header-cell *matHeaderCellDef style="width: 48px; text-align: center;"> 
          <mat-icon style="color: #626F86; font-size: 20px; vertical-align: middle;">star_border</mat-icon> 
        </th>
        <td mat-cell *matCellDef="let proj" style="text-align: center;"> 
          <mat-icon style="color: #626F86; font-size: 20px; cursor: pointer; vertical-align: middle;">star_border</mat-icon> 
        </td>
      </ng-container>

      <!-- Name Column -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef> Name </th>
        <td mat-cell *matCellDef="let proj">
          <div class="project-name-cell" [routerLink]="['/projects', proj.projectId]">
            <img class="project-avatar" [src]="getProjectAvatar(proj)" alt="Project Avatar">
            <span class="project-name-text">{{ proj.name }}</span>
          </div>
        </td>
      </ng-container>

      <!-- Key Column -->
      <ng-container matColumnDef="key">
        <th mat-header-cell *matHeaderCellDef> Key </th>
        <td mat-cell *matCellDef="let proj"> {{ getProjectKey(proj.name) }} </td>
      </ng-container>

      <!-- Type Column -->
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef> Type </th>
        <td mat-cell *matCellDef="let proj"> Software project </td>
      </ng-container>

      <!-- Lead Column -->
      <ng-container matColumnDef="lead">
        <th mat-header-cell *matHeaderCellDef> Lead </th>
        <td mat-cell *matCellDef="let proj">
          <div class="lead-cell">
            <div class="lead-avatar">{{ getInitials(proj.projectManagerName) }}</div>
            <span>{{ proj.projectManagerName || 'Unassigned' }}</span>
          </div>
        </td>
      </ng-container>

      <!-- Actions Column -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef style="width: 48px; text-align: right;"></th>
        <td mat-cell *matCellDef="let proj" style="text-align: right;">
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_horiz</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="editProject(proj)">Edit project</button>
            <button mat-menu-item (click)="deleteProject(proj)">Move to trash</button>
          </mat-menu>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="jira-row"></tr>
      
      <!-- Row shown when there is no matching data. -->
      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell empty-cell" colspan="6">
          <div class="empty-state" *ngIf="projects.length > 0">No projects match your search criteria.</div>
          <div class="empty-state" *ngIf="projects.length === 0">You don't have any projects yet.</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="loading-state" *ngIf="loading" style="padding: 40px; text-align: center;">
    <mat-progress-bar mode="indeterminate" style="max-width: 400px; margin: 0 auto;"></mat-progress-bar>
  </div>
</div>`,
  styles: [`
.page-container { padding: 32px 40px; background: #FFFFFF; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 500; color: #172B4D; margin: 0; line-height: 28px; }
.jira-btn-primary { background-color: #0052CC !important; color: white !important; font-weight: 500; box-shadow: none !important; border-radius: 3px; height: 32px; padding: 0 12px; font-size: 14px; line-height: 32px; }
.jira-btn-primary:hover { background-color: #0065FF !important; }

.filters-row { margin-bottom: 16px; display: flex; gap: 16px; }
.search-box { position: relative; width: 220px; }
.search-box input { width: 100%; height: 36px; border: 2px solid #DFE1E6; border-radius: 3px; padding: 0 8px 0 32px; font-size: 14px; color: #172B4D; transition: background-color 0.2s, border-color 0.2s; background: #FAFBFC; box-sizing: border-box; }
.search-box input:hover { background: #EBECF0; border-color: #DFE1E6; }
.search-box input:focus { background: #FFFFFF; border-color: #4C9AFF; outline: none; }
.search-box mat-icon { position: absolute; left: 8px; top: 8px; font-size: 20px; color: #626F86; pointer-events: none; }

.table-container { border: none; overflow-x: auto; }
.jira-table { width: 100%; box-shadow: none; border-collapse: separate; border-spacing: 0; }
.jira-table th.mat-header-cell { color: #626F86; font-size: 12px; font-weight: 600; text-transform: none; border-bottom: 2px solid #DFE1E6; padding: 12px 16px; background: white; }
.jira-table td.mat-cell { color: #172B4D; font-size: 14px; border-bottom: 1px solid #DFE1E6; padding: 12px 16px; transition: background-color 0.1s; }
.jira-row:hover td { background-color: #F4F5F7; }

.project-name-cell { display: flex; align-items: center; gap: 12px; cursor: pointer; text-decoration: none; }
.project-name-text { color: #0052CC; font-weight: 500; font-size: 14px; }
.project-name-cell:hover .project-name-text { text-decoration: underline; color: #0065FF; }
.project-avatar { width: 24px; height: 24px; border-radius: 3px; object-fit: cover; background: #0052CC; }

.lead-cell { display: flex; align-items: center; gap: 8px; }
.lead-avatar { width: 24px; height: 24px; border-radius: 50%; background: #0052CC; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }

.empty-cell { text-align: center; padding: 48px !important; border-bottom: none !important; }
.empty-state { color: #626F86; font-size: 14px; }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: TrackerProject[] = [];
  filteredProjects: TrackerProject[] = [];
  loading = true;
  searchQuery = '';
  
  displayedColumns: string[] = ['star', 'name', 'key', 'type', 'lead', 'actions'];

  constructor(private service: ProgressTrackerService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.service.getProjects().subscribe({ 
      next: (p) => { 
        this.projects = p.map(proj => {
          (proj as any)['_attachmentUrl'] = this.getAttachmentUrl(proj.description);
          (proj as any)['_cleanDescription'] = this.getCleanDescription(proj.description);
          return proj;
        });
        this.filterProjects();
        this.loading = false; 
      }, 
      error: () => { 
        this.loading = false; 
        this.projects = [];
        this.filterProjects();
      } 
    });
  }

  filterProjects(): void {
    if (!this.searchQuery) {
      this.filteredProjects = [...this.projects];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredProjects = this.projects.filter(p => 
        p.name.toLowerCase().includes(q) || 
        this.getProjectKey(p.name).toLowerCase().includes(q) ||
        (p.projectManagerName && p.projectManagerName.toLowerCase().includes(q))
      );
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

  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  getProjectAvatar(proj: any): string {
      const colors = ['172B4D', '0052CC', '00875A', 'FF991F', 'DE350B', '6554C0', '00B8D9'];
      const colorIndex = proj.name ? proj.name.charCodeAt(0) % colors.length : 0;
      const color = colors[colorIndex];
      const firstLetter = (proj.name || 'P').charAt(0).toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#${color}"/><text x="12" y="16" font-family="sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${firstLetter}</text></svg>`;
      return 'data:image/svg+xml;base64,' + btoa(svg);
  }

  getAttachmentUrl(desc: string | undefined | null): string | null {
    if (!desc) return null;
    const match = desc.match(/Attachment:\\s*(http[^\\s]+)/);
    return match ? match[1] : null;
  }
  
  getCleanDescription(desc: string | undefined | null): string {
    if (!desc) return '';
    return desc.replace(/\\n*\\s*Attachment:\\s*http[^\\s]+/, '');
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects();
      }
    });
  }

  editProject(proj: any): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '600px',
      data: { project: proj }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProjects();
    });
  }

  deleteProject(proj: any): void {
    if (confirm(`Are you sure you want to move project "${proj.name}" to trash?`)) {
      this.service.deleteProject(proj.projectId).subscribe({
        next: () => this.loadProjects(),
        error: (err) => console.error('Failed to delete project')
      });
    }
  }

  openTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '700px'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Typically, you might reload tasks here, but since this is the projects view, 
      // there's no immediate project list change needed when a task is created.
    });
  }
}
