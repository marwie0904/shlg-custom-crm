'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
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
import { generateIntakePdf, generateIntakePdfFilename, downloadIntakePdf } from '@/lib/services/pdfService'
import { AlertCircle, CheckCircle2, ArrowLeft, Calendar, Download } from 'lucide-react'
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

// Success Data Type
interface SuccessData {
  intakeId: string
  appointmentId?: string
  // For PDF download
  formData: IntakeFormData
  appointmentInfo?: {
    staffName?: string
    meetingType?: string
    location?: string
    date?: string
    time?: string
  }
  isFormComplete: boolean
}

export default function NewIntakePage() {
  const router = useRouter()
  const createIntake = useMutation(api.intake.create)
  const createAppointment = useMutation(api.appointments.create)
  const linkIntakeToAppointment = useMutation(api.intake.linkToAppointment)

  const [formData, setFormData] = useState<IntakeFormData>(initialFormData)
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
  const [showIncompleteFormConfirm, setShowIncompleteFormConfirm] = useState(false)
  const [showNoContactConfirm, setShowNoContactConfirm] = useState(false)
  const [currentMissingFields, setCurrentMissingFields] = useState<string[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if contact info is missing (no email AND no phone)
    const hasContactInfo = formData.email?.trim() || formData.phone?.trim()

    // If no contact info, show confirmation popup
    if (!hasContactInfo) {
      setShowNoContactConfirm(true)
      return
    }

    // Check if form is incomplete
    const missingFields = getMissingFields(formData)
    const isFormComplete = missingFields.length === 0

    // If form is incomplete OR no appointment, show confirmation
    if (!isFormComplete || !selectedTime) {
      setCurrentMissingFields(missingFields)
      setShowIncompleteFormConfirm(true)
      return
    }

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

      // Build the intake data for Convex
      const intakeData = {
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

      // Create intake in Convex
      const intakeId = await createIntake(intakeData)

      // If appointment was scheduled, create appointment record
      let appointmentId = null
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

        appointmentId = await createAppointment({
          intakeId: intakeId,
          title: appointmentTitle,
          type: meetingType,
          practiceArea: formData.practiceArea || 'Other/Out of Practice Area',
          date: appointmentDateTimestamp,
          time: selectedTime,
          location: locationName,
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
          // Participant info from form
          participantFirstName: formData.firstName || undefined,
          participantLastName: formData.lastName || undefined,
          participantEmail: formData.email || undefined,
          participantPhone: formData.phone || undefined,
          // Calendar info (staff name as calendar for now)
          calendarId: selectedStaff.id,
          calendarName: `${selectedStaff.name}'s Calendar`,
          status: 'Scheduled',
        })

        // Link the appointment back to the intake
        await linkIntakeToAppointment({
          id: intakeId,
          appointmentId: appointmentId,
        })
      }

      // Prepare appointment info for success popup
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

      // Show success - intake is now a pending lead
      setSuccessData({
        intakeId: intakeId,
        appointmentId: appointmentId ? String(appointmentId) : undefined,
        formData: { ...formData },
        appointmentInfo: appointmentInfoForPdf,
        isFormComplete: status === 'complete',
      })
      setShowSuccessPopup(true)

      // Reset form
      setFormData(initialFormData)
      setSelectedStaff(null)
      setSelectedDate(null)
      setSelectedTime(null)
      setMeetingType('')
      setMeetingLocation('')
      setCalendarStep('staff')
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit form. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate button state
  const missingFields = getMissingFields(formData)
  const isFormComplete = missingFields.length === 0
  const hasAppointment = !!selectedTime

  // Determine button text and style
  let buttonText = 'Submit with Appointment'
  let buttonVariant: 'default' | 'secondary' | 'destructive' = 'default'
  let hintText = ''

  if (hasAppointment && isFormComplete) {
    buttonText = 'Submit with Appointment'
    buttonVariant = 'default'
  } else if (hasAppointment && !isFormComplete) {
    buttonText = 'Submit Incomplete Intake'
    buttonVariant = 'destructive'
  } else if (!hasAppointment && isFormComplete) {
    buttonText = 'Submit Without Appointment'
    buttonVariant = 'secondary'
    hintText = 'Book an appointment on the right panel, or submit without one'
  } else {
    buttonText = 'Submit Without Appointment & Incomplete Intake'
    buttonVariant = 'destructive'
    hintText = 'Book an appointment on the right panel, or submit without one'
  }

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Intake Form</h1>
            <p className="text-gray-500 mb-8">Please fill out the information below to get started</p>

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
                    buttonVariant === 'destructive' && 'bg-amber-500 hover:bg-amber-600',
                    buttonVariant === 'secondary' && 'bg-gray-500 hover:bg-gray-600 text-white'
                  )}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : buttonText}
                </Button>
                {hintText && (
                  <p className="text-center text-sm text-gray-500 mt-3">{hintText}</p>
                )}
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

        {/* Incomplete Form / No Appointment Confirmation Modal */}
        <Dialog open={showIncompleteFormConfirm} onOpenChange={setShowIncompleteFormConfirm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <DialogTitle className="text-center">
                {!selectedTime && currentMissingFields.length > 0
                  ? 'Submit Without Appointment & Incomplete Intake?'
                  : !selectedTime
                    ? 'Submit Without Appointment?'
                    : 'Submit Incomplete Intake?'}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-center">
                  {!selectedTime && (
                    <p className="mb-3 text-muted-foreground text-sm">You haven&apos;t selected an appointment time.</p>
                  )}
                  {currentMissingFields.length > 0 && (
                    <div className="text-left">
                      <p className="mb-3 text-muted-foreground text-sm">The following fields are missing:</p>
                      <ul className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                        {currentMissingFields.map((field, index) => (
                          <li key={index} className="text-amber-800 text-sm py-1 border-b border-amber-200 last:border-0">
                            <span className="text-amber-500 mr-2">•</span>
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 sm:justify-center">
              <Button
                variant="outline"
                onClick={() => setShowIncompleteFormConfirm(false)}
              >
                Go Back
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => {
                  setShowIncompleteFormConfirm(false)
                  submitForm()
                }}
              >
                Submit Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* No Contact Info Confirmation Modal */}
        <Dialog open={showNoContactConfirm} onOpenChange={setShowNoContactConfirm}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <DialogTitle className="text-center">Missing Contact Information</DialogTitle>
              <DialogDescription className="text-center">
                Email and phone number are missing. No contact will be created in GHL, but the form will be saved to the database.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 sm:justify-center">
              <Button
                variant="outline"
                onClick={() => setShowNoContactConfirm(false)}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowNoContactConfirm(false)
                  // Still check for appointment after contact warning
                  const missingFields = getMissingFields(formData)
                  if (!selectedTime || missingFields.length > 0) {
                    setCurrentMissingFields(missingFields)
                    setShowIncompleteFormConfirm(true)
                  } else {
                    submitForm()
                  }
                }}
              >
                Submit Without Contact Info
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Popup Modal */}
        <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <DialogTitle className="text-center">Intake Submitted Successfully!</DialogTitle>
              <DialogDescription asChild>
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-4">
                    {successData?.appointmentId
                      ? 'Intake and appointment have been saved. This lead is now pending review.'
                      : 'Intake has been saved. This lead is now pending review.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 my-4">
                    {/* Download PDF Button - always show if form was complete */}
                    {successData?.isFormComplete && successData?.formData && (
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          downloadIntakePdf(successData.formData, successData.appointmentInfo)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Intake PDF
                      </Button>
                    )}

                    {successData?.appointmentId && (
                      <Button
                        asChild
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <a
                          href={`/calendars?appointment=${successData.appointmentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          View Appointment
                        </a>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <Link href="/leads">
                        View in Leads
                      </Link>
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessPopup(false)
                  setSuccessData(null)
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
