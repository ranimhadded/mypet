import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { AllCategoriesComponent } from './pages/all-categories/all-categories.component';
import { AddPetComponent } from './pages/add-pet/add-pet.component';
import { PetlistComponent } from './pages/petlist/petlist.component';
import { EditPetComponent } from './pages/edit-pet/edit-pet.component';
import { PetDetailsComponent } from './pages/pet-details/pet-details.component';
import { CartComponent } from './pages/cart/cart.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { ChatComponent } from './pages/chat/chat.component';
import { ProfileeditComponent } from './pages/profileedit/profileedit.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';

export const routes: Routes = [
     { path: '', component: HomeComponent },
     { path: 'login', component: LoginComponent },
     { path: 'signup', component: SignupComponent },
     { path: 'addpet', component: AddPetComponent },
     { path: 'All', component: AllCategoriesComponent },
     {path: 'petlist', component: PetlistComponent},
     { path: 'editpet/:id', component: EditPetComponent},
     { path: 'cart', component: CartComponent},
     { path: 'Favorites', component: FavoritesComponent},
     { path: 'Mail', component: ChatComponent},
     { path: 'Profile', component: ProfileeditComponent},
     { path: 'Notifications', component: NotificationsComponent},
     { path: 'pet/:id', component: PetDetailsComponent }

];
