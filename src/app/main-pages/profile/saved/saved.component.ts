import { ContentWrapperService } from './../../../shared/services/content-wrapper.service';
import { IPost } from './../../../shared/interfaces/post.interface';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { IUser } from 'src/app/shared/interfaces/user.interface';

@Component({
  selector: 'app-saved',
  templateUrl: './saved.component.html',
  styleUrls: ['./saved.component.scss']
})
export class SavedComponent implements OnInit {
  gotRes:any
  currUser:IUser | any
  posts: IPost[] | any = []
  postsEmpty: boolean = true
  subscribeLike: Subscription
  unsubscribeComment: Subscription
  showPreloader:boolean = false
  userListener: Subscription

  constructor(private contentService: ContentWrapperService, private profileService: ProfileService) { }

  ngOnInit(): void {
    this.userListener = this.profileService.getUserData(JSON.parse(localStorage.getItem('authUser')).id)
    .subscribe( user => {
      this.currUser = user
      if (this.currUser.saved.length == 0) {
        this.postsEmpty = true
      } else {
        this.postsEmpty = false
        this.showPreloader = true
        this.currUser.saved.forEach(postID => {
          this.posts.length = 0
          this.gotRes = this.contentService.getSavedPost(postID).onSnapshot( doc => {
              this.showPreloader = false
              doc.forEach(el => {
              let post = el.data()
              post.likesCount = post.likes.length
              post.commentsCount = post.comments.length
              const isExistInList = this.posts.findIndex( p => p.idPost == post.idPost)
              isExistInList != -1
                          ? this.posts.splice(isExistInList, 1, post)
                          : this.posts.push(post)
              console.log('☻post☻', post)
            })
          })
        });
      }
    })
  };

  ngOnDestroy(){
    this.userListener.unsubscribe()
    if (this.gotRes){
      this.gotRes() //відписатись від оновлень
    }
  };

  postHasOnePhoto(post: IPost): boolean {
    return post.photos.length < 2
  }
}
