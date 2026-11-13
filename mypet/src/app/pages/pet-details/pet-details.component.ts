import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '../../components/footer/footer.component';
import { PetService } from '../../core/services/pet.service';
import { Pet } from '../../core/models/pet.model';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';

@Component({
  selector: 'app-pet-details',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './pet-details.component.html',
  styleUrl: './pet-details.component.scss'
})
export class PetDetailsComponent implements OnInit {
  private petService = inject(PetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  inCart = false;
  pet: Pet | null = null;
  allPets: Pet[] = [];
  isLoading = true;
  errorMessage = '';
  isFavorite = false;
  currentImageIndex = 0;
   isAddingToCart = false;
  @Input() petId?: string;
  cartChange: any;

    get currentUser() {
    return this.auth.currentUser;
  }
  ngOnInit(): void {
    this.loadPetDetails();
    this.loadAllPets();
    this.checkIfInCart();
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
  private loadPetDetails(): void {
    const petId = this.route.snapshot.paramMap.get('id');
    if (!petId) {
      this.errorMessage = 'No pet ID provided';
      this.isLoading = false;
      return;
    }

    this.petService.getPetById(petId).subscribe({
      next: (pet) => {
        this.pet = pet;
        this.isLoading = false;
        this.checkIfFavorite();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message?.includes('not found') ? 'Pet not found' : 'Failed to load pet details';
      }
    });
  }

  private loadAllPets(): void {
    this.petService.getAllPets().subscribe({
      next: (pets) => this.allPets = pets,
      error: () => console.error('Failed to load pets for navigation')
    });
  }

  // Location helper
  getLocationString(location: { city: string; state: string } | undefined): string {
    if (!location) return 'Location nnot specified';
    const { city, state } = location;
    if (city && state) return `${city}, ${state}`;
    return city || state || 'Location noot specified';
  }

  // Image carousel
  nextImage(): void {
    if (this.pet?.photos?.length) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.pet.photos.length;
    }
  }

  previousImage(): void {
    if (this.pet?.photos?.length) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.pet.photos.length) % this.pet.photos.length;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  getCurrentImage(): string {
    return this.pet?.photos?.[this.currentImageIndex] || 'assets/cat.png';
  }

  // Favorites
  private async checkIfFavorite(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !this.pet?.id) return;

    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      if (userDoc.exists()) {
        const favorites: string[] = userDoc.data()['favorites'] || [];
        this.isFavorite = favorites.includes(this.pet.id);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  }

  async toggleFavorite(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      alert('Please log in to save favorites');
      return;
    }
    if (!this.pet?.id) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    
    try {
      if (this.isFavorite) {
        await updateDoc(userRef, { favorites: arrayRemove(this.pet.id) });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(this.pet.id) });
      }
      this.isFavorite = !this.isFavorite;
    } catch (error) {
      console.error('Error updating favorite:', error);
      alert('Failed to update favorites');
    }
  }

  // Navigation
  nextPet(): void {
    if (!this.pet?.id || this.allPets.length < 2) {
      this.router.navigate(['/All']);
      return;
    }
    // Filter out current pet and get random one
    const otherPets = this.allPets.filter(p => p.id !== this.pet!.id);
    if (otherPets.length === 0) {
      this.router.navigate(['/All']);
      return;
    }
    const randomPet = otherPets[Math.floor(Math.random() * otherPets.length)];
    this.router.navigate(['/pet', randomPet.id]);
    setTimeout(() => {
    this.loadPetDetails();
  }, 300);
    
  }

 
  formatAge(age: string): string {
    const ages: Record<string, string> = { puppy: 'Puppy/Kitten', young: 'Young', adult: 'Adult', senior: 'Senior' };
    return ages[age] || age;
  }

  getSize(): string {
    if (!this.pet?.weight) return 'Medium';
    return this.pet.weight < 5 ? 'Small' : this.pet.weight < 15 ? 'Medium' : 'Large';
  }

  formatCharacteristics(): string {
    return this.pet?.characteristics?.length ? this.pet.characteristics.join(', ') : 'No characteristics provided';
  }

  // Actions
contactOwner(): void {
  const user = this.auth.currentUser;
  if (!user || !this.pet?.ownerId) {
    alert('Please login first');
    return;
  }

  const uid1 = user.uid;
  const uid2 = this.pet.ownerId;
  const chatId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  this.router.navigate(['/Mail'], {
    queryParams: {
      chatId,
      receiverId: this.pet.ownerId,
      receiverName: this.pet.ownerName,
      receiverAvatar: this.pet.ownerPhoto || 'assets/user.png',
      petId: this.pet.id
    }
  });
}

async toggleCart(event: Event): Promise<void> {
  event.stopPropagation();

  if (!this.currentUser) {
    this.router.navigate(['/login']);
    return;
  }

  if (!this.pet?.id || this.isAddingToCart) return;

  this.isAddingToCart = true;
  const userRef = doc(this.firestore, `users/${this.currentUser.uid}`);

  try {
    if (this.inCart) {
      // Remove from cart
      await updateDoc(userRef, { cart: arrayRemove(this.pet.id) });
      this.inCart = false;
    } else {
      // Add to cart
      await updateDoc(userRef, { cart: arrayUnion(this.pet.id) });
      this.inCart = true;

      // Navigate to cart page after adding
      this.router.navigate(['/cart']);
    }

    await this.cartChange?.emit({ petId: this.pet.id, inCart: this.inCart });
  } catch (error) {
    console.error('Error updating cart:', error);
  } finally {
    this.isAddingToCart = false;
  }
}



  visitOwnerProfile(): void {
    if (this.pet?.ownerId) this.router.navigate(['/user', this.pet.ownerId]);
  }

  bookAdoption(): void {
    if (this.pet) alert(`Booking adoption for ${this.pet.name}`);
  }

  reloadPet(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadPetDetails();
  }

  goBack(): void {
    this.router.navigate(['/All']);
  }
}