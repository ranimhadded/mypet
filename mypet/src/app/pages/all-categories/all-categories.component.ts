import { Component, NgModule, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryCardComponent } from '../../shared/category-card/category-card.component';
import { PetService } from '../../core/services/pet.service';
import { Pet } from '../../core/models/pet.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchComponent } from '../../shared/search/search.component';
import { SearchService } from '../../core/services/search.service';
@Component({
  selector: 'app-all-categories',
  standalone: true,
  imports: [CommonModule, CategoryCardComponent,FormsModule],
  templateUrl: './all-categories.component.html',
  styleUrl: './all-categories.component.scss'
})
export class AllCategoriesComponent implements OnInit {
private petService = inject(PetService);
private searchService = inject(SearchService);
private router = inject(Router);
  allPets: Pet[] = [];
  filteredPets: Pet[] = [];
  searchTerm: string = '';
  isLoading = true;
  errorMessage = '';
  noPetsMessage = '';

  // Color palette for pet cards
  private colorPalettes = [
    { bg: '#F2B2B2', content: '#F25F9E' }, // Pink
    { bg: '#FFE167', content: '#F79F5A' }, // Orange/Yellow
    { bg: '#C8EDFD', content: '#283275' }, // Blue
    { bg: '#A9F3B5', content: '#4CD964' }, // Green
    
  ];

  // Species statistics
  speciesStats = {
    total: 0,
    dogs: 0,
    cats: 0,
    birds: 0,
    others: 0
  };

  ngOnInit(): void {
    this.loadAllPets();

    // Subscribe to search term from the service
    this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = term;
      this.filterPets();
    });
  }

  filterPets() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredPets = this.allPets;
      return;
    }

    this.filteredPets = this.allPets.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.species.toLowerCase().includes(term)
    );
  }
  private loadAllPets(): void {
    this.isLoading = true;
    this.petService.getAllPets().subscribe({
      next: pets => {
        this.allPets = pets;
        this.filteredPets = pets; // <-- make sure filteredPets is initialized
        this.isLoading = false;
      },
      error: error => {
        this.errorMessage = 'Failed to load pets. Please try again.';
        this.isLoading = false;
        this.allPets = [];
      }
    });
  }

    /**
   * Refresh pets list
   */
  refreshPets(): void {
    this.loadAllPets();
  }

  private calculateSpeciesStats(pets: Pet[]): void {
    this.speciesStats = {
      total: pets.length,
      dogs: pets.filter(pet => pet.species.toLowerCase() === 'dog').length,
      cats: pets.filter(pet => pet.species.toLowerCase() === 'cat').length,
      birds: pets.filter(pet => pet.species.toLowerCase() === 'bird').length,
      others: pets.filter(pet => 
        !['dog', 'cat', 'bird'].includes(pet.species.toLowerCase())
      ).length
    };
  }

  /**
   * Get a color palette for a pet based on its index
   */
  getPetColor(index: number): { bg: string, content: string } {
    return this.colorPalettes[index % this.colorPalettes.length];
  }

  /**
   * Get pet species emoji
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
   * Get pet image (first photo or default)
   */
  getPetImage(pet: Pet): string {
    if (pet.photos && pet.photos.length > 0) {
      return pet.photos[0];
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
   * Get pet age category
   */
  getAgeCategory(age: string): string {
    switch(age) {
      case 'puppy': return 'Puppy/Kitten';
      case 'young': return 'Young';
      case 'adult': return 'Adult';
      case 'senior': return 'Senior';
      default: return age;
    }
  }

  /**
   * Filter pets by species
   */
  filterBySpecies(species: string): void {
  if (species === 'all') {
    this.filteredPets = [...this.allPets];
  } else {
    this.filteredPets = this.allPets.filter(
      pet => pet.species.toLowerCase() === species.toLowerCase()
    );
  }
}

  /**
   * Sort pets by criteria
   */
 sortPets(criteria: 'name' | 'species' | 'age'): void {
  const sortedPets = [...this.filteredPets].sort((a, b) => { 
    switch(criteria) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'species':
        return a.species.localeCompare(b.species);
      case 'age':
        const ageOrder = { 'puppy': 0, 'young': 1, 'adult': 2, 'senior': 3 };
        return (ageOrder[a.age as keyof typeof ageOrder] || 4) - 
               (ageOrder[b.age as keyof typeof ageOrder] || 4);
      default:
        return 0;
    }
  });
  this.filteredPets = sortedPets;
}

viewPetDetails(petId: string): void {
  
  if (!petId) {
    console.error('Pet ID is undefined or null');
    return;
  }
  
  this.router.navigate(['/pet', petId]).then(
    (success) => {
      console.log('4. Navigation successful:', success);
    },
    (error) => {
      console.error('5. Navigation failed:', error);
    }
  );
}

testClick(pet: any, source: string): void {
  console.log(`${source} clicked for pet:`, pet.name);
  console.log('Pet ID:', pet.id);
  console.log('Pet has ID?', !!pet.id);
  
  if (pet.id) {
    this.viewPetDetails(pet.id);
  } else {
    console.error('No pet ID available');
  }
}



}