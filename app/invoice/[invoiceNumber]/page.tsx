"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import Image from "next/image";

const LOGO_URL = 'https://storage.googleapis.com/msgsndr/afYLuZPi37CZR1IpJlfn/media/68f107369d906785d9458314.png';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function InvoiceViewerPage() {
  const params = useParams();
  const invoiceNumber = params.invoiceNumber as string;

  // Fetch invoice by invoice number
  const invoice = useQuery(api.invoices.getByInvoiceNumber, { invoiceNumber });

  // Fetch contact details if invoice exists
  const contact = useQuery(
    api.contacts.getById,
    invoice?.contactId ? { id: invoice.contactId } : "skip"
  );

  // Loading state
  if (invoice === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Invoice not found
  if (invoice === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">
            The invoice <span className="font-mono font-semibold">{invoiceNumber}</span> could not be found.
          </p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "Paid";
  const balanceDue = invoice.amount - (invoice.amountPaid || 0);
  const contactName = contact
    ? `${contact.firstName} ${contact.lastName}`
    : "Loading...";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Image
            src={LOGO_URL}
            alt="Safe Harbor Law Firm"
            width={300}
            height={80}
            className="mx-auto"
            unoptimized
          />
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Banner */}
          {isPaid ? (
            <div className="bg-green-500 text-white px-6 py-4 flex items-center justify-center gap-3">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-semibold">Payment Received - Thank You!</span>
            </div>
          ) : (
            <div className="bg-orange-400 text-white px-6 py-4 flex items-center justify-center gap-3">
              <Clock className="h-6 w-6" />
              <span className="text-lg font-semibold">Invoice - Payment Due</span>
            </div>
          )}

          {/* Invoice Header */}
          <div className="p-6 sm:p-8 border-b">
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">INVOICE</h1>
                <p className="text-gray-600 font-mono">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Issue Date</div>
                <div className="font-semibold text-gray-900">{formatDate(invoice.issueDate)}</div>
                {invoice.dueDate && (
                  <>
                    <div className="text-sm text-gray-500 mt-3 mb-1">Due Date</div>
                    <div className="font-semibold text-gray-900">{formatDate(invoice.dueDate)}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="p-6 sm:p-8 border-b bg-gray-50">
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Bill To</div>
            <div className="text-xl font-semibold text-gray-900">{contactName}</div>
            {contact?.email && (
              <div className="text-gray-600 mt-1">{contact.email}</div>
            )}
            {contact?.phone && (
              <div className="text-gray-600">{contact.phone}</div>
            )}
          </div>

          {/* Line Items */}
          <div className="p-6 sm:p-8">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 uppercase tracking-wide border-b">
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lineItems?.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 text-gray-900">{item.description}</td>
                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.amount)}</span>
                  </div>
                  {(invoice.amountPaid || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Amount Paid</span>
                      <span>-{formatCurrency(invoice.amountPaid || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Total {isPaid ? "Paid" : "Due"}</span>
                    <span className={isPaid ? "text-green-600" : "text-orange-500"}>
                      {formatCurrency(isPaid ? invoice.amount : balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-6 sm:px-8 pb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Notes</div>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Payment Button */}
          {!isPaid && invoice.paymentLink && (
            <div className="p-6 sm:p-8 bg-blue-50 border-t">
              <a
                href={invoice.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
              >
                Pay Now - {formatCurrency(balanceDue)}
                <ExternalLink className="h-5 w-5" />
              </a>
              <p className="text-center text-sm text-gray-500 mt-3">
                Secure payment powered by Confido Legal
              </p>
            </div>
          )}

          {/* Paid Receipt Footer */}
          {isPaid && (
            <div className="p-6 sm:p-8 bg-green-50 border-t text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-semibold">This invoice has been paid in full.</p>
              {invoice.paidDate && (
                <p className="text-green-600 text-sm mt-1">
                  Paid on {formatDate(invoice.paidDate)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p className="mt-1">Safe Harbor Law Firm</p>
        </div>
      </div>
    </div>
  );
}
