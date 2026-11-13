import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  currentUser: any = null;
  dropdownOpen = false;
  unreadCount = 3;
  @Input() showSearchButton = false;
  @Output() searchToggle = new EventEmitter<void>();

  constructor(
    private router: Router,
    private authState: AuthStateService,
    private auth: Auth
  ) {
    this.authState.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  onSearchClick() {
    if (!this.showSearchButton) return;
    this.searchToggle.emit();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen = false;
  }

  goToSellerMode() {
    this.router.navigate(['/petlist']);
    this.dropdownOpen = false;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
goToNotifications() {
this.router.navigate(['/Notifications']);
  }
  logOut() {
    this.auth.signOut().then(() => {
      this.dropdownOpen = false;
      this.router.navigate(['/login']);
    });
  }
  goToFavorites() {
  // Navigate to the favorites page
  this.router.navigate(['/Favorites']);
}

goToCart() {
  // Navigate to the cart page
  this.router.navigate(['/cart']);
}

}
