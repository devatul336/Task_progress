import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { EmployeeDashboard } from '../../shared/models/interfaces';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, MatChipsModule,
    MatBadgeModule, MatTooltipModule, MatDividerModule, BaseChartDirective
  ],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss']
})
export class EmployeeDashboardComponent implements OnInit {
  dashboard: EmployeeDashboard | null = null;
  loading = true;
  activeTab = 'overview';

  // Donut chart: Tasks by Status
  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  statusChartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';
  statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}` } } },
    cutout: '65%'
  };

  // Bar chart: Tasks by Priority
  priorityChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  priorityChartType: ChartType = 'bar';
  priorityChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    plugins: { legend: { display: false } }
  };

  // Line chart: Productivity Trend
  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { label: 'Tasks Completed', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 },
      { label: 'Hours Worked', data: [], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: false, tension: 0.4 }
    ]
  };
  trendChartType: ChartType = 'line';
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'top' } }
  };

  constructor(private service: ProgressTrackerService) {}

  ngOnInit(): void {
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
            } catch(e) {}
        }
    }
    if (!employeeId || employeeId === 'undefined') {
        employeeId = 'me';
    }
    this.loadDashboard(employeeId);
  }

  loadDashboard(employeeId: string): void {
    this.loading = true;
    this.service.getEmployeeDashboard(employeeId).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.buildCharts(data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  buildCharts(data: EmployeeDashboard): void {
    if (data.tasksByStatus?.length) {
      this.statusChartData = {
        labels: data.tasksByStatus.map(d => d.label),
        datasets: [{ data: data.tasksByStatus.map(d => d.value), backgroundColor: data.tasksByStatus.map(d => d.color || '#ccc') }]
      };
    }
    if (data.tasksByPriority?.length) {
      this.priorityChartData = {
        labels: data.tasksByPriority.map(d => d.label),
        datasets: [{ data: data.tasksByPriority.map(d => d.value), backgroundColor: data.tasksByPriority.map(d => d.color || '#ccc'), borderRadius: 8 }]
      };
    }
    if (data.productivityTrend?.length) {
      this.trendChartData = {
        labels: data.productivityTrend.map(d => new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
        datasets: [
          { ...this.trendChartData.datasets[0], data: data.productivityTrend.map(d => d.tasksCompleted) },
          { ...this.trendChartData.datasets[1], data: data.productivityTrend.map(d => d.hoursWorked) }
        ]
      };
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'To Do': 'radio_button_unchecked',
      'In Progress': 'pending',
      'Under Review': 'rate_review',
      'Completed': 'check_circle',
      'On Hold': 'pause_circle',
      'Cancelled': 'cancel'
    };
    return icons[status] || 'help';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getDaysLeft(dueDate: string): string {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `${diff}d left`;
  }
}
