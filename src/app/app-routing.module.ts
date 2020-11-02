import { AuthGuard } from './shared/auth/auth.guard';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

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
import { EditProfileComponent } from './secondary-pages/settings/edit-profile/edit-profile.component';

import { NotExistComponent } from './secondary-pages/not-exist/not-exist.component';
import { PostDetailsComponent } from './secondary-pages/post-details/post-details.component';
import { DialogComponent } from './main-pages/direct/dialog/dialog.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate:[AuthGuard], children:[
    { path: ':idPost', component: PostDetailsComponent }
  ]},
  { path: 'direct', component: DirectComponent, canActivate:[AuthGuard], children:[
    {path: ':idDialog', component: DialogComponent, children: [
      { path: ':idPost', component: PostDetailsComponent }
    ]}
  ]},
  { path: 'explore', component: ExploreComponent, canActivate:[AuthGuard], children:[
    { path: ':idPost', component: PostDetailsComponent }
  ]},
  { path: 'activity', component: ActivityComponent, canActivate:[AuthGuard], children:[
    { path: ':idPost', component: PostDetailsComponent }
  ]},
  { path: 'settings', component: SettingsComponent, canActivate:[AuthGuard], children:[
    { path: 'edit-profile', component: EditProfileComponent }
  ] },
  { path: 'log-in', component: LogInComponent, },
  { path: 'sing-up', component: SingInComponent,},
  { path: 'profile', component: ProfileComponent,canActivate:[AuthGuard], children: [
    { path: 'posts/:id', component: PostsComponent, children:[
      { path: ':idPost', component: PostDetailsComponent }
    ]},
    { path: 'igtv/:id', component: IgtvComponent },
    { path: 'saved/:id', component: SavedComponent, children:[
      { path: ':idPost', component: PostDetailsComponent }
    ] },
    { path: 'tagged/:id', component: TaggedComponent },
  ]},
  { path: 'not-exist', component: NotExistComponent},
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: '**', component: NotExistComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
