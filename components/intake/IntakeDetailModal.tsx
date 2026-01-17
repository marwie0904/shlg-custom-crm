'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Trash2,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { downloadIntakePdf, generateIntakePdf } from '@/lib/services/pdfService'
import { IntakeFormData, getMissingFields } from '@/lib/intake-constants'

interface IntakeDetailModalProps {
  intakeId: string | null
  isOpen: boolean
  onClose: () => void
}

export function IntakeDetailModal({ intakeId, isOpen, onClose }: IntakeDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const intake = useQuery(
    api.intake.getWithRelated,
    intakeId ? { id: intakeId as Id<'intake'> } : 'skip'
  )

  const deleteIntake = useMutation(api.intake.remove)

  const handleDelete = async () => {
    if (!intakeId || !confirm('Are you sure you want to delete this intake submission?')) return

    setIsDeleting(true)
    try {
      await deleteIntake({ id: intakeId as Id<'intake'> })
      onClose()
    } catch (error) {
      console.error('Failed to delete intake:', error)
      alert('Failed to delete intake. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!intake) return

    // Build form data from intake
    const formData: IntakeFormData = {
      createPdf: intake.createPdf || '',
      practiceArea: intake.practiceArea || '',
      callDetails: intake.callDetails || '',
      firstName: intake.firstName || '',
      middleName: intake.middleName || '',
      lastName: intake.lastName || '',
      email: intake.email || '',
      phone: intake.phone || '',
      streetAddress: intake.streetAddress || '',
      streetAddress2: intake.streetAddress2 || '',
      city: intake.city || '',
      state: intake.state || '',
      zipCode: intake.zipCode || '',
      country: intake.country || '',
      referralSource: intake.referralSource || '',
      referralOther: intake.referralOther || '',
      // Estate Planning fields
      ep_goals: intake.ep_goals || '',
      ep_callerScheduling: intake.ep_callerScheduling || '',
      ep_clientJoinMeeting: intake.ep_clientJoinMeeting || '',
      ep_clientSoundMind: intake.ep_clientSoundMind || '',
      ep_callerFirstName: intake.ep_callerFirstName || '',
      ep_callerLastName: intake.ep_callerLastName || '',
      ep_callerPhone: intake.ep_callerPhone || '',
      ep_callerEmail: intake.ep_callerEmail || '',
      ep_floridaResident: intake.ep_floridaResident || '',
      ep_maritalStatus: intake.ep_maritalStatus || '',
      ep_spouseFirstName: intake.ep_spouseFirstName || '',
      ep_spouseLastName: intake.ep_spouseLastName || '',
      ep_spouseEmail: intake.ep_spouseEmail || '',
      ep_spousePhone: intake.ep_spousePhone || '',
      ep_spousePlanningTogether: intake.ep_spousePlanningTogether || '',
      ep_hasChildren: intake.ep_hasChildren || '',
      ep_hasExistingDocs: intake.ep_hasExistingDocs || '',
      ep_documents: intake.ep_documents || '',
      ep_isTrustFunded: intake.ep_isTrustFunded || '',
      ep_updateOrStartFresh: intake.ep_updateOrStartFresh || '',
      // PBTA fields
      pbta_beneficiaryDisagreements: intake.pbta_beneficiaryDisagreements || '',
      pbta_assetOwnership: intake.pbta_assetOwnership || '',
      pbta_allAssetsOwnership: intake.pbta_allAssetsOwnership || '',
      pbta_hasWill: intake.pbta_hasWill || '',
      pbta_accessToWill: intake.pbta_accessToWill || '',
      pbta_assetsForProbate: intake.pbta_assetsForProbate || '',
      pbta_decedentFirstName: intake.pbta_decedentFirstName || '',
      pbta_decedentLastName: intake.pbta_decedentLastName || '',
      pbta_dateOfDeath: intake.pbta_dateOfDeath || '',
      pbta_relationshipToDecedent: intake.pbta_relationshipToDecedent || '',
      // Medicaid fields
      medicaid_primaryConcern: intake.medicaid_primaryConcern || '',
      medicaid_assetsInvolved: intake.medicaid_assetsInvolved || '',
      // Deed fields
      deed_concern: intake.deed_concern || '',
      deed_needsTrustCounsel: intake.deed_needsTrustCounsel || '',
      // Doc Review fields
      docReview_floridaResident: intake.docReview_floridaResident || '',
      docReview_legalAdvice: intake.docReview_legalAdvice || '',
      docReview_recentLifeChanges: intake.docReview_recentLifeChanges || '',
      docReview_isDocumentOwner: intake.docReview_isDocumentOwner || '',
      docReview_relationshipWithOwners: intake.docReview_relationshipWithOwners || '',
      docReview_isBeneficiaryOrTrustee: intake.docReview_isBeneficiaryOrTrustee || '',
      docReview_hasPOA: intake.docReview_hasPOA || '',
      docReview_documents: intake.docReview_documents || [],
      docReview_pendingLitigation: intake.docReview_pendingLitigation || '',
    }

    // Build appointment info
    const appointmentInfo = intake.appointmentDate && intake.appointmentTime ? {
      staffName: intake.appointmentStaffName,
      meetingType: intake.appointmentMeetingType,
      location: intake.appointmentLocation,
      date: intake.appointmentDate,
      time: intake.appointmentTime,
    } : undefined

    downloadIntakePdf(formData, appointmentInfo)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Loading state
  if (isOpen && intake === undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Not found state
  if (isOpen && intake === null) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Intake Not Found</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>The requested intake submission could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!intake) return null

  const isComplete = intake.status === 'complete'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">
                {intake.firstName} {intake.lastName}
              </DialogTitle>
              <Badge variant="outline">{intake.practiceArea}</Badge>
              {isComplete ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Incomplete
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {intake.firstName} {intake.middleName && `${intake.middleName} `}{intake.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{intake.email || <span className="text-muted-foreground italic">No email</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{intake.phone || <span className="text-muted-foreground italic">No phone</span>}</span>
              </div>
              {(intake.streetAddress || intake.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {[intake.streetAddress, intake.streetAddress2, intake.city, intake.state, intake.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Appointment Information */}
          {intake.appointmentDate && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Appointment
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {intake.appointmentDate} at {intake.appointmentTime}
                    </span>
                  </div>
                  {intake.appointmentMeetingType && (
                    <div className="text-sm text-muted-foreground">
                      Type: {intake.appointmentMeetingType}
                    </div>
                  )}
                  {intake.appointmentStaffName && (
                    <div className="text-sm text-muted-foreground">
                      Staff: {intake.appointmentStaffName}
                    </div>
                  )}
                  {intake.appointmentLocation && (
                    <div className="text-sm text-muted-foreground">
                      Location: {intake.appointmentLocation}
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Call Details */}
          {intake.callDetails && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Call Details
                </h3>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                  {intake.callDetails}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Practice Area Specific Info */}
          {intake.practiceArea === 'Estate Planning' && (intake.ep_goals || intake.ep_floridaResident) && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Estate Planning Details
                </h3>
                <div className="space-y-2 text-sm">
                  {intake.ep_goals && (
                    <div>
                      <span className="font-medium">Goals:</span>{' '}
                      <span className="text-muted-foreground">{intake.ep_goals}</span>
                    </div>
                  )}
                  {intake.ep_floridaResident && (
                    <div>
                      <span className="font-medium">Florida Resident:</span>{' '}
                      <span className="text-muted-foreground">{intake.ep_floridaResident}</span>
                    </div>
                  )}
                  {intake.ep_maritalStatus && (
                    <div>
                      <span className="font-medium">Marital Status:</span>{' '}
                      <span className="text-muted-foreground">{intake.ep_maritalStatus}</span>
                    </div>
                  )}
                  {intake.ep_hasChildren && (
                    <div>
                      <span className="font-medium">Has Children:</span>{' '}
                      <span className="text-muted-foreground">{intake.ep_hasChildren}</span>
                    </div>
                  )}
                  {intake.ep_hasExistingDocs && (
                    <div>
                      <span className="font-medium">Has Existing Documents:</span>{' '}
                      <span className="text-muted-foreground">{intake.ep_hasExistingDocs}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {intake.practiceArea === 'PBTA' && (intake.pbta_decedentFirstName || intake.pbta_relationshipToDecedent) && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  PBTA Details
                </h3>
                <div className="space-y-2 text-sm">
                  {intake.pbta_decedentFirstName && (
                    <div>
                      <span className="font-medium">Decedent:</span>{' '}
                      <span className="text-muted-foreground">
                        {intake.pbta_decedentFirstName} {intake.pbta_decedentLastName}
                      </span>
                    </div>
                  )}
                  {intake.pbta_dateOfDeath && (
                    <div>
                      <span className="font-medium">Date of Death:</span>{' '}
                      <span className="text-muted-foreground">{intake.pbta_dateOfDeath}</span>
                    </div>
                  )}
                  {intake.pbta_relationshipToDecedent && (
                    <div>
                      <span className="font-medium">Relationship:</span>{' '}
                      <span className="text-muted-foreground">{intake.pbta_relationshipToDecedent}</span>
                    </div>
                  )}
                  {intake.pbta_hasWill && (
                    <div>
                      <span className="font-medium">Has Will:</span>{' '}
                      <span className="text-muted-foreground">{intake.pbta_hasWill}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {intake.practiceArea === 'Medicaid' && intake.medicaid_primaryConcern && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Medicaid Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Primary Concern:</span>{' '}
                    <span className="text-muted-foreground">{intake.medicaid_primaryConcern}</span>
                  </div>
                  {intake.medicaid_assetsInvolved && (
                    <div>
                      <span className="font-medium">Assets Involved:</span>{' '}
                      <span className="text-muted-foreground">{intake.medicaid_assetsInvolved}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Missing Fields */}
          {intake.missingFields && intake.missingFields.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3">
                  Missing Fields
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                    {intake.missingFields.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Linked Records */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Linked Records
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {intake.contact ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/contacts/${intake.contactId}`}>
                    <User className="h-4 w-4 mr-2" />
                    View Contact
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <User className="h-4 w-4 mr-2" />
                  No Contact Linked
                </Button>
              )}
              {intake.opportunity ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/opportunities?id=${intake.opportunityId}`}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Opportunity
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Briefcase className="h-4 w-4 mr-2" />
                  No Opportunity Linked
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            <div>Created: {formatDateTime(intake.createdAt)}</div>
            <div>Updated: {formatDateTime(intake.updatedAt)}</div>
            {intake.referralSource && <div>Referral Source: {intake.referralSource}</div>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <div className="flex items-center gap-2">
            {isComplete && (
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={`/intake/${intakeId}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Intake
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
