'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { UserCircle, Mail, Building2, Shield } from 'lucide-react';

export default function CuentaPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-muted-foreground">Información de tu perfil</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle>{user.fullName}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Correo Electrónico
              </Label>
              <div className="text-lg">{user.email}</div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Roles
              </Label>
              <div className="flex gap-2">
                {user.roles.map(role => (
                  <Badge
                    key={role}
                    variant={
                      role === 'ADMINISTRADOR' ? 'destructive' :
                      role === 'GERENTE' ? 'default' : 'secondary'
                    }
                  >
                    {role === 'ADMINISTRADOR' ? 'Administrador' :
                     role === 'GERENTE' ? 'Gerente' : 'Cajero'}
                  </Badge>
                ))}
              </div>
            </div>

            {user.branch && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Sucursal
                </Label>
                <div className="text-lg">{user.branch.name}</div>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-muted-foreground">Estado</Label>
              <div>
                <Badge variant={user.isActive ? 'default' : 'outline'}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos</CardTitle>
          <CardDescription>Acciones disponibles según tus roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.roles.includes('ADMINISTRADOR') && (
              <div className="border-l-4 border-destructive pl-4">
                <h3 className="font-semibold">Administrador</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Gestión completa de usuarios</li>
                  <li>• Asignación de roles y permisos</li>
                  <li>• Configuración de sucursales y secuencias</li>
                  <li>• Todas las funciones de Gerente</li>
                </ul>
              </div>
            )}
            
            {user.roles.includes('GERENTE') && (
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Gerente</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Dashboard con KPIs y gráficos</li>
                  <li>• Emisión y anulación de facturas</li>
                  <li>• Gestión de productos (CRUD + control de stock)</li>
                  <li>• Gestión de proveedores</li>
                  <li>• Edición y eliminación de clientes</li>
                  <li>• Reportes con filtros avanzados</li>
                </ul>
              </div>
            )}
            
            {user.roles.includes('CAJERO') && (
              <div className="border-l-4 border-secondary pl-4">
                <h3 className="font-semibold">Cajero</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Emisión de facturas</li>
                  <li>• Consulta de clientes</li>
                  <li>• Historial de ventas del día</li>
                  <li>• Vista de cuenta personal</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versión del Sistema:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última Actualización:</span>
              <span className="font-medium">Octubre 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formato de Fecha:</span>
              <span className="font-medium">DD/MM/AAAA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moneda:</span>
              <span className="font-medium">USD ($)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zona Horaria:</span>
              <span className="font-medium">América/El Salvador (UTC-6)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

