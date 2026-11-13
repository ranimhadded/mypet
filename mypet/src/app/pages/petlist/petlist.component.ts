import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategoryCardComponent } from '../../shared/category-card/category-card.component';
import { SideBarComponent } from '../../components/sidebar/sidebar.component';
import { PetService } from '../../core/services/pet.service';
import { Pet } from '../../core/models/pet.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-petlist',
  standalone: true,
  imports: [CommonModule, RouterModule, CategoryCardComponent, SideBarComponent, ConfirmationDialogComponent],
  templateUrl: './petlist.component.html',
  styleUrl: './petlist.component.scss'
})
export class PetlistComponent implements OnInit {
  private petService = inject(PetService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  pets: Pet[] = [];
  isLoading = true;
  errorMessage = '';
  noPetsMessage = '';

  // Delete confirmation state
  showDeleteDialog = false;
  petToDelete: Pet | null = null;
  isDeleting = false;
  deleteError = '';

  // Color palette for pet cards
  private colorPalettes = [
    { bg: '#F2B2B2', content: '#F25F9E' }, // Pink
    { bg: '#FFE167', content: '#F79F5A' }, // Orange/Yellow
    { bg: '#C8EDFD', content: '#283275' }, // Blue
    { bg: '#A9F3B5', content: '#4CD964' }, // Green
  
  ];

  ngOnInit(): void {
    this.loadUserPets();
    // Listen for authentication state changes
    this.authState.currentUser$.subscribe(user => {
      if (!user) {
        this.errorMessage = 'Please log in to view your pets';
        this.pets = [];
        this.isLoading = false;
      } else if (this.pets.length === 0) {
        // Reload pets if user logs in and we don't have pets
        this.loadUserPets();
      }
    });
  }

  private loadUserPets(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.noPetsMessage = '';

    this.petService.getUserPets().subscribe({
      next: (userPets) => {
        this.pets = userPets;
        this.isLoading = false;
        
        if (userPets.length === 0) {
          this.noPetsMessage = 'You haven\'t added any pets yet. Start by adding your first pet!';
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load pets. Please try again.';
        console.error('Error loading pets:', error);
        this.isLoading = false;
        this.pets = [];
      }
    });
  }

  /**
   * Get a color palette for a pet based on its index
   */
  getPetColor(index: number): { bg: string, content: string } {
    return this.colorPalettes[index % this.colorPalettes.length];
  }

  /**
   * Get pet species emoji or icon
   */
  getSpeciesIcon(species: string): string {
    switch(species.toLowerCase()) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      case 'bird': return '🐦';
      default: return '🐾';
    }
  }

  /**
   * Format pet age for display
   */
  formatAge(age: string): string {
    switch(age) {
      case 'puppy': return 'Puppy/Kitten';
      case 'young': return 'Young';
      case 'adult': return 'Adult';
      case 'senior': return 'Senior';
      default: return age;
    }
  }

  /**
   * Get first photo or default image
   */
  getPetImage(pet: Pet): string {
    if (pet.photos && pet.photos.length > 0) {
      return pet.photos[0]; // First photo (Base64 string)
    }
    
    // Default images based on species
    switch(pet.species.toLowerCase()) {
      case 'cat': return 'assets/cat.png';
      case 'dog': return 'assets/dog.png';
      case 'bird': return 'assets/bird.png';
      default: return 'assets/pet-default.png';
    }
  }

  /**
   * Navigate to pet details
   */
  viewPetDetails(petId: string): void {
    // i'll implement this later
    console.log('View pet details:', petId);
  }

  /**
   * Edit pet
   */
  editPet(petId: string): void {
  this.router.navigate(['/editpet', petId]);
}
  /**
   * Show delete confirmation dialog
   */
  confirmDelete(pet: Pet): void {
    this.petToDelete = pet;
    this.showDeleteDialog = true;
    this.deleteError = '';
  }

  /**
   * Cancel delete operation
   */
  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.petToDelete = null;
    this.isDeleting = false;
    this.deleteError = '';
  }

  /**
   * Execute delete operation
   */
  executeDelete(): void {
    if (!this.petToDelete?.id) {
      this.deleteError = 'Invalid pet selected';
      return;
    }

    this.isDeleting = true;
    this.deleteError = '';

    this.petService.deletePet(this.petToDelete.id).subscribe({
      next: () => {
        // Remove pet from local array
        this.pets = this.pets.filter(pet => pet.id !== this.petToDelete?.id);
        
        // Reset state
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.petToDelete = null;
        
        // Show success message
        setTimeout(() => {
          // You could add a toast notification here
          console.log('Pet deleted successfully');
        }, 100);
      },
      error: (error) => {
        this.isDeleting = false;
        this.deleteError = error.message || 'Failed to delete pet. Please try again.';
        console.error('Error deleting pet:', error);
      }
    });
  }

  /**
   * Handle delete click from category card
   */
  onDeletePet(petId: string): void {
    const pet = this.pets.find(p => p.id === petId);
    if (pet) {
      this.confirmDelete(pet);
    }
  }

  /**
   * Refresh pets list
   */
  refreshPets(): void {
    this.loadUserPets();
  }
}