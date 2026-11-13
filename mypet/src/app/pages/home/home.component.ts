import { Component } from '@angular/core';
import { FooterComponent } from '../../components/footer/footer.component';
import { CategoryCardComponent } from '../../shared/category-card/category-card.component';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [FooterComponent,CategoryCardComponent,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
