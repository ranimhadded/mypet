import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SideBarComponent implements OnInit {
  userName: string = 'User Name'; // default name
  userPhoto: string = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgttl9Ksrpb4LM5UGBHbgLi3Ag8eS5Cf0qCnLaHAw8g8Rnwq5CpJ93F-Ue0OJpwZ8lx2hs5Vi3X5t1pVCupvbyoCMeGFDu37Skk7xXj0h6vc-pO8cIDNsX_ndbcg_D1NLJ0d18toKkV2C7XAgw4JxH2GRlyBH662W3rm2jBOwQxnBMpqMHAIiIqJBsZDc22bQBDJK3ntPR2jZrnCGMBKo4QB2GL0vIJpbZr-iMh66hfrjU_Fc1CJs5QV9Y7tU_vpzw5_tTTMgaai0';

  constructor(private router: Router,private auth: Auth, private firestore: Firestore) {}
isCollapsed = true;
ngOnInit() {
    const user = this.auth.currentUser;
    if (user) {
      // Get the display name immediately if available
      this.userName = user.displayName || this.userName;

      // Optionally, get extra info from Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      docData(userDocRef).subscribe((data: any) => {
        if (data?.displayName) {
          this.userName = data.displayName;
        }
        if (data?.photoURL) {
          this.userPhoto = data.photoURL;
        }
      });
    }
  }
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
