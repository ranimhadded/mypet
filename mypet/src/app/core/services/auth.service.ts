import { Injectable } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  UserCredential
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  // Sign up with email/password
  signUp(email: string, password: string, userData: any): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((userCredential) => {
        // Update profile with display name
        const updatePromises = [];
        updatePromises.push(updateProfile(userCredential.user, {
          displayName: userData.name
        }));

        // Send email verification
        updatePromises.push(sendEmailVerification(userCredential.user));

        // Save additional user data to Firestore
        const userDocRef = doc(this.firestore, `users/${userCredential.user.uid}`);
        updatePromises.push(setDoc(userDocRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userData.name,
          title: userData.title,
          companyName: userData.companyName,
          address: userData.address,
          state: userData.state,
          city: userData.city,
          postal: userData.postal,
          createdAt: new Date()
        }));

        return from(Promise.all(updatePromises)).pipe(
  switchMap(() => {
    return from([userCredential]);
  }),
  catchError(err => {
    console.error('Signup pipeline failed:', err);
    return throwError(() => err);
  })
);

      }),
      catchError((error) => {
        return this.handleAuthError(error);
      })
    );
  }

  // Sign in with email/password
  signIn(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      catchError((error) => {
        return this.handleAuthError(error);
      })
    );
  }

  // Handle authentication errors
  private handleAuthError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many attempts. Try again later.';
        break;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Sign out
  signOut(): Observable<void> {
    return from(this.auth.signOut());
  }
}