import { IDialogPreview } from "../interfaces/dialog-preview.interface";


export class DialogPreview implements IDialogPreview {
    constructor(
        public idDialogPreview: string,
        public type: string,
        public lastActive: Date,
        public users: string[],
        public usersData: any[]
    ) { }
}