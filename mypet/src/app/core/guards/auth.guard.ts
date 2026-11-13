import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authState: AuthStateService,
    private router: Router
  ) {}

  canActivate() {
    return this.authState.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && user.emailVerified) {
          return true;
        }
        
        // Redirect to login if not authenticated
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}