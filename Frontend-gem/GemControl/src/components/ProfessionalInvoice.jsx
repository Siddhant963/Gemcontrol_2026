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
        border: '2px solid #0a2540',
        '@media print': { p: 3 },
      }}
    >
      {/* Header: logo (left) / firm name+details, centered (middle) / second
          logo, e.g. hallmark (right) -- top-aligned so both logos sit level
          with the shop name, not vertically centered against the whole
          (taller) details block. */}
      <Grid container alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Grid item xs={2}>
          {firm?.logo && (
            <Box sx={{ width: 72, height: 72 }}>
              <img
                src={getImageUrl(firm.logo)}
                alt="Logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Grid>
        <Grid item xs={8} sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0a2540' }}>
            {firm?.shopName || 'SHUBH LABH'}
          </Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 900, letterSpacing: 1, color: '#0a2540' }}>
            {(firm?.name || '').toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>
            {(firm?.description || 'GOLD AND SILVER').toUpperCase()}
          </Typography>
          {/* Everything below the firm name condensed to at most 2 lines --
              registration/city on one, email/GSTIN on the other. */}
          {(firm?.registrationNo || firm?.city || firm?.location) && (
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#000', mt: 0.5 }}>
              {[
                firm?.registrationNo && `REGISTRATION NO: ${firm.registrationNo}`,
                [firm?.city, firm?.location].filter(Boolean).join(', ').toUpperCase() || null,
              ]
                .filter(Boolean)
                .join('   ·   ')}
            </Typography>
          )}
          {(firm?.email || firm?.gst) && (
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#000' }}>
              {[
                firm?.email && `EMAIL: ${firm.email}`,
                firm?.gst && `GSTIN: ${firm.gst}`,
              ]
                .filter(Boolean)
                .join('   ·   ')}
            </Typography>
          )}
        </Grid>
        <Grid item xs={2} sx={{ textAlign: 'right' }}>
          {firm?.secondLogo && (
            <Box sx={{ width: 72, height: 72, ml: 'auto' }}>
              <img
                src={getImageUrl(firm.secondLogo)}
                alt="Hallmark"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* GST INVOICE / Gold Sell heading -- comes before the bill-to block
          now (was after it). */}
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 900, color: '#0a2540' }}>
          GST INVOICE
        </Typography>
        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>
          {saleTypeLabel}
        </Typography>
      </Box>

      {/* Bill-to / invoice meta */}
      <Grid container sx={{ border: '1px solid #0a2540', mb: 1.5 }}>
        <Grid item xs={7} sx={{ p: 1.5, borderRight: '1px solid #0a2540' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#000', mb: 0.5 }}>
            Details Of Receiver (Bill To):
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#000' }}>
            NAME : {customer?.name || ''}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#000' }}>
            ADDRESS : {customer?.address || ''}
          </Typography>
          {customer?.contact && (
            <Typography sx={{ fontSize: '12px', color: '#000' }}>
              PHONE : {customer.contact}
            </Typography>
          )}
        </Grid>
        <Grid item xs={5} sx={{ p: 1.5 }}>
          <Typography sx={{ fontSize: '12px', color: '#000' }}>
            <strong>INVOICE NO:</strong> {sale?.invoiceNumber || '—'}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#000' }}>
            <strong>DATE:</strong>{' '}
            {new Date(sale?.saleDate || sale?.createdAt || Date.now()).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
          {firm?.gst && (
            <Typography sx={{ fontSize: '12px', color: '#000' }}>
              <strong>VAT NO . : :</strong> {firm.gst}
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Item table -- every cell gets an EXPLICIT color (never relying on
          inheritance) since this invoice can be rendered inside the app's
          dark-mode theme context, whose MuiTableCell/Typography defaults
          would otherwise win over an inherited color and wash the text out. */}
      <Table
        size="small"
        sx={{
          border: '1px solid #0a2540',
          mb: 1,
          '& td, & th': { border: '1px solid #0a2540', padding: '6px 8px', fontSize: '11px' },
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: '#eaedff' }}>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540' }}>PROD ID</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540' }}>DESIGN</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540' }}>PROD DESC</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'center' }}>QTY</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'center' }}>HSN</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'center' }}>GS WT</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'center' }}>NT WT</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'center' }}>V/A WT</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'right' }}>RATE</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'center' }}>ST RATE</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#0a2540', textAlign: 'right' }}>MKG</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((line, idx) => (
            <TableRow key={idx}>
              <TableCell sx={{ color: '#000' }}>{line.prodId || `ITEM${idx + 1}`}</TableCell>
              <TableCell sx={{ color: '#000' }}>
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
              <TableCell sx={{ color: '#000' }}>{line.name}{line.karat ? ` [${line.karat}]` : ''}</TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'center' }}>{line.quantity}</TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'center' }}>{line.hsnCode || '—'}</TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'center' }}>
                {line.grossWeight ? `${line.grossWeight.toFixed?.(3) ?? line.grossWeight} GM` : '—'}
              </TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'center' }}>
                {line.netWeight ? `${line.netWeight.toFixed?.(3) ?? line.netWeight} GM` : '—'}
              </TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'center' }}>
                {line.lessWeight ? `${line.lessWeight.toFixed?.(3) ?? line.lessWeight} GM` : '-'}
              </TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'right' }}>{line.rate ? rupee(line.rate) : '-'}</TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'center' }}>-</TableCell>
              <TableCell sx={{ color: '#000', textAlign: 'right' }}>{rupee(line.makingCharge)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Payment received (left) + totals (right) -- both sides bordered
          the same way now, so they read as two clearly separated blocks
          rather than a bordered block next to a floating, borderless one. */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Table
            size="small"
            sx={{
              border: '1px solid #0a2540',
              height: '100%',
              '& td': { border: 'none', padding: '4px 10px', fontSize: '12px' },
            }}
          >
            <TableBody>
              {payments.length === 0 && (sale?.udharAmount || 0) === 0 && (
                <TableRow>
                  <TableCell sx={{ color: '#000' }}>—</TableCell>
                </TableRow>
              )}
              {payments.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 700, color: '#000' }}>
                    {PAYMENT_ROW_LABELS[p.method] || `${(p.method || '').toUpperCase()} RECEIVED`} :
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(p.amount)}</TableCell>
                </TableRow>
              ))}
              {(sale?.udharAmount || 0) > 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#ba1a1a' }}>UDHAR (CREDIT) :</TableCell>
                  <TableCell sx={{ textAlign: 'right', color: '#ba1a1a' }}>
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
              border: '1px solid #0a2540',
              '& td': { border: '1px solid #0a2540', padding: '4px 10px', fontSize: '12px' },
            }}
          >
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>AMOUNT :</TableCell>
                <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(sale?.subtotal || taxableAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>TAXABLE AMT :</TableCell>
                <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(taxableAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>CGST ({cgstRate}%) :</TableCell>
                <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(cgstAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>SGST ({sgstRate}%) :</TableCell>
                <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(sgstAmount)}</TableCell>
              </TableRow>
              {igstRate > 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#000' }}>IGST ({igstRate}%) :</TableCell>
                  <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(igstAmount)}</TableCell>
                </TableRow>
              )}
              <TableRow sx={{ bgcolor: '#eaedff' }}>
                <TableCell sx={{ fontWeight: 900, color: '#0a2540' }}>TOTAL AMOUNT :</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#0a2540' }}>{rupee(totalAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>NET RECEIVABLE AMT :</TableCell>
                <TableCell sx={{ textAlign: 'right', color: '#000' }}>{rupee(netReceivable)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, color: '#000' }}>AMT BALANCE:</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: balance > 0 ? '#ba1a1a' : '#000' }}>
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
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#000' }}>PAYABLE AMOUNT :</Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#000' }}>
            {amountToWords(totalAmount)} Only/-
          </Typography>
        </Grid>
      </Grid>

      {/* Signatures: customer (left), firm stamp + owner signature (right) */}
      <Grid container sx={{ mt: 4 }}>
        <Grid item xs={6}>
          <Box sx={{ borderTop: '1px solid #000', width: '70%', pt: 0.5 }}>
            <Typography sx={{ fontSize: '12px', color: '#000' }}>Customer Signatory</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          {(firm?.firmStamp || firm?.ownerSignature) && (
            <Box
              sx={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
              }}
            >
              {firm?.firmStamp && (
                <img
                  src={getImageUrl(firm.firmStamp)}
                  alt="Firm Stamp"
                  style={{ maxHeight: '100%', maxWidth: 90, objectFit: 'contain' }}
                />
              )}
              {firm?.ownerSignature && (
                <img
                  src={getImageUrl(firm.ownerSignature)}
                  alt="Signature"
                  style={{ maxHeight: '100%', maxWidth: 120, objectFit: 'contain' }}
                />
              )}
            </Box>
          )}
          <Box sx={{ borderTop: '1px solid #000', width: '70%', ml: 'auto', pt: 0.5 }}>
            <Typography sx={{ fontSize: '12px', color: '#000' }}>Authorized Signatory</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfessionalInvoice;
