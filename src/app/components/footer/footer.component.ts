import { Router, NavigationEnd, Event } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  showFooter:boolean = true

  constructor(private router: Router) { 
      this.router.events.subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          let urlNow: string = this.router.routerState.snapshot.url
          if (urlNow.includes('direct')){
            this.showFooter = false
          } else {
            this.showFooter = true
          }
        }
      }); 
    }

  ngOnInit(): void {
  }

}
