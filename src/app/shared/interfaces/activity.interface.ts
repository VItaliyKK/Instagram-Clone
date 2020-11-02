export interface IActivity{
    date: Date;
    type: 'following' | 'like' | 'comment';
    fromUser:string;
    forUser:string;
    pinPost?: string;
    nikname?: string;
    profilePhoto?: string;
    idComment?: string;
    isFollowToo?: boolean;
}