import { NgClass, NgIf, NgStyle } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [NgStyle, NgIf, NgClass],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss'
})
export class CategoryCardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  liked = false;
  inCart = false;
  isProcessing = false;
  isAddingToCart = false;

  @Input() variant: 'default' | 'admin' = 'default';
  @Input() showActions = true;
  @Input() showShopButtons = true;
  @Input() showAdminButtons = false;
  @Input() cardWidth = '100%';
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() imgSrc!: string;
  @Input() bgColor: string = '#007AFF';
  @Input() contentBgColor: string = 'rgba(0,0,0,0.3)';
  @Input() clickable: boolean = true;
  @Input() petId?: string;

  @Output() cardClick = new EventEmitter<string>();
  @Output() detailClick = new EventEmitter<string>();
  @Output() editClick = new EventEmitter<string>();
  @Output() deleteClick = new EventEmitter<string>();
  @Output() favoriteChange = new EventEmitter<{ petId: string; liked: boolean }>();
  @Output() cartChange = new EventEmitter<{ petId: string; inCart: boolean }>();

  get currentUser() {
    return this.auth.currentUser;
  }

  ngOnInit(): void {
    this.checkIfFavorite();
    this.checkIfInCart();
  }

  private async checkIfFavorite(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !this.petId) return;

    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      if (userDoc.exists()) {
        const favorites: string[] = userDoc.data()['favorites'] || [];
        this.liked = favorites.includes(this.petId);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  }

  private async checkIfInCart(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !this.petId) return;

    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      if (userDoc.exists()) {
        const cart: string[] = userDoc.data()['cart'] || [];
        this.inCart = cart.includes(this.petId);
      }
    } catch (error) {
      console.error('Error checking cart:', error);
    }
  }

  async toggleLike(event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.petId || this.isProcessing) return;

    this.isProcessing = true;
    const userRef = doc(this.firestore, `users/${this.currentUser.uid}`);

    try {
      if (this.liked) {
        await updateDoc(userRef, { favorites: arrayRemove(this.petId) });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(this.petId) });
      }
      
      this.liked = !this.liked;
      this.favoriteChange.emit({ petId: this.petId, liked: this.liked });
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async toggleCart(event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.petId || this.isAddingToCart) return;

    this.isAddingToCart = true;
    const userRef = doc(this.firestore, `users/${this.currentUser.uid}`);

    try {
      if (this.inCart) {
        await updateDoc(userRef, { cart: arrayRemove(this.petId) });
      } else {
        await updateDoc(userRef, { cart: arrayUnion(this.petId) });
      }
      
      this.inCart = !this.inCart;
      this.cartChange.emit({ petId: this.petId, inCart: this.inCart });
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      this.isAddingToCart = false;
    }
  }

  onCardClick(event: Event): void {
    event.stopPropagation();
    if (this.clickable && this.petId) {
      this.cardClick.emit(this.petId);
    }
  }

  onDetailClick(event: Event): void {
    event.stopPropagation();
    if (this.petId) this.detailClick.emit(this.petId);
  }

  onEditClick(event: Event): void {
    event.stopPropagation();
    if (this.petId) this.editClick.emit(this.petId);
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    if (this.petId) this.deleteClick.emit(this.petId);
  }

  goToCategories(): void {
    this.router.navigate(['/All']);
  }
}