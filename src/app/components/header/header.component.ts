import { AngularFirestore } from '@angular/fire/firestore';
import { IUser } from './../../shared/interfaces/user.interface';
import { AuthService } from './../../shared/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-header', 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isShowedItemsLinks: boolean = false;
  profileViewPhoto: string = ''
  activeAuthUser:boolean = false // for display border around profile photo
  id:string = '';
  showHeader: boolean = true
  searchedListUsers: IUser[] | any = [] //list founded users
  showSearchUser:boolean = false; //show searched users block
  searchInput:string = ''
  noResultsFound:boolean = true //show message 'No results found.'
  showPreloader:boolean = false

  constructor(private router: Router,
              private firestore: AngularFirestore, 
              private authService: AuthService) { 
                this.router.events.subscribe((event: Event) => {
                  if (event instanceof NavigationEnd) {
                    this.showSearchUser = false
                    let urlNow = this.router.routerState.snapshot.url
                    const urlParams = urlNow.split('/')
                    if (urlParams[urlParams.length-1] == 'log-in' || urlParams[urlParams.length-1] == 'sing-up'){
                      this.isShowedItemsLinks = false
                      this.showHeader = false
                    } else {
                      this.showHeader = true
                      urlNow.includes(this.id) && urlNow.includes(`profile`)
                          ? this.activeAuthUser = true
                          : this.activeAuthUser = false
                    }
                  }
                }); 
              }

  ngOnInit(): void {
    this.subscribeUserProfilePath()
    this.updateViewProfilePhoto()
    this.loadProfilePhotoHeader()
  }

  private subscribeUserProfilePath():void{
    this.authService.userAuthPath.subscribe( (newPath) => {
      this.id = newPath
    })
  }
  
  updateViewProfilePhoto(){
    // якщо зміниться userAuthProfilePhoto в authService -> то автоматично змінити profileViewPhoto в header-i
    this.authService.userAuthProfilePhoto.subscribe( (newViewPhoto) => {
      this.profileViewPhoto = newViewPhoto
    })
  }
  // підгрузити фото профілю та лінк в header
  loadProfilePhotoHeader(){
    if (localStorage.getItem('authUser')){
      this.profileViewPhoto = JSON.parse(localStorage.getItem('authUser')).profilePhoto
      this.id = JSON.parse(localStorage.getItem('authUser')).id
    } else{
      this.profileViewPhoto = ''
      this.id = 'notAuthUser'
    }
    
  }

  toggleShowNavLinksBlock():void{
    this.isShowedItemsLinks = !this.isShowedItemsLinks
  }
  logOutUser():void{
    localStorage.clear();
    this.isShowedItemsLinks = false
    this.router.navigateByUrl('/log-in')
  };

  onBlurEventSearchInput():void{
    setTimeout( () => {
      this.showSearchUser = false
      this.searchInput = ''
    }, 100)
  };

  //пошук користувачів по input field
  searchingUser(){
    if(this.searchInput != ''){
      this.searchedListUsers.length = 0
      this.showPreloader = true
      this.noResultsFound = false
      this.firestore.collection("users").ref.orderBy('nikname').startAt(this.searchInput).endAt(this.searchInput +'\uf8ff').limit(10)
      .get().then( doc => {
        this.showPreloader = false
        this.searchedListUsers.length = 0
        if(doc.empty){
          this.noResultsFound = true
        }  else {
          this.noResultsFound = false
        } 
        doc.forEach( el => {
          this.searchedListUsers.push(el.data())
        })
      })
    } else {
      this.searchedListUsers.length = 0
    }
  };
}
