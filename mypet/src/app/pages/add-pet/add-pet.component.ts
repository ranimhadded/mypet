import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SideBarComponent } from '../../components/sidebar/sidebar.component';
import { PetService } from '../../core/services/pet.service';
import { PetFormData } from '../../core/models/pet.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-pet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SideBarComponent],
  templateUrl: './add-pet.component.html',
  styleUrls: ['./add-pet.component.scss']
})
export class AddPetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private petService = inject(PetService);
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private firestore = inject(Firestore);

  petForm!: FormGroup;
  selectedAge: string | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // File handling
  selectedFiles: File[] = [];
  uploadedPhotos: string[] = [];
  
  // User location (from profile)
  userLocation: { city: string; state: string } | null = null;
  
  // Selected characteristics
  selectedCharacteristics: string[] = [];
  
  // Species options for dropdown
  speciesOptions = ['Cat', 'Dog', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'];
  sexOptions = ['Male', 'Female'];
  ageOptions = [
    { value: 'puppy', label: 'Puppy/Kitten' },
    { value: 'young', label: 'Young' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' }
  ];
  
  // Characteristics options
  characteristicsOptions = [
    'Friendly',
    'Playful',
    'Calm',
    'Good with kids',
    'Good with other pets',
    'Energetic',
    'Shy',
    'Independent',
    'Affectionate',
    'Trained',
    'Vaccinated',
    'Neutered/Spayed'
  ];

  ngOnInit(): void {
    this.initializeForm();
    
    // Check if user is authenticated and get location
    this.authState.currentUser$.subscribe(user => {
      if (!user) {
        this.errorMessage = 'Please log in to add a pet';
      } else {
        this.loadUserLocation(user.uid);
      }
    });
  }

  private async loadUserLocation(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userLocation = {
          city: userData['city'] || 'Unknown',
          state: userData['state'] || 'Unknown'
        };
      } else {
        this.userLocation = { city: 'Unknown', state: 'Unknown' };
      }
    } catch (error) {
      console.error('Error loading user location:', error);
      this.userLocation = { city: 'Unknown', state: 'Unknown' };
    }
  }

  private initializeForm(): void {
    this.petForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      species: ['Cat', Validators.required],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      sex: ['Male', Validators.required],
      age: ['puppy', Validators.required],
      breed: [''],
      weight: [null, [Validators.min(0.1)]],
      medicalNotes: [''],
      // New fields
      color: ['', Validators.required],
      houseTrained: [false, Validators.required],
      adoptionFee: [0, [Validators.required, Validators.min(0)]]
    });

    // Set initial age selection
    this.selectedAge = 'puppy';
  }

  selectAge(age: string): void {
    this.selectedAge = age;
    this.petForm.patchValue({ age });
  }

  // Toggle characteristic selection
  toggleCharacteristic(char: string): void {
    const index = this.selectedCharacteristics.indexOf(char);
    if (index > -1) {
      this.selectedCharacteristics.splice(index, 1);
    } else {
      this.selectedCharacteristics.push(char);
    }
  }

  // Set house trained value
  setHouseTrained(value: boolean): void {
    this.petForm.patchValue({ houseTrained: value });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      
      // Validate file types and sizes
      const validFiles = newFiles.filter(file => 
        this.validateFile(file)
      );
      
      // Check total size of new files
      const newFilesSize = validFiles.reduce((total, file) => total + file.size, 0);
      const totalSize = this.selectedFiles.reduce((total, file) => total + file.size, 0) + newFilesSize;
      
      if (totalSize > 2 * 1024 * 1024) {
        this.errorMessage = 'Total photos size cannot exceed 2MB for Base64 storage';
        input.value = '';
        return;
      }
      
      if (validFiles.length !== newFiles.length) {
        this.errorMessage = 'Some files were skipped. Only JPG, PNG, GIF, WebP under 1MB each are allowed.';
      }
      
      // Add valid files to selected files
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      
      // Create Base64 previews immediately
      this.createBase64Previews(validFiles);
      
      // Clear the input to allow selecting the same file again
      input.value = '';
      
      // Clear error after 5 seconds
      setTimeout(() => {
        if (this.errorMessage.includes('skipped')) {
          this.errorMessage = '';
        }
      }, 5000);
    }
  }

  private validateFile(file: File): boolean {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return false;
    }
    
    // Check file size (max 1MB)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      return false;
    }
    
    return true;
  }

  private createBase64Previews(files: File[]): void {
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.uploadedPhotos.push(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }

  removePhoto(index: number): void {
    // Remove from both arrays
    if (index >= 0 && index < this.uploadedPhotos.length) {
      this.uploadedPhotos.splice(index, 1);
      this.selectedFiles.splice(index, 1);
    }
  }

  onAddPet(): void {
    if (this.petForm.invalid) {
      this.markFormGroupTouched(this.petForm);
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const petData: PetFormData = {
      ...this.petForm.value,
      photos: [],
      age: this.selectedAge as any,
      characteristics: this.selectedCharacteristics
    };

    // Use Base64 method
    this.petService.addPetWithBase64(petData, this.selectedFiles).subscribe({
      next: (createdPet) => {
        this.isLoading = false;
        
        const photoCount = createdPet.photos?.length || 0;
        const photoText = photoCount === 1 ? '1 photo' : `${photoCount} photos`;
        this.successMessage = `Pet "${createdPet.name}" added successfully! ${photoText} saved.`;
        
        // Reset form after successful submission
        this.resetForm();
        
        // Redirect to pet list after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/petlist']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to add pet. Please try again.';
        console.error('Error adding pet:', error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private resetForm(): void {
    this.petForm.reset({
      species: 'Cat',
      sex: 'Male',
      age: 'puppy',
      houseTrained: false,
      adoptionFee: 0,
      color: ''
    });
    this.selectedAge = 'puppy';
    this.selectedFiles = [];
    this.uploadedPhotos = [];
    this.selectedCharacteristics = [];
  }

  // Drag and drop functionality
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.classList.contains('upload-box')) {
      target.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.classList.contains('upload-box')) {
      target.classList.remove('drag-over');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    if (target.classList.contains('upload-box')) {
      target.classList.remove('drag-over');
    }
    
    if (event.dataTransfer?.files) {
      const inputEvent = {
        target: {
          files: event.dataTransfer.files
        }
      } as unknown as Event;
      
      this.onFileSelected(inputEvent);
    }
  }

  // Helper to get file size in readable format
  getTotalFileSize(): string {
    const totalBytes = this.selectedFiles.reduce((total, file) => total + file.size, 0);
    if (totalBytes < 1024) {
      return `${totalBytes} bytes`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  // Getters for easy access to form fields in template
  get name() { return this.petForm.get('name'); }
  get description() { return this.petForm.get('description'); }
  get species() { return this.petForm.get('species'); }
  get sex() { return this.petForm.get('sex'); }
  get age() { return this.petForm.get('age'); }
  get breed() { return this.petForm.get('breed'); }
  get weight() { return this.petForm.get('weight'); }
  get medicalNotes() { return this.petForm.get('medicalNotes'); }
  get color() { return this.petForm.get('color'); }
  get houseTrained() { return this.petForm.get('houseTrained'); }
  get adoptionFee() { return this.petForm.get('adoptionFee'); }
}