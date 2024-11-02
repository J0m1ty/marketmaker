export type FileData = {
    name: string;
    path: string;
    content: string;
}

export type File = FileData & {
    active: boolean;
    hover?: boolean;
}

export type XY = {
    x: number;
    y: number;
}

export type Point = {
    price: number;
    quantity: number;
}

export type Curve = Point[];

export type Market = {
    demand: Curve;
    supply: Curve;
}