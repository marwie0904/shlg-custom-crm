'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalendarPanel } from '@/components/intake/CalendarPanel'
import {
  EstatePlanningSection,
  PBTASection,
  MedicaidSection,
  DeedSection,
  DocReviewSection,
} from '@/components/intake/PracticeAreaSections'
import {
  practiceAreaOptions,
  referralSourceOptions,
  initialFormData,
  getMissingFields,
  type IntakeFormData,
} from '@/lib/intake-constants'
import { mapIntakeToContact, hasContactInfo } from '@/lib/services/contactService'
import { generateIntakePdf, generateIntakePdfFilename, downloadIntakePdf } from '@/lib/services/pdfService'
import { AlertCircle, CheckCircle2, ArrowLeft, Download } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Section Divider Component
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

export default function EditIntakePage() {
  const router = useRouter()
  const params = useParams()
  const intakeId = params.id as string

  // Fetch existing intake data
  const intakeData = useQuery(api.intake.getById, {
    id: intakeId as Id<"intake">
  })

  const updateIntake = useMutation(api.intake.update)
  const updateContact = useMutation(api.contacts.update)
  const createContact = useMutation(api.contacts.create)
  const createOpportunity = useMutation(api.opportunities.createFromIntake)
  const linkIntakeToContact = useMutation(api.intake.linkToContact)
  const linkIntakeToOpportunity = useMutation(api.intake.linkToOpportunity)
  const createAppointment = useMutation(api.appointments.create)
  const updateAppointment = useMutation(api.appointments.update)
  const linkIntakeToAppointment = useMutation(api.intake.linkToAppointment)
  const linkAppointmentToContact = useMutation(api.appointments.linkToContact)
  const linkAppointmentToOpportunity = useMutation(api.appointments.linkToOpportunity)
  const createDocumentForIntake = useMutation(api.documents.createForIntake)
  const linkDocumentToContact = useMutation(api.documents.linkToContact)
  const linkDocumentToOpportunity = useMutation(api.documents.linkToOpportunity)

  const [formData, setFormData] = useState<IntakeFormData>(initialFormData)
  const [isInitialized, setIsInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  // Calendar state
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null)
  const [meetingType, setMeetingType] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [calendarStep, setCalendarStep] = useState<'staff' | 'details' | 'date' | 'time'>('staff')

  // Modal states
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [savedFormData, setSavedFormData] = useState<IntakeFormData | null>(null)
  const [savedAppointmentInfo, setSavedAppointmentInfo] = useState<{
    staffName?: string
    meetingType?: string
    location?: string
    date?: string
    time?: string
  } | null>(null)

  // Initialize form with existing data
  useEffect(() => {
    if (intakeData && !isInitialized) {
      // Handle legacy 'Other' value that should be 'Other/Out of Practice Area'
      let practiceArea = intakeData.practiceArea || ''
      if (practiceArea === 'Other') {
        practiceArea = 'Other/Out of Practice Area'
      }

      setFormData({
        createPdf: intakeData.createPdf || '',
        practiceArea,
        callDetails: intakeData.callDetails || '',
        firstName: intakeData.firstName || '',
        middleName: intakeData.middleName || '',
        lastName: intakeData.lastName || '',
        email: intakeData.email || '',
        phone: intakeData.phone || '',
        streetAddress: intakeData.streetAddress || '',
        streetAddress2: intakeData.streetAddress2 || '',
        city: intakeData.city || '',
        state: intakeData.state || '',
        zipCode: intakeData.zipCode || '',
        country: intakeData.country || 'United States',
        referralSource: intakeData.referralSource || '',
        referralOther: intakeData.referralOther || '',
        // Estate Planning fields
        ep_goals: intakeData.ep_goals || '',
        ep_callerScheduling: intakeData.ep_callerScheduling || '',
        ep_clientJoinMeeting: intakeData.ep_clientJoinMeeting || '',
        ep_clientSoundMind: intakeData.ep_clientSoundMind || '',
        ep_callerFirstName: intakeData.ep_callerFirstName || '',
        ep_callerLastName: intakeData.ep_callerLastName || '',
        ep_callerPhone: intakeData.ep_callerPhone || '',
        ep_callerEmail: intakeData.ep_callerEmail || '',
        ep_floridaResident: intakeData.ep_floridaResident || '',
        ep_maritalStatus: intakeData.ep_maritalStatus || '',
        ep_spouseFirstName: intakeData.ep_spouseFirstName || '',
        ep_spouseLastName: intakeData.ep_spouseLastName || '',
        ep_spouseEmail: intakeData.ep_spouseEmail || '',
        ep_spousePhone: intakeData.ep_spousePhone || '',
        ep_spousePlanningTogether: intakeData.ep_spousePlanningTogether || '',
        ep_hasChildren: intakeData.ep_hasChildren || '',
        ep_hasExistingDocs: intakeData.ep_hasExistingDocs || '',
        ep_documents: intakeData.ep_documents || '',
        ep_isTrustFunded: intakeData.ep_isTrustFunded || '',
        ep_updateOrStartFresh: intakeData.ep_updateOrStartFresh || '',
        // PBTA fields
        pbta_beneficiaryDisagreements: intakeData.pbta_beneficiaryDisagreements || '',
        pbta_assetOwnership: intakeData.pbta_assetOwnership || '',
        pbta_allAssetsOwnership: intakeData.pbta_allAssetsOwnership || '',
        pbta_hasWill: intakeData.pbta_hasWill || '',
        pbta_accessToWill: intakeData.pbta_accessToWill || '',
        pbta_assetsForProbate: intakeData.pbta_assetsForProbate || '',
        pbta_decedentFirstName: intakeData.pbta_decedentFirstName || '',
        pbta_decedentLastName: intakeData.pbta_decedentLastName || '',
        pbta_dateOfDeath: intakeData.pbta_dateOfDeath || '',
        pbta_relationshipToDecedent: intakeData.pbta_relationshipToDecedent || '',
        // Medicaid fields
        medicaid_primaryConcern: intakeData.medicaid_primaryConcern || '',
        medicaid_assetsInvolved: intakeData.medicaid_assetsInvolved || '',
        // Deed fields
        deed_concern: intakeData.deed_concern || '',
        deed_needsTrustCounsel: intakeData.deed_needsTrustCounsel || '',
        // Doc Review fields
        docReview_floridaResident: intakeData.docReview_floridaResident || '',
        docReview_legalAdvice: intakeData.docReview_legalAdvice || '',
        docReview_recentLifeChanges: intakeData.docReview_recentLifeChanges || '',
        docReview_isDocumentOwner: intakeData.docReview_isDocumentOwner || '',
        docReview_relationshipWithOwners: intakeData.docReview_relationshipWithOwners || '',
        docReview_isBeneficiaryOrTrustee: intakeData.docReview_isBeneficiaryOrTrustee || '',
        docReview_hasPOA: intakeData.docReview_hasPOA || '',
        docReview_documents: intakeData.docReview_documents || [],
        docReview_pendingLitigation: intakeData.docReview_pendingLitigation || '',
      })

      // Set appointment data
      if (intakeData.appointmentStaffId && intakeData.appointmentStaffName) {
        setSelectedStaff({
          id: intakeData.appointmentStaffId,
          name: intakeData.appointmentStaffName,
        })
      }
      if (intakeData.appointmentMeetingType) {
        setMeetingType(intakeData.appointmentMeetingType)
      }
      if (intakeData.appointmentLocation) {
        setMeetingLocation(intakeData.appointmentLocation)
      }
      if (intakeData.appointmentDate) {
        // Convert date string (YYYY-MM-DD) to timestamp
        const dateTimestamp = new Date(intakeData.appointmentDate + 'T00:00:00').getTime()
        setSelectedDate(dateTimestamp)
      }
      if (intakeData.appointmentTime) {
        setSelectedTime(intakeData.appointmentTime)
      }
      // Determine calendar step based on existing data
      if (intakeData.appointmentTime) {
        setCalendarStep('time')
      } else if (intakeData.appointmentDate) {
        setCalendarStep('date')
      } else if (intakeData.appointmentMeetingType) {
        setCalendarStep('details')
      }

      setIsInitialized(true)
    }
  }, [intakeData, isInitialized])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle radio button changes
  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle checkbox changes for arrays
  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentValues = (prev[name as keyof IntakeFormData] as string[]) || []
      if (checked) {
        return { ...prev, [name]: [...currentValues, value] }
      } else {
        return { ...prev, [name]: currentValues.filter((v) => v !== value) }
      }
    })
  }

  // Handle form submission (update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitForm()
  }

  // Actual form submission
  const submitForm = async () => {
    setSubmitting(true)
    setSubmitResult(null)

    try {
      // Calculate missing fields and status
      const missingFieldsList = getMissingFields(formData)
      const status = missingFieldsList.length === 0 ? 'complete' : 'incomplete'

      // Build the intake data for Convex update
      const updateData = {
        id: intakeId as Id<"intake">,
        // Contact info
        firstName: formData.firstName || 'Unknown',
        lastName: formData.lastName || 'Unknown',
        middleName: formData.middleName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,

        // Address
        streetAddress: formData.streetAddress || undefined,
        streetAddress2: formData.streetAddress2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country || undefined,

        // Basic fields
        createPdf: formData.createPdf || undefined,
        practiceArea: formData.practiceArea || 'Other/Out of Practice Area',
        callDetails: formData.callDetails || undefined,
        referralSource: formData.referralSource || undefined,
        referralOther: formData.referralOther || undefined,

        // Estate Planning fields
        ep_goals: formData.ep_goals || undefined,
        ep_callerScheduling: formData.ep_callerScheduling || undefined,
        ep_clientJoinMeeting: formData.ep_clientJoinMeeting || undefined,
        ep_clientSoundMind: formData.ep_clientSoundMind || undefined,
        ep_callerFirstName: formData.ep_callerFirstName || undefined,
        ep_callerLastName: formData.ep_callerLastName || undefined,
        ep_callerPhone: formData.ep_callerPhone || undefined,
        ep_callerEmail: formData.ep_callerEmail || undefined,
        ep_floridaResident: formData.ep_floridaResident || undefined,
        ep_maritalStatus: formData.ep_maritalStatus || undefined,
        ep_spouseFirstName: formData.ep_spouseFirstName || undefined,
        ep_spouseLastName: formData.ep_spouseLastName || undefined,
        ep_spouseEmail: formData.ep_spouseEmail || undefined,
        ep_spousePhone: formData.ep_spousePhone || undefined,
        ep_spousePlanningTogether: formData.ep_spousePlanningTogether || undefined,
        ep_hasChildren: formData.ep_hasChildren || undefined,
        ep_hasExistingDocs: formData.ep_hasExistingDocs || undefined,
        ep_documents: formData.ep_documents || undefined,
        ep_isTrustFunded: formData.ep_isTrustFunded || undefined,
        ep_updateOrStartFresh: formData.ep_updateOrStartFresh || undefined,

        // PBTA fields
        pbta_beneficiaryDisagreements: formData.pbta_beneficiaryDisagreements || undefined,
        pbta_assetOwnership: formData.pbta_assetOwnership || undefined,
        pbta_allAssetsOwnership: formData.pbta_allAssetsOwnership || undefined,
        pbta_hasWill: formData.pbta_hasWill || undefined,
        pbta_accessToWill: formData.pbta_accessToWill || undefined,
        pbta_assetsForProbate: formData.pbta_assetsForProbate || undefined,
        pbta_decedentFirstName: formData.pbta_decedentFirstName || undefined,
        pbta_decedentLastName: formData.pbta_decedentLastName || undefined,
        pbta_dateOfDeath: formData.pbta_dateOfDeath || undefined,
        pbta_relationshipToDecedent: formData.pbta_relationshipToDecedent || undefined,

        // Medicaid fields
        medicaid_primaryConcern: formData.medicaid_primaryConcern || undefined,
        medicaid_assetsInvolved: formData.medicaid_assetsInvolved || undefined,

        // Deed fields
        deed_concern: formData.deed_concern || undefined,
        deed_needsTrustCounsel: formData.deed_needsTrustCounsel || undefined,

        // Doc Review fields
        docReview_floridaResident: formData.docReview_floridaResident || undefined,
        docReview_legalAdvice: formData.docReview_legalAdvice || undefined,
        docReview_recentLifeChanges: formData.docReview_recentLifeChanges || undefined,
        docReview_isDocumentOwner: formData.docReview_isDocumentOwner || undefined,
        docReview_relationshipWithOwners: formData.docReview_relationshipWithOwners || undefined,
        docReview_isBeneficiaryOrTrustee: formData.docReview_isBeneficiaryOrTrustee || undefined,
        docReview_hasPOA: formData.docReview_hasPOA || undefined,
        docReview_documents: formData.docReview_documents.length > 0 ? formData.docReview_documents : undefined,
        docReview_pendingLitigation: formData.docReview_pendingLitigation || undefined,

        // Appointment info
        appointmentStaffId: selectedStaff?.id || undefined,
        appointmentStaffName: selectedStaff?.name || undefined,
        appointmentMeetingType: meetingType || undefined,
        appointmentLocation: meetingLocation || undefined,
        appointmentDate: selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : undefined,
        appointmentTime: selectedTime || undefined,

        // Status
        status,
        missingFields: missingFieldsList.length > 0 ? missingFieldsList : undefined,
      }

      // Update intake in Convex
      await updateIntake(updateData)

      // Handle appointment creation/update
      let appointmentId = intakeData?.appointmentId
      if (selectedTime && selectedDate && selectedStaff) {
        // Get the location name from the location id
        const locationName = meetingLocation === 'naples' ? 'Naples' :
          meetingLocation === 'bonita' ? 'Bonita Springs' :
          meetingLocation === 'zoom' ? 'Zoom' :
          meetingLocation === 'phone' ? 'Phone Call' : meetingLocation

        // Build appointment title
        const clientName = formData.firstName && formData.lastName
          ? `${formData.firstName} ${formData.lastName}`
          : 'Unknown Client'
        const appointmentTitle = `${meetingType} - ${clientName}`

        // Create the appointment date timestamp
        const appointmentDateTimestamp = selectedDate

        if (intakeData?.appointmentId) {
          // Update existing appointment
          await updateAppointment({
            id: intakeData.appointmentId,
            title: appointmentTitle,
            type: meetingType,
            practiceArea: formData.practiceArea || 'Other/Out of Practice Area',
            date: appointmentDateTimestamp,
            time: selectedTime,
            location: locationName,
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            participantFirstName: formData.firstName || undefined,
            participantLastName: formData.lastName || undefined,
            participantEmail: formData.email || undefined,
            participantPhone: formData.phone || undefined,
            calendarId: selectedStaff.id,
            calendarName: `${selectedStaff.name}'s Calendar`,
          })
        } else {
          // Create new appointment and link to intake
          appointmentId = await createAppointment({
            intakeId: intakeId as Id<"intake">,
            title: appointmentTitle,
            type: meetingType,
            practiceArea: formData.practiceArea || 'Other/Out of Practice Area',
            date: appointmentDateTimestamp,
            time: selectedTime,
            location: locationName,
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            participantFirstName: formData.firstName || undefined,
            participantLastName: formData.lastName || undefined,
            participantEmail: formData.email || undefined,
            participantPhone: formData.phone || undefined,
            calendarId: selectedStaff.id,
            calendarName: `${selectedStaff.name}'s Calendar`,
            status: 'Scheduled',
          })

          // Link the appointment back to the intake
          await linkIntakeToAppointment({
            id: intakeId as Id<"intake">,
            appointmentId: appointmentId,
          })
        }
      }

      // Update or create contact if we have contact info
      let contactId = intakeData?.contactId
      if (hasContactInfo(formData.email, formData.phone)) {
        const contactData = mapIntakeToContact(formData, {
          source: 'Intake Form',
          tags: [formData.practiceArea].filter(Boolean),
        })

        if (intakeData?.contactId) {
          // Update existing contact
          await updateContact({
            id: intakeData.contactId,
            ...contactData,
          })
          contactId = intakeData.contactId
        } else {
          // Create new contact and link to intake
          contactId = await createContact({
            ...contactData,
            intakeId: intakeId as Id<"intake">, // Link contact to the intake that created it
          })
          await linkIntakeToContact({
            id: intakeId as Id<"intake">,
            contactId: contactId,
          })
        }

        // Link appointment to contact if both exist and appointment doesn't have contact yet
        if (appointmentId && contactId && !intakeData?.contactId) {
          await linkAppointmentToContact({
            id: appointmentId,
            contactId: contactId,
          })
        }

        // Create opportunity if contact was just created (no existing opportunity)
        if (contactId && !intakeData?.contactId && !intakeData?.opportunityId) {
          const contactFullName = `${formData.firstName || 'Unknown'} ${formData.lastName || 'Unknown'}`.trim()
          const opportunityId = await createOpportunity({
            contactId: contactId,
            contactFullName: contactFullName,
            appointmentDate: selectedDate || undefined,
            appointmentType: meetingType || undefined,
          })

          // Link opportunity to intake
          await linkIntakeToOpportunity({
            id: intakeId as Id<"intake">,
            opportunityId: opportunityId,
          })

          // Link opportunity to appointment (if appointment exists)
          if (appointmentId) {
            await linkAppointmentToOpportunity({
              id: appointmentId,
              opportunityId: opportunityId,
            })
          }
        }
      }

      // Auto-generate and upload PDF if form is now complete
      // Only generate if status changed to complete OR if user explicitly wants PDF
      const wasIncomplete = intakeData?.status === 'incomplete'
      const isNowComplete = status === 'complete'

      // Prepare appointment info for PDF
      const appointmentInfoForPdf = selectedTime && selectedDate && selectedStaff ? {
        staffName: selectedStaff.name,
        meetingType: meetingType,
        location: meetingLocation === 'naples' ? 'Naples' :
          meetingLocation === 'bonita' ? 'Bonita Springs' :
          meetingLocation === 'zoom' ? 'Zoom' :
          meetingLocation === 'phone' ? 'Phone Call' : meetingLocation,
        date: new Date(selectedDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: selectedTime,
      } : undefined

      // Save form data for potential PDF download
      setSavedFormData({ ...formData })
      setSavedAppointmentInfo(appointmentInfoForPdf || null)

      if (isNowComplete && (wasIncomplete || formData.createPdf === 'yes')) {
        try {
          const pdfBlob = generateIntakePdf(formData, appointmentInfoForPdf)
          const pdfFilename = generateIntakePdfFilename(formData)

          // Upload PDF to Convex storage
          const generateUploadUrlResponse = await fetch('/api/documents/upload-url', { method: 'POST' })
          if (generateUploadUrlResponse.ok) {
            const { uploadUrl } = await generateUploadUrlResponse.json()
            const uploadResponse = await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/pdf' },
              body: pdfBlob,
            })

            if (uploadResponse.ok) {
              const { storageId } = await uploadResponse.json()

              // Create document record for the PDF
              const pdfDocId = await createDocumentForIntake({
                intakeId: intakeId as Id<"intake">,
                name: pdfFilename,
                type: 'pdf',
                mimeType: 'application/pdf',
                size: pdfBlob.size,
                storageId: storageId as Id<"_storage">,
              })

              // Link PDF to contact and opportunity if they exist
              if (contactId) {
                await linkDocumentToContact({ id: pdfDocId, contactId: contactId })
              }
              if (intakeData?.opportunityId) {
                await linkDocumentToOpportunity({ id: pdfDocId, opportunityId: intakeData.opportunityId })
              }

              setPdfGenerated(true)
            }
          }
        } catch (pdfError) {
          console.error('Failed to auto-generate PDF:', pdfError)
          // Don't fail the update if PDF generation fails
        }
      }

      // Show success
      setShowSuccessPopup(true)
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update intake. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Not found state - check this first
  if (intakeData === null) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Intake not found</p>
            <Button asChild>
              <Link href="/intake">Back to Intake List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state - wait for both data fetch AND initialization
  if (intakeData === undefined || !isInitialized) {
    return (
      <div className="max-w-[1400px] mx-auto">
        {/* Back button skeleton */}
        <div className="mb-4">
          <Skeleton className="h-9 w-40" />
        </div>

        <div className="flex gap-8">
          {/* Left - Form Panel Skeleton */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Header with title and badge */}
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-96 mb-8" />

              {/* Create PDF Section */}
              <div className="mb-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="flex gap-6">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>

              {/* Practice Area */}
              <div className="mb-5">
                <Skeleton className="h-4 w-28 mb-1.5" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Call Details */}
              <div className="mb-5">
                <Skeleton className="h-4 w-24 mb-1.5" />
                <Skeleton className="h-24 w-full" />
              </div>

              {/* Section Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <Skeleton className="h-3 w-32" />
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-1.5" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-28 mb-1.5" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>

              {/* Section Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <Skeleton className="h-3 w-20" />
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Street Address */}
              <div className="mb-5">
                <Skeleton className="h-4 w-28 mb-1.5" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Street Address 2 */}
              <div className="mb-5">
                <Skeleton className="h-4 w-40 mb-1.5" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-16 mb-1.5" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Right - Info Panel Skeleton */}
          <Card className="w-[400px] flex-shrink-0">
            <CardContent className="p-6">
              {/* Appointment Section */}
              <div className="mb-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="mb-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              </div>

              {/* Opportunity Section */}
              <div>
                <Skeleton className="h-6 w-36 mb-4" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate button state
  const missingFields = getMissingFields(formData)
  const isFormComplete = missingFields.length === 0

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/intake">
            <ArrowLeft className="h-4 w-4" />
            Back to Intake List
          </Link>
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Left - Form Panel */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Edit Intake</h1>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {intakeId}
              </span>
            </div>
            <p className="text-gray-500 mb-8">Update the intake information below</p>

            {submitResult && (
              <div
                className={`p-4 rounded-lg mb-6 ${
                  submitResult.success
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {submitResult.message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Create PDF */}
              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700">Create PDF?</Label>
                <RadioGroup
                  value={formData.createPdf}
                  onValueChange={(value) => handleRadioChange('createPdf', value)}
                  className="mt-2 flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="createPdf_yes" />
                    <Label htmlFor="createPdf_yes" className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="createPdf_no" />
                    <Label htmlFor="createPdf_no" className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Practice Area */}
              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700">
                  Practice Area <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.practiceArea}
                  onValueChange={(value) => handleRadioChange('practiceArea', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select practice area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceAreaOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Call Details */}
              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700">Call Details</Label>
                <Textarea
                  name="callDetails"
                  value={formData.callDetails}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  rows={4}
                  placeholder="Enter any relevant details about the call..."
                />
              </div>

              <SectionDivider title="Contact Information" />

              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Middle Name</Label>
                  <Input
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1.5"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1.5"
                    placeholder="(000) 000-0000"
                  />
                </div>
              </div>

              <SectionDivider title="Address" />

              {/* Street Address */}
              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700">Street Address</Label>
                <Input
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  className="mt-1.5"
                />
              </div>

              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700">Street Address Line 2</Label>
                <Input
                  name="streetAddress2"
                  value={formData.streetAddress2}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  placeholder="Apt, Suite, Unit, etc. (optional)"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">City</Label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">State</Label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Zip & Country */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Zip Code</Label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleRadioChange('country', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SectionDivider title="Referral Information" />

              {/* Referral Source */}
              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700">How did you hear about us?</Label>
                <Select
                  value={formData.referralSource}
                  onValueChange={(value) => handleRadioChange('referralSource', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {referralSourceOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.referralSource === 'Others' && (
                <div className="mb-5">
                  <Label className="text-sm font-medium text-gray-700">Please specify</Label>
                  <Input
                    name="referralOther"
                    value={formData.referralOther}
                    onChange={handleInputChange}
                    className="mt-1.5"
                    placeholder="Tell us how you found us..."
                  />
                </div>
              )}

              {/* Practice Area Sections */}
              {formData.practiceArea === 'Estate Planning' && (
                <EstatePlanningSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleRadioChange={handleRadioChange}
                  handleCheckboxChange={handleCheckboxChange}
                />
              )}

              {formData.practiceArea === 'PBTA' && (
                <PBTASection
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleRadioChange={handleRadioChange}
                  handleCheckboxChange={handleCheckboxChange}
                />
              )}

              {formData.practiceArea === 'Medicaid' && (
                <MedicaidSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleRadioChange={handleRadioChange}
                  handleCheckboxChange={handleCheckboxChange}
                />
              )}

              {formData.practiceArea === 'Deed' && (
                <DeedSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleRadioChange={handleRadioChange}
                  handleCheckboxChange={handleCheckboxChange}
                />
              )}

              {formData.practiceArea === 'Doc Review' && (
                <DocReviewSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleRadioChange={handleRadioChange}
                  handleCheckboxChange={handleCheckboxChange}
                />
              )}

              {/* Submit Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  className={cn(
                    'w-full h-12 text-base font-semibold',
                    !isFormComplete && 'bg-amber-500 hover:bg-amber-600'
                  )}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isFormComplete ? 'Save Changes' : 'Save Incomplete Intake'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right - Calendar Panel */}
        <CalendarPanel
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          meetingType={meetingType}
          setMeetingType={setMeetingType}
          meetingLocation={meetingLocation}
          setMeetingLocation={setMeetingLocation}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          calendarStep={calendarStep}
          setCalendarStep={setCalendarStep}
        />

        {/* Success Popup Modal */}
        <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <DialogTitle className="text-center">Intake Updated Successfully!</DialogTitle>
              <DialogDescription asChild>
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-4">
                    Your changes have been saved.
                    {pdfGenerated && ' A PDF copy has been generated and saved.'}
                  </p>

                  {/* Download PDF Button - show if form is complete */}
                  {savedFormData && getMissingFields(savedFormData).length === 0 && (
                    <div className="flex flex-col gap-2 my-4">
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          if (savedFormData) {
                            downloadIntakePdf(savedFormData, savedAppointmentInfo || undefined)
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Intake PDF
                      </Button>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessPopup(false)
                  setPdfGenerated(false)
                  router.push('/intake')
                }}
                className="w-full"
              >
                Back to Intake List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
