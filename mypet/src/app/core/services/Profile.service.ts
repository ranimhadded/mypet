
import { Injectable } from '@angular/core';
import { Auth, updateProfile, User } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // Update user profile
  updateUserProfile(userId: string, data: any): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) return throwError(() => new Error('No user logged in'));

    const promises = [];

    // Update Firebase Auth profile if displayName or photoURL changed
    if (data.displayName || data.photoURL) {
      promises.push(updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL
      }));
    }

    // Update Firestore user document
    const userDocRef = doc(this.firestore, `users/${userId}`);
    promises.push(updateDoc(userDocRef, data));

    return from(Promise.all(promises)).pipe(
      switchMap(() => from([void 0])),
      catchError(err => throwError(() => err))
    );
  }
}
