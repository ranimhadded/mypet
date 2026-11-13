import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule ,NgForm} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
    standalone: true, // necessary for standalone component
  imports: [FormsModule,NgIf], 
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  preview: string | ArrayBuffer | null = null;
  isLoading = false;
  errorMessage = '';
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

onImageSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    this.preview = reader.result;
  };
  reader.readAsDataURL(file);
}

onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    const formValue = form.value;
    
    // Password validation
    if (formValue.password !== formValue.repeatPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (formValue.password.length < 5) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Extract auth data
    const authData = {
      email: formValue.email,
      password: formValue.password,
      name: formValue.name,
      title: formValue.title,
      companyName: formValue.companyName,
      address: formValue.address,
      state: formValue.state,
      city: formValue.city,
      postal: formValue.postal
    };

    this.authService.signUp(authData.email, authData.password, authData).subscribe({
      next: (userCredential) => {
        this.isLoading = false;
        // Show success message and redirect
        alert('Registration successful! Please check your email for verification.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      }
    });
  }
}
