export interface CatalogItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  order: number;
  icon?: string | null;
  color?: string | null;
  inputKind: 'text' | 'digits' | 'integer' | 'decimal';
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
}
export interface CatalogDetails {
  code: string;
  name: string;
  items: CatalogItem[];
}
