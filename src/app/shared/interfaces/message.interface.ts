export interface IMessage{
    idAuthor: string;
    inDialog:string;
    nikname:string;
    content: string;
    type: string;
    date: Date;
    id?:string;
}