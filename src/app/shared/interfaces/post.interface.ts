
export interface IPost {
    id: string;
    idPost: string;
    postBy: string;
    date: Date;
    description: string;
    location: string;
    likes: string[];
    photos: string[];
    comments: string[];
    profilePhoto: string;
    saved: string[];
    likesCount?:number;
}