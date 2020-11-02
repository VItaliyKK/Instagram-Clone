import { Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from './../auth/auth.service';
import { User } from './../models/user.model';
import { IUser } from './../interfaces/user.interface';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SingInService {
  statusSingUp: Subject<string> = new Subject<string>()

  constructor(private firestore: AngularFirestore,
              private afAuth: AngularFireAuth, 
              private authServise: AuthService,
              private spinner: NgxSpinnerService) { }
  
  addNewUser(newUser: IUser): Promise<void>{
    return this.firestore.collection('users').doc(newUser.id).set(Object.assign({}, newUser))
      .catch(function(error) {
          console.error(error);
      });
  };

  mainRegisterNewUser(email: string, password: string, nikname: string, fullName: string){
    this.spinner.show()
    this.afAuth.createUserWithEmailAndPassword(email, password)
      .then( i => {
        if (i.additionalUserInfo.isNewUser) {
          localStorage.setItem('isNewUser', JSON.stringify(true))
        }
        let newwUs:IUser = new User(i.user.uid, nikname, fullName, email)
        this.addNewUser(newwUs).finally(()=>{
          this.statusSingUp.next('')
          this.authServise.logIn(email, password)
          this.spinner.hide()
        })
      })
      .catch( error => {
        this.statusSingUp.next(error.message)
        this.spinner.hide()
      })
  };
}
