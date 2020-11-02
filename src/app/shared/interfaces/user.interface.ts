import { IIgtv } from './igtv.interface';
import { IPost } from './post.interface';
import { IHistory } from './history.interface';

export interface IUser {
    id: string;
    nikname: string;
    fullname: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    profilePhoto: string;
    followers: string[];
    following: string[];
    historyActive:IHistory[];
    historyInactive:IHistory[];
    posts: IPost[];
    igtv: IIgtv[];
    saved: IPost[];
    tagged: IPost[];
    isFollowToo?: boolean;
}