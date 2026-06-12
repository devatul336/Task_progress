import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = sessionStorage.getItem('token') || localStorage.getItem('token');
  let employeeId = localStorage.getItem('employeeId');
  if (!employeeId) {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        employeeId = userObj.employeId || userObj.EmployeeId;
      } catch(e) {}
    }
  }
  if (token) {
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.substring(1, token.length - 1);
    }
    
    let headers: any = {
      Authorization: `Bearer ${token}`
    };
    
    if (employeeId && employeeId !== 'me') {
        headers['X-Employee-Id'] = employeeId;
    }

    let email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
    if (!email) {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                email = userObj.email || userObj.Email;
            } catch(e) {}
        }
    }
    if (email) {
        headers['X-User-Email'] = email;
    }

    let userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || sessionStorage.getItem('role') || localStorage.getItem('role');
    
    if (!userRole) {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj && userObj.employeeRoleLoginDtos && userObj.employeeRoleLoginDtos.length > 0) {
            userRole = userObj.employeeRoleLoginDtos[0].roleName;
          }
        } catch(e) {}
      }
    }

    if (userRole) {
      headers['X-User-Role'] = userRole;
    }
    
    const cloned = req.clone({ setHeaders: headers });
    return next(cloned);
  }
  
  return next(req);
};
