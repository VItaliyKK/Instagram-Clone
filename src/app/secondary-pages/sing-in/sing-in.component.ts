import { SingInService } from './../../shared/services/sing-in.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sing-in',
  templateUrl: './sing-in.component.html',
  styleUrls: ['./sing-in.component.scss']
})
export class SingInComponent implements OnInit {
  email: string = '';
  nikname:string = '';
  fullName:string = '';
  password: string = '';
  
  emailRegExp: RegExp = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  niknameRegExp: RegExp = /^([A-Za-z0-9_.-]{6,25})$/;
  fullNameRegExp: RegExp = /^([A-Za-z0-9А-Яа-я\x20]{8,35})$/;
  passwordRegExp: RegExp = /^([A-Za-z0-9.-]{8,25})$/;

  emailIsValid: boolean = true;
  niknameIsValid: boolean = true;
  fullNameIsValid: boolean = true;
  passwordIsValid: boolean = true;

  isShowPassword: boolean = false;
  errorMessage:string = ''
  submitButtonDisabled:boolean = true;

  constructor(private singInService: SingInService) { }

  ngOnInit(): void {
    this.subscribeSingUpStatus();
  }
  ngOnDestroy(): void {
    this.singInService.statusSingUp.unsubscribe()
  }

  subscribeSingUpStatus():void{
    this.singInService.statusSingUp.subscribe( mess => {
      this.errorMessage = mess;
    })
  };
  
  toogleShowPassword():void{
    this.isShowPassword = !this.isShowPassword
  }

  checkDisabledButton(){
    this.submitButtonDisabled = this.email == '' || this.nikname == '' || this.fullName == '' || this.password == ''
  }

  singUp(){
    if (this.isValidForm()){
      this.singInService.mainRegisterNewUser(this.email, this.password, this.nikname, this.fullName)
    }
  }

  isValidForm():boolean{
    this.emailIsValid = true;
    this.niknameIsValid = true;
    this.fullNameIsValid = true;
    this.passwordIsValid = true;
    
    this.emailIsValid = this.emailRegExp.test(this.email)
    this.fullNameIsValid = this.fullNameRegExp.test(this.fullName)
    this.niknameIsValid = this.niknameRegExp.test(this.nikname)
    this.passwordIsValid = this.passwordRegExp.test(this.password)

    return this.emailIsValid && this.fullNameIsValid && this.niknameIsValid && this.passwordIsValid
  }
}
