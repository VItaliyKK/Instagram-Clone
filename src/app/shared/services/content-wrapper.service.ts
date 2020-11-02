import { Subject } from 'rxjs';
import { IPost } from './../interfaces/post.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class ContentWrapperService {
  postsCount: Subject<boolean> = new Subject<boolean>()

  constructor(private firestore: AngularFirestore, private router: Router) { }

  getIdCurrentUserThrouthURL():string{
    let urlParams = this.router.routerState.snapshot.url.split('/');
    if(urlParams.length == 5){
      return urlParams[urlParams.length-2]
    } else{
      return urlParams[urlParams.length-1]
    }
  };

  getContentByTypeAndID(type: string, userID: string, amountLoad:number, lastIndex:any) {
    if (type == 'posts') {
      if (lastIndex == 0) {
        return this.firestore.collection('posts').ref.where('id', '==', userID).orderBy('date', 'desc').limit(amountLoad)
      } else {
        return this.firestore.collection('posts').ref.where('id', '==', userID).orderBy('date', 'desc').startAfter(lastIndex).limit(amountLoad)
      }
    }
  };

  addNewPost(newPost: IPost, futureDocPostId: string): Promise<void> {
    return this.firestore.collection('posts').doc(futureDocPostId)
      .set(Object.assign({}, newPost))
      .then(() => {
            this.firestore.collection('users').doc(newPost.id).update({
                  'posts': firebase.firestore.FieldValue.arrayUnion(newPost.idPost)
            })
      })
      .catch( (error) => {
        console.error(error);
      });
  };

  // підписка на user
  following(idUsWhatSubscribed: string, idUsWhatGotSubscriber: string):Promise<void>{
    return this.firestore.collection('users').doc(idUsWhatSubscribed).update({
      'following': firebase.firestore.FieldValue.arrayUnion(idUsWhatGotSubscriber)
    }).then( () => {
      this.firestore.collection('users').doc(idUsWhatGotSubscriber).update({
        'followers': firebase.firestore.FieldValue.arrayUnion(idUsWhatSubscribed)
      }).then(()=>{
      })
    })
  };

  unfollowing(usWhoWantUnsubscribe: string, usWhoLosesSubscriber: string):Promise<void>{
    return this.firestore.collection('users').doc(usWhoWantUnsubscribe).update({
      'following': firebase.firestore.FieldValue.arrayRemove(usWhoLosesSubscriber)
    }).then( () => {
      this.firestore.collection('users').doc(usWhoLosesSubscriber).update({
        'followers': firebase.firestore.FieldValue.arrayRemove(usWhoWantUnsubscribe)
      })
    })
  };

  getSavedPost(idPost:string){
    return this.firestore.collection('posts').ref.where('idPost', '==', idPost)
  }
}
