'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, Eye, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Client } from '@/types';

interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: string;
  cost: string;
  stockQty: number;
}

interface InvoiceItem {
  productId: number;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: string;
  discount: string;
  subtotal: string;
}

export default function FacturacionPage() {
  const { user, hasRole } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchingProduct, setSearchingProduct] = useState(false);
  
  // Form data
  const [branchId, setBranchId] = useState('');
  const [type, setType] = useState('FACTURA');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [clientId, setClientId] = useState<number | null>(null); // Store client ID
  const [clientData, setClientData] = useState<Client>({
    id: 0,
    name: '',
    tipoCliente: 'NATURAL',
    email: '',
    phone: '',
    address: '',
    nit: '',
    nrc: '',
    dui: '',
    actividadEconomica: '',
    nombreComercial: '',
    isActive: true,
    createdAt: '',
    updatedAt: ''
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [applyRetRenta, setApplyRetRenta] = useState(false);
  const [applyRetIva, setApplyRetIva] = useState(false);
  const [observations, setObservations] = useState('');
  
  // Dialogs
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [clientSearchDialogOpen, setClientSearchDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemDiscount, setItemDiscount] = useState('0');

  const canManage = hasRole('GERENTE') || hasRole('ADMINISTRADOR');
  const canInvoice = hasRole('CAJERO') || hasRole('GERENTE') || hasRole('ADMINISTRADOR');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      const branchesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || response.data.branches || []);
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setBranchId(branchesData[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  // Buscar clientes por nombre, NIT o DUI
  const searchClients = async (query: string) => {
    if (!query || query.length < 2) {
      setClients([]);
      return;
    }

    setSearchingClient(true);
    try {
      const response = await api.get(`/clients?q=${encodeURIComponent(query)}`);
      const clientsData = response.data.clients || [];
      setClients(clientsData);
    } catch (error: any) {
      console.error('Error searching clients:', error);
      toast.error('Error al buscar clientes');
      setClients([]);
    } finally {
      setSearchingClient(false);
    }
  };

  // Seleccionar un cliente
  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientData(client);
    setClientSearchDialogOpen(false);
    setClientSearch('');
    setClients([]);
    toast.success('Cliente seleccionado', {
      description: client.name
    });
  };

  const searchProducts = async () => {
    if (!productSearch) return;
    setSearchingProduct(true);
    try {
      const response = await api.get(`/products?query=${productSearch}`);
      const productsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || response.data.products || []);
      setProducts(productsData);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setSearchingProduct(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    // Calculate total quantity already in the invoice for this product
    const existingItem = items.find(item => item.productId === selectedProduct.id);
    const existingQty = existingItem ? existingItem.qty : 0;
    const totalQty = existingQty + itemQty;
    
    // Validate stock availability
    if (totalQty > selectedProduct.stockQty) {
      toast.error('Stock insuficiente', {
        description: `Producto: ${selectedProduct.name}\nStock disponible: ${selectedProduct.stockQty} unidades\nYa en factura: ${existingQty} unidades\nIntentando agregar: ${itemQty} unidades\nTotal requerido: ${totalQty} unidades\n\nPor favor, reduce la cantidad o elimina el producto de la factura.`
      });
      return;
    }
    
    const unitPrice = parseFloat(selectedProduct.unitPrice);
    const discount = parseFloat(itemDiscount) || 0;
    const subtotal = (itemQty * unitPrice) - discount;

    // If product already exists, update quantity instead of adding new line
    if (existingItem) {
      const updatedItems = items.map(item => {
        if (item.productId === selectedProduct.id) {
          const newQty = item.qty + itemQty;
          const newSubtotal = (newQty * unitPrice) - parseFloat(item.discount);
          return {
            ...item,
            qty: newQty,
            subtotal: newSubtotal.toFixed(2)
          };
        }
        return item;
      });
      setItems(updatedItems);
    } else {
      // Add as new item
    const newItem: InvoiceItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      qty: itemQty,
      unitPrice: unitPrice.toFixed(2),
      discount: discount.toFixed(2),
      subtotal: subtotal.toFixed(2)
    };
      setItems([...items, newItem]);
    }

    setAddProductDialogOpen(false);
    setSelectedProduct(null);
    setItemQty(1);
    setItemDiscount('0');
    setProductSearch('');
    setProducts([]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    // Calcular subtotal: suma de todos los productos/servicios
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    
    // Calcular impuestos sobre el subtotal
    const iva13 = subtotal * 0.13; // IVA 13% sobre subtotal
    const retRenta10 = applyRetRenta ? subtotal * 0.10 : 0; // Retención Renta 10% sobre subtotal
    const retIva1 = applyRetIva ? subtotal * 0.01 : 0; // Retención IVA 1% sobre subtotal
    
    // Calcular total: subtotal + IVA - retenciones
    const total = subtotal + iva13 - retRenta10 - retIva1;

    return {
      subtotal: subtotal.toFixed(2),
      iva13: iva13.toFixed(2),
      retRenta10: retRenta10.toFixed(2),
      retIva1: retIva1.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handlePreview = async () => {
    // Validate required fields
    if (!clientId) {
      toast.warning('Selecciona un cliente', {
        description: 'Debes usar el botón "Buscar" para encontrar un cliente existente.'
      });
      return;
    }
    
    if (items.length === 0) {
      toast.warning('Agrega al menos un producto');
      return;
    }

    if (!user || !user.id) {
      toast.error('No se pudo obtener la información del usuario');
      return;
    }
    
    try {
      // Format items for backend - only send what backend expects
      const formattedItems = items.map(item => ({
        productId: item.productId,
        qty: item.qty,
        discount: parseFloat(item.discount) || 0
      }));

      // Determine series based on type
      const series = type === 'FACTURA' ? 'FAC' : 
                    type === 'CCF' ? 'CCF' : 
                    type === 'TICKET' ? 'TIK' : 'EXP';

      // Prepare request data according to backend schema
      const requestData = {
        branchId: parseInt(branchId),
        series,
        type,
        clientId: clientId,  // Send clientId as number
        userId: user.id,     // Send userId as number
        items: formattedItems,
        paymentMethod,
        observations: observations || undefined,  // Optional field
        applyRetencionRenta: applyRetRenta,
        applyRetencionIva: applyRetIva
      };

      console.log('Sending preview data:', requestData);
      console.log('User info:', { userId: user.id, username: user.username });
      console.log('Client info:', { clientId, clientName: clientData.name });
      
      await api.post('/invoices/preview', requestData);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      console.error('Error previewing invoice:', error);
      console.error('Error response:', error.response?.data);
      
      // Manejar error de autenticación
      if (error.response?.status === 401 || error.response?.data?.error?.includes('autenticación')) {
        toast.error('Sesión expirada', {
          description: 'Por favor inicia sesión nuevamente'
        });
        window.location.href = '/login';
        return;
      }
      
      // Mostrar detalles de validación si existen
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
        
        // Mostrar cada error de validación
        error.response.data.details.forEach((detail: any) => {
          console.error(`Campo: ${detail.path?.join('.')}, Esperado: ${detail.expected}, Recibido: ${detail.received}, Mensaje: ${detail.message}`);
        });
      }
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Error al previsualizar la factura';
      toast.error('Error al previsualizar la factura', {
        description: errorMsg + '\n\nRevisa la consola (F12) para más detalles.'
      });
    }
  };

  const handleEmit = async () => {
    if (!canInvoice) {
      toast.error('No tienes permisos para emitir facturas');
      return;
    }

    // Validate required fields
    if (!clientId) {
      toast.warning('Selecciona un cliente', {
        description: 'Debes usar el botón "Buscar" para encontrar un cliente existente.'
      });
      return;
    }
    
    if (items.length === 0) {
      toast.warning('Agrega al menos un producto');
      return;
    }

    if (!user || !user.id) {
      toast.error('No se pudo obtener la información del usuario');
      return;
    }

    try {
      // Format items for backend - only send what backend expects
      const formattedItems = items.map(item => ({
        productId: item.productId,
        qty: item.qty,
        discount: parseFloat(item.discount) || 0
      }));

      // Determine series based on type
      const series = type === 'FACTURA' ? 'FAC' : 
                    type === 'CCF' ? 'CCF' : 
                    type === 'TICKET' ? 'TIK' : 'EXP';

      // Prepare request data according to backend schema (same as preview + issueDate)
      const requestData = {
        branchId: parseInt(branchId),
        series,
        type,
        clientId: clientId,  // Send clientId as number
        userId: user.id,     // Send userId as number
        items: formattedItems,
        paymentMethod,
        observations: observations || undefined,  // Optional field
        applyRetencionRenta: applyRetRenta,
        applyRetencionIva: applyRetIva,
        issueDate: new Date().toISOString()
      };

      console.log('Sending invoice data:', requestData);
      console.log('User info:', { userId: user.id, username: user.username });
      console.log('Client info:', { clientId, clientName: clientData.name });
      
      await api.post('/invoices', requestData);
      
      // Reset form
      setClientId(null);
      setClientData({
        id: 0,
        name: '',
        tipoCliente: 'NATURAL',
        email: '',
        phone: '',
        address: '',
        nit: '',
        nrc: '',
        dui: '',
        actividadEconomica: '',
        nombreComercial: '',
        isActive: true,
        createdAt: '',
        updatedAt: ''
      });
      setItems([]);
      setApplyRetRenta(false);
      setApplyRetIva(false);
      setObservations('');
      setPreviewDialogOpen(false);
      
      toast.success('Factura emitida exitosamente');
    } catch (error: any) {
      console.error('Error emitting invoice:', error);
      console.error('Error response:', error.response?.data);
      
      // Manejar error de autenticación
      if (error.response?.status === 401 || error.response?.data?.error?.includes('autenticación')) {
        toast.error('Sesión expirada', {
          description: 'Por favor inicia sesión nuevamente'
        });
        window.location.href = '/login';
        return;
      }
      
      // Mostrar detalles de validación si existen
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
        
        // Mostrar cada error de validación
        error.response.data.details.forEach((detail: any) => {
          console.error(`Campo: ${detail.path?.join('.')}, Esperado: ${detail.expected}, Recibido: ${detail.received}, Mensaje: ${detail.message}`);
        });
      }
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Error al emitir la factura';
      toast.error('Error al emitir la factura', {
        description: errorMsg + '\n\nRevisa la consola (F12) para más detalles.'
      });
    }
  };

  const totals = calculateTotals();
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
        <p className="text-muted-foreground">Emisión de documentos tributarios</p>
      </div>

      {/* 1. Datos de facturación */}
      <Card>
        <CardHeader>
          <CardTitle>1. Datos de Facturación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="branch">Sucursal *</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Documento *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                  <SelectItem value="CCF">Comprobante Crédito Fiscal</SelectItem>
                  <SelectItem value="TICKET">Ticket</SelectItem>
                  <SelectItem value="EXPORTACION">Exportación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>2. Cliente</CardTitle>
          <CardDescription>
            {clientId ? (
              <span className="text-green-600 font-medium">✓ Cliente seleccionado</span>
            ) : (
              <span className="text-amber-600">⚠ Debes buscar un cliente existente para continuar</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button 
              onClick={() => setClientSearchDialogOpen(true)} 
              variant="outline"
              className="w-full"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar Cliente
            </Button>
          </div>
          
          {clientId && (
            <div className="space-y-4">
              {/* Client Header */}
              <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex-1 space-y-1">
                  <p className="text-base font-semibold text-foreground">{clientData.name}</p>
                  {clientData.email && (
                    <p className="text-sm text-muted-foreground">{clientData.email}</p>
                  )}
            </div>
                <Badge 
                  variant={clientData.tipoCliente === 'JURIDICA' ? 'default' : 'secondary'}
                  className="ml-3 shrink-0"
                >
                  {clientData.tipoCliente === 'JURIDICA' ? 'Jurídica' : 'Natural'}
                </Badge>
            </div>

              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-4 bg-background rounded-lg border border-border">
                {clientData.phone && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teléfono</p>
                    <p className="text-sm font-medium text-foreground">{clientData.phone}</p>
            </div>
                )}
                
                {/* Campos según tipo de cliente */}
                {clientData.tipoCliente === 'NATURAL' ? (
                  clientData.dui && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DUI</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{clientData.dui}</p>
            </div>
                  )
                ) : (
                  <>
                    {clientData.nit && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NIT</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{clientData.nit}</p>
            </div>
                    )}
                    {clientData.nrc && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NRC</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{clientData.nrc}</p>
            </div>
                    )}
                    {clientData.nombreComercial && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre Comercial</p>
                        <p className="text-sm font-medium text-foreground">{clientData.nombreComercial}</p>
          </div>
                    )}
                  </>
                )}

                {clientData.address && (
                  <div className="space-y-0.5 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dirección</p>
                    <p className="text-sm font-medium text-foreground">{clientData.address}</p>
                  </div>
                )}
                
                {clientData.tipoCliente === 'JURIDICA' && clientData.actividadEconomica && (
                  <div className="space-y-0.5 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actividad Económica</p>
                    <p className="text-sm font-medium text-foreground">{clientData.actividadEconomica}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Productos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>3. Productos</CardTitle>
            <Button onClick={() => setAddProductDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-4" />
              <p>No hay productos agregados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Descuento</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{item.sku}</code>
                    </TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.discount)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 4. Resumen y Pago */}
      <Card>
        <CardHeader>
          <CardTitle>4. Resumen y Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Forma de Pago *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="CREDITO">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Input
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observaciones opcionales"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="retRenta"
                    checked={applyRetRenta}
                    onCheckedChange={(checked) => setApplyRetRenta(checked as boolean)}
                  />
                  <Label htmlFor="retRenta" className="cursor-pointer">
                    Aplicar Retención Renta 10%
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="retIva"
                    checked={applyRetIva}
                    onCheckedChange={(checked) => setApplyRetIva(checked as boolean)}
                  />
                  <Label htmlFor="retIva" className="cursor-pointer">
                    Aplicar Retención IVA 1%
                  </Label>
                </div>
              </div>
            </div>
            
            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA 13%:</span>
                  <span className="font-medium">{formatCurrency(totals.iva13)}</span>
                </div>
                {applyRetRenta && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Retención Renta 10%:</span>
                    <span className="font-medium">-{formatCurrency(totals.retRenta10)}</span>
                  </div>
                )}
                {applyRetIva && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Retención IVA 1%:</span>
                    <span className="font-medium">-{formatCurrency(totals.retIva1)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={items.length === 0 || !clientData.name}
            >
              <Eye className="mr-2 h-4 w-4" />
              Previsualizar
            </Button>
            {canInvoice && (
              <Button
                onClick={handleEmit}
                disabled={items.length === 0 || !clientData.name}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Emitir Factura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>Busca y selecciona un producto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
              />
              <Button onClick={searchProducts} disabled={searchingProduct}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {products.length > 0 && (
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {products.map(product => (
                  <div
                    key={product.id}
                    className={`p-3 cursor-pointer hover:bg-accent ${
                      selectedProduct?.id === product.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                    <div className="font-medium">{product.name}</div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.stockQty <= 0 
                          ? 'bg-destructive/10 text-destructive' 
                          : product.stockQty < 10
                          ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500'
                          : 'bg-green-500/10 text-green-700 dark:text-green-500'
                      }`}>
                        Stock: {product.stockQty}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>{product.sku}</span>
                      <span>{formatCurrency(product.unitPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-3 border-t pt-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{selectedProduct.name}</span>
                    <span className="text-sm font-mono">{selectedProduct.sku}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio unitario:</span>
                    <span className="font-semibold">{formatCurrency(selectedProduct.unitPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Stock disponible:</span>
                    <span className={`font-bold ${
                      selectedProduct.stockQty <= 0 
                        ? 'text-destructive' 
                        : selectedProduct.stockQty < 10
                        ? 'text-yellow-600 dark:text-yellow-500'
                        : 'text-green-600 dark:text-green-500'
                    }`}>
                      {selectedProduct.stockQty} unidades
                    </span>
                  </div>
                  {selectedProduct.stockQty <= 0 && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      ⚠️ Sin stock disponible
                    </div>
                  )}
                  {selectedProduct.stockQty > 0 && selectedProduct.stockQty < 10 && (
                    <div className="mt-2 p-2 bg-yellow-500/10 rounded text-xs text-yellow-700 dark:text-yellow-500">
                      ⚠️ Stock bajo
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="qty">Cantidad *</Label>
                    <Input
                      id="qty"
                      type="number"
                      min="1"
                      max={selectedProduct.stockQty}
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo: {selectedProduct.stockQty} unidades
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discount">Descuento ($)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemDiscount}
                      onChange={(e) => setItemDiscount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Descuento en dólares</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedProduct}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Vista Previa de Factura</DialogTitle>
            <DialogDescription className="text-base">
              Verifica los datos antes de emitir
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-4">
            <div className="border-b pb-3">
                  <h3 className="font-semibold text-base">Cliente</h3>
                  <p className="text-base">{clientData.name}</p>
              {clientData.nit && <p className="text-sm text-muted-foreground">NIT: {clientData.nit}</p>}
                  {clientData.dui && <p className="text-sm text-muted-foreground">DUI: {clientData.dui}</p>}
            </div>
            <div className="border-b pb-3">
                  <h3 className="font-semibold text-base mb-2">Tipo de Documento</h3>
                  <p className="text-base">{type}</p>
                  <p className="text-sm text-muted-foreground">Método de pago: {paymentMethod}</p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <QRCodeSVG 
                  value={`FACTURA-${new Date().getTime()}-${clientData.name}`}
                  size={120}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="border-b pb-3">
              <h3 className="font-semibold text-base mb-2">Productos</h3>
              <div className="space-y-1">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-base">
                    <span>{item.qty}x {item.productName}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-base">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>IVA 13%:</span>
                <span className="font-medium">{formatCurrency(totals.iva13)}</span>
              </div>
              {applyRetRenta && (
                <div className="flex justify-between py-1 text-destructive">
                  <span>Retención Renta 10%:</span>
                  <span className="font-medium">-{formatCurrency(totals.retRenta10)}</span>
                </div>
              )}
              {applyRetIva && (
                <div className="flex justify-between py-1 text-destructive">
                  <span>Retención IVA 1%:</span>
                  <span className="font-medium">-{formatCurrency(totals.retIva1)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t-2 pt-2 mt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Cerrar
            </Button>
            {canInvoice && (
              <Button onClick={handleEmit}>
                Emitir Factura
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Search Dialog */}
      <Dialog open={clientSearchDialogOpen} onOpenChange={setClientSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Buscar Cliente</DialogTitle>
            <DialogDescription>
              Busca por nombre, NIT o DUI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre, NIT o DUI..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  searchClients(e.target.value);
                }}
                className="pl-10"
                autoFocus
              />
            </div>

            {searchingClient ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : clients.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{client.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                          {client.tipoCliente === 'NATURAL' ? (
                            client.dui && <span>DUI: {client.dui}</span>
                          ) : (
                            <>
                              {client.nit && <span>NIT: {client.nit}</span>}
                              {client.nrc && <span>NRC: {client.nrc}</span>}
                            </>
                          )}
                          {client.email && <span>· {client.email}</span>}
                        </div>
                      </div>
                      <Badge variant={client.tipoCliente === 'JURIDICA' ? 'default' : 'secondary'}>
                        {client.tipoCliente === 'JURIDICA' ? 'Jurídica' : 'Natural'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : clientSearch.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No se encontraron clientes</p>
                <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Escribe al menos 2 caracteres para buscar</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

