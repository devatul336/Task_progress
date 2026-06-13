import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { OrgDashboard } from '../../shared/models/interfaces';

@Component({
  selector: 'app-org-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatChipsModule, MatTableModule, MatTooltipModule,
    MatTabsModule, BaseChartDirective
  ],
  templateUrl: './org-dashboard.component.html',
  styleUrls: ['./org-dashboard.component.scss']
})
export class OrgDashboardComponent implements OnInit {
  dashboard: OrgDashboard | null = null;
  loading = true;
  perfColumns = ['rank', 'employeeName', 'departmentName', 'totalTasks', 'taskCompletionRate', 'kpiAchievementRate', 'overallScore', 'performanceBand'];
  deptColumns = ['departmentName', 'employeeCount', 'totalTasks', 'completedTasks', 'taskCompletionRate', 'overallScore'];

  // Monthly trend line chart
  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { label: 'Total', data: [], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)', fill: true, tension: 0.4 },
      { label: 'Completed', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.4 },
      { label: 'Overdue', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: false, tension: 0.4 }
    ]
  };
  trendChartType: ChartType = 'line';
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'top' } }
  };

  // Department performance radar chart
  deptChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Completion Rate %', data: [], backgroundColor: [] }] };
  deptChartType: ChartType = 'bar';
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, max: 100 } },
    plugins: { legend: { display: false } }
  };

  // Task status doughnut
  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  statusChartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';
  statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '60%'
  };

  // Weekly org progress
  weeklyChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  weeklyChartType: ChartType = 'bar';
  weeklyChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    plugins: { legend: { position: 'top' } }
  };

  constructor(private service: ProgressTrackerService) {}

  errorMessage: string | null = null;

  ngOnInit(): void {
    this.service.getOrgDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.buildCharts(data);
        this.loading = false;
      },
      error: (err) => { 
        console.error('Error fetching dashboard:', err);
        this.errorMessage = 'Failed to load organization dashboard data. Please make sure the backend service is running and you have proper Admin access.';
        this.loading = false; 
      }
    });
  }

  buildCharts(data: OrgDashboard): void {
    const trend = data.monthlyCompletionTrend ?? [];
    this.trendChartData = {
      labels: trend.map(t => `${t.month} ${t.year}`),
      datasets: [
        { ...this.trendChartData.datasets[0], data: trend.map(t => t.totalTasks) },
        { ...this.trendChartData.datasets[1], data: trend.map(t => t.completedTasks) },
        { ...this.trendChartData.datasets[2], data: trend.map(t => t.overdueTasks) }
      ]
    };

    const depts = data.departmentPerformance ?? [];
    const deptColors = depts.map(d =>
      d.taskCompletionRate >= 80 ? '#10b981' : d.taskCompletionRate >= 60 ? '#3b82f6' : d.taskCompletionRate >= 40 ? '#f59e0b' : '#ef4444'
    );
    this.deptChartData = {
      labels: depts.map(d => d.departmentName),
      datasets: [{ label: 'Completion Rate %', data: depts.map(d => d.taskCompletionRate), backgroundColor: deptColors, borderRadius: 6 }]
    };

    if (data.tasksByStatus?.length) {
      this.statusChartData = {
        labels: data.tasksByStatus.map(s => s.label),
        datasets: [{ data: data.tasksByStatus.map(s => s.value), backgroundColor: data.tasksByStatus.map(s => s.color || '#ccc') }]
      };
    }

    const weekly = data.weeklyOrgProgress ?? [];
    this.weeklyChartData = {
      labels: weekly.map(w => w.week),
      datasets: [
        { label: 'Completed', data: weekly.map(w => w.completedTasks), backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 4 },
        { label: 'Remaining', data: weekly.map(w => w.totalTasks - w.completedTasks), backgroundColor: 'rgba(99,102,241,0.4)', borderRadius: 4 }
      ]
    };
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getBandClass(band: string): string {
    return `band-${band.toLowerCase().replace(' ', '-')}`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
