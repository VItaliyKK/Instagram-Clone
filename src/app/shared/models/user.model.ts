import { IUser } from './../interfaces/user.interface';
import { IIgtv } from './../interfaces/igtv.interface';
import { IPost } from './../interfaces/post.interface';
import { IHistory } from './../interfaces/history.interface';


export class User implements IUser {
    constructor(
        public id: string,
        public nikname: string,
        public fullname: string,
        public email: string,
        public bio: string = '',
        public location: string = '',
        public website: string = '',
        public profilePhoto: string = '',
        public followers: string[] = [],
        public following: string[] = [],
        public historyActive: IHistory[] = [],
        public historyInactive: IHistory[] = [],
        public posts: IPost[] = [],
        public igtv: IIgtv[] = [],
        public saved: IPost[] = [],
        public tagged: IPost[] = [],
    ) { }
}