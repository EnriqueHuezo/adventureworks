import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  console.log('Creating roles...');
  const roleCajero = await prisma.role.upsert({
    where: { name: 'CAJERO' },
    update: {},
    create: { name: 'CAJERO' }
  });

  const roleGerente = await prisma.role.upsert({
    where: { name: 'GERENTE' },
    update: {},
    create: { name: 'GERENTE' }
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMINISTRADOR' },
    update: {},
    create: { name: 'ADMINISTRADOR' }
  });

  console.log('✓ Roles created');

  // Create branches
  console.log('Creating branches...');
  const branch1 = await prisma.branch.upsert({
    where: { code: 'SUC001' },
    update: {},
    create: {
      name: 'Sucursal Centro',
      code: 'SUC001',
      address: 'Av. Principal #123, San Salvador'
    }
  });

  const branch2 = await prisma.branch.upsert({
    where: { code: 'SUC002' },
    update: {},
    create: {
      name: 'Sucursal Metrocentro',
      code: 'SUC002',
      address: 'Centro Comercial Metrocentro, Local 45'
    }
  });

  console.log('✓ Branches created');

  // Create sequences
  console.log('Creating sequences...');
  await prisma.sequence.upsert({
    where: {
      branchId_series: {
        branchId: branch1.id,
        series: 'FAC'
      }
    },
    update: {},
    create: {
      branchId: branch1.id,
      series: 'FAC',
      nextValue: 1
    }
  });

  await prisma.sequence.upsert({
    where: {
      branchId_series: {
        branchId: branch1.id,
        series: 'CCF'
      }
    },
    update: {},
    create: {
      branchId: branch1.id,
      series: 'CCF',
      nextValue: 1
    }
  });

  await prisma.sequence.upsert({
    where: {
      branchId_series: {
        branchId: branch2.id,
        series: 'FAC'
      }
    },
    update: {},
    create: {
      branchId: branch2.id,
      series: 'FAC',
      nextValue: 1
    }
  });

  console.log('✓ Sequences created');

  // Create users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@billing.com',
      password: hashedPassword,
      fullName: 'Administrador Principal',
      branchId: branch1.id,
      roles: {
        create: {
          roleId: roleAdmin.id
        }
      }
    }
  });

  const gerenteUser = await prisma.user.upsert({
    where: { username: 'gerente' },
    update: {},
    create: {
      username: 'gerente',
      email: 'gerente@billing.com',
      password: hashedPassword,
      fullName: 'María Gerente',
      branchId: branch1.id,
      roles: {
        create: {
          roleId: roleGerente.id
        }
      }
    }
  });

  const cajeroUser = await prisma.user.upsert({
    where: { username: 'cajero' },
    update: {},
    create: {
      username: 'cajero',
      email: 'cajero@billing.com',
      password: hashedPassword,
      fullName: 'Juan Cajero',
      branchId: branch1.id,
      roles: {
        create: {
          roleId: roleCajero.id
        }
      }
    }
  });

  // Usuarios adicionales
  await prisma.user.upsert({
    where: { username: 'admin2' },
    update: {},
    create: {
      username: 'admin2',
      email: 'admin2@billing.com',
      password: hashedPassword,
      fullName: 'Carlos Admin',
      branchId: branch2.id,
      roles: {
        create: {
          roleId: roleAdmin.id
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { username: 'gerente2' },
    update: {},
    create: {
      username: 'gerente2',
      email: 'gerente2@billing.com',
      password: hashedPassword,
      fullName: 'Ana Gerente',
      branchId: branch2.id,
      roles: {
        create: {
          roleId: roleGerente.id
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { username: 'cajero2' },
    update: {},
    create: {
      username: 'cajero2',
      email: 'cajero2@billing.com',
      password: hashedPassword,
      fullName: 'Pedro Cajero',
      branchId: branch2.id,
      roles: {
        create: {
          roleId: roleCajero.id
        }
      }
    }
  });

  console.log('✓ Users created');

  // Create clients
  console.log('Creating clients...');
  await prisma.client.createMany({
    data: [
      {
        name: 'Juan Pérez García',
        email: 'juan.perez@email.com',
        phone: '7890-1234',
        address: 'Col. Escalón, San Salvador',
        nit: '0614-120389-001-4',
        nrc: null,
        dui: '03456789-0'
      },
      {
        name: 'María López Hernández',
        email: 'maria.lopez@email.com',
        phone: '7765-4321',
        address: 'Col. San Benito, San Salvador',
        nit: '0614-230490-102-3',
        nrc: null,
        dui: '04567890-1'
      },
      {
        name: 'Carlos Rodríguez Martínez',
        email: 'carlos.rodriguez@email.com',
        phone: '7654-3210',
        address: 'Col. Roma, Santa Tecla',
        nit: '0614-340591-203-2',
        nrc: null,
        dui: '05678901-2'
      },
      {
        name: 'Empresa ABC S.A. de C.V.',
        email: 'info@empresaabc.com',
        phone: '2234-5678',
        address: 'Zona Industrial, Santa Ana',
        nit: '0614-150687-104-1',
        nrc: '45678-9',
        dui: null,
      },
      {
        name: 'Inversiones XYZ S.A. de C.V.',
        email: 'contacto@inversionesxyz.com',
        phone: '2245-6789',
        address: 'Paseo General Escalón, San Salvador',
        nit: '0614-260788-105-2',
        nrc: '56789-0',
        dui: null
      }
    ],
    skipDuplicates: true
  });

  console.log('✓ Clients created');

  // Create suppliers
  console.log('Creating suppliers...');
  await prisma.supplier.createMany({
    data: [
      {
        company: 'Distribuidora El Salvador S.A.',
        contact: 'Roberto Martínez',
        email: 'ventas@distribuidora.com',
        phone: '2245-6789'
      },
      {
        company: 'Importaciones Globales',
        contact: 'Ana García',
        email: 'compras@importaciones.com',
        phone: '2256-7890'
      },
      {
        company: 'Proveedor Nacional',
        contact: 'Luis Hernández',
        email: 'info@proveedornacional.com',
        phone: '2267-8901'
      }
    ],
    skipDuplicates: true
  });

  console.log('✓ Suppliers created');

  // Create products
  console.log('Creating products...');
  await prisma.product.createMany({
    data: [
      {
        name: 'Laptop Dell Inspiron 15',
        sku: 'LAP-DEL-001',
        type: 'PRODUCTO',
        cost: 450.00,
        unitPrice: 699.99,
        stockQty: 15
      },
      {
        name: 'Mouse Logitech M185',
        sku: 'MOU-LOG-001',
        type: 'PRODUCTO',
        cost: 8.50,
        unitPrice: 15.99,
        stockQty: 50
      },
      {
        name: 'Teclado Mecánico RGB',
        sku: 'KEY-MEC-001',
        type: 'PRODUCTO',
        cost: 35.00,
        unitPrice: 59.99,
        stockQty: 25
      },
      {
        name: 'Monitor LG 24" Full HD',
        sku: 'MON-LG-001',
        type: 'PRODUCTO',
        cost: 120.00,
        unitPrice: 189.99,
        stockQty: 12
      },
      {
        name: 'Cable HDMI 2.0',
        sku: 'CAB-HDM-001',
        type: 'PRODUCTO',
        cost: 3.50,
        unitPrice: 8.99,
        stockQty: 100
      },
      {
        name: 'Impresora HP LaserJet',
        sku: 'PRI-HP-001',
        type: 'PRODUCTO',
        cost: 180.00,
        unitPrice: 299.99,
        stockQty: 8
      },
      {
        name: 'Servicio de Instalación',
        sku: 'SRV-INS-001',
        type: 'SERVICIO',
        cost: 0.00,
        unitPrice: 25.00,
        stockQty: 0
      },
      {
        name: 'Servicio de Mantenimiento',
        sku: 'SRV-MAN-001',
        type: 'SERVICIO',
        cost: 0.00,
        unitPrice: 35.00,
        stockQty: 0
      },
      {
        name: 'USB 32GB Kingston',
        sku: 'USB-KIN-001',
        type: 'PRODUCTO',
        cost: 5.00,
        unitPrice: 12.99,
        stockQty: 75
      },
      {
        name: 'Webcam Logitech C920',
        sku: 'WEB-LOG-001',
        type: 'PRODUCTO',
        cost: 45.00,
        unitPrice: 79.99,
        stockQty: 5
      }
    ],
    skipDuplicates: true
  });

  console.log('✓ Products created');

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('===== Sucursal Centro =====');
  console.log('Admin    - username: admin    | password: password123');
  console.log('Gerente  - username: gerente  | password: password123');
  console.log('Cajero   - username: cajero   | password: password123');
  console.log('\n===== Sucursal Metrocentro =====');
  console.log('Admin    - username: admin2   | password: password123');
  console.log('Gerente  - username: gerente2 | password: password123');
  console.log('Cajero   - username: cajero2  | password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

