import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, doc, updateDoc, deleteDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, forkJoin, of, map } from 'rxjs';
import { Pet, PetFormData } from '../models/pet.model';

interface UserData {
  city?: string;
  state?: string;
  displayName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private get petsCollection() {
    return collection(this.firestore, 'pets');
  }

  // Get user location
  private getUserLocation(userId: string): Observable<{ city: string; state: string }> {
    return new Observable(observer => {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          observer.next({
            city: userData.city || 'Unknown',
            state: userData.state || 'Unknown'
          });
        } else {
          observer.next({ city: 'Unknown', state: 'Unknown' });
        }
        observer.complete();
      }).catch(() => {
        observer.next({ city: 'Unknown', state: 'Unknown' });
        observer.complete();
      });
    });
  }

  // Convert files to Base64 with compression
  private filesToBase64(files: File[]): Observable<string[]> {
    if (!files || files.length === 0) return of([]);
    return forkJoin(files.map(file => this.fileToBase64(file)));
  }

  // Convert and compress single file to Base64
  private fileToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result as string;
        
        // If image is larger than 300KB, compress it
        if (base64String.length > 300000) {
          this.compressImage(base64String, file.type)
            .then(compressed => {
              observer.next(compressed);
              observer.complete();
            })
            .catch(() => {
              // If compression fails, try with original if under 500KB
              if (base64String.length <= 500000) {
                observer.next(base64String);
                observer.complete();
              } else {
                observer.error(new Error('Image is too large. Please use images under 500KB'));
              }
            });
        } else {
          observer.next(base64String);
          observer.complete();
        }
      };
      
      reader.onerror = () => observer.error(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Compress image using canvas
  private compressImage(base64: string, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Calculate new dimensions (max 800px width/height)
        let { width, height } = img;
        const maxSize = 800;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw image with white background (for transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until size is acceptable
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        while (result.length > 400000 && quality > 0.3) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        if (result.length > 500000) {
          reject(new Error('Could not compress image enough'));
        } else {
          resolve(result);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
  }

  // Add pet with Base64 photos
addPetWithBase64(petData: PetFormData, files: File[]): Observable<Pet> {
  return new Observable(observer => {
    const user = this.auth.currentUser;
    
    if (!user) {
      observer.error(new Error('User must be logged in to add a pet'));
      return;
    }

    this.getUserLocation(user.uid).subscribe({
      next: (location) => {
        this.filesToBase64(files).subscribe({
          next: (base64Photos) => {
            const pet: Omit<Pet, 'id'> = {
              name: petData.name,
              species: petData.species,
              description: petData.description,
              sex: petData.sex,
              age: petData.age,
              breed: petData.breed || '',
              weight: petData.weight,
              medicalNotes: petData.medicalNotes || '',
              color: petData.color || '',
              characteristics: petData.characteristics || [],
              houseTrained: petData.houseTrained ?? false,
              adoptionFee: petData.adoptionFee ?? 0,
              ownerId: user.uid,
              ownerName: user.displayName || user.email || 'Unknown',
              photos: base64Photos, // <-- Utilise les photos converties
              photoType: 'base64',
              location: location,
              createdAt: new Date(),
              updatedAt: new Date(),
              sold: false
            };

            const totalSize = JSON.stringify(pet).length;
            if (totalSize > 900000) {
              observer.error(new Error('Pet data is too large. Please reduce number or size of photos.'));
              return;
            }

            addDoc(this.petsCollection, pet)
              .then(docRef => {
                observer.next({ ...pet, id: docRef.id });
                observer.complete();
              })
              .catch(error => observer.error(this.handleFirestoreError(error)));
          },
          error: (err) => observer.error(err)
        });
      },
      error: (err) => observer.error(err)
    });
  });
}

  // Update pet with Base64 photos
  updatePetWithBase64(petId: string, petData: PetFormData, newFiles: File[]): Observable<Pet> {
    return new Observable(observer => {
      const user = this.auth.currentUser;
      
      if (!user) {
        observer.error(new Error('User must be logged in to update pets'));
        return;
      }

      this.filesToBase64(newFiles).subscribe({
        next: (newBase64Photos) => {
          const updateData: Partial<Pet> = {
            name: petData.name,
            species: petData.species,
            description: petData.description,
            sex: petData.sex,
            age: petData.age,
            color: petData.color,
            characteristics: petData.characteristics,
            houseTrained: petData.houseTrained,
            adoptionFee: petData.adoptionFee,
            photos: [...(petData.photos || []), ...newBase64Photos],
            photoType: 'base64',
            updatedAt: new Date()
          };

          if (petData.breed) updateData.breed = petData.breed;
          if (petData.weight) updateData.weight = petData.weight;
          if (petData.medicalNotes) updateData.medicalNotes = petData.medicalNotes;

          const petDocRef = doc(this.firestore, `pets/${petId}`);
          
          getDoc(petDocRef).then(petDoc => {
            if (!petDoc.exists()) {
              observer.error(new Error('Pet not found'));
              return;
            }

            const existingPet = petDoc.data() as Pet;
            
            if (existingPet.ownerId !== user.uid) {
              observer.error(new Error('You can only update your own pets'));
              return;
            }

            updateDoc(petDocRef, updateData)
              .then(() => {
                observer.next({ ...existingPet, ...updateData, id: petId });
                observer.complete();
              })
              .catch(error => observer.error(this.handleFirestoreError(error)));
          }).catch(error => observer.error(this.handleFirestoreError(error)));
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // Add pet without photos
addPet(petData: PetFormData): Observable<Pet> {
  return new Observable(observer => {
    const user = this.auth.currentUser;
    
    if (!user) {
      observer.error(new Error('User must be logged in to add a pet'));
      return;
    }

    this.getUserLocation(user.uid).subscribe({
      next: (location) => {
        const pet: Omit<Pet, 'id'> = {
          name: petData.name,
          species: petData.species,
          description: petData.description,
          sex: petData.sex,
          age: petData.age,
          breed: petData.breed || '',
          weight: petData.weight,
          medicalNotes: petData.medicalNotes || '',
          color: petData.color || '',
          characteristics: petData.characteristics || [],
          houseTrained: petData.houseTrained ?? false,
          adoptionFee: petData.adoptionFee ?? 0,
          ownerId: user.uid,
          ownerName: user.displayName || user.email || 'Unknown',
          photos: petData.photos || [],
          photoType: 'base64',
          location: location,
          createdAt: new Date(),
          updatedAt: new Date(),
          sold: false
        };

        addDoc(this.petsCollection, pet)
          .then(docRef => {
            observer.next({ ...pet, id: docRef.id });
            observer.complete();
          })
          .catch(error => observer.error(this.handleFirestoreError(error)));
      }
    });
  });
}

  // Get pet by ID
  getPetById(petId: string): Observable<Pet> {
    return new Observable(observer => {
      const petDocRef = doc(this.firestore, `pets/${petId}`);
      
      getDoc(petDocRef).then(petDoc => {
        if (!petDoc.exists()) {
          observer.error(new Error('Pet not found'));
          return;
        }

        const petData = petDoc.data() as any;
        const pet: Pet = {
          ...petData,
          id: petDoc.id,
          createdAt: this.handleTimestamp(petData.createdAt),
          updatedAt: this.handleTimestamp(petData.updatedAt)
        };
        
        observer.next(pet);
        observer.complete();
      }).catch(error => observer.error(this.handleFirestoreError(error)));
    });
  }

  // Get current user's pets only
  getUserPets(): Observable<Pet[]> {
    return new Observable(observer => {
      const user = this.auth.currentUser;
      
      if (!user) {
        observer.next([]);
        observer.complete();
        return;
      }

      const userPetsQuery = query(
        this.petsCollection,
        where('ownerId', '==', user.uid)
      );

      collectionData(userPetsQuery, { idField: 'id' }).subscribe({
        next: (pets) => {
          const processedPets = (pets as any[]).map(pet => ({
            ...pet,
            createdAt: this.handleTimestamp(pet.createdAt),
            updatedAt: this.handleTimestamp(pet.updatedAt)
          } as Pet));
          
          observer.next(processedPets);
        },
        error: (error) => observer.error(this.handleFirestoreError(error)),
        complete: () => observer.complete()
      });
    });
  }

  // Get all pets EXCEPT current user's pets and sold pets
  getAllPets(): Observable<Pet[]> {
    const currentUserId = this.auth.currentUser?.uid;

    return collectionData(this.petsCollection, { idField: 'id' }).pipe(
      map(pets => {
        return (pets as any[])
          .filter(pet => {
            // Exclude sold pets
            if (pet.sold) return false;
            // Exclude current user's pets
            if (currentUserId && pet.ownerId === currentUserId) return false;
            return true;
          })
          .map(pet => ({
            ...pet,
            createdAt: this.handleTimestamp(pet.createdAt),
            updatedAt: this.handleTimestamp(pet.updatedAt)
          } as Pet));
      })
    );
  }

  // Get ALL pets including user's own (for admin or special views)
  getAllPetsIncludingOwn(): Observable<Pet[]> {
    return collectionData(this.petsCollection, { idField: 'id' }).pipe(
      map(pets => {
        return (pets as any[])
          .filter(pet => !pet.sold)
          .map(pet => ({
            ...pet,
            createdAt: this.handleTimestamp(pet.createdAt),
            updatedAt: this.handleTimestamp(pet.updatedAt)
          } as Pet));
      })
    );
  }

  // Delete pet
  deletePet(petId: string): Observable<void> {
    return new Observable(observer => {
      const user = this.auth.currentUser;
      
      if (!user) {
        observer.error(new Error('User must be logged in to delete pets'));
        return;
      }

      const petDocRef = doc(this.firestore, `pets/${petId}`);
      
      getDoc(petDocRef).then(petDoc => {
        if (!petDoc.exists()) {
          observer.error(new Error('Pet not found'));
          return;
        }

        const petData = petDoc.data() as Pet;
        
        if (petData.ownerId !== user.uid) {
          observer.error(new Error('You can only delete your own pets'));
          return;
        }

        deleteDoc(petDocRef)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch(error => observer.error(this.handleFirestoreError(error)));
      }).catch(error => observer.error(this.handleFirestoreError(error)));
    });
  }

  // Search by name or species
  getPetsByNameOrSpecies(searchTerm: string): Observable<Pet[]> {
    if (!searchTerm) return this.getAllPets();

    const lowerTerm = searchTerm.toLowerCase();

    return this.getAllPets().pipe(
      map(pets => pets.filter(p => 
        p.name.toLowerCase().includes(lowerTerm) || 
        p.species.toLowerCase().includes(lowerTerm) ||
        p.breed?.toLowerCase().includes(lowerTerm)
      ))
    );
  }

  // Search by location
  getPetsByLocation(city?: string, state?: string): Observable<Pet[]> {
    return this.getAllPets().pipe(
      map(pets => pets.filter(p => {
        if (city && state) {
          return p.location?.city?.toLowerCase().includes(city.toLowerCase()) && 
                 p.location?.state?.toLowerCase().includes(state.toLowerCase());
        }
        if (city) return p.location?.city?.toLowerCase().includes(city.toLowerCase());
        if (state) return p.location?.state?.toLowerCase().includes(state.toLowerCase());
        return true;
      }))
    );
  }

  // Helper: Handle Firestore timestamps
  private handleTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  }

  // Helper: Handle Firestore errors
  private handleFirestoreError(error: any): Error {
    console.error('Firestore error:', error);
    
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'unavailable': 'Network error. Please check your connection',
      'invalid-argument': 'Invalid data provided',
      'resource-exhausted': 'Document too large. Please reduce photo size',
      'already-exists': 'This pet already exists'
    };
    
    return new Error(errorMessages[error.code] || 'An error occurred');
  }
}