
export enum View {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  WIZARD = 'WIZARD',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  CHECKOUT = 'CHECKOUT',
  STATUS = 'STATUS'
}

export interface Photo {
  id: string;
  url: string;
  name: string;
}

export interface BookPage {
  id: string;
  photoId?: string;
  caption: string;
  layout: 'single' | 'caption-bottom' | 'blank';
}

export interface PhotoBook {
  id: string;
  title: string;
  theme: string;
  size: 'A4' | 'A5' | 'Square';
  pages: BookPage[];
  status: 'draft' | 'ordered' | 'printing' | 'shipped' | 'delivered';
  writingStyle?: string;
}

export interface Order {
  id: string;
  bookId: string;
  createdAt: number;
  status: 'pending' | 'printing' | 'shipped' | 'delivered';
  address: string;
}
