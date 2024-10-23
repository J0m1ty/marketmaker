export type FileData = {
    name: string;
    path: string;
    content: string;
}

export type File = FileData & {
    active: boolean;
    hover?: boolean;
}