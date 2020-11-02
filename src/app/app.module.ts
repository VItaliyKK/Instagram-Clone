import { environment } from './../environments/environment.prod';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppRoutingModule, routes } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';

import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './main-pages/home/home.component';
import { DirectComponent } from './main-pages/direct/direct.component';
import { ExploreComponent } from './main-pages/explore/explore.component';
import { ActivityComponent } from './main-pages/activity/activity.component';
import { ProfileComponent } from './main-pages/profile/profile.component';
import { PostsComponent } from './main-pages/profile/posts/posts.component';
import { IgtvComponent } from './main-pages/profile/igtv/igtv.component';
import { SavedComponent } from './main-pages/profile/saved/saved.component';
import { TaggedComponent } from './main-pages/profile/tagged/tagged.component';
import { SettingsComponent } from './secondary-pages/settings/settings.component';
import { LogInComponent } from './secondary-pages/log-in/log-in.component';
import { SingInComponent } from './secondary-pages/sing-in/sing-in.component';
import { FooterComponent } from './components/footer/footer.component';
import { EditProfileComponent } from './secondary-pages/settings/edit-profile/edit-profile.component';
import { PostDetailsComponent } from './secondary-pages/post-details/post-details.component';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConvertDatePipe } from './shared/pipes/convert-date.pipe';

import { NgxSpinnerModule } from "ngx-spinner";
import { DialogComponent } from './main-pages/direct/dialog/dialog.component';
import { NotExistComponent } from './secondary-pages/not-exist/not-exist.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { PreloaderComponent } from './secondary-pages/preloader/preloader.component'; 
import 'hammerjs';
import { NgxHmCarouselModule } from 'ngx-hm-carousel';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    DirectComponent,
    ExploreComponent,
    ActivityComponent,
    ProfileComponent,
    PostsComponent,
    IgtvComponent,
    SavedComponent,
    TaggedComponent,
    SettingsComponent,
    LogInComponent,
    SingInComponent,
    FooterComponent,
    EditProfileComponent,
    PostDetailsComponent,
    ConvertDatePipe,
    DialogComponent,
    NotExistComponent,
    PreloaderComponent
  ],
  imports: [
    AppRoutingModule,
    RouterModule.forRoot(routes),
    BrowserModule,
    FormsModule,
    ModalModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebaseConfig), 
    AngularFirestoreModule, // firestore
    AngularFireAuthModule, // auth
    AngularFireStorageModule, // storage
    HttpClientModule, 
    BrowserAnimationsModule,
    NgxSpinnerModule,
    ModalModule.forRoot(),
    LazyLoadImageModule,
    NgxHmCarouselModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
