'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import api from '@/lib/api';
import { DollarSign, FileText, Package, TrendingUp } from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardMetrics {
  totalSales: number;
  invoiceCount: number;
  avgTicket: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  dailySales: Array<{ date: string; total: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TYPE_LABELS: Record<string, string> = {
  'FACTURA': 'Factura',
  'CCF': 'Crédito Fiscal',
  'TICKET': 'Ticket',
  'EXPORTACION': 'Exportación'
};

export default function DashboardPage() {
  const { hasRole } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRole('GERENTE', 'ADMINISTRADOR')) {
      window.location.href = '/historial';
      return;
    }

    async function fetchData() {
      try {
        const [metricsRes, stockRes] = await Promise.all([
          api.get('/invoices/dashboard-metrics'),
          api.get('/products/low-stock?threshold=10')
        ]);
        setMetrics(metricsRes.data);
        setLowStock(stockRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [hasRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de ventas y métricas</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? formatMoney(metrics.totalSales) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Período actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.invoiceCount || 0}</div>
              <p className="text-xs text-muted-foreground">Documentos generados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? formatMoney(metrics.avgTicket) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Por factura</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStock.length}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Invoice Types */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos por Tipo</CardTitle>
              <CardDescription>Distribución de facturas emitidas</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && Object.keys(metrics.byType).length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(metrics.byType).map(([name, value]) => ({ 
                          name: TYPE_LABELS[name] || name, 
                          value 
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(metrics.byType).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle>Productos con Bajo Stock</CardTitle>
              <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.length > 0 ? (
                <div className="space-y-2">
                  {lowStock.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <span className={`text-sm font-medium ${product.stockQty <= 5 ? 'text-destructive' : 'text-orange-500'}`}>
                        {product.stockQty} unidades
                      </span>
                    </div>
                  ))}
                  {lowStock.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      + {lowStock.length - 5} productos más
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Todos los productos tienen stock suficiente</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Sales Trend */}
        {metrics && metrics.dailySales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ventas Diarias</CardTitle>
              <CardDescription>Ventas de los últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={metrics.dailySales.slice(-7).map(day => ({
                      date: new Date(day.date).toLocaleDateString('es-SV', { day: '2-digit', month: 'short' }),
                      total: parseFloat(day.total.toString())
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatMoney(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      name="Ventas"
                      dot={{ fill: '#0088FE', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
}

