'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { IntakeFormData } from '@/lib/intake-constants'
import { AlertTriangle, Info } from 'lucide-react'

interface PracticeAreaSectionProps {
  formData: IntakeFormData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleRadioChange: (name: string, value: string) => void
  handleCheckboxChange: (name: string, value: string, checked: boolean) => void
}

// Disclosure Box Component
function DisclosureBox({
  children,
  variant = 'warning',
}: {
  children: React.ReactNode
  variant?: 'warning' | 'info'
}) {
  const styles = {
    warning: 'bg-amber-50 border-amber-400 text-amber-900',
    info: 'bg-blue-50 border-blue-400 text-blue-900',
  }

  return (
    <div className={`p-4 rounded-lg border ${styles[variant]}`}>
      <div className="flex gap-3">
        {variant === 'warning' ? (
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
        ) : (
          <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
        )}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}

// Section Divider
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

// Estate Planning Section
export function EstatePlanningSection({
  formData,
  handleInputChange,
  handleRadioChange,
}: PracticeAreaSectionProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
      <SectionDivider title="Estate Planning Questions" />

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium text-gray-700 leading-relaxed">
            Many people come to us with different goals - some want to avoid probate, others want to protect their kids or handle a specific asset. What's something you'd like us to help you plan for? What would you like to get out of your estate plan?
          </Label>
          <Textarea
            name="ep_goals"
            value={formData.ep_goals}
            onChange={handleInputChange}
            className="mt-2"
            rows={4}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            Is the caller scheduling on behalf of the potential client?
          </Label>
          <RadioGroup
            value={formData.ep_callerScheduling}
            onValueChange={(value) => handleRadioChange('ep_callerScheduling', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="ep_callerScheduling_yes" />
              <Label htmlFor="ep_callerScheduling_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="ep_callerScheduling_no" />
              <Label htmlFor="ep_callerScheduling_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Are you a Florida Resident?</Label>
          <RadioGroup
            value={formData.ep_floridaResident}
            onValueChange={(value) => handleRadioChange('ep_floridaResident', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="ep_floridaResident_yes" />
              <Label htmlFor="ep_floridaResident_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="ep_floridaResident_no" />
              <Label htmlFor="ep_floridaResident_no" className="font-normal cursor-pointer">No</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No, but planning to become resident" id="ep_floridaResident_planning" />
              <Label htmlFor="ep_floridaResident_planning" className="font-normal cursor-pointer">
                No, but I am planning to become a resident within the next 12 months
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.ep_floridaResident === 'No' && (
          <DisclosureBox variant="warning">
            <p>Since our attorneys are only licensed in Florida, we focus on residents or those with property here. We're probably not the right fit just yet, but I can share a workshop where our founding attorney explains how to protect assets in Florida. When you're closer to becoming a resident, we'd love to meet with you.</p>
          </DisclosureBox>
        )}

        {formData.ep_floridaResident !== 'No' && (
          <>
            <div>
              <Label className="text-sm font-medium text-gray-700">Are you single or married?</Label>
              <RadioGroup
                value={formData.ep_maritalStatus}
                onValueChange={(value) => handleRadioChange('ep_maritalStatus', value)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="Single" id="ep_maritalStatus_single" />
                  <Label htmlFor="ep_maritalStatus_single" className="font-normal cursor-pointer">Single</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="Married" id="ep_maritalStatus_married" />
                  <Label htmlFor="ep_maritalStatus_married" className="font-normal cursor-pointer">Married</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.ep_maritalStatus === 'Married' && (
              <div className="ml-6">
                <Label className="text-sm font-medium text-gray-700">Are you and your spouse planning together?</Label>
                <RadioGroup
                  value={formData.ep_spousePlanningTogether}
                  onValueChange={(value) => handleRadioChange('ep_spousePlanningTogether', value)}
                  className="mt-2 flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="ep_spousePlanning_yes" />
                    <Label htmlFor="ep_spousePlanning_yes" className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="ep_spousePlanning_no" />
                    <Label htmlFor="ep_spousePlanning_no" className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-gray-700">Do you have children?</Label>
              <RadioGroup
                value={formData.ep_hasChildren}
                onValueChange={(value) => handleRadioChange('ep_hasChildren', value)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="Yes" id="ep_hasChildren_yes" />
                  <Label htmlFor="ep_hasChildren_yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="No" id="ep_hasChildren_no" />
                  <Label htmlFor="ep_hasChildren_no" className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Do you have existing documents?</Label>
              <RadioGroup
                value={formData.ep_hasExistingDocs}
                onValueChange={(value) => handleRadioChange('ep_hasExistingDocs', value)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="Yes" id="ep_hasExistingDocs_yes" />
                  <Label htmlFor="ep_hasExistingDocs_yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="No" id="ep_hasExistingDocs_no" />
                  <Label htmlFor="ep_hasExistingDocs_no" className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.ep_hasExistingDocs === 'Yes' && (
              <>
                <div className="ml-6">
                  <Label className="text-sm font-medium text-gray-700">Do you have a will or trust?</Label>
                  <RadioGroup
                    value={formData.ep_documents}
                    onValueChange={(value) => handleRadioChange('ep_documents', value)}
                    className="mt-2 flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Will" id="ep_documents_will" />
                      <Label htmlFor="ep_documents_will" className="font-normal cursor-pointer">Will</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Will and Trust" id="ep_documents_trust" />
                      <Label htmlFor="ep_documents_trust" className="font-normal cursor-pointer">Will and Trust</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.ep_documents === 'Will and Trust' && (
                  <div className="ml-12">
                    <Label className="text-sm font-medium text-gray-700">Is the trust funded?</Label>
                    <RadioGroup
                      value={formData.ep_isTrustFunded}
                      onValueChange={(value) => handleRadioChange('ep_isTrustFunded', value)}
                      className="mt-2 flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="ep_isTrustFunded_yes" />
                        <Label htmlFor="ep_isTrustFunded_yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="ep_isTrustFunded_no" />
                        <Label htmlFor="ep_isTrustFunded_no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {formData.ep_documents && (
                  <div className="ml-6">
                    <Label className="text-sm font-medium text-gray-700">
                      Are you hoping to update your documents, start from scratch, or just have your current documents reviewed?
                    </Label>
                    <RadioGroup
                      value={formData.ep_updateOrStartFresh}
                      onValueChange={(value) => handleRadioChange('ep_updateOrStartFresh', value)}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="Update Docs" id="ep_update" />
                        <Label htmlFor="ep_update" className="font-normal cursor-pointer">Update Docs</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="Start From Scratch" id="ep_scratch" />
                        <Label htmlFor="ep_scratch" className="font-normal cursor-pointer">Start From Scratch</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="Unsure" id="ep_unsure" />
                        <Label htmlFor="ep_unsure" className="font-normal cursor-pointer">Unsure</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// PBTA Section
export function PBTASection({
  formData,
  handleInputChange,
  handleRadioChange,
}: PracticeAreaSectionProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
      <SectionDivider title="PBTA Intake Questions" />

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Are there any disagreements among the beneficiaries that we should be aware of? (Listen closely for potential litigation concerns.)
          </Label>
          <RadioGroup
            value={formData.pbta_beneficiaryDisagreements}
            onValueChange={(value) => handleRadioChange('pbta_beneficiaryDisagreements', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="pbta_disagreements_yes" />
              <Label htmlFor="pbta_disagreements_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="pbta_disagreements_no" />
              <Label htmlFor="pbta_disagreements_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.pbta_beneficiaryDisagreements === 'Yes' && (
          <DisclosureBox variant="warning">
            <p className="font-semibold mb-2">REFER OUT: Our firm does not handle probate disputes or litigation. What I can do is refer you to a trusted litigation attorney if you'd like.</p>
            <div className="mt-3">
              <p className="font-semibold">ATTY MATTHEW A. LINDE</p>
              <p>LINDE, GOULD & ASSOCIATES</p>
              <p>(239) 939-7100</p>
            </div>
          </DisclosureBox>
        )}

        {formData.pbta_beneficiaryDisagreements === 'No' && (
          <>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Are the assets owned individually by the decedent or are they in a trust?
              </Label>
              <RadioGroup
                value={formData.pbta_assetOwnership}
                onValueChange={(value) => handleRadioChange('pbta_assetOwnership', value)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="In a trust" id="pbta_ownership_trust" />
                  <Label htmlFor="pbta_ownership_trust" className="font-normal cursor-pointer">In a trust</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="Owned individually" id="pbta_ownership_individual" />
                  <Label htmlFor="pbta_ownership_individual" className="font-normal cursor-pointer">Owned individually</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.pbta_assetOwnership === 'In a trust' && (
              <div className="ml-6">
                <Label className="text-sm font-medium text-gray-700">
                  Are all the assets owned individually by the decedent or are they in a trust?
                </Label>
                <RadioGroup
                  value={formData.pbta_allAssetsOwnership}
                  onValueChange={(value) => handleRadioChange('pbta_allAssetsOwnership', value)}
                  className="mt-2 flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="All in the trust" id="pbta_all_trust" />
                    <Label htmlFor="pbta_all_trust" className="font-normal cursor-pointer">All in the trust</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Some are owned individually" id="pbta_some_individual" />
                    <Label htmlFor="pbta_some_individual" className="font-normal cursor-pointer">Some are owned individually</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {formData.pbta_assetOwnership === 'Owned individually' && (
              <>
                <div className="ml-6">
                  <Label className="text-sm font-medium text-gray-700">Was there a will?</Label>
                  <RadioGroup
                    value={formData.pbta_hasWill}
                    onValueChange={(value) => handleRadioChange('pbta_hasWill', value)}
                    className="mt-2 flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="pbta_hasWill_yes" />
                      <Label htmlFor="pbta_hasWill_yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="pbta_hasWill_no" />
                      <Label htmlFor="pbta_hasWill_no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.pbta_hasWill === 'Yes' && (
                  <div className="ml-12">
                    <Label className="text-sm font-medium text-gray-700">Do you have access to the original will?</Label>
                    <RadioGroup
                      value={formData.pbta_accessToWill}
                      onValueChange={(value) => handleRadioChange('pbta_accessToWill', value)}
                      className="mt-2 flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="pbta_accessToWill_yes" />
                        <Label htmlFor="pbta_accessToWill_yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="pbta_accessToWill_no" />
                        <Label htmlFor="pbta_accessToWill_no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </>
            )}

            {formData.pbta_assetOwnership && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    If applicable, What assets need to go to probate or are there assets that does not have any beneficiaries listed?
                  </Label>
                  <Textarea
                    name="pbta_assetsForProbate"
                    value={formData.pbta_assetsForProbate}
                    onChange={handleInputChange}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Complete Name of Decedent</Label>
                  <Input
                    name="pbta_decedentFirstName"
                    value={formData.pbta_decedentFirstName}
                    onChange={handleInputChange}
                    className="mt-1.5"
                    placeholder="Full name of the decedent"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Date of Death of The Decedent</Label>
                  <Input
                    type="date"
                    name="pbta_dateOfDeath"
                    value={formData.pbta_dateOfDeath}
                    onChange={handleInputChange}
                    className="mt-1.5 max-w-[200px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Relationship With The Decedent</Label>
                  <Input
                    name="pbta_relationshipToDecedent"
                    value={formData.pbta_relationshipToDecedent}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>

                {formData.pbta_assetOwnership === 'In a trust' && (
                  <DisclosureBox variant="info">
                    <p className="font-semibold">Schedule 1 hour Trust Admin meeting with Pam or Helen.</p>
                  </DisclosureBox>
                )}

                {formData.pbta_assetOwnership === 'Owned individually' && (
                  <DisclosureBox variant="info">
                    <p className="font-semibold">Schedule 15-minute call with Jessica</p>
                  </DisclosureBox>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Medicaid Section
export function MedicaidSection({
  formData,
  handleInputChange,
  handleRadioChange,
}: PracticeAreaSectionProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
      <SectionDivider title="Medicaid Intake Questions" />

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium text-gray-700">What is your primary concern?</Label>
          <RadioGroup
            value={formData.medicaid_primaryConcern}
            onValueChange={(value) => handleRadioChange('medicaid_primaryConcern', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="I need help with applying for Medicaid." id="medicaid_applying" />
              <Label htmlFor="medicaid_applying" className="font-normal cursor-pointer">
                I need help with applying for Medicaid.
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="I need to protect my assets so I can qualify for Medicaid." id="medicaid_protect" />
              <Label htmlFor="medicaid_protect" className="font-normal cursor-pointer">
                I need to protect my assets so I can qualify for Medicaid.
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.medicaid_primaryConcern === 'I need help with applying for Medicaid.' && (
          <DisclosureBox variant="warning">
            <p>
              <strong>REFER OUT:</strong> We do not assist with Medicaid Applications directly. but we <strong>do create the legal documents</strong> that make Medicaid eligibility possible like a Qualified Income Trust, Power of Attorney, Advance Directive, etc.
            </p>
            <div className="mt-3">
              <p className="font-semibold">Amy McGarry</p>
              <p>239-945-3883</p>
              <a href="mailto:Amy@amymcgarrylaw.com" className="text-blue-600 hover:underline">
                Amy@amymcgarrylaw.com
              </a>
            </div>
          </DisclosureBox>
        )}

        {formData.medicaid_primaryConcern === 'I need to protect my assets so I can qualify for Medicaid.' && (
          <>
            <div>
              <Label className="text-sm font-medium text-gray-700">What assets are involved?</Label>
              <Textarea
                name="medicaid_assetsInvolved"
                value={formData.medicaid_assetsInvolved}
                onChange={handleInputChange}
                className="mt-2"
                rows={4}
                placeholder="Please describe the assets that need to be considered..."
              />
            </div>

            <DisclosureBox variant="info">
              <p className="font-semibold">Schedule a 30-minute call with Brea.</p>
            </DisclosureBox>
          </>
        )}
      </div>
    </div>
  )
}

// Deed Section
export function DeedSection({
  formData,
  handleRadioChange,
}: PracticeAreaSectionProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
      <SectionDivider title="Deed Intake Questions" />

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium text-gray-700">Specify the caller's concern.</Label>
          <RadioGroup
            value={formData.deed_concern}
            onValueChange={(value) => handleRadioChange('deed_concern', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Deed property into a trust" id="deed_into_trust" />
              <Label htmlFor="deed_into_trust" className="font-normal cursor-pointer">Deed property into a trust</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Deed property out of a trust" id="deed_out_trust" />
              <Label htmlFor="deed_out_trust" className="font-normal cursor-pointer">Deed property out of a trust</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Lady Bird Deed" id="deed_lady_bird" />
              <Label htmlFor="deed_lady_bird" className="font-normal cursor-pointer">Lady Bird Deed</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Caller does not have a trust and would like to seek counsel on whether they need a trust set up for my property." id="deed_counsel" />
              <Label htmlFor="deed_counsel" className="font-normal cursor-pointer">
                Caller does not have a trust and would like to seek counsel on whether they need a trust set up for my property.
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Other" id="deed_other" />
              <Label htmlFor="deed_other" className="font-normal cursor-pointer">Other</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            Caller does not have a trust and would like to seek counsel on whether they need a trust set up for my property.
          </Label>
          <RadioGroup
            value={formData.deed_needsTrustCounsel}
            onValueChange={(value) => handleRadioChange('deed_needsTrustCounsel', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="deed_needsTrust_yes" />
              <Label htmlFor="deed_needsTrust_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="deed_needsTrust_no" />
              <Label htmlFor="deed_needsTrust_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}

// Doc Review Section
export function DocReviewSection({
  formData,
  handleInputChange,
  handleRadioChange,
  handleCheckboxChange,
}: PracticeAreaSectionProps) {
  const documentOptions = ['Trust', 'Will', 'POA', 'Healthcare Directive', 'Other']

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-6">
      <SectionDivider title="Doc Review Intake Questions" />

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium text-gray-700">Are you a Florida Resident?</Label>
          <RadioGroup
            value={formData.docReview_floridaResident}
            onValueChange={(value) => handleRadioChange('docReview_floridaResident', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="docReview_fl_yes" />
              <Label htmlFor="docReview_fl_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="docReview_fl_no" />
              <Label htmlFor="docReview_fl_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            What legal advice or guidance are you seeking? (Please summarize the issue or concern.) List specific questions you'd like to ask the attorney:
          </Label>
          <Textarea
            name="docReview_legalAdvice"
            value={formData.docReview_legalAdvice}
            onChange={handleInputChange}
            className="mt-2"
            rows={4}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            Have there been any recent life changes or events that led you to reach out and seek advice now?
          </Label>
          <Textarea
            name="docReview_recentLifeChanges"
            value={formData.docReview_recentLifeChanges}
            onChange={handleInputChange}
            className="mt-2"
            rows={4}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            Are you the document owner? Or will the document owner be in the meeting room?
          </Label>
          <RadioGroup
            value={formData.docReview_isDocumentOwner}
            onValueChange={(value) => handleRadioChange('docReview_isDocumentOwner', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="docReview_owner_yes" />
              <Label htmlFor="docReview_owner_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="docReview_owner_no" />
              <Label htmlFor="docReview_owner_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">What is your relationship with the document owners?</Label>
          <Input
            name="docReview_relationshipWithOwners"
            value={formData.docReview_relationshipWithOwners}
            onChange={handleInputChange}
            className="mt-1.5"
            placeholder="e.g., Child, Spouse, Caregiver, etc."
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Are you a beneficiary or trustee?</Label>
          <RadioGroup
            value={formData.docReview_isBeneficiaryOrTrustee}
            onValueChange={(value) => handleRadioChange('docReview_isBeneficiaryOrTrustee', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Beneficiary" id="docReview_beneficiary" />
              <Label htmlFor="docReview_beneficiary" className="font-normal cursor-pointer">Beneficiary</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Trustee" id="docReview_trustee" />
              <Label htmlFor="docReview_trustee" className="font-normal cursor-pointer">Trustee</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Both" id="docReview_both" />
              <Label htmlFor="docReview_both" className="font-normal cursor-pointer">Both</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Neither" id="docReview_neither" />
              <Label htmlFor="docReview_neither" className="font-normal cursor-pointer">Neither</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            Do you have a Power of Attorney (POA) authorizing you to make changes?
          </Label>
          <RadioGroup
            value={formData.docReview_hasPOA}
            onValueChange={(value) => handleRadioChange('docReview_hasPOA', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="Yes" id="docReview_poa_yes" />
              <Label htmlFor="docReview_poa_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="No" id="docReview_poa_no" />
              <Label htmlFor="docReview_poa_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">What documents do you have?</Label>
          <div className="mt-2 space-y-2">
            {documentOptions.map((doc) => (
              <div key={doc} className="flex items-center space-x-3">
                <Checkbox
                  id={`docReview_doc_${doc}`}
                  checked={formData.docReview_documents.includes(doc)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('docReview_documents', doc, checked as boolean)
                  }
                />
                <Label htmlFor={`docReview_doc_${doc}`} className="font-normal cursor-pointer">
                  {doc}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            Is there any pending litigation related to the estate/trust?
          </Label>
          <RadioGroup
            value={formData.docReview_pendingLitigation}
            onValueChange={(value) => handleRadioChange('docReview_pendingLitigation', value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="yes" id="docReview_litigation_yes" />
              <Label htmlFor="docReview_litigation_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="no" id="docReview_litigation_no" />
              <Label htmlFor="docReview_litigation_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <DisclosureBox variant="warning">
          <h4 className="font-semibold mb-2">Read disclosures:</h4>
          <p className="text-sm leading-relaxed">
            Before I schedule your meeting please take note that: This is a paid document review / legal-advice meeting billed at our hourly rate. Payment is required to confirm the appointment. This 1-hour meeting will be used to briefly review your documents and discuss them during your appointment. If a more detailed or in-depth review is needed after your initial consultation, it will be billed at the attorney's standard hourly rate. This meeting does not mean the attorney is retained beyond this consultation. Booking this meeting does not establish formal representation. For the meeting to be productive and to give the attorney a full picture, please bring or send copies of your existing documents so they can be referenced during the meeting. If you cancel 24 hours or more before your appointment, we will refund the fee. Anything beyond, the fee is non-refundable.
          </p>
        </DisclosureBox>
      </div>
    </div>
  )
}
