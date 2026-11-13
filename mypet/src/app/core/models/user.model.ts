export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  // Additional fields from your signup form
  title?: string;
  companyName?: string;
  address?: string;
  state?: string;
  city?: string;
  postal?: string;
  createdAt?: Date;
}