import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  paid_date?: string;
  utr_reference?: string;
}

export interface ClientData {
  name: string;
  email?: string;
  whatsapp?: string;
  gstin?: string;
  address?: string;
}

export interface SettingsData {
  creator_display_name?: string;
  company_name?: string;
  gstin?: string;
  company_address?: string;
  footer_message?: string;
  logo_url?: string;
  default_gst_percent?: number;
  upi_vpa?: string;
}

export interface InvoiceItem {
  title: string;
  qty: number;
  rate: number;
  amount: number;
}

export const generateInvoicePDF = async (
  invoice: InvoiceData,
  client: ClientData,
  items: InvoiceItem[],
  settings: SettingsData
): Promise<string> => {
  try {
    // Create a temporary div for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '40px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    
    tempDiv.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #17B897; padding-bottom: 30px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              ${settings.logo_url ? `<img src="${settings.logo_url}" alt="Logo" style="max-height: 80px; margin-bottom: 20px;" />` : `<img src="/assets/Full_Logo_hustlehub.png" alt="HustleHub" style="max-height: 80px; margin-bottom: 20px;" />`}
              <h1 style="color: #17B897; font-size: 36px; font-weight: bold; margin: 0;">INVOICE</h1>
            </div>
            <div style="text-align: right;">
              <div style="background: ${invoice.status === 'paid' ? '#16a34a' : invoice.status === 'overdue' ? '#dc2626' : '#6b7280'}; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; display: inline-block;">
                ${invoice.status.toUpperCase()}
              </div>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <div style="font-size: 16px; margin-bottom: 8px;"><strong>Invoice #:</strong> ${invoice.invoice_number}</div>
            <div style="font-size: 16px; margin-bottom: 8px;"><strong>Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</div>
            <div style="font-size: 16px;"><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</div>
          </div>
        </div>

        <!-- Business & Client Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="color: #374151; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">From:</h3>
            <div style="line-height: 1.6;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${settings.company_name || settings.creator_display_name || 'Business Name'}</div>
              ${settings.company_address ? `<div style="margin-bottom: 5px;">${settings.company_address}</div>` : ''}
              ${settings.gstin ? `<div style="margin-bottom: 5px;"><strong>GSTIN:</strong> ${settings.gstin}</div>` : ''}
              ${settings.upi_vpa ? `<div><strong>UPI:</strong> ${settings.upi_vpa}</div>` : ''}
            </div>
          </div>
          
          <div>
            <h3 style="color: #374151; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Bill To:</h3>
            <div style="line-height: 1.6;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${client.name}</div>
              ${client.email ? `<div style="margin-bottom: 5px;">${client.email}</div>` : ''}
              ${client.whatsapp ? `<div style="margin-bottom: 5px;">Phone: ${client.whatsapp}</div>` : ''}
              ${client.address ? `<div style="margin-bottom: 5px;">${client.address}</div>` : ''}
              ${client.gstin ? `<div><strong>GSTIN:</strong> ${client.gstin}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 15px; text-align: left; font-weight: bold; color: #374151;">Description</th>
              <th style="border: 1px solid #e5e7eb; padding: 15px; text-align: center; font-weight: bold; color: #374151; width: 80px;">Qty</th>
              <th style="border: 1px solid #e5e7eb; padding: 15px; text-align: right; font-weight: bold; color: #374151; width: 120px;">Rate</th>
              <th style="border: 1px solid #e5e7eb; padding: 15px; text-align: right; font-weight: bold; color: #374151; width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
                <td style="border: 1px solid #e5e7eb; padding: 15px;">${item.title}</td>
                <td style="border: 1px solid #e5e7eb; padding: 15px; text-align: center;">${item.qty}</td>
                <td style="border: 1px solid #e5e7eb; padding: 15px; text-align: right;">${currency(item.rate)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 15px; text-align: right; font-weight: bold;">${currency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 300px; border: 1px solid #e5e7eb; background-color: #f9fafb; padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px;">
              <span>Subtotal:</span>
              <span>${currency(invoice.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 16px;">
              <span>GST (${settings.default_gst_percent || 18}%):</span>
              <span>${currency(invoice.gst_amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; color: #17B897; border-top: 2px solid #17B897; padding-top: 15px;">
              <span>Total Amount:</span>
              <span>${currency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        ${invoice.status === 'paid' && invoice.paid_date ? `
          <!-- Payment Info -->
          <div style="border: 1px solid #16a34a; background-color: #f0fdf4; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
            <div style="color: #16a34a; font-weight: bold; font-size: 16px; margin-bottom: 10px;">✅ Payment Received</div>
            <div style="font-size: 14px; color: #15803d;">
              <div><strong>Paid on:</strong> ${new Date(invoice.paid_date).toLocaleDateString()}</div>
              ${invoice.utr_reference ? `<div><strong>UTR Reference:</strong> ${invoice.utr_reference}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        ${settings.footer_message ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-style: italic;">
            ${settings.footer_message}
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Generated by HustleHub - Your UPI-first Hustle-HQ
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // Generate canvas from HTML
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert PDF to blob
    const pdfBlob = pdf.output('blob');

    // Upload to Supabase Storage
    const fileName = `invoice_${invoice.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('invoices_pdfs')
      .upload(fileName, pdfBlob, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // Get the URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices_pdfs')
      .getPublicUrl(fileName);

    // Update invoice record with PDF URL
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoice.id);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const downloadPDF = async (pdfUrl: string, fileName: string) => {
  try {
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};