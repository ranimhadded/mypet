import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, arrayRemove, collection, addDoc } from '@angular/fire/firestore';
import { PetService } from '../../core/services/pet.service';
import { Pet } from '../../core/models/pet.model';

interface CartItem extends Pet {
  cartId: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private petService = inject(PetService);

  cartItems: CartItem[] = [];
  isLoading = true;
  isCheckingOut = false;
  errorMessage = '';
  successMessage = '';

  colorPalettes = [
    { bg: '#F25F9E' },
    { bg: '#F79F5A' },
    { bg: '#283275' },
    { bg: '#4CD964' },
    { bg: '#8B5CF6' },
  ];

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadCart(user);
      } else {
        this.errorMessage = 'Please log in to view your cart';
        this.isLoading = false;
      }
    });
  }

  private async loadCart(user: User): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      
      if (!userDoc.exists()) {
        this.isLoading = false;
        return;
      }

      const cartIds: string[] = userDoc.data()['cart'] || [];
      
      if (cartIds.length === 0) {
        this.isLoading = false;
        return;
      }

      this.petService.getAllPets().subscribe({
        next: (allPets) => {
          // Filter only available pets (not sold)
          this.cartItems = allPets
            .filter(pet => pet.id && cartIds.includes(pet.id) && !pet.sold)
            .map(pet => ({ ...pet, cartId: pet.id! }));
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load cart items';
          this.isLoading = false;
          console.error('Error:', error);
        }
      });
    } catch (error) {
      this.errorMessage = 'Failed to load cart';
      this.isLoading = false;
    }
  }

  async removeItem(item: CartItem): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(this.firestore, `users/${user.uid}`), {
        cart: arrayRemove(item.cartId)
      });
      this.cartItems = this.cartItems.filter(i => i.cartId !== item.cartId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.adoptionFee || 0), 0)  ;
  }

  get total(): number {
    return this.subtotal+8;
  }

  async checkout(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || this.cartItems.length === 0 || this.isCheckingOut) return;

    this.isCheckingOut = true;
    this.errorMessage = '';

    try {
      // Create order
      const order = {
        buyerId: user.uid,
        buyerEmail: user.email,
        pets: this.cartItems.map(pet => ({
          petId: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed || '',
          adoptionFee: pet.adoptionFee || 0,
          ownerId: pet.ownerId,
          ownerName: pet.ownerName
        })),
        totalAmount: this.total,
        status: 'completed',
        createdAt: new Date(),
      };

      // Add order to orders collection
      await addDoc(collection(this.firestore, 'orders'), order);

      // Mark pets as sold
      for (const pet of this.cartItems) {
        if (pet.id) {
          await updateDoc(doc(this.firestore, `pets/${pet.id}`), { sold: true });
        }
      }

      // Clear user's cart
      await updateDoc(doc(this.firestore, `users/${user.uid}`), { cart: [] });

      this.successMessage = 'Order placed successfully! Thank you for adopting.';
      this.cartItems = [];
      
      setTimeout(() => this.router.navigate(['/All']), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to process order. Please try again.';
      console.error('Checkout error:', error);
    } finally {
      this.isCheckingOut = false;
    }
  }

  getPetImage(pet: Pet): string {
    return pet.photos?.[0] || 'assets/cat.png';
  }

  getLocationString(pet: Pet): string {
    if (!pet.location) return 'Not specified';
    const { city, state } = pet.location;
    return city && state ? `${city}, ${state}` : city || state || 'Not specified';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}