import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CategoryCardComponent } from '../../shared/category-card/category-card.component';
import { PetService } from '../../core/services/pet.service';
import { Pet } from '../../core/models/pet.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryCardComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private petService = inject(PetService);
showSearch = false;

  pets: Pet[] = [];
  filteredPets: Pet[] = [];
  isLoading = true;
  errorMessage = '';

  // Filter state
  searchQuery = '';
  selectedSpecies = '';
  currentSort = 'name';

  // Options
  speciesOptions = ['Cat', 'Dog', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'];

  colorPalettes = [
    { bg: '#F2B2B2', content: '#F25F9E' },
    { bg: '#FFE167', content: '#F79F5A' },
    { bg: '#C8EDFD', content: '#283275' },
    { bg: '#A9F3B5', content: '#4CD964' },
    { bg: '#DCC8FF', content: '#8B5CF6' },
    { bg: '#FFD1A9', content: '#EA580C' },
  ];

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadFavorites(user);
      } else {
        this.errorMessage = 'Please log in to view favorites';
        this.isLoading = false;
      }
    });
  }

  private async loadFavorites(user: User): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      
      if (!userDoc.exists()) {
        this.isLoading = false;
        return;
      }

      const favoriteIds: string[] = userDoc.data()['favorites'] || [];
      
      if (favoriteIds.length === 0) {
        this.isLoading = false;
        return;
      }

      this.petService.getAllPets().subscribe({
        next: (allPets) => {
          this.pets = allPets.filter(pet => pet.id && favoriteIds.includes(pet.id));
          this.filteredPets = [...this.pets];
          this.sortPets(this.currentSort);
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load favorite pets';
          this.isLoading = false;
          console.error('Error loading pets:', error);
        }
      });
    } catch (error) {
      this.errorMessage = 'Failed to load favorites';
      this.isLoading = false;
      console.error('Error:', error);
    }
  }

  reloadFavorites(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const user = this.auth.currentUser;
    if (user) {
      this.loadFavorites(user);
    }
  }

  // Filter & Sort methods
  applyFilters(): void {
    let result = [...this.pets];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(pet =>
        pet.name.toLowerCase().includes(query) ||
        pet.species.toLowerCase().includes(query) ||
        pet.breed?.toLowerCase().includes(query) ||
        pet.location?.city?.toLowerCase().includes(query)
      );
    }

    if (this.selectedSpecies) {
      result = result.filter(pet => pet.species === this.selectedSpecies);
    }

    this.filteredPets = result;
    this.sortPets(this.currentSort);
  }

  sortPets(sortBy: string): void {
    this.currentSort = sortBy;
    
    this.filteredPets.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'species':
          return a.species.localeCompare(b.species);
        case 'age':
          const ageOrder = ['puppy', 'young', 'adult', 'senior'];
          return ageOrder.indexOf(a.age) - ageOrder.indexOf(b.age);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedSpecies = '';
    this.filteredPets = [...this.pets];
    this.sortPets('name');
  }

  // Helper methods
  getLocationString(pet: Pet): string {
    if (!pet.location) return 'Not specified';
    const { city, state } = pet.location;
    if (city && state) return `${city}, ${state}`;
    return city || state || 'Not specified';
  }

  getAdoptionFee(pet: Pet): string {
    if (pet.adoptionFee === 0 || pet.adoptionFee === undefined) return 'Free';
    return `${pet.adoptionFee} DT`;
  }

  getPetImage(pet: Pet): string {
    return pet.photos?.[0] || 'assets/cat.png';
  }

  getPetColor(index: number): { bg: string; content: string } {
    return this.colorPalettes[index % this.colorPalettes.length];
  }

  getSpeciesIcon(species: string): string {
    const icons: Record<string, string> = {
      'Cat': '🐱', 'Dog': '🐕', 'Bird': '🐦', 'Rabbit': '🐰',
      'Hamster': '🐹', 'Fish': '🐠', 'Other': '🐾'
    };
    return icons[species] || '🐾';
  }

  formatAge(age: string): string {
    const ages: Record<string, string> = {
      'puppy': 'Puppy/Kitten', 'young': 'Young', 'adult': 'Adult', 'senior': 'Senior'
    };
    return ages[age] || age;
  }

  // Navigation & Events
  onCardClick(petId: string): void {
    this.router.navigate(['/pet', petId]);
  }

  onDetailClick(petId: string): void {
    this.router.navigate(['/pet', petId]);
  }

  onFavoriteChange(event: { petId: string; liked: boolean }): void {
    if (!event.liked) {
      this.pets = this.pets.filter(p => p.id !== event.petId);
      this.filteredPets = this.filteredPets.filter(p => p.id !== event.petId);
    }
  }

  goToAll(): void {
    this.router.navigate(['/All']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}