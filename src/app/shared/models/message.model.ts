import { IMessage } from './../interfaces/message.interface';


export class Message implements IMessage{
    constructor(
        public idAuthor: string,
        public inDialog:string,
        public nikname:string,
        public content: string,
        public type: string,
        public date: Date
    ){}
}