'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Download, Eye, X, FileText, FileJson, FileDown, FileCheck, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Invoice {
  id: number;
  numeroControl: string;
  issueDate: string;
  type: string;
  status: string;
  client: {
    name: string;
  };
  total: string;
  paymentMethod: string;
}

interface InvoiceDetail extends Invoice {
  codeGeneracion: string;
  selloRecepcion: string;
  series: string;
  subtotal: string;
  iva13: string;
  retencionRenta10: string;
  retencionIva1: string;
  observations?: string;
  client: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    nit?: string;
    nrc?: string;
    dui?: string;
  };
  branch: {
    id: number;
    name: string;
    code: string;
  };
  user: {
    id: number;
    username: string;
    fullName: string;
  };
  items: Array<{
    id: number;
    qty: number;
    cost: string;
    unitPrice: string;
    discount: string;
    subtotal: string;
    product: {
      id: number;
      name: string;
      sku: string;
    };
  }>;
}

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export default function ReportesPage() {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  
  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusInvoice, setStatusInvoice] = useState<InvoiceDetail | null>(null);

  const canViewReports = hasRole('GERENTE') || hasRole('ADMINISTRADOR');

  useEffect(() => {
    if (!canViewReports) {
      window.location.href = '/dashboard';
      return;
    }
  }, [canViewReports]);

  useEffect(() => {
    updateActiveFilters();
    fetchInvoices();
  }, [searchQuery, dateFrom, dateTo, typeFilter, statusFilter, paymentFilter, page]);

  const updateActiveFilters = () => {
    const filters: FilterChip[] = [];
    
    if (searchQuery) {
      filters.push({ key: 'search', label: 'Búsqueda', value: searchQuery });
    }
    if (dateFrom) {
      filters.push({ key: 'dateFrom', label: 'Desde', value: format(new Date(dateFrom), 'dd/MM/yyyy', { locale: es }) });
    }
    if (dateTo) {
      filters.push({ key: 'dateTo', label: 'Hasta', value: format(new Date(dateTo), 'dd/MM/yyyy', { locale: es }) });
    }
    if (typeFilter !== 'ALL') {
      filters.push({ key: 'type', label: 'Tipo', value: typeFilter });
    }
    if (statusFilter !== 'ALL') {
      filters.push({ key: 'status', label: 'Estado', value: statusFilter });
    }
    if (paymentFilter !== 'ALL') {
      filters.push({ key: 'payment', label: 'Pago', value: paymentFilter });
    }
    
    setActiveFilters(filters);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);  // Changed from 'query' to 'q'
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (paymentFilter !== 'ALL') params.append('paymentMethod', paymentFilter);
      params.append('page', page.toString());
      params.append('size', '25');
      
      console.log('Fetching invoices with params:', params.toString());
      const response = await api.get(`/invoices?${params.toString()}`);
      console.log('Invoice response:', response.data);
      
      // Backend returns { invoices, total, page, size }
      const invoicesData = response.data.invoices || [];
      const total = response.data.total || 0;
      const size = response.data.size || 25;
      const calculatedTotalPages = Math.ceil(total / size);
      
      setInvoices(invoicesData);
      setTotalPages(calculatedTotalPages);
      
      console.log(`Loaded ${invoicesData.length} invoices (Total: ${total}, Pages: ${calculatedTotalPages})`);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      console.error('Error response:', error.response?.data);
      setInvoices([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setPage(1);
  };

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'search':
        setSearchQuery('');
        break;
      case 'dateFrom':
        setDateFrom('');
        break;
      case 'dateTo':
        setDateTo('');
        break;
      case 'type':
        setTypeFilter('ALL');
        break;
      case 'status':
        setStatusFilter('ALL');
        break;
      case 'payment':
        setPaymentFilter('ALL');
        break;
    }
  };

  const handleViewDetails = async (invoiceId: number) => {
    try {
      setLoadingDetail(true);
      setDetailDialogOpen(true);
      const response = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
    } catch (error: any) {
      console.error('Error loading invoice details:', error);
      toast.error('Error al cargar los detalles', {
        description: error.response?.data?.error || error.message
      });
      setDetailDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCheckStatus = async (invoiceId: number) => {
    try {
      setStatusDialogOpen(true);
      const response = await api.get(`/invoices/${invoiceId}`);
      setStatusInvoice(response.data);
    } catch (error: any) {
      console.error('Error loading invoice status:', error);
      toast.error('Error al consultar el estado', {
        description: error.response?.data?.error || error.message
      });
      setStatusDialogOpen(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    try {
      const confirmCancel = window.confirm('¿Estás seguro de que deseas anular este documento? Esta acción no se puede deshacer.');
      if (!confirmCancel) return;

      await api.post(`/invoices/${invoiceId}/void`);
      toast.success('Documento anulado exitosamente');
      fetchInvoices(); // Refresh the list
    } catch (error: any) {
      console.error('Error canceling invoice:', error);
      toast.error('Error al anular el documento', {
        description: error.response?.data?.error || error.message
      });
    }
  };

  const handleGenerateExcel = async () => {
    try {
      // Dynamic import para evitar errores de SSR
      const XLSX = await import('xlsx');
      
      // Preparar los datos para Excel
      const excelData = invoices.map((invoice) => ({
        'Número de Control': invoice.numeroControl,
        'Fecha': formatDate(invoice.issueDate),
        'Cliente': invoice.client.name,
        'Tipo de Documento': invoice.type,
        'Forma de Pago': invoice.paymentMethod,
        'Monto Total': parseFloat(invoice.total),
        'Estado': invoice.status
      }));

      // Crear libro de trabajo
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 20 }, // Número de Control
        { wch: 18 }, // Fecha
        { wch: 30 }, // Cliente
        { wch: 18 }, // Tipo
        { wch: 15 }, // Pago
        { wch: 12 }, // Monto
        { wch: 12 }  // Estado
      ];
      worksheet['!cols'] = colWidths;

      // Generar y descargar el archivo
      const fileName = `reporte-facturas-${format(new Date(), 'ddMMyyyy-HHmmss')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error: any) {
      console.error('Error generating Excel:', error);
      toast.error('Error al generar el Excel', {
        description: `${error.message}\n\nAsegúrate de haber instalado la librería xlsx: npm install xlsx`
      });
    }
  };

  const handleDownloadJSON = (invoice: InvoiceDetail) => {
    // Estructura JSON según especificación DTE El Salvador
    const jsonData = {
      identificacion: {
        version: 1,
        ambiente: "00", // 00 = Prueba, 01 = Producción
        tipoDte: invoice.type,
        numeroControl: invoice.numeroControl,
        codigoGeneracion: invoice.codeGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi: format(new Date(invoice.issueDate), 'yyyy-MM-dd'),
        horEmi: format(new Date(invoice.issueDate), 'HH:mm:ss'),
        tipoMoneda: "USD"
      },
      documentoRelacionado: null,
      emisor: {
        nit: invoice.branch.code,
        nrc: invoice.branch.code,
        nombre: invoice.branch.name,
        codActividad: "62020",
        descActividad: "Desarrollo de software",
        nombreComercial: invoice.branch.name,
        tipoEstablecimiento: "01"
      },
      receptor: {
        tipoDocumento: invoice.client.dui ? "13" : "36",
        numDocumento: invoice.client.dui || invoice.client.nit || "",
        nrc: invoice.client.nrc || null,
        nombre: invoice.client.name,
        codActividad: null,
        descActividad: null,
        direccion: {
          departamento: "06",
          municipio: "14",
          complemento: invoice.client.address || "San Salvador"
        },
        telefono: invoice.client.phone || "",
        correo: invoice.client.email || ""
      },
      cuerpoDocumento: invoice.items.map((item, index) => ({
        numItem: index + 1,
        tipoItem: 2,
        numeroDocumento: null,
        cantidad: item.qty,
        codigo: item.product.sku,
        codTributo: null,
        uniMedida: 99,
        descripcion: item.product.name,
        precioUni: parseFloat(item.unitPrice),
        montoDescu: parseFloat(item.discount),
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: parseFloat(item.subtotal),
        tributos: null,
        psv: 0,
        noGravado: 0
      })),
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: parseFloat(invoice.subtotal),
        subTotalVentas: parseFloat(invoice.subtotal),
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: null,
        subTotal: parseFloat(invoice.subtotal),
        ivaRete1: parseFloat(invoice.retencionIva1),
        reteRenta: parseFloat(invoice.retencionRenta10),
        montoTotalOperacion: parseFloat(invoice.total),
        totalNoGravado: 0,
        totalPagar: parseFloat(invoice.total),
        totalLetras: "Consultar total",
        saldoFavor: 0,
        condicionOperacion: 1,
        pagos: [
          {
            codigo: invoice.paymentMethod === "EFECTIVO" ? "01" : 
                    invoice.paymentMethod === "TARJETA" ? "03" : 
                    invoice.paymentMethod === "TRANSFERENCIA" ? "04" : "99",
            montoPago: parseFloat(invoice.total),
            referencia: null,
            plazo: null,
            periodo: null
          }
        ],
        numPagoElectronico: null
      },
      extension: {
        nombEntrega: null,
        docuEntrega: null,
        nombRecibe: null,
        docuRecibe: null,
        observaciones: invoice.observations || null,
        placaVehiculo: null
      },
      apendice: null,
      selloRecibido: invoice.selloRecepcion,
      observaciones: invoice.observations || null
    };

    // Crear y descargar archivo JSON
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
    link.download = `factura-${invoice.numeroControl}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async (invoice: InvoiceDetail) => {
    try {
      // Dynamic import to avoid SSR issues with @react-pdf/renderer
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoicePDF } = await import('@/components/pdf/InvoicePDF');
      
      // Generate PDF
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoice.numeroControl}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF generado exitosamente');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF', {
        description: error.message
      });
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline'> = {
      EMITIDA: 'default',
      ANULADA: 'destructive',
      DRAFT: 'outline'
    };
    const labels: Record<string, string> = {
      EMITIDA: 'Emitida',
      ANULADA: 'Anulada',
      DRAFT: 'Borrador'
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (!canViewReports) {
    return null;
  }

  const totalAmount = Array.isArray(invoices) 
    ? invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Consulta y exportación de facturas</p>
        </div>
        <Button onClick={handleGenerateExcel} disabled={invoices.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="search">Búsqueda Global</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por número, cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Fecha Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo de Documento</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                  <SelectItem value="CCF">CCF</SelectItem>
                  <SelectItem value="TICKET">Ticket</SelectItem>
                  <SelectItem value="EXPORTACION">Exportación</SelectItem>
                  <SelectItem value="NOTA_CREDITO">Nota de Crédito</SelectItem>
                  <SelectItem value="NOTA_DEBITO">Nota de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="EMITIDA">Emitida</SelectItem>
                  <SelectItem value="ANULADA">Anulada</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment">Forma de Pago</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  <SelectItem value="TARJETA">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  <SelectItem value="CREDITO">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {activeFilters.map((filter) => (
                <Badge key={filter.key} variant="secondary" className="gap-1">
                  {filter.label}: {filter.value}
                  <button
                    onClick={() => handleRemoveFilter(filter.key)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 text-xs"
              >
                Limpiar todo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                {invoices.length} {invoices.length === 1 ? 'factura encontrada' : 'facturas encontradas'}
                {invoices.length > 0 && ` - Total: ${formatCurrency(totalAmount.toFixed(2))}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No se encontraron facturas</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Núm. Doc</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {invoice.numeroControl}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDate(invoice.issueDate)}
                        </TableCell>
                        <TableCell>{invoice.client.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {invoice.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver detalles"
                              onClick={() => handleViewDetails(invoice.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Consultar estado"
                              onClick={() => handleCheckStatus(invoice.id)}
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'ANULADA' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Anular documento"
                                onClick={() => handleCancelInvoice(invoice.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Factura</DialogTitle>
            <DialogDescription>
              Información completa del documento tributario
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="space-y-2 py-8">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Número de Control DTE</p>
                  <p className="text-base font-mono font-bold text-primary">{selectedInvoice.numeroControlDTE}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Número de Control</p>
                  <p className="text-sm font-mono font-semibold">{selectedInvoice.numeroControl}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tipo</p>
                  <p className="text-sm font-semibold">{selectedInvoice.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Fecha de Emisión</p>
                  <p className="text-sm">{formatDate(selectedInvoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Código de Generación</p>
                  <p className="text-xs font-mono break-all">{selectedInvoice.codeGeneracion}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sello de Recepción</p>
                  <p className="text-xs font-mono break-all">{selectedInvoice.selloRecepcion}</p>
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h3 className="text-base font-semibold mb-3">Cliente</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Nombre:</span>
                    <span className="ml-2">{selectedInvoice.client.name}</span>
                  </div>
                  {selectedInvoice.client.email && (
                    <div>
                      <span className="text-muted-foreground font-medium">Correo:</span>
                      <span className="ml-2">{selectedInvoice.client.email}</span>
                    </div>
                  )}
                  {selectedInvoice.client.phone && (
                    <div>
                      <span className="text-muted-foreground font-medium">Teléfono:</span>
                      <span className="ml-2">{selectedInvoice.client.phone}</span>
                    </div>
                  )}
                  {selectedInvoice.client.nit && (
                    <div>
                      <span className="text-muted-foreground font-medium">NIT:</span>
                      <span className="ml-2">{selectedInvoice.client.nit}</span>
                    </div>
                  )}
                  {selectedInvoice.client.nrc && (
                    <div>
                      <span className="text-muted-foreground font-medium">NRC:</span>
                      <span className="ml-2">{selectedInvoice.client.nrc}</span>
                    </div>
                  )}
                  {selectedInvoice.client.dui && (
                    <div>
                      <span className="text-muted-foreground font-medium">DUI:</span>
                      <span className="ml-2">{selectedInvoice.client.dui}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-base font-semibold mb-3">Productos/Servicios</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-sm">
                        <TableHead className="text-sm">Producto</TableHead>
                        <TableHead className="text-sm text-right">Cant.</TableHead>
                        <TableHead className="text-sm text-right">Precio Unit.</TableHead>
                        <TableHead className="text-sm text-right">Descuento</TableHead>
                        <TableHead className="text-sm text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-right">{item.qty}</TableCell>
                          <TableCell className="text-sm text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-sm text-right">{formatCurrency(item.discount)}</TableCell>
                          <TableCell className="text-sm text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 max-w-sm ml-auto text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (13%):</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.iva13)}</span>
                  </div>
                  {parseFloat(selectedInvoice.retencionRenta10) > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Retención Renta (10%):</span>
                      <span className="font-medium">-{formatCurrency(selectedInvoice.retencionRenta10)}</span>
                    </div>
                  )}
                  {parseFloat(selectedInvoice.retencionIva1) > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Retención IVA (1%):</span>
                      <span className="font-medium">-{formatCurrency(selectedInvoice.retencionIva1)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <span className="text-muted-foreground font-medium">Sucursal:</span>
                  <span className="ml-2">{selectedInvoice.branch.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Forma de Pago:</span>
                  <span className="ml-2">{selectedInvoice.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Cajero:</span>
                  <span className="ml-2">{selectedInvoice.user.fullName}</span>
                </div>
              </div>

              {selectedInvoice.observations && (
                <div className="text-sm border-t pt-4">
                  <p className="text-muted-foreground font-semibold mb-1">Observaciones:</p>
                  <p className="text-sm">{selectedInvoice.observations}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No se pudieron cargar los detalles</p>
          )}
          
          {selectedInvoice && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleDownloadJSON(selectedInvoice)}
              >
                <FileJson className="mr-2 h-4 w-4" />
                Descargar JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadPDF(selectedInvoice)}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Estado del Documento</DialogTitle>
            <DialogDescription>
              Información general del documento tributario
            </DialogDescription>
          </DialogHeader>
          
          {statusInvoice ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="mb-2">{getStatusBadge(statusInvoice.status)}</div>
                  <p className="text-sm text-muted-foreground">
                    {statusInvoice.status === 'EMITIDA' && 'El documento ha sido emitido correctamente'}
                    {statusInvoice.status === 'ANULADA' && 'El documento ha sido anulado'}
                    {statusInvoice.status === 'DRAFT' && 'El documento está en estado borrador'}
                  </p>
                </div>
              </div>

              {/* Document Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium">Número de Control</p>
                    <p className="font-mono font-semibold">{statusInvoice.numeroControl}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Tipo de Documento</p>
                    <p className="font-semibold">{statusInvoice.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Fecha de Emisión</p>
                    <p>{formatDate(statusInvoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Monto Total</p>
                    <p className="font-semibold">{formatCurrency(statusInvoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Cliente</p>
                    <p>{statusInvoice.client.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Forma de Pago</p>
                    <p>{statusInvoice.paymentMethod}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-muted-foreground font-medium text-sm mb-1">Código de Generación</p>
                  <p className="font-mono text-xs break-all">{statusInvoice.codeGeneracion}</p>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-muted-foreground font-medium text-sm mb-1">Sello de Recepción</p>
                  <p className="font-mono text-xs break-all">{statusInvoice.selloRecepcion}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Cargando información...</p>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

