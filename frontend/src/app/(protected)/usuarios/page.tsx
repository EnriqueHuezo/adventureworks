'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash2, UserCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: Array<{
    role: {
      id: number;
      name: string;
    };
  }>;
  branch?: {
    id: number;
    name: string;
  };
}

interface Role {
  id: number;
  name: string;
}

const ROLE_LABELS: Record<string, string> = {
  'CAJERO': 'Cajero',
  'GERENTE': 'Gerente',
  'ADMINISTRADOR': 'Administrador'
};

export default function UsuariosPage() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    roleId: 0,
    isActive: true
  });

  const isAdmin = hasRole('ADMINISTRADOR');

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard';
      return;
    }
    fetchRoles();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [debouncedSearchQuery, statusFilter, isAdmin]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('q', debouncedSearchQuery);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      
      const response = await api.get(`/users?${params.toString()}`);
      const usersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || response.data.users || []);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      const userRoleId = user.roles && user.roles.length > 0 ? user.roles[0].role.id : 0;
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        password: '',
        roleId: userRoleId,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      const defaultRoleId = roles.find(r => r.name === 'CAJERO')?.id || 0;
      setFormData({
        username: '',
        email: '',
        fullName: '',
        password: '',
        roleId: defaultRoleId,
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // When editing, update user data and roles separately
        const userData: any = {
          email: formData.email,
          fullName: formData.fullName,
        };
        
        if (formData.password) {
          userData.password = formData.password;
        }
        
        await api.put(`/users/${editingUser.id}`, userData);
        
        // Update roles separately
        await api.patch(`/users/${editingUser.id}/roles`, {
          roleIds: [formData.roleId]
        });
      } else {
        // When creating, send all data including roleIds
        await api.post('/users', {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          roleIds: [formData.roleId]
        });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error al guardar el usuario';
      toast.error('Error al guardar el usuario', {
        description: errorMsg + '\n\nPor favor verifica los datos.'
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await api.delete(`/users/${deletingUser.id}`);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };


  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Total: {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay usuarios</h3>
              <p className="text-muted-foreground">Comienza agregando el primer usuario.</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{user.username}</code>
                      </TableCell>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map(userRole => (
                            <Badge
                              key={userRole.role.id}
                              variant={
                                userRole.role.name === 'ADMINISTRADOR' ? 'destructive' :
                                userRole.role.name === 'GERENTE' ? 'default' : 'secondary'
                              }
                            >
                              {ROLE_LABELS[userRole.role.name] || userRole.role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                            className={user.isActive ? 'hover:text-destructive' : 'hover:text-green-600'}
                          >
                            {user.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuario' : 'Agregar Usuario'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Modifica los datos del usuario.' : 'Complete los datos del nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Contraseña {editingUser && '(dejar vacío para mantener actual)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol *</Label>
                <Select 
                  value={formData.roleId.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, roleId: parseInt(value) })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {ROLE_LABELS[role.name] || role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.roleId}>
                {editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a &quot;{deletingUser?.fullName}&quot;? Esta acción no se puede deshacer.
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

