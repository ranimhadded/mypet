export interface Pet {
  id?: string; 
  name: string;
  species: 'Cat' | 'Dog' | 'Bird' | 'Other';
  description: string;
  sex: 'Male' | 'Female';
  age: 'puppy' | 'young' | 'adult' | 'senior';
  ownerId: string; 
  ownerName?: string; 
  ownerPhoto?: string; 
  ownerLocation?: string; 
  location: {
    city: string;
    state: string;
  };
  photos: string[]; // Array of photo URLs
  photoType?: 'base64' | 'url';
  createdAt: Date;
  updatedAt: Date;
  breed?: string;
  weight?: number;
  medicalNotes?: string;
  color: string;
  characteristics: string[];
  houseTrained: boolean;
  adoptionFee: number;
  sold?: boolean;
}
// Helper function to get species icon
export function getSpeciesIcon(species: string): string {
  switch(species.toLowerCase()) {
    case 'cat':
      return 'assets/cat.png'; // Or use material icon: 'pets'
    case 'dog':
      return 'assets/dog.png'; // Or 'cruelty_free'
    case 'bird':
      return 'assets/bird.png'; // Or 'flutter_dash'
    default:
      return 'assets/pet.png'; // Or 'pets'
  }
}
// For form submission (without auto-generated fields)
export interface PetFormData {
  name: string;
  species: 'Cat' | 'Dog' | 'Bird' | 'Other';
  description: string;
  sex: 'Male' | 'Female';
  age: 'puppy' | 'young' | 'adult' | 'senior';
  photos: string[];
  location: {
    city: string;
    state: string;
  };
  breed?: string;
  weight?: number;
  medicalNotes?: string;
  adoptionFee?: number;
  houseTrained?: boolean;
  characteristics?: string[];
  color?: string;
}