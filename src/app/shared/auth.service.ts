import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  constructor() {}

  /**
   * Retrieves the current token from storage.
   */
  getToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  /**
   * Decodes the token and extracts the role.
   * Prioritizes the userRole saved in sessionStorage (passed from shell).
   * If no token/session is present, returns 'Admin' by default.
   */
  getUserRole(): string {
    const sessionRole = sessionStorage.getItem('userRole');
    if (sessionRole && sessionRole.trim() !== '') {
      return sessionRole;
    }
    
    // Try to extract from the 'user' object saved by AAA login
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.employeeRoleLoginDtos && userObj.employeeRoleLoginDtos.length > 0) {
          const roleName = userObj.employeeRoleLoginDtos[0].roleName;
          if (roleName) return roleName;
        }
      } catch (e) {}
    }
    
    return this.getUserInfo().role;
  }

  /**
   * Retrieves full user info (name, email, role) from token.
   */
  getUserInfo(): { id: string, name: string, email: string, role: string } {
    let id = localStorage.getItem('employeeId') || localStorage.getItem('EmployeeId') || '';
    let name = sessionStorage.getItem('userName') || sessionStorage.getItem('UserName') || sessionStorage.getItem('username') || '';
    let role = sessionStorage.getItem('userRole') || sessionStorage.getItem('UserRole') || sessionStorage.getItem('role') || '';
    let email = '';

    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        if (!role) role = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (!name) name = decodedToken.name || decodedToken.given_name || decodedToken.unique_name || '';
        if (!email) email = decodedToken.email || decodedToken.upn || '';
        if (!id) id = decodedToken.sub || decodedToken.nameid || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
      } catch (error) {
        console.error('Error decoding token', error);
      }
    }

    if (name && name.includes('@')) {
      name = name.split('@')[0].split('.').map((part: string) => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    }

    return {
      id: id,
      name: name,
      email: email,
      role: role || 'Employee'
    };
  }

  /**
   * Checks if the user has Admin or HR role.
   */
  isAdminOrHR(): boolean {
    const role = this.getUserRole();
    return role === 'Admin' || role === 'HR' || role === 'Super Admin' || role === 'HRManager';
  }

  /**
   * Checks if the user is a Manager.
   */
  isManager(): boolean {
    const role = this.getUserRole();
    return role === 'Manager';
  }
}
