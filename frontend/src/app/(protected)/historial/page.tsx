'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, FileText, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface DayMetrics {
  totalSales: string;
  invoiceCount: number;
  lastInvoiceTime: string | null;
}

export default function HistorialPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<DayMetrics>({
    totalSales: '0.00',
    invoiceCount: 0,
    lastInvoiceTime: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayInvoices();
  }, []);

  const fetchTodayInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invoices/today');
      const invoicesData = response.data.invoices 
        ? (Array.isArray(response.data.invoices) ? response.data.invoices : [])
        : (Array.isArray(response.data) ? response.data : []);
      setInvoices(invoicesData);
      setMetrics(response.data.metrics || { totalSales: '0.00', invoiceCount: 0, lastInvoiceTime: null });
    } catch (error) {
      console.error('Error fetching today invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: es });
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

  const getPaymentBadge = (method: string) => {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
      CREDITO: 'Crédito'
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial del Día</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ventas del día actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.invoiceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documentos del día
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Factura</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.lastInvoiceTime ? formatTime(metrics.lastInvoiceTime) : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hora de la última venta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas de Hoy</CardTitle>
          <CardDescription>
            Listado de todas las facturas emitidas hoy
          </CardDescription>
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
              <h3 className="mt-4 text-lg font-semibold">No hay facturas hoy</h3>
              <p className="text-muted-foreground">
                Aún no se han emitido facturas el día de hoy.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Núm. Control</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
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
                        {formatTime(invoice.issueDate)}
                      </TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invoice.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPaymentBadge(invoice.paymentMethod)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!loading && invoices.length > 0 && (
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">
                Promedio por factura: {formatCurrency((parseFloat(metrics.totalSales) / metrics.invoiceCount).toFixed(2))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

