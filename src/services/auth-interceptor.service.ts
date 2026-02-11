import { Injectable } from '@angular/core';
import { AuthService} from './auth.service';
import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Alert } from '../class/alert';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router, private alert: Alert) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    //metodo que intercepta todas os requests para o servidor
    const token = this.authService.getToken();
    let request: HttpRequest<any> = req;

    if (token && (this.authService.isLogged() === true)) {
      request = req.clone({
        headers: req.headers.set('token', `${token}`),
      });
    }else{
      this.authService.destroyToken();
      this.router.navigate(['/']);
    }
    return next.handle(request).pipe(
                                catchError(this.handleError),
                                );
  }

 handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      //erro do client side ou de rede
      //console.log('Ocorreu um erro', error.error.message);
    } else {
      //erro retornado pelo backend
      `Codigo do erro ${error.status},` +
        `Erro: ${JSON.stringify(error.error)}`;
    }
    return throwError(error.error.message);

  }
}
