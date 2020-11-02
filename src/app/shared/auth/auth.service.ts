import { IUser } from '../interfaces/user.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: IUser | any;
  statusLogIn: Subject<string> = new Subject<string>()
  userAuthPath: Subject<string> = new Subject<string>()
  userAuthProfilePhoto: Subject<string> = new Subject<string>()

  constructor(private afAuth: AngularFireAuth,
              private firestore: AngularFirestore,
              private spinner: NgxSpinnerService,
              private router: Router) { } 

  logIn(email: string, password: string): void {
    this.spinner.show()
    this.afAuth.signInWithEmailAndPassword(email, password)
      .then(user => {
        //after autorize get data user with Firestore 
        this.firestore.collection('users').ref.where('id', '==', user.user.uid).onSnapshot(
          snap => {
            this.spinner.hide()
            snap.forEach(userRef => {
              this.currentUser = userRef.data()
              this.changeLocalStorageData(this.currentUser) //change/add data User in localstorage
              this.changeUserAuthPath(this.currentUser.id) //change User path in headerComponent
              this.changeUserAuthProfilePhoto(userRef.data().profilePhoto) //change User header profile photo
              this.router.navigateByUrl(`/profile/posts/${this.currentUser.id}`)
            })
          }
        ).bind(AuthService)
        this.statusLogIn.next('');
      })
      .catch(error => {
        this.spinner.hide() 
        this.statusLogIn.next(error.message);
      })

  };
  //change url 'profile photo' for all subscribers
  changeUserAuthProfilePhoto( url:string){
    this.userAuthProfilePhoto.next(url)
  }
  //change 'profile path' in headerComponent
  changeUserAuthPath(path:string){
    this.userAuthPath.next(path)
  }
  //change data in localStorage
  changeLocalStorageData( date: IUser){
    localStorage.setItem('authUser', JSON.stringify(date))
  };
}
