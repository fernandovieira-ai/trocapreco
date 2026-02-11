import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Alert } from '../class/alert';
import { AuthService } from './auth.service';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate{

  constructor(private router: Router, private authService: AuthService, private alert: Alert){}

  canActivate(
    //metodo que valida se a sessao do usuario está ativa
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isLogged()) {
      return true;
    } else {
      this.authService.destroyToken();
      this.alert.presentAlert('Sessão Expirada', '', 'Por favor, faça o login novamente.');
      this.router.navigate(['/login']);
      return false;
    }
  }

}
