import { jsPDF } from 'jspdf'
import { IntakeFormData } from '@/lib/intake-constants'

// ==========================================
// INVOICE PDF TYPES
// ==========================================

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoicePdfData {
  invoiceNumber: string
  name: string
  issueDate: number
  dueDate?: number
  status: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  opportunityTitle?: string
  lineItems: InvoiceLineItem[]
  amount: number
  amountPaid?: number
  notes?: string
  paymentLink?: string
}

interface AppointmentInfo {
  staffName?: string
  meetingType?: string
  location?: string
  date?: string
  time?: string
}

// Helper to format labels from camelCase/snake_case
function formatLabel(key: string): string {
  return key
    .replace(/^(ep_|pbta_|medicaid_|deed_|docReview_)/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

// Helper to format value for display
function formatValue(value: string | string[] | undefined): string {
  if (!value) return 'N/A'
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None'
  }
  return value
}

export function generateIntakePdf(
  formData: IntakeFormData,
  appointmentInfo?: AppointmentInfo
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // Header
  doc.setFillColor(59, 130, 246) // Blue
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Client Intake Form', margin, 22)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 30)

  yPos = 45
  doc.setTextColor(0, 0, 0)

  // Helper to add section header
  const addSectionHeader = (title: string) => {
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = margin
    }
    doc.setFillColor(243, 244, 246) // Gray-100
    doc.rect(margin, yPos, contentWidth, 8, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(55, 65, 81) // Gray-700
    doc.text(title, margin + 3, yPos + 5.5)
    yPos += 12
    doc.setTextColor(0, 0, 0)
  }

  // Helper to add field
  const addField = (label: string, value: string | undefined) => {
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = margin
    }
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(107, 114, 128) // Gray-500
    doc.text(label, margin, yPos)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(17, 24, 39) // Gray-900
    const displayValue = formatValue(value)

    // Handle long text with wrapping
    const lines = doc.splitTextToSize(displayValue, contentWidth - 60)
    doc.text(lines, margin + 50, yPos)
    yPos += Math.max(6, lines.length * 5) + 2
  }

  // Helper to add multi-line text field
  const addTextBlock = (label: string, value: string | undefined) => {
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(107, 114, 128)
    doc.text(label, margin, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(17, 24, 39)
    const displayValue = formatValue(value)
    const lines = doc.splitTextToSize(displayValue, contentWidth)
    doc.text(lines, margin, yPos)
    yPos += lines.length * 5 + 4
  }

  // Practice Area Badge
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text(`Practice Area: ${formData.practiceArea || 'Not specified'}`, margin, yPos)
  yPos += 10

  // Client Information Section
  addSectionHeader('Client Information')
  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(' ') || 'N/A'
  addField('Full Name', fullName)
  addField('Email', formData.email)
  addField('Phone', formData.phone)
  yPos += 3

  // Address Section
  addSectionHeader('Address')
  addField('Street', formData.streetAddress)
  if (formData.streetAddress2) {
    addField('Street Line 2', formData.streetAddress2)
  }
  const cityStateZip = [formData.city, formData.state, formData.zipCode]
    .filter(Boolean)
    .join(', ')
  addField('City/State/Zip', cityStateZip || undefined)
  addField('Country', formData.country)
  yPos += 3

  // Referral Information
  addSectionHeader('Referral Information')
  addField('Referral Source', formData.referralSource)
  if (formData.referralSource === 'Others' && formData.referralOther) {
    addField('Other Details', formData.referralOther)
  }
  yPos += 3

  // Call Details
  if (formData.callDetails) {
    addSectionHeader('Call Details')
    addTextBlock('Notes', formData.callDetails)
    yPos += 3
  }

  // Appointment Information
  if (appointmentInfo && (appointmentInfo.date || appointmentInfo.time)) {
    addSectionHeader('Appointment')
    addField('Staff Member', appointmentInfo.staffName)
    addField('Meeting Type', appointmentInfo.meetingType)
    addField('Location', appointmentInfo.location)
    addField('Date', appointmentInfo.date)
    addField('Time', appointmentInfo.time)
    yPos += 3
  }

  // Practice Area Specific Sections
  const practiceArea = formData.practiceArea?.toLowerCase()

  if (practiceArea === 'estate planning') {
    addSectionHeader('Estate Planning Details')
    addTextBlock('Goals', formData.ep_goals)
    addField('Caller Scheduling', formData.ep_callerScheduling)
    if (formData.ep_callerScheduling === 'Yes') {
      addField('Client Join Meeting', formData.ep_clientJoinMeeting)
      addField('Client Sound Mind', formData.ep_clientSoundMind)
      addField('Caller Name', `${formData.ep_callerFirstName} ${formData.ep_callerLastName}`.trim() || undefined)
      addField('Caller Phone', formData.ep_callerPhone)
      addField('Caller Email', formData.ep_callerEmail)
    }
    addField('Florida Resident', formData.ep_floridaResident)
    addField('Marital Status', formData.ep_maritalStatus)
    if (formData.ep_maritalStatus === 'Married') {
      addField('Spouse Name', `${formData.ep_spouseFirstName} ${formData.ep_spouseLastName}`.trim() || undefined)
      addField('Spouse Email', formData.ep_spouseEmail)
      addField('Spouse Phone', formData.ep_spousePhone)
      addField('Planning Together', formData.ep_spousePlanningTogether)
    }
    addField('Has Children', formData.ep_hasChildren)
    addField('Has Existing Docs', formData.ep_hasExistingDocs)
    if (formData.ep_hasExistingDocs === 'Yes') {
      addField('Documents', formData.ep_documents)
      addField('Trust Funded', formData.ep_isTrustFunded)
      addField('Update or Start Fresh', formData.ep_updateOrStartFresh)
    }
  }

  if (practiceArea === 'pbta') {
    addSectionHeader('Probate/Trust Administration Details')
    addField('Decedent Name', `${formData.pbta_decedentFirstName} ${formData.pbta_decedentLastName}`.trim() || undefined)
    addField('Date of Death', formData.pbta_dateOfDeath)
    addField('Relationship', formData.pbta_relationshipToDecedent)
    addField('Beneficiary Disagreements', formData.pbta_beneficiaryDisagreements)
    addField('Asset Ownership', formData.pbta_assetOwnership)
    if (formData.pbta_assetOwnership === 'Multiple people') {
      addField('All Assets Ownership', formData.pbta_allAssetsOwnership)
    }
    addField('Has Will', formData.pbta_hasWill)
    if (formData.pbta_hasWill === 'Yes') {
      addField('Access to Will', formData.pbta_accessToWill)
    }
    addField('Assets for Probate', formData.pbta_assetsForProbate)
  }

  if (practiceArea === 'medicaid') {
    addSectionHeader('Medicaid Details')
    addTextBlock('Primary Concern', formData.medicaid_primaryConcern)
    addTextBlock('Assets Involved', formData.medicaid_assetsInvolved)
  }

  if (practiceArea === 'deed') {
    addSectionHeader('Deed Details')
    addTextBlock('Concern', formData.deed_concern)
    addField('Needs Trust Counsel', formData.deed_needsTrustCounsel)
  }

  if (practiceArea === 'doc review') {
    addSectionHeader('Document Review Details')
    addField('Florida Resident', formData.docReview_floridaResident)
    addTextBlock('Legal Advice Sought', formData.docReview_legalAdvice)
    addField('Recent Life Changes', formData.docReview_recentLifeChanges)
    addField('Document Owner', formData.docReview_isDocumentOwner)
    if (formData.docReview_isDocumentOwner === 'No') {
      addField('Relationship w/ Owners', formData.docReview_relationshipWithOwners)
    }
    addField('Beneficiary/Trustee', formData.docReview_isBeneficiaryOrTrustee)
    addField('Has POA', formData.docReview_hasPOA)
    addField('Documents', formData.docReview_documents?.join(', '))
    addField('Pending Litigation', formData.docReview_pendingLitigation)
  }

  // Footer on last page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175) // Gray-400
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    )
    doc.text(
      'SHLF Law Firm - Confidential',
      margin,
      pageHeight - 10
    )
  }

  return doc.output('blob')
}

// Generate filename for intake PDF
export function generateIntakePdfFilename(formData: IntakeFormData): string {
  const clientName = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .join('_')
    .replace(/\s+/g, '_') || 'Unknown'
  const date = new Date().toISOString().split('T')[0]
  const practiceArea = (formData.practiceArea || 'General')
    .replace(/[^a-zA-Z0-9]/g, '_')
  return `Intake_${clientName}_${practiceArea}_${date}.pdf`
}

// Download PDF directly in browser
export function downloadIntakePdf(
  formData: IntakeFormData,
  appointmentInfo?: AppointmentInfo
): void {
  const blob = generateIntakePdf(formData, appointmentInfo)
  const filename = generateIntakePdfFilename(formData)

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==========================================
// INVOICE PDF GENERATION
// ==========================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatInvoiceDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateInvoicePdf(data: InvoicePdfData): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // Header with brand color
  doc.setFillColor(251, 146, 60) // Orange-400
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', margin, 28)

  // Invoice number on right side of header
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.invoiceNumber, pageWidth - margin, 20, { align: 'right' })

  // Status badge
  doc.setFontSize(10)
  doc.text(`Status: ${data.status}`, pageWidth - margin, 32, { align: 'right' })

  yPos = 55
  doc.setTextColor(0, 0, 0)

  // Company Info (Left) & Invoice Details (Right)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('FROM', margin, yPos)
  doc.text('INVOICE DETAILS', pageWidth - margin - 60, yPos)

  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(12)
  doc.text('SHLF Law Firm', margin, yPos)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)

  // Invoice details on right
  doc.text('Issue Date:', pageWidth - margin - 60, yPos)
  doc.setTextColor(17, 24, 39)
  doc.text(formatInvoiceDate(data.issueDate), pageWidth - margin, yPos, { align: 'right' })

  yPos += 6
  if (data.dueDate) {
    doc.setTextColor(107, 114, 128)
    doc.text('Due Date:', pageWidth - margin - 60, yPos)
    doc.setTextColor(17, 24, 39)
    doc.text(formatInvoiceDate(data.dueDate), pageWidth - margin, yPos, { align: 'right' })
    yPos += 6
  }

  yPos += 8

  // Bill To Section
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('BILL TO', margin, yPos)

  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(12)
  doc.text(data.contactName, margin, yPos)

  yPos += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)

  if (data.contactEmail) {
    doc.text(data.contactEmail, margin, yPos)
    yPos += 5
  }
  if (data.contactPhone) {
    doc.text(data.contactPhone, margin, yPos)
    yPos += 5
  }
  if (data.contactAddress) {
    const addressLines = doc.splitTextToSize(data.contactAddress, contentWidth / 2)
    doc.text(addressLines, margin, yPos)
    yPos += addressLines.length * 5
  }

  if (data.opportunityTitle) {
    yPos += 3
    doc.setTextColor(107, 114, 128)
    doc.text(`Matter: ${data.opportunityTitle}`, margin, yPos)
  }

  yPos += 15

  // Line Items Table
  // Table Header
  doc.setFillColor(249, 250, 251) // Gray-50
  doc.rect(margin, yPos, contentWidth, 10, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)

  const col1 = margin + 3
  const col2 = margin + 90
  const col3 = margin + 115
  const col4 = margin + 145

  doc.text('DESCRIPTION', col1, yPos + 7)
  doc.text('QTY', col2, yPos + 7)
  doc.text('PRICE', col3, yPos + 7)
  doc.text('AMOUNT', col4, yPos + 7)

  yPos += 14

  // Table Body
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(10)

  data.lineItems.forEach((item) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = margin
    }

    const descLines = doc.splitTextToSize(item.description, 80)
    doc.text(descLines, col1, yPos)
    doc.text(item.quantity.toString(), col2, yPos)
    doc.text(formatCurrency(item.unitPrice), col3, yPos)
    doc.text(formatCurrency(item.total), col4, yPos)

    yPos += Math.max(7, descLines.length * 5) + 3

    // Light divider line
    doc.setDrawColor(229, 231, 235)
    doc.line(margin, yPos - 1, margin + contentWidth, yPos - 1)
  })

  yPos += 10

  // Totals Section
  const totalsX = pageWidth - margin - 70

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('Subtotal:', totalsX, yPos)
  doc.setTextColor(17, 24, 39)
  doc.text(formatCurrency(data.amount), pageWidth - margin, yPos, { align: 'right' })

  if (data.amountPaid && data.amountPaid > 0) {
    yPos += 7
    doc.setTextColor(107, 114, 128)
    doc.text('Amount Paid:', totalsX, yPos)
    doc.setTextColor(34, 197, 94) // Green
    doc.text(`-${formatCurrency(data.amountPaid)}`, pageWidth - margin, yPos, { align: 'right' })
  }

  yPos += 10

  // Total Due box
  doc.setFillColor(251, 146, 60) // Orange-400
  doc.rect(totalsX - 5, yPos - 5, 75, 12, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.text('TOTAL DUE:', totalsX, yPos + 3)

  const balanceDue = data.amount - (data.amountPaid || 0)
  doc.text(formatCurrency(balanceDue), pageWidth - margin, yPos + 3, { align: 'right' })

  yPos += 20

  // Notes Section
  if (data.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('NOTES', margin, yPos)

    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99)
    doc.setFontSize(9)
    const noteLines = doc.splitTextToSize(data.notes, contentWidth)
    doc.text(noteLines, margin, yPos)
    yPos += noteLines.length * 5 + 5
  }

  // Payment Link
  if (data.paymentLink) {
    yPos += 5
    doc.setFillColor(239, 246, 255) // Blue-50
    doc.rect(margin, yPos - 3, contentWidth, 15, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.setFontSize(10)
    doc.text('Pay Online:', margin + 5, yPos + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.textWithLink(data.paymentLink, margin + 35, yPos + 5, { url: data.paymentLink })
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' })
  doc.text('SHLF Law Firm', pageWidth / 2, pageHeight - 10, { align: 'center' })

  return doc.output('blob')
}

// Generate filename for invoice PDF
export function generateInvoicePdfFilename(invoiceNumber: string, contactName: string): string {
  const safeName = contactName.replace(/[^a-zA-Z0-9]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  return `Invoice_${invoiceNumber}_${safeName}_${date}.pdf`
}

// Download invoice PDF directly in browser
export function downloadInvoicePdf(data: InvoicePdfData): void {
  const blob = generateInvoicePdf(data)
  const filename = generateInvoicePdfFilename(data.invoiceNumber, data.contactName)

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
