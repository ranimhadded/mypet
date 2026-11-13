import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchComponent } from './shared/search/search.component';
import { SearchService } from './core/services/search.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    SearchComponent,
    CommonModule,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  showSearch = false;
  searchTerm = '';
  showSearchButton = false;

  constructor(
    private router: Router,
    private searchService: SearchService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Show search button only on /All
        this.showSearchButton = event.urlAfterRedirects.includes('/All');

        if (!this.showSearchButton) {
          this.showSearch = false; // hide search if leaving /All
        }
      });
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  onSearchTermChange(term: string) {
    this.searchTerm = term;
    this.searchService.setSearchTerm(term);
  }
}
