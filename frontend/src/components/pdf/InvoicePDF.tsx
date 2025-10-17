'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666',
    width: '40%',
  },
  value: {
    fontSize: 10,
    width: '60%',
  },
  table: {
    marginVertical: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 9,
    borderBottom: 1,
    borderBottomColor: '#eee',
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 15,
    borderTop: 1,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10,
  },
  totalLabel: {
    fontWeight: 'normal',
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: 2,
    borderTopColor: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

interface InvoiceItem {
  id: number;
  product: {
    name: string;
    sku: string;
  };
  qty: number;
  unitPrice: string;
  discount: string;
  subtotal: string;
}

interface InvoicePDFProps {
  invoice: {
    numeroControlDTE: string;
    numeroControl: string;
    codeGeneracion: string;
    selloRecepcion: string;
    issueDate: string;
    type: string;
    status: string;
    paymentMethod: string;
    observations?: string;
    client: {
      name: string;
      email?: string;
      phone?: string;
      nit?: string;
      nrc?: string;
      dui?: string;
      address?: string;
    };
    branch: {
      name: string;
      code: string;
      address: string;
    };
    items: InvoiceItem[];
    subtotal: string;
    iva13: string;
    retencionRenta10: string;
    retencionIva1: string;
    total: string;
  };
}

const formatCurrency = (value: string) => {
  return `$${parseFloat(value).toFixed(2)}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-SV', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FACTURA ELECTRÓNICA</Text>
        <Text style={styles.subtitle}>DTE: {invoice.numeroControlDTE}</Text>
        <Text style={styles.subtitle}>N° Control: {invoice.numeroControl}</Text>
      </View>

      {/* Branch Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMISOR</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{invoice.branch.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Código:</Text>
          <Text style={styles.value}>{invoice.branch.code}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>{invoice.branch.address}</Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CLIENTE</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{invoice.client.name}</Text>
        </View>
        {invoice.client.nit && (
          <View style={styles.row}>
            <Text style={styles.label}>NIT:</Text>
            <Text style={styles.value}>{invoice.client.nit}</Text>
          </View>
        )}
        {invoice.client.nrc && (
          <View style={styles.row}>
            <Text style={styles.label}>NRC:</Text>
            <Text style={styles.value}>{invoice.client.nrc}</Text>
          </View>
        )}
        {invoice.client.dui && (
          <View style={styles.row}>
            <Text style={styles.label}>DUI:</Text>
            <Text style={styles.value}>{invoice.client.dui}</Text>
          </View>
        )}
        {invoice.client.phone && (
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{invoice.client.phone}</Text>
          </View>
        )}
        {invoice.client.email && (
          <View style={styles.row}>
            <Text style={styles.label}>Correo:</Text>
            <Text style={styles.value}>{invoice.client.email}</Text>
          </View>
        )}
        {invoice.client.address && (
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{invoice.client.address}</Text>
          </View>
        )}
      </View>

      {/* Invoice Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DETALLES DEL DOCUMENTO</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha de Emisión:</Text>
          <Text style={styles.value}>{formatDate(invoice.issueDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.value}>{invoice.type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>{invoice.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Método de Pago:</Text>
          <Text style={styles.value}>{invoice.paymentMethod}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Código Generación:</Text>
          <Text style={styles.value}>{invoice.codeGeneracion}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sello Recepción:</Text>
          <Text style={styles.value}>{invoice.selloRecepcion}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Producto</Text>
          <Text style={styles.col2}>Cant.</Text>
          <Text style={styles.col3}>Precio Unit.</Text>
          <Text style={styles.col4}>Desc.</Text>
          <Text style={styles.col5}>Subtotal</Text>
        </View>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.col1}>{item.product.name}</Text>
            <Text style={styles.col2}>{item.qty}</Text>
            <Text style={styles.col3}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.col4}>{formatCurrency(item.discount)}</Text>
            <Text style={styles.col5}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA 13%:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.iva13)}</Text>
        </View>
        {parseFloat(invoice.retencionRenta10) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Retención Renta 10%:</Text>
            <Text style={styles.totalValue}>-{formatCurrency(invoice.retencionRenta10)}</Text>
          </View>
        )}
        {parseFloat(invoice.retencionIva1) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Retención IVA 1%:</Text>
            <Text style={styles.totalValue}>-{formatCurrency(invoice.retencionIva1)}</Text>
          </View>
        )}
        <View style={styles.grandTotal}>
          <Text>TOTAL:</Text>
          <Text>{formatCurrency(invoice.total)}</Text>
        </View>
      </View>

      {/* Observations */}
      {invoice.observations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
          <Text style={{ fontSize: 10 }}>{invoice.observations}</Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Este documento es una representación impresa de la factura electrónica
      </Text>
    </Page>
  </Document>
);

