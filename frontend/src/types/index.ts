export type RoleName = 'CAJERO' | 'GERENTE' | 'ADMINISTRADOR';
export type ProductType = 'SERVICIO' | 'PRODUCTO';
export type InvoiceType = 'FACTURA' | 'TICKET' | 'CCF' | 'EXPORTACION';
export type InvoiceStatus = 'DRAFT' | 'EMITIDA' | 'ANULADA';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleName[];
  branch?: Branch;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
}

export type ClientType = 'NATURAL' | 'JURIDICA';

export interface Client {
  id: number;
  name: string;
  tipoCliente: ClientType;
  email?: string;
  phone?: string;
  address?: string;
  nit?: string;
  nrc?: string;
  dui?: string;
  actividadEconomica?: string;
  nombreComercial?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  company: string;
  contact?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  type: ProductType;
  cost: number;
  unitPrice: number;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  numeroControlDTE: string;
  codeGeneracion: string;
  numeroControl: string;
  selloRecepcion: string;
  issueDate: string;
  series: string;
  type: InvoiceType;
  status: InvoiceStatus;
  categoria?: string;
  subtotal: number;
  iva13: number;
  retencionRenta10: number;
  retencionIva1: number;
  total: number;
  paymentMethod: PaymentMethod;
  observations?: string;
  client: Client;
  branch: Branch;
  items?: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: number;
  productId: number;
  qty: number;
  cost: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  product: Product;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

