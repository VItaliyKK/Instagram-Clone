import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkLogin();
  }

  //провіряє чи є в localStorage авторизований юзер
  private checkLogin(): boolean {
    const authUser = JSON.parse(localStorage.getItem('authUser'));
    if (authUser != null) {
      return true;
    }
    else {
      this.router.navigateByUrl('/log-in')
      return false;
    }
  }
}
