import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';
import { SideBarComponent } from '../../components/sidebar/sidebar.component';
import { ProfileService } from '../../core/services/Profile.service';

@Component({
  selector: 'app-profileedit',
  standalone: true,
  imports: [SideBarComponent,ReactiveFormsModule],
  templateUrl: './profileedit.component.html',
  styleUrls: ['./profileedit.component.scss']
})
export class ProfileeditComponent implements OnInit {
  profileForm!: FormGroup;
  userId!: string;
 profilePhoto: string | null = null;
  defaultPhoto = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAseSgMuVGHbiipx0lGNK6lAi6sTRXQPB1CkHLWD6fFt8TmfzDFf35Mfmj9tHWxozvnG_F_53iXXi84BfIIJCRCT02r4Dp2iYSIUH0ibqEeR-gIaI17vUtlHQNlLEa_Fvlh0flDxyg0g4EiUhA6v4ybLbqtblDJ3vlsOydw1DC1Xhb1jCQwYlKC-lzAXMKuCfihkfN7lcAYVd61aRap0jieuSfvCQ8S6_mY8ilSBbYaLxFA00JhW5aljo3lsaQwnC59LRYQahsszNM';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) return;

    this.userId = user.uid;

    // Initialize form
    this.profileForm = this.fb.group({
      displayName: [user.displayName || ''],
      email: [user.email || ''],
      title: [''],
      companyName: [''],
      address: [''],
      state: [''],
      city: [''],
      postal: [''],
      password: [''],
      confirmPassword: [''],
    });

    // Load additional data from Firestore
    this.loadUserData();
  }

  async loadUserData() {
    const docRef = doc(this.firestore, `users/${this.userId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.profileForm.patchValue(docSnap.data());
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    const formValue = this.profileForm.value;

    // Optional: handle password change separately
    if (formValue.password && formValue.password === formValue.confirmPassword) {
      // call firebase updatePassword here if needed
    }

    const updateData: any = { ...formValue };
    delete updateData.confirmPassword;
    delete updateData.password;

    this.profileService.updateUserProfile(this.userId, updateData)
      .subscribe({
        next: () => alert('Profile updated successfully!'),
        error: (err) => console.error('Update failed', err)
      });
  }
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = e => this.profilePhoto = reader.result as string;
      reader.readAsDataURL(file);
    }
  }
}
