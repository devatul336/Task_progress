import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { ManagerDashboard, EmployeePerformanceSummary, TaskItem } from '../../shared/models/interfaces';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatChipsModule, MatTableModule, MatSortModule,
    MatTooltipModule, MatBadgeModule, BaseChartDirective
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ManagerDashboardComponent implements OnInit {
  dashboard: ManagerDashboard | null = null;
  loading = true;
  isLeaderboardExpanded = false;
  displayedColumns = ['rank', 'employeeName', 'totalTasks', 'completedTasks', 'taskCompletionRate', 'onTimeCompletionRate', 'kpiAchievementRate', 'overallScore', 'performanceBand', 'actions'];
  expandedElement: EmployeePerformanceSummary | null = null;
  employeeTasks: { [employeeId: string]: TaskItem[] } = {};
  loadingTasks: { [employeeId: string]: boolean } = {};
  canReview = false;
  ratings: { [employeeId: string]: number } = {};

  trackByEmployee(index: number, emp: EmployeePerformanceSummary): string {
    return emp.employeeId;
  }

  toggleRow(element: EmployeePerformanceSummary, event: Event) {
    event.stopPropagation();
    if (this.expandedElement === element) {
      this.expandedElement = null;
    } else {
      this.expandedElement = element;
      if (!this.employeeTasks[element.employeeId]) {
        this.loadingTasks[element.employeeId] = true;
        this.service.getTasks({ employeeId: element.employeeId }).subscribe({
          next: (tasks) => {
            this.employeeTasks[element.employeeId] = tasks;
            this.loadingTasks[element.employeeId] = false;
          },
          error: () => {
            this.loadingTasks[element.employeeId] = false;
          }
        });
      }
    }
  }

  setRating(employeeId: string, rating: number, event: Event) {
    event.stopPropagation();
    this.ratings[employeeId] = rating;
    // In a real app, you would call an API here to save the rating.
  }

  // Bar chart: Team completion by employee
  teamCompletionData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Completion %', data: [], backgroundColor: [] }] };
  teamCompletionType: ChartType = 'bar';
  teamCompletionOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    scales: { x: { beginAtZero: true, max: 100 } },
    plugins: { legend: { display: false } }
  };

  // Line chart: Weekly progress
  weeklyChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { label: 'Total Tasks', data: [], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4 },
      { label: 'Completed', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }
    ]
  };
  weeklyChartType: ChartType = 'line';
  weeklyChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'top' } }
  };

  constructor(private service: ProgressTrackerService, private authService: AuthService) { }

  ngOnInit(): void {
    this.canReview = this.authService.isAdminOrHR() || this.authService.isManager();
    let managerId = localStorage.getItem('employeeId');
    if (!managerId || managerId === 'undefined') {
      managerId = localStorage.getItem('EmployeeId');
    }
    if (!managerId || managerId === 'undefined') {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          managerId = userObj.employeId || userObj.EmployeeId;
        } catch (e) { }
      }
    }
    if (!managerId || managerId === 'undefined') {
      managerId = 'me';
    }
    const deptId = localStorage.getItem('departmentId') || undefined;
    this.loadDashboard(managerId, deptId);
  }

  loadDashboard(managerId: string, deptId?: string): void {
    this.loading = true;
    this.service.getManagerDashboard(managerId, deptId).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.buildCharts(data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  buildCharts(data: ManagerDashboard): void {
    const perf = data.teamPerformance?.slice(0, 10) ?? [];
    const colors = perf.map(e =>
      e.taskCompletionRate >= 80 ? '#10b981' : e.taskCompletionRate >= 60 ? '#3b82f6' : e.taskCompletionRate >= 40 ? '#f59e0b' : '#ef4444'
    );
    this.teamCompletionData = {
      labels: perf.map(e => e.employeeName),
      datasets: [{ label: 'Task Completion %', data: perf.map(e => e.taskCompletionRate), backgroundColor: colors, borderRadius: 6 }]
    };

    const weekly = data.weeklyTeamProgress ?? [];
    this.weeklyChartData = {
      labels: weekly.map(w => w.week),
      datasets: [
        { ...this.weeklyChartData.datasets[0], data: weekly.map(w => w.totalTasks) },
        { ...this.weeklyChartData.datasets[1], data: weekly.map(w => w.completedTasks) }
      ]
    };
  }

  getBandClass(band: string): string {
    return `band-${band.toLowerCase().replace(' ', '-')}`;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  getDaysLeft(dueDate: string): string {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `${diff}d left`;
  }

  getStatusLabel(status: number): string {
    const map: any = { 1: 'To Do', 2: 'In Progress', 3: 'Under Review', 4: 'Completed', 5: 'On Hold', 6: 'Cancelled' };
    return map[status] || 'Unknown';
  }

  getPriorityLabel(priority: number): string {
    const map: any = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return map[priority] || 'Medium';
  }
}
