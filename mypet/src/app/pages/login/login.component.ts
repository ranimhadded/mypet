import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [FormsModule], 
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  isLoading = false;
  errorMessage = '';
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = form.value;

    this.authService.signIn(email, password).subscribe({
      next: (userCredential) => {
        this.isLoading = false;
        
        this.router.navigate(['/All']);
        /*if (userCredential.user.emailVerified) {
          alert('succes');
        this.router.navigate(['/signup']);
        } else {
          this.errorMessage = 'Please verify your email before logging in.';
          // Optionally resend verification email
        }*/
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
        alert(this.errorMessage);
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

}
