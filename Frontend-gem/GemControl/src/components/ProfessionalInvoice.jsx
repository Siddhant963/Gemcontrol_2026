import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import { getImageUrl } from '../utils/imageUtils';

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function threeDigitsToWords(num) {
  let str = '';
  if (num >= 100) {
    str += `${ONES[Math.floor(num / 100)]} Hundred `;
    num %= 100;
  }
  if (num >= 20) {
    str += `${TENS[Math.floor(num / 10)]} `;
    num %= 10;
  }
  if (num > 0) {
    str += `${ONES[num]} `;
  }
  return str.trim();
}

// Converts a rupee amount to Indian-numbering words, e.g. 77000 -> "Seventy
// Seven Thousand". Paise are dropped since jewellery bills are always
// rounded to the rupee.
function amountToWords(amount) {
  let num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (num) parts.push(threeDigitsToWords(num));

  return parts.join(' ').trim();
}

const rupee = (value) =>
  `${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// A single line-item's display values, preferring the snapshot captured on
// the sale itself (item.name/grossWeight/etc — see Backend/Models/SaleModel.js)
// over looking the current stock record up, since the stock's price/weight
// may have changed since this sale was made. Falls back to the live stock
// lookup only for pre-snapshot historical sales.
function resolveLineItem(item, stocks, materials) {
  const stock =
    item.saleType === 'stock' ? stocks?.find((s) => s._id === item.salematerialId) : null;
  const material =
    item.saleType !== 'stock' ? materials?.find((m) => m._id === item.salematerialId) : null;

  return {
    name: item.name || stock?.name || material?.name || 'Item',
    prodId: stock?.stockcode || material?.RawMaterialcode || '',
    image: stock?.stockImg || '',
    hsnCode: item.hsnCode || stock?.hsnCode || '',
    karat: item.karat || stock?.karat || '',
    grossWeight: item.grossWeight || stock?.grossWeight || stock?.waight || 0,
    netWeight: item.netWeight || stock?.netWeight || stock?.waight || 0,
    lessWeight: item.lessWeight || stock?.lessWeight || 0,
    rate: item.rate || 0,
    makingCharge: item.makingCharge ?? stock?.makingCharge ?? 0,
    quantity: item.quantity || 0,
    amount: item.amount || 0,
  };
}

const PAYMENT_ROW_LABELS = {
  cash: 'CASH RECEIVED',
  cheque: 'CHEQUE RECEIVED',
  card: 'CARD RECEIVED',
  online: 'ONLINE PAYMENT',
  Upi: 'UPI PAYMENT',
  bankTransfer: 'BANK TRANSFER',
  credit: 'CREDIT',
};

const ProfessionalInvoice = ({ sale, customer, firm, items, stocks, materials }) => {
  const lineItems = (items || []).map((item) => resolveLineItem(item, stocks, materials));

  const hasGstSnapshot = sale?.gst && (sale.gst.cgstRate || sale.gst.sgstRate || sale.gst.igstRate);
  const totalAmount = sale?.totalAmount || 0;

  // Older sales made before the GST snapshot existed still need something to
  // show — fall back to reverse-deriving a 3% split from the final total,
  // matching this component's previous (pre-overhaul) behavior.
  const taxableAmount = hasGstSnapshot
    ? sale.taxableAmount || 0
    : totalAmount / 1.03;
  const cgstRate = hasGstSnapshot ? sale.gst.cgstRate : 1.5;
  const sgstRate = hasGstSnapshot ? sale.gst.sgstRate : 1.5;
  const igstRate = hasGstSnapshot ? sale.gst.igstRate || 0 : 0;
  const cgstAmount = hasGstSnapshot ? sale.gst.cgstAmount : taxableAmount * 0.015;
  const sgstAmount = hasGstSnapshot ? sale.gst.sgstAmount : taxableAmount * 0.015;
  const igstAmount = hasGstSnapshot ? sale.gst.igstAmount || 0 : 0;

  const payments =
    sale?.payments?.length > 0
      ? sale.payments
      : sale?.paymentMethod
      ? [{ method: sale.paymentMethod, amount: sale.paymentAmount || 0 }]
      : [];
  const netReceivable = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = Math.max(totalAmount - netReceivable, 0);

  const saleTypeLabel =
    lineItems[0]?.karat && (lineItems[0].name || '').toLowerCase().includes('silver')
      ? 'Silver Sell'
      : 'Gold Sell';

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
        border: '2px solid #1a3d7c',
        '@media print': { p: 3 },
      }}
    >
      {/* Header */}
      <Grid container alignItems="center" sx={{ mb: 1.5 }}>
        <Grid item xs={2}>
          {firm?.logo && (
            <Box sx={{ width: 80, height: 80 }}>
              <img
                src={getImageUrl(firm.logo)}
                alt="Logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Grid>
        <Grid item xs={8} sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#b02a2a' }}>
            {firm?.shopName || 'SHUBH LABH'}
          </Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 900, letterSpacing: 1, color: '#b02a2a' }}>
            {(firm?.name || '').toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
            {(firm?.description || 'GOLD AND SILVER').toUpperCase()}
          </Typography>
          {firm?.registrationNo && (
            <Typography sx={{ fontSize: '11px', fontWeight: 700, mt: 0.5 }}>
              REGISTRATION NO : {firm.registrationNo}
            </Typography>
          )}
          <Typography sx={{ fontSize: '11px' }}>
            {[firm?.city, firm?.location].filter(Boolean).join(', ').toUpperCase()}
          </Typography>
          {firm?.email && (
            <Typography sx={{ fontSize: '11px' }}>
              EMAIL : {firm.email}
            </Typography>
          )}
          {firm?.gst && (
            <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>
              GSTIN: {firm.gst}
            </Typography>
          )}
        </Grid>
        <Grid item xs={2} sx={{ textAlign: 'right' }}>
          {firm?.secondLogo && (
            <Box sx={{ width: 80, height: 80, ml: 'auto' }}>
              <img
                src={getImageUrl(firm.secondLogo)}
                alt="Hallmark"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Bill-to / invoice meta */}
      <Grid container sx={{ border: '1px solid #1a3d7c', mb: 1.5 }}>
        <Grid item xs={7} sx={{ p: 1.5, borderRight: '1px solid #1a3d7c' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, mb: 0.5 }}>
            Details Of Receiver (Bill To):
          </Typography>
          <Typography sx={{ fontSize: '12px' }}>
            NAME : {customer?.name || ''}
          </Typography>
          <Typography sx={{ fontSize: '12px' }}>
            ADDRESS : {customer?.address || ''}
          </Typography>
          {customer?.contact && (
            <Typography sx={{ fontSize: '12px' }}>
              PHONE : {customer.contact}
            </Typography>
          )}
        </Grid>
        <Grid item xs={5} sx={{ p: 1.5 }}>
          <Typography sx={{ fontSize: '12px' }}>
            <strong>INVOICE NO:</strong> {sale?.invoiceNumber || '—'}
          </Typography>
          <Typography sx={{ fontSize: '12px' }}>
            <strong>DATE:</strong>{' '}
            {new Date(sale?.saleDate || sale?.createdAt || Date.now()).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
          {firm?.gst && (
            <Typography sx={{ fontSize: '12px' }}>
              <strong>VAT NO . : :</strong> {firm.gst}
            </Typography>
          )}
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 900, color: '#1a3d7c' }}>
          GST INVOICE
        </Typography>
        <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
          {saleTypeLabel}
        </Typography>
      </Box>

      {/* Item table */}
      <Table
        size="small"
        sx={{
          border: '1px solid #1a3d7c',
          mb: 1,
          '& td, & th': { border: '1px solid #1a3d7c', padding: '6px 8px', fontSize: '11px' },
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: '#eef2fa' }}>
            <TableCell sx={{ fontWeight: 700 }}>PROD ID</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>DESIGN</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>PROD DESC</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>QTY</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>HSN</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>GS WT</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>NT WT</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>V/A WT</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>RATE</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>ST RATE</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>MKG</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((line, idx) => (
            <TableRow key={idx}>
              <TableCell>{line.prodId || `ITEM${idx + 1}`}</TableCell>
              <TableCell>
                {line.image ? (
                  <img
                    src={getImageUrl(line.image)}
                    alt={line.name}
                    style={{ width: 50, height: 50, objectFit: 'cover' }}
                  />
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>{line.name}{line.karat ? ` [${line.karat}]` : ''}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>{line.quantity}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>{line.hsnCode || '—'}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                {line.grossWeight ? `${line.grossWeight.toFixed?.(3) ?? line.grossWeight} GM` : '—'}
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                {line.netWeight ? `${line.netWeight.toFixed?.(3) ?? line.netWeight} GM` : '—'}
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                {line.lessWeight ? `${line.lessWeight.toFixed?.(3) ?? line.lessWeight} GM` : '-'}
              </TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{line.rate ? rupee(line.rate) : '-'}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>-</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{rupee(line.makingCharge)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Payment received (left) + totals (right) */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Table
            size="small"
            sx={{ '& td': { border: 'none', padding: '3px 6px', fontSize: '12px' } }}
          >
            <TableBody>
              {payments.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {PAYMENT_ROW_LABELS[p.method] || `${(p.method || '').toUpperCase()} RECEIVED`} :
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{rupee(p.amount)}</TableCell>
                </TableRow>
              ))}
              {(sale?.udharAmount || 0) > 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#b02a2a' }}>UDHAR (CREDIT) :</TableCell>
                  <TableCell sx={{ textAlign: 'right', color: '#b02a2a' }}>
                    {rupee(sale.udharAmount)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Grid>
        <Grid item xs={6}>
          <Table
            size="small"
            sx={{
              border: '1px solid #1a3d7c',
              '& td': { border: '1px solid #1a3d7c', padding: '4px 10px', fontSize: '12px' },
            }}
          >
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>AMOUNT :</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{rupee(sale?.subtotal || taxableAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>TAXABLE AMT :</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{rupee(taxableAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>CGST ({cgstRate}%) :</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{rupee(cgstAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>SGST ({sgstRate}%) :</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{rupee(sgstAmount)}</TableCell>
              </TableRow>
              {igstRate > 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>IGST ({igstRate}%) :</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{rupee(igstAmount)}</TableCell>
                </TableRow>
              )}
              <TableRow sx={{ bgcolor: '#eef2fa' }}>
                <TableCell sx={{ fontWeight: 900 }}>TOTAL AMOUNT :</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{rupee(totalAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>NET RECEIVABLE AMT :</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{rupee(netReceivable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>AMT BALANCE:</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: balance > 0 ? 'red' : 'inherit' }}>
                  {rupee(balance)}{balance > 0 ? ' DR' : ''}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>

      {/* Amount in words */}
      <Grid container sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>PAYABLE AMOUNT :</Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>
            {amountToWords(totalAmount)} Only/-
          </Typography>
        </Grid>
      </Grid>

      {/* Signatures */}
      <Grid container sx={{ mt: 4 }}>
        <Grid item xs={6}>
          <Box sx={{ borderTop: '1px solid #000', width: '70%', pt: 0.5 }}>
            <Typography sx={{ fontSize: '12px' }}>Customer Signatory</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          {firm?.ownerSignature && (
            <Box sx={{ height: 50, display: 'flex', justifyContent: 'flex-end' }}>
              <img
                src={getImageUrl(firm.ownerSignature)}
                alt="Signature"
                style={{ maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
          <Box sx={{ borderTop: '1px solid #000', width: '70%', ml: 'auto', pt: 0.5 }}>
            <Typography sx={{ fontSize: '12px' }}>Authorized Signatory</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfessionalInvoice;
