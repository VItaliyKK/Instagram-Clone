import { AuthService } from './../../shared/auth/auth.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent implements OnInit {
  email: string = '';
  password: string = '';
  isShowPassword: boolean = false;
  errorMessage:string = ''
  submitButtom:boolean = true

  constructor( private authServise: AuthService) { }

  ngOnInit(): void {
    this.subscribeLogInStatus();
  }
  
  subscribeLogInStatus():void{
    this.authServise.statusLogIn.subscribe( mess => {
      this.errorMessage = mess;
    })
  };
  changeButtonDisabled():void{
    this.submitButtom = this.email == "" || this.password == "" 
  }

  toogleShowPassword():void{
    this.isShowPassword = !this.isShowPassword
  }
  logIn():void{
    this.authServise.logIn(this.email, this.password)
  }
}
