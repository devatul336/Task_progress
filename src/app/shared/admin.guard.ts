import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';

  console.log('Guard role check:', role);
  if (authService.isAdminOrHR() || authService.isManager() || role === 'Manager') {
    return true;
  }

  // If not admin/HR, redirect to employee dashboard
  router.navigate(['/dashboard/employee']);
  return false;
};
