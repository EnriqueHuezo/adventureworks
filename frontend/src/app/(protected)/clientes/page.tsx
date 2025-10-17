'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Edit, Trash2, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '@/types';

export default function ClientesPage() {
  const { hasRole } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tipoCliente: 'NATURAL' as 'NATURAL' | 'JURIDICA',
    email: '',
    phone: '',
    address: '',
    nit: '',
    nrc: '',
    dui: '',
    actividadEconomica: '',
    nombreComercial: ''
  });

  const canManage = hasRole('GERENTE') || hasRole('ADMINISTRADOR');

  useEffect(() => {
    fetchClients();
  }, [debouncedSearchQuery]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('q', debouncedSearchQuery);
      
      const response = await api.get(`/clients?${params.toString()}`);
      console.log('Clients response:', response.data);
      
      // Backend returns { clients, total, page, size }
      const clientsData = response.data.clients || [];
      setClients(clientsData);
      
      console.log(`Loaded ${clientsData.length} clients`);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      console.error('Error response:', error.response?.data);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      tipoCliente: client.tipoCliente || 'NATURAL',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      nit: client.nit || '',
      nrc: client.nrc || '',
      dui: client.dui || '',
      actividadEconomica: client.actividadEconomica || '',
      nombreComercial: client.nombreComercial || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Preparar datos según el tipo de cliente
      const dataToSend = {
        name: formData.name,
        tipoCliente: formData.tipoCliente,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      // Agregar campos específicos según el tipo
      if (formData.tipoCliente === 'NATURAL') {
        Object.assign(dataToSend, {
          dui: formData.dui || null,
          nit: null,
          nrc: null,
          actividadEconomica: null,
          nombreComercial: null
        });
      } else {
        // JURIDICA
        Object.assign(dataToSend, {
          nit: formData.nit || null,
          nrc: formData.nrc || null,
          actividadEconomica: formData.actividadEconomica || null,
          nombreComercial: formData.nombreComercial || null,
          dui: null
        });
      }

      if (editingClient) {
        // Update existing client
        await api.put(`/clients/${editingClient.id}`, dataToSend);
        toast.success('Cliente actualizado exitosamente');
      } else {
        // Create new client
        await api.post('/clients', dataToSend);
        toast.success('Cliente creado exitosamente');
      }
      setDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error al guardar el cliente';
      toast.error('Error al guardar el cliente', {
        description: errorMsg
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    try {
      await api.delete(`/clients/${deletingClient.id}`);
      toast.success('Cliente eliminado exitosamente');
      setDeleteDialogOpen(false);
      setDeletingClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error al eliminar el cliente';
      toast.error('Error al eliminar el cliente', {
        description: errorMsg
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery) ||
    client.nit?.includes(searchQuery) ||
    client.nrc?.includes(searchQuery) ||
    client.dui?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            {canManage ? 'Gestión de clientes' : 'Consulta de clientes'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => {
            setEditingClient(null);
            setFormData({
              name: '',
              tipoCliente: 'NATURAL',
              email: '',
              phone: '',
              address: '',
              nit: '',
              nrc: '',
              dui: '',
              actividadEconomica: '',
              nombreComercial: ''
            });
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Cliente
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, correo, teléfono, NIT, NRC o DUI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Total: {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay clientes</h3>
              <p className="text-muted-foreground">
                {canManage 
                  ? 'Crea tu primer cliente usando el botón "Crear Cliente".' 
                  : 'No hay clientes registrados en el sistema.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>NIT</TableHead>
                    <TableHead>NRC</TableHead>
                    <TableHead>DUI</TableHead>
                    {canManage && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <Badge variant={client.tipoCliente === 'JURIDICA' ? 'default' : 'secondary'}>
                          {client.tipoCliente === 'JURIDICA' ? 'Jurídica' : 'Natural'}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{client.address || '-'}</TableCell>
                      <TableCell>
                        {client.nit ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{client.nit}</code>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {client.nrc ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{client.nrc}</code>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {client.dui ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{client.dui}</code>
                        ) : '-'}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingClient(client);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Crear Cliente'}</DialogTitle>
              <DialogDescription>
                {editingClient ? 'Modifica los datos del cliente.' : 'Ingresa los datos del nuevo cliente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tipoCliente">Tipo de Cliente *</Label>
                <Select
                  value={formData.tipoCliente}
                  onValueChange={(value: 'NATURAL' | 'JURIDICA') => {
                    // Limpiar campos según el tipo seleccionado
                    if (value === 'NATURAL') {
                      setFormData({
                        ...formData,
                        tipoCliente: value,
                        nit: '',
                        nrc: '',
                        actividadEconomica: '',
                        nombreComercial: ''
                      });
                    } else {
                      setFormData({
                        ...formData,
                        tipoCliente: value,
                        dui: ''
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATURAL">Natural</SelectItem>
                    <SelectItem value="JURIDICA">Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* DUI para clientes naturales */}
              {formData.tipoCliente === 'NATURAL' && (
                <div className="grid gap-2">
                  <Label htmlFor="dui">DUI</Label>
                  <Input
                    id="dui"
                    value={formData.dui}
                    onChange={(e) => setFormData({ ...formData, dui: e.target.value })}
                  />
                </div>
              )}

              {/* Campos específicos para clientes jurídicos */}
              {formData.tipoCliente === 'JURIDICA' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nit">NIT *</Label>
                      <Input
                        id="nit"
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                        required={formData.tipoCliente === 'JURIDICA'}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nrc">NRC *</Label>
                      <Input
                        id="nrc"
                        value={formData.nrc}
                        onChange={(e) => setFormData({ ...formData, nrc: e.target.value })}
                        required={formData.tipoCliente === 'JURIDICA'}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                    <Input
                      id="nombreComercial"
                      value={formData.nombreComercial}
                      onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="actividadEconomica">Actividad Económica</Label>
                    <Input
                      id="actividadEconomica"
                      value={formData.actividadEconomica}
                      onChange={(e) => setFormData({ ...formData, actividadEconomica: e.target.value })}
                      placeholder="Ej: 46900 - Comercio al por mayor"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a &quot;{deletingClient?.name}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

