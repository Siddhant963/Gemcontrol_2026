import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import { getImageUrl } from '../utils/imageUtils';

const ProfessionalInvoice = ({ sale, customer, firm, items, stocks, materials, owner }) => {
  // Calculate totals
  const subtotal = sale?.totalAmount || 0;
  const payment = sale?.paymentAmount || 0;
  const udhar = sale?.udharAmount || 0;

  // Calculate GST breakdown (3% total = 1.5% CGST + 1.5% SGST)
  const gstRate = 3;
  const amountBeforeGST = subtotal / (1 + gstRate / 100);
  const gstAmount = subtotal - amountBeforeGST;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;

  const proprietorName = firm?.proprietorName || owner?.name || '';

  const summaryRows = [
    { label: 'Total Before GST', value: `₹ ${amountBeforeGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { label: 'Add CGST (1.5%)', value: `₹ ${cgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { label: 'Add SGST (1.5%)', value: `₹ ${sgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { label: 'Add IGST (0%)', value: '₹ 0.00' },
    { label: 'TOTAL AFTER GST', value: `₹ ${subtotal.toLocaleString('en-IN')}`, emphasize: true },
    { label: 'Payment Received', value: `₹ ${payment.toLocaleString('en-IN')}` },
    { label: 'Credit (Udhar)', value: `₹ ${udhar.toLocaleString('en-IN')}`, warn: udhar > 0 },
    { label: 'Payment Method', value: (sale?.paymentMethod || '').toUpperCase() || '—' },
    { label: 'TOTAL AMOUNT', value: `₹ ${subtotal.toLocaleString('en-IN')}`, emphasize: true },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        bgcolor: 'white',
        color: 'black',
        p: 4,
        fontFamily: 'Arial, sans-serif',
        '@media print': {
          p: 3,
        },
      }}
    >
      {/* Header Section */}
      <Grid container alignItems="center" sx={{ mb: 2 }}>
        {/* Left: Proprietor */}
        <Grid item xs={3}>
          <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
            {proprietorName ? `Prop: ${proprietorName}` : ''}
          </Typography>
        </Grid>

        {/* Center: Logo and Firm Name */}
        <Grid item xs={6} sx={{ textAlign: 'center' }}>
          {/* Logo */}
          {firm?.logo && (
            <Box
              sx={{
                width: 50,
                height: 50,
                margin: '0 auto 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={getImageUrl(firm.logo)}
                alt="Logo"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}

          {/* Firm Name - Stylized */}
          <Typography
            sx={{
              fontSize: '32px',
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
              letterSpacing: 3,
              textTransform: 'uppercase',
              lineHeight: 1.2,
              textDecoration: 'underline',
              textDecorationThickness: '3px',
            }}
          >
            {firm?.name || ''}
          </Typography>
        </Grid>

        {/* Right: Tax Invoice and GST */}
        <Grid item xs={3} sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 900, mb: 0.5 }}>
            TAX INVOICE
          </Typography>
          {firm?.gst && (
            <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>
              GSTIN: {firm.gst}
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Address Line */}
      {firm?.location && (
        <Box sx={{ textAlign: 'center', mb: 2, borderBottom: '1px solid #000', pb: 1 }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
            {firm.location}
          </Typography>
        </Box>
      )}

      {/* Bill Details Row */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Typography sx={{ fontSize: '10px' }}>
            <span style={{ fontWeight: 700 }}>Bill No:</span>{' '}
            {sale?.invoiceNumber || '—'}
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '10px' }}>
            <span style={{ fontWeight: 700 }}>Email:</span> {firm?.email || '—'}
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Typography sx={{ fontSize: '9px', fontStyle: 'italic' }}>
            Mfrs. in: High Class Gold & Silver Ornament, KDM JOINS 916 Hallmark Jewellery 100% Returnable
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '10px' }}>
            <span style={{ fontWeight: 700 }}>Mob No:</span> {firm?.contact || '—'}
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2, textAlign: 'right' }}>
        <Typography sx={{ fontSize: '10px' }}>
          <span style={{ fontWeight: 700 }}>Date:</span> {new Date(sale?.createdAt || Date.now()).toLocaleDateString('en-IN')}
        </Typography>
      </Box>

      {/* Customer Details */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '11px', mb: 0.5 }}>
          <span style={{ fontWeight: 700 }}>Client Name:</span>
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '400px', marginLeft: '10px' }}>
            {customer?.name || ''}
          </span>
        </Typography>

        <Typography sx={{ fontSize: '11px', mb: 0.5 }}>
          <span style={{ fontWeight: 700 }}>Address:</span>
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '450px', marginLeft: '10px' }}>
            {customer?.address || ''}
          </span>
        </Typography>

        <Typography sx={{ fontSize: '11px' }}>
          <span style={{ fontWeight: 700 }}>Phone No:</span>
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '200px', marginLeft: '10px' }}>
            {customer?.contact || ''}
          </span>
        </Typography>
      </Box>

      {/* Items Table */}
      <Table
        sx={{
          border: '2px solid #000',
          mb: 2,
          '& td, & th': {
            border: '1px solid #000',
            padding: '6px 8px',
          },
        }}
        size="small"
      >
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', textAlign: 'center', width: '40px', color: '#000' }}>
              Sr.No.
            </TableCell>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', color: '#000' }}>
              Description of Goods
            </TableCell>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', textAlign: 'center', width: '80px', color: '#000' }}>
              Making Charge
            </TableCell>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', textAlign: 'center', width: '80px', color: '#000' }}>
              Weight in gram
            </TableCell>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', textAlign: 'center', width: '80px', color: '#000' }}>
              Gold Silver Rate
            </TableCell>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', textAlign: 'center', width: '40px', color: '#000' }}>
              %
            </TableCell>
            <TableCell sx={{ fontWeight: 900, fontSize: '11px', textAlign: 'right', width: '100px', color: '#000' }}>
              Amount ₹
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items?.map((item, idx) => {
            const stock =
              item.saleType === 'stock'
                ? stocks?.find((s) => s._id === item.salematerialId)
                : null;
            const material =
              item.saleType !== 'stock'
                ? materials?.find((m) => m._id === item.salematerialId)
                : null;
            const name = stock?.name || material?.name || 'Item';
            const weight = stock?.waight || material?.weight || item.quantity;
            const makingCharge = stock?.makingCharge || 0;

            return (
              <TableRow key={idx}>
                <TableCell sx={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#000' }}>
                  {idx + 1}
                </TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 600, color: '#000' }}>
                  {name}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#000' }}>
                  {makingCharge}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#000' }}>
                  {weight}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#000' }}>
                  {stock?.price || '-'}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#000' }}>
                  {gstRate}
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#000' }}>
                  {item.amount?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            );
          })}

          {/* Empty rows for spacing */}
          {[...Array(Math.max(0, 10 - (items?.length || 0)))].map((_, idx) => (
            <TableRow key={`empty-${idx}`}>
              <TableCell sx={{ height: '25px' }}>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* GST + Payment Summary — row based, matching the items table style */}
      <TableContainer sx={{ mb: 2 }}>
        <Table
          size="small"
          sx={{
            border: '2px solid #000',
            '& td': {
              border: '1px solid #000',
              padding: '6px 10px',
            },
          }}
        >
          <TableBody>
            {summaryRows.map((row) => (
              <TableRow
                key={row.label}
                sx={row.emphasize ? { bgcolor: '#000' } : undefined}
              >
                <TableCell
                  sx={{
                    fontWeight: 900,
                    fontSize: row.emphasize ? '13px' : '11px',
                    color: row.emphasize ? '#fff' : row.warn ? 'red' : '#000',
                    width: '70%',
                  }}
                >
                  {row.label}
                  {row.label === 'Payment Method' ? ':' : row.emphasize ? ':' : ''}
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 900,
                    fontSize: row.emphasize ? '13px' : '11px',
                    color: row.emphasize ? '#fff' : row.warn ? 'red' : '#000',
                    textAlign: 'right',
                  }}
                >
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Amount in Words */}
      <Box sx={{ border: '2px solid #000', p: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: 900, fontSize: '11px', display: 'inline' }}>
          AMOUNT IN WORDS:{' '}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontStyle: 'italic', fontSize: '12px', display: 'inline' }}>
          Rupees {subtotal.toLocaleString('en-IN')} Only
        </Typography>
      </Box>

      {/* Signature Section - Full Width, Reduced Height */}
      <Box sx={{ border: '2px solid #000', mb: 2 }}>
        <Box
          sx={{
            bgcolor: '#000',
            color: 'white',
            p: 0.5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: '12px' }}>
            FOR {(firm?.name || '').toUpperCase()}
          </Typography>
        </Box>

        <Grid container sx={{ p: 1.5 }}>
          {/* Stamp Area */}
          <Grid item xs={4}>
            <Box
              sx={{
                border: firm?.firmStamp ? 'none' : '2px dashed #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80px',
              }}
            >
              {firm?.firmStamp ? (
                <img
                  src={getImageUrl(firm.firmStamp)}
                  alt="Firm Stamp"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '9px' }}>
                  [FIRM STAMP HERE]
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Customer Signature */}
          <Grid item xs={4} sx={{ px: 2 }}>
            <Box sx={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box
                sx={{
                  borderBottom: '2px solid #000',
                  mb: 0.5,
                  height: '50px',
                }}
              />
              <Typography sx={{ fontWeight: 700, textAlign: 'center', fontSize: '10px' }}>
                Customer Signature
              </Typography>
            </Box>
          </Grid>

          {/* Auth Signature */}
          <Grid item xs={4}>
            <Box sx={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box
                sx={{
                  borderBottom: '2px solid #000',
                  mb: 0.5,
                  height: '50px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                {firm?.ownerSignature && (
                  <img
                    src={getImageUrl(firm.ownerSignature)}
                    alt="Owner Signature"
                    style={{ maxWidth: '100%', maxHeight: '48px', objectFit: 'contain' }}
                  />
                )}
              </Box>
              <Typography sx={{ fontWeight: 700, textAlign: 'center', fontSize: '10px' }}>
                Auth Signature
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 2, pt: 1, borderTop: '1px solid #000' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '11px' }}>
          Thank you for your business!
        </Typography>
        <Typography sx={{ fontSize: '9px', color: 'text.secondary', mt: 0.5 }}>
          This is a computer generated invoice | For any queries, please contact: {firm?.contact || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfessionalInvoice;
