import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SideBarComponent } from '../../components/sidebar/sidebar.component';
import { PetService } from '../../core/services/pet.service';
import { Pet, PetFormData } from '../../core/models/pet.model';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-pet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SideBarComponent],
  templateUrl: './edit-pet.component.html',
  styleUrls: ['./edit-pet.component.scss']
})
export class EditPetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private petService = inject(PetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  petForm!: FormGroup;
  pet: Pet | null = null;
  petId: string | null = null;
  
  // UI State
  selectedAge: string = 'puppy';
  selectedCharacteristics: string[] = [];
  isLoading = false;
  isFetching = true;
  errorMessage = '';
  successMessage = '';
  
  // Photos
  selectedFiles: File[] = [];
  uploadedPhotos: string[] = [];
  existingPhotosCount = 0;
  
  // Location
  userLocation: { city: string; state: string } | null = null;
  
  // Options
  speciesOptions = ['Cat', 'Dog', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'];
  sexOptions = ['Male', 'Female'];
  ageOptions = [
    { value: 'puppy', label: 'Puppy/Kitten' },
    { value: 'young', label: 'Young' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' }
  ];
  characteristicsOptions = [
    'Friendly', 'Playful', 'Calm', 'Good with kids', 'Good with other pets',
    'Energetic', 'Shy', 'Independent', 'Affectionate', 'Trained', 'Vaccinated', 'Neutered/Spayed'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadPet();
  }

  private initializeForm(): void {
    this.petForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      species: ['Cat', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      sex: ['Male', Validators.required],
      age: ['puppy', Validators.required],
      breed: [''],
      weight: [null, [Validators.min(0.1)]],
      medicalNotes: [''],
      color: ['', Validators.required],
      houseTrained: [false, Validators.required],
      adoptionFee: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private loadPet(): void {
    this.petId = this.route.snapshot.paramMap.get('id');
    
    if (!this.petId) {
      this.errorMessage = 'No pet ID provided';
      this.isFetching = false;
      return;
    }

    this.petService.getPetById(this.petId).subscribe({
      next: (pet) => {
        // Verify ownership
        const user = this.auth.currentUser;
        if (!user || pet.ownerId !== user.uid) {
          this.errorMessage = 'You do not have permission to edit this pet';
          this.isFetching = false;
          return;
        }

        this.pet = pet;
        this.populateForm(pet);
        this.loadUserLocation(user.uid);
        this.isFetching = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load pet';
        this.isFetching = false;
      }
    });
  }

  private populateForm(pet: Pet): void {
    this.petForm.patchValue({
      name: pet.name,
      species: pet.species,
      description: pet.description,
      sex: pet.sex,
      age: pet.age,
      breed: pet.breed || '',
      weight: pet.weight || null,
      medicalNotes: pet.medicalNotes || '',
      color: pet.color || '',
      houseTrained: pet.houseTrained || false,
      adoptionFee: pet.adoptionFee || 0
    });

    this.selectedAge = pet.age;
    this.selectedCharacteristics = pet.characteristics ? [...pet.characteristics] : [];
    
    if (pet.photos?.length) {
      this.uploadedPhotos = [...pet.photos];
      this.existingPhotosCount = pet.photos.length;
    }
    
    if (pet.location) {
      this.userLocation = pet.location;
    }
  }

  private async loadUserLocation(userId: string): Promise<void> {
    if (this.userLocation) return; // Already loaded from pet
    
    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${userId}`));
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.userLocation = { city: data['city'] || 'Unknown', state: data['state'] || 'Unknown' };
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  }

  // Form interactions
  selectAge(age: string): void {
    this.selectedAge = age;
    this.petForm.patchValue({ age });
  }

  toggleCharacteristic(char: string): void {
    const idx = this.selectedCharacteristics.indexOf(char);
    idx > -1 ? this.selectedCharacteristics.splice(idx, 1) : this.selectedCharacteristics.push(char);
  }

  setHouseTrained(value: boolean): void {
    this.petForm.patchValue({ houseTrained: value });
  }

  // Photo handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const newFiles = Array.from(input.files).filter(f => this.validateFile(f));
    const totalSize = [...this.selectedFiles, ...newFiles].reduce((t, f) => t + f.size, 0);

    if (totalSize > 3 * 1024 * 1024) {
      this.errorMessage = 'Total new photos size cannot exceed 3MB';
      input.value = '';
      return;
    }

    this.selectedFiles.push(...newFiles);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) this.uploadedPhotos.push(e.target.result as string);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type) && file.size <= 1024 * 1024;
  }

  removePhoto(index: number): void {
    if (index >= this.existingPhotosCount) {
      this.selectedFiles.splice(index - this.existingPhotosCount, 1);
    }
    this.uploadedPhotos.splice(index, 1);
    if (index < this.existingPhotosCount) this.existingPhotosCount--;
  }

  // Form submission
  onUpdatePet(): void {
    if (this.petForm.invalid || !this.petId) {
      Object.values(this.petForm.controls).forEach(c => c.markAsTouched());
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const petData: PetFormData = {
      ...this.petForm.value,
      photos: this.uploadedPhotos.slice(0, this.existingPhotosCount), // Only existing photos
      characteristics: this.selectedCharacteristics
    };

    this.petService.updatePetWithBase64(this.petId, petData, this.selectedFiles).subscribe({
      next: (updatedPet) => {
        this.isLoading = false;
        this.successMessage = `Pet "${updatedPet.name}" updated successfully!`;
        this.pet = updatedPet;
        this.existingPhotosCount = updatedPet.photos?.length || 0;
        this.uploadedPhotos = [...(updatedPet.photos || [])];
        this.selectedFiles = [];
        
        setTimeout(() => this.router.navigate(['/petlist']), 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to update pet';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/petlist']);
  }

  // Drag & drop
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    (e.target as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    (e.target as HTMLElement).classList.remove('drag-over');
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    (e.target as HTMLElement).classList.remove('drag-over');
    if (e.dataTransfer?.files) {
      this.onFileSelected({ target: { files: e.dataTransfer.files } } as unknown as Event);
    }
  }

  // Helpers
  getTotalFileSize(): string {
    const bytes = this.selectedFiles.reduce((t, f) => t + f.size, 0);
    return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(1)} MB`;
  }

  // Getters
  get name() { return this.petForm.get('name'); }
  get description() { return this.petForm.get('description'); }
  get weight() { return this.petForm.get('weight'); }
  get color() { return this.petForm.get('color'); }
  get adoptionFee() { return this.petForm.get('adoptionFee'); }
}