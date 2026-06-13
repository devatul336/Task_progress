import { Routes } from '@angular/router';
import { adminGuard } from './shared/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard/employee', pathMatch: 'full' },
  {
    path: 'dashboard',
    children: [
      { path: 'employee', loadComponent: () => import('./dashboard/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent) },
      { path: 'employee/:id', loadComponent: () => import('./dashboard/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent) },
      { path: 'manager', loadComponent: () => import('./dashboard/manager-dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
      { path: 'organization', loadComponent: () => import('./dashboard/org-dashboard/org-dashboard.component').then(m => m.OrgDashboardComponent), canActivate: [adminGuard] },
    ]
  },
  {
    path: 'tasks',
    children: [
      { path: '', loadComponent: () => import('./tasks/task-board/task-board.component').then(m => m.TaskBoardComponent) },
      { path: 'board', loadComponent: () => import('./tasks/task-board/task-board.component').then(m => m.TaskBoardComponent) },
      { path: 'create', loadComponent: () => import('./tasks/task-form/task-form.component').then(m => m.TaskFormComponent) },
      { path: ':id', loadComponent: () => import('./tasks/task-form/task-form.component').then(m => m.TaskFormComponent) },
    ]
  },
  {
    path: 'projects',
    canActivate: [adminGuard],
    children: [
      { path: 'trash', loadComponent: () => import('./projects/project-trash/project-trash.component').then(m => m.ProjectTrashComponent) },
      { path: '', loadComponent: () => import('./projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: ':id', loadComponent: () => import('./projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
    ]
  },
  {
    path: 'kpi',
    children: [
      { path: '', loadComponent: () => import('./kpi/kpi-list/kpi-list.component').then(m => m.KpiListComponent) },
    ]
  },
  {
    path: 'goals',
    children: [
      { path: '', loadComponent: () => import('./goals/goal-list/goal-list.component').then(m => m.GoalListComponent) },
    ]
  },
  {
    path: 'reviews',
    children: [
      { path: '', loadComponent: () => import('./reviews/review-list/review-list.component').then(m => m.ReviewListComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard/employee' }
];
