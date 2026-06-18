import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { AuthService } from '../../shared/auth.service';
import { KPIDefinition, EmployeeKPI } from '../../shared/models/interfaces';
import { KpiDefinitionDialogComponent } from '../kpi-definition-dialog/kpi-definition-dialog.component';
import { AssignKpiDialogComponent } from '../assign-kpi-dialog/assign-kpi-dialog.component';
import { UpdateKpiDialogComponent } from '../update-kpi-dialog/update-kpi-dialog.component';

@Component({
  selector: 'app-kpi-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatChipsModule, MatTableModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule
  ],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1><mat-icon>flag</mat-icon> KPI Management</h1>
    <div class="header-actions" *ngIf="canManage">
      <button mat-stroked-button color="primary" (click)="openAssignDialog()"><mat-icon>assignment_ind</mat-icon> Assign KPI</button>
      <button mat-raised-button color="primary" (click)="openDefinitionDialog()"><mat-icon>add</mat-icon> Define KPI</button>
    </div>
  </div>
  <mat-tab-group>
    <mat-tab label="My KPIs">
      <div class="tab-content">
        <div class="kpi-grid" *ngIf="employeeKPIs.length">
          <mat-card class="kpi-card" *ngFor="let kpi of employeeKPIs">
            <mat-card-header>
              <mat-icon mat-card-avatar>flag</mat-icon>
              <mat-card-title>{{ kpi.kpiName }}</mat-card-title>
              <mat-card-subtitle>
                {{ kpi.category }} | {{ kpi.unit }} <br/>
                <span class="emp-name" *ngIf="kpi.employeeName"><mat-icon inline>person</mat-icon> {{ kpi.employeeName }}</span>
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="kpi-values">
                <div class="kv-item"><span class="kv-val">{{ kpi.targetValue }}</span><span class="kv-lbl">Target</span></div>
                <div class="kv-item"><span class="kv-val green">{{ kpi.achievedValue }}</span><span class="kv-lbl">Achieved</span></div>
                <div class="kv-item"><span class="kv-val" [class.green]="kpi.score>=80" [class.red]="kpi.score<60">{{ kpi.score | number:'1.0-1' }}%</span><span class="kv-lbl">Score</span></div>
              </div>
              <mat-progress-bar mode="determinate" [value]="kpi.score"
                [color]="kpi.score >= 80 ? 'primary' : kpi.score >= 50 ? 'accent' : 'warn'"></mat-progress-bar>
              <div class="kpi-period">{{ kpi.periodStart | date:'dd MMM' }} – {{ kpi.periodEnd | date:'dd MMM yyyy' }}</div>
            </mat-card-content>
            <mat-card-actions align="end" *ngIf="kpi.targetValue > 0">
              <button mat-button color="primary" (click)="openUpdateDialog(kpi)">
                <mat-icon>track_changes</mat-icon> Update Progress
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
        <div class="empty" *ngIf="!employeeKPIs.length && !loading">No KPIs assigned yet.</div>
      </div>
    </mat-tab>
    <mat-tab label="KPI Definitions">
      <div class="tab-content">
        <table mat-table [dataSource]="definitions" class="w-full">
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>KPI</th><td mat-cell *matCellDef="let k">{{ k.name }}</td></ng-container>
          <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let k">{{ k.category }}</td></ng-container>
          <ng-container matColumnDef="unit"><th mat-header-cell *matHeaderCellDef>Unit</th><td mat-cell *matCellDef="let k">{{ k.unit }}</td></ng-container>
          <ng-container matColumnDef="targetType"><th mat-header-cell *matHeaderCellDef>Frequency</th><td mat-cell *matCellDef="let k">{{ k.targetTypeName }}</td></ng-container>
          <ng-container matColumnDef="scope"><th mat-header-cell *matHeaderCellDef>Scope</th>
            <td mat-cell *matCellDef="let k"><mat-chip>{{ k.isGlobal ? 'Global' : 'Department' }}</mat-chip></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['name','category','unit','targetType','scope']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['name','category','unit','targetType','scope']"></tr>
        </table>
      </div>
    </mat-tab>
  </mat-tab-group>
</div>`,
  styles: [`
.page-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; h1 { display: flex; align-items: center; gap: 8px; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; mat-icon { color: #6366f1; } } }
.header-actions { display: flex; gap: 12px; }
.tab-content { padding: 20px 0; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.kpi-card { border-radius: 16px !important; }
.kpi-values { display: flex; justify-content: space-around; margin: 12px 0; text-align: center; }
.kv-item { }
.kv-val { display: block; font-size: 1.5rem; font-weight: 700; color: #1e293b; &.green { color: #10b981; } &.red { color: #ef4444; } }
.kv-lbl { font-size: 0.75rem; color: #94a3b8; }
.kpi-period { font-size: 0.75rem; color: #94a3b8; margin-top: 8px; text-align: right; }
.emp-name { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #6366f1; font-weight: 500; margin-top: 4px; }
.emp-name mat-icon { font-size: 16px; width: 16px; height: 16px; }
.w-full { width: 100%; }
.empty { text-align: center; color: #94a3b8; padding: 48px; }
  `]
})
export class KpiListComponent implements OnInit {
  definitions: KPIDefinition[] = [];
  employeeKPIs: EmployeeKPI[] = [];
  loading = true;
  canManage = false;

  constructor(private service: ProgressTrackerService, private dialog: MatDialog, private authService: AuthService) {}

  ngOnInit(): void {
    this.canManage = this.authService.isAdminOrHR() || this.authService.isManager();
    this.loadData();
  }

  loadData(): void {
    let employeeId = localStorage.getItem('employeeId');
    if (!employeeId || employeeId === 'undefined') {
      employeeId = localStorage.getItem('EmployeeId');
    }
    if (!employeeId || employeeId === 'undefined') {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          employeeId = userObj.employeId || userObj.EmployeeId || userObj.employeeId;
        } catch (e) { }
      }
    }

    this.loading = true;
    this.service.getKPIDefinitions().subscribe(d => { this.definitions = d; this.loading = false; });
    
    if (this.canManage) {
      this.service.getEmployeeKPIs().subscribe(k => this.employeeKPIs = k);
    } else {
      let filters: any = {};
      if (employeeId && employeeId !== 'me' && employeeId !== 'undefined') {
        filters.employeeId = employeeId;
      }
      this.service.getEmployeeKPIs(filters).subscribe(k => this.employeeKPIs = k);
    }
  }

  openDefinitionDialog() {
    const dialogRef = this.dialog.open(KpiDefinitionDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  openAssignDialog() {
    const dialogRef = this.dialog.open(AssignKpiDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  openUpdateDialog(kpi: EmployeeKPI) {
    const dialogRef = this.dialog.open(UpdateKpiDialogComponent, { 
      width: '450px',
      data: { kpi: kpi }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }
}
