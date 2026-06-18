export declare class ListGarmentsDto {
    marca?: string;
    talla?: string;
    categoria?: string;
    precioMin?: number;
    precioMax?: number;
    q?: string;
    sort?: 'recent' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
}
