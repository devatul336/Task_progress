import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const employeeId = localStorage.getItem('employeeId');
  
  if (token) {
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.substring(1, token.length - 1);
    }
    
    let headers: any = {
      Authorization: `Bearer ${token}`
    };
    
    if (employeeId) {
      headers['X-Employee-Id'] = employeeId;
    }

    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || sessionStorage.getItem('role') || localStorage.getItem('role');
    if (userRole) {
      headers['X-User-Role'] = userRole;
    }
    
    const cloned = req.clone({ setHeaders: headers });
    return next(cloned);
  }
  
  return next(req);
};
