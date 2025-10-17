import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { roleController } from '../controllers/roleController';
import { clientController } from '../controllers/clientController';
import { productController } from '../controllers/productController';
import { supplierController } from '../controllers/supplierController';
import { invoiceController } from '../controllers/invoiceController';
import { branchController } from '../controllers/branchController';

const router = Router();

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// Role routes
router.get('/roles', authenticateToken, requireRole('ADMINISTRADOR'), roleController.getAll);

// User routes (Admin only)
router.get('/users', authenticateToken, requireRole('ADMINISTRADOR'), userController.getAll);
router.get('/users/:id', authenticateToken, requireRole('ADMINISTRADOR'), userController.getById);
router.post('/users', authenticateToken, requireRole('ADMINISTRADOR'), userController.create);
router.put('/users/:id', authenticateToken, requireRole('ADMINISTRADOR'), userController.update);
router.delete('/users/:id', authenticateToken, requireRole('ADMINISTRADOR'), userController.delete);
router.patch('/users/:id/roles', authenticateToken, requireRole('ADMINISTRADOR'), userController.updateRoles);
router.patch('/users/:id/status', authenticateToken, requireRole('ADMINISTRADOR'), userController.updateStatus);

// Client routes
router.get('/clients', authenticateToken, clientController.getAll);
router.get('/clients/lookup', authenticateToken, clientController.lookup);
router.get('/clients/:id', authenticateToken, clientController.getById);
router.post('/clients', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), clientController.create);
router.put('/clients/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), clientController.update);
router.delete('/clients/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), clientController.delete);

// Product routes
router.get('/products', authenticateToken, productController.getAll); // Cajeros pueden buscar productos
router.get('/products/low-stock', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), productController.getLowStock);
router.get('/products/:id', authenticateToken, productController.getById); // Cajeros pueden ver productos
router.post('/products', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), productController.create);
router.put('/products/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), productController.update);
router.delete('/products/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), productController.delete);
router.post('/products/:id/stock', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), productController.adjustStock);
router.get('/products/:id/movements', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), productController.getStockMovements);

// Supplier routes
router.get('/suppliers', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), supplierController.getAll);
router.get('/suppliers/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), supplierController.getById);
router.post('/suppliers', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), supplierController.create);
router.put('/suppliers/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), supplierController.update);
router.delete('/suppliers/:id', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), supplierController.delete);

// Invoice routes
router.post('/invoices/preview', authenticateToken, invoiceController.preview);
router.post('/invoices', authenticateToken, invoiceController.create); // Cajeros pueden crear facturas
router.get('/invoices', authenticateToken, invoiceController.getAll);
router.get('/invoices/today', authenticateToken, invoiceController.getTodayHistory);
router.get('/invoices/dashboard-metrics', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), invoiceController.getDashboardMetrics);
router.get('/invoices/:id', authenticateToken, invoiceController.getById);
router.post('/invoices/:id/void', authenticateToken, requireRole('GERENTE', 'ADMINISTRADOR'), invoiceController.void);

// Branch routes
router.get('/branches', authenticateToken, branchController.getAll);
router.get('/branches/:id', authenticateToken, branchController.getById);
router.get('/branches/:id/sequences', authenticateToken, branchController.getSequences);
router.post('/branches/:id/sequences', authenticateToken, requireRole('ADMINISTRADOR'), branchController.createSequence);

export default router;

