import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProgressTrackerService } from '../../shared/progress-tracker.service';
import { EmployeeGoal, GoalMilestone, GoalAttachment } from '../../shared/models/interfaces';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { GoalMilestoneDialogComponent } from '../goal-milestone-dialog/goal-milestone-dialog.component';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-goal-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatDividerModule, MatChipsModule,
    MatInputModule, MatFormFieldModule, BaseChartDirective,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule
  ],
  templateUrl: './goal-details.component.html',
  styleUrls: ['./goal-details.component.scss']
})
export class GoalDetailsComponent implements OnInit {
  goalId!: number;
  goal?: EmployeeGoal;
  loading = true;

  // New Progress Form
  showProgressForm = false;
  newProgressValue: number = 0;
  progressWorkNote: string = '';
  selectedFileName: string = '';
  selectedFileUrl: string = '';

  // New Comment Form
  newCommentText: string = '';

  // Manager Review
  showReviewForm = false;
  reviewRemarks: string = '';

  // Data arrays
  mockMilestones: GoalMilestone[] = [];
  mockAttachments: GoalAttachment[] = [];

  // Chart
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Progress %',
        fill: true,
        tension: 0.4,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        pointBackgroundColor: '#4f46e5'
      }
    ]
  };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { min: 0, max: 100 }
    }
  };
  public lineChartLegend = false;
  userRole: string = 'Admin';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ProgressTrackerService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.goalId = +id;
        this.loadGoalDetails();
      }
    });
  }

  loadGoalDetails(): void {
    this.loading = true;

    this.service.getEmployees().subscribe(employees => {
      const empMap = new Map<string, string>();
      employees.forEach(emp => {
        empMap.set(emp.employeeId, `${emp.firstName} ${emp.lastName}`);
      });

      this.service.getGoalById(this.goalId).subscribe(data => {
        this.goal = data;

        const resolveName = (idOrName: string) => {
          if (!idOrName) return '';
          if (empMap.has(idOrName)) return empMap.get(idOrName)!;
          
          const currentUser = this.authService.getUserInfo();
          if (idOrName === currentUser.id) return currentUser.name || 'Admin';
          
          if (idOrName.length > 30 && idOrName.includes('-')) {
             return currentUser.name || 'Admin'; 
          }
          return idOrName;
        };

        if (this.goal.comments) {
          this.goal.comments.forEach(c => {
            c.createdBy = resolveName(c.createdBy);
          });
        }

        if (this.goal.activities) {
          this.goal.activities.forEach(a => {
            a.createdBy = resolveName(a.createdBy);
          });
        }

        if (this.goal.createdBy) {
          this.goal.createdBy = resolveName(this.goal.createdBy);
        }

        if (!this.goal.employeeName && this.goal.employeeId) {
          this.goal.employeeName = resolveName(this.goal.employeeId);
        }

        if (this.goal.statusName) {
          this.goal.statusName = this.goal.statusName.replace(/([A-Z])/g, ' $1').trim();
        }

        this.newProgressValue = data.currentValue;

        this.mockMilestones = data.milestones || [];
        this.mockAttachments = data.attachments || [];

        this.updateChartData();

        this.loading = false;
      });
    });
  }

  updateChartData(): void {
    if (!this.goal || !this.goal.progressLogs || this.goal.progressLogs.length === 0) return;

    const sortedLogs = [...this.goal.progressLogs].sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());

    const labels: string[] = ['Start'];
    const dataPoints: number[] = [0];

    sortedLogs.forEach(log => {
      const date = new Date(log.createdDate);
      labels.push(`${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`);

      let pct = 0;
      if (this.goal!.targetValue > 0) {
        pct = Math.min(100, Math.round((log.newValue / this.goal!.targetValue) * 100));
      }
      dataPoints.push(pct);
    });

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: dataPoints,
          label: 'Progress %',
          fill: true,
          tension: 0.4,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          pointBackgroundColor: '#4f46e5'
        }
      ]
    };
  }

  getDaysRemaining(): string {
    if (!this.goal || !this.goal.targetDate) return 'N/A';
    const target = new Date(this.goal.targetDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    if (diff < 0) return 'Overdue';
    return Math.ceil(diff / (1000 * 3600 * 24)).toString();
  }

  getProgressColor(): string {
    if (!this.goal) return '#ef4444';
    const pct = this.goal.progressPercentage;
    if (pct <= 30) return '#ef4444';
    if (pct <= 60) return '#f97316';
    if (pct <= 90) return '#3b82f6';
    return '#10b981';
  }

  getDashArray(): string {
    if (!this.goal) return '0, 100';
    return `${this.goal.progressPercentage}, 100`;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileUrl = e.target.result;

        const payload = {
          fileName: file.name,
          fileUrl: this.selectedFileUrl,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size
        };
        this.service.addGoalAttachment(this.goalId, payload).subscribe(() => {
          this.loadGoalDetails();
        });
      };
      reader.readAsDataURL(file);
    }
  }

  updateProgress(): void {
    if (!this.progressWorkNote) return;
    const payload = {
      newValue: this.newProgressValue,
      workNote: this.progressWorkNote,
      evidenceFileName: this.selectedFileName || undefined,
      evidenceFileUrl: this.selectedFileUrl || undefined
    };
    this.service.updateGoalProgress(this.goalId, payload).subscribe(() => {
      this.loadGoalDetails();
      this.showProgressForm = false;
      this.progressWorkNote = '';
      this.selectedFileName = '';
      this.selectedFileUrl = '';
    });
  }

  addComment(): void {
    if (!this.newCommentText) return;
    this.service.addGoalComment(this.goalId, this.newCommentText).subscribe(() => {
      this.loadGoalDetails();
      this.newCommentText = '';
    });
  }

  submitReview(isApproved: boolean): void {
    const payload = { isApproved: isApproved, remarks: this.reviewRemarks };
    this.service.reviewGoal(this.goalId, payload).subscribe(() => {
      this.loadGoalDetails();
      this.reviewRemarks = '';
    });
  }

  downloadAttachment(fileUrl: string, fileName: string): void {
    if (!fileUrl) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  openAddMilestoneDialog(): void {
    const dialogRef = this.dialog.open(GoalMilestoneDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.addGoalMilestone(this.goalId, result).subscribe(() => {
          this.loadGoalDetails();
        });
      }
    });
  }

  getStatusColor(status: number): string {
    switch (status) {
      case 1: return '#64748b';
      case 2: return '#3b82f6';
      case 3: return '#f97316';
      case 4: return '#ef4444';
      case 5: return '#8b5cf6';
      case 6: return '#10b981';
      case 7: return '#991b1b';
      default: return '#64748b';
    }
  }

  getPriorityColor(priority: number): string {
    switch (priority) {
      case 1: return '#ef4444';
      case 2: return '#f97316';
      case 3: return '#eab308';
      case 4: return '#3b82f6';
      default: return '#64748b';
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext!)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext!)) return 'description';
    if (['jpg', 'jpeg', 'png', 'svg'].includes(ext!)) return 'image';
    return 'insert_drive_file';
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
