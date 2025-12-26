import { NextRequest, NextResponse } from "next/server";

const MAKE_WEBHOOK_URL = process.env.MAKE_APPOINTMENT_EMAIL_WEBHOOK;
const LOGO_URL = 'https://storage.googleapis.com/msgsndr/afYLuZPi37CZR1IpJlfn/media/68f107369d906785d9458314.png';

// JotForm link for Personal and Financial Information form
const JOTFORM_LINK = 'https://form.jotform.com/252972444974066';

// Workshop registration link
const WORKSHOP_LINK = 'https://safeharborlaw.mykajabi.com/offers/4G46XzDJ/checkout';

// Brochure PDF download link
const BROCHURE_LINK = 'https://storage.googleapis.com/msgsndr/afYLuZPi37CZR1IpJlfn/media/6929c210850cc4f85b2e7a03.pdf';

// Estate Questionnaire link for Probate Discovery Calls
const ESTATE_QUESTIONNAIRE_LINK = '[ESTATE_QUESTIONNAIRE_LINK]';

// Trust Admin Questionnaire link
const TRUST_ADMIN_QUESTIONNAIRE_LINK = '[TRUST_ADMIN_QUESTIONNAIRE_LINK]';

// Office addresses by meeting location
const MEETING_LOCATIONS: Record<string, { address: string; type: string }> = {
  'Naples': {
    address: '4500 Executive Drive, Suite 100, Naples, FL 34119',
    type: 'in-person'
  },
  'Bonita Springs': {
    address: '27821 Tamiami Trail, Suite 2, Bonita Springs, FL 34134',
    type: 'in-person'
  },
  'Fort Myers': {
    address: 'Summerlin Commons Blvd, Fort Myers, FL 33907',
    type: 'in-person'
  },
  'Zoom': {
    address: '[ZOOM LINK - Dynamic or Static TBD]',
    type: 'virtual'
  }
};

// Meeting types that trigger different email templates
const EMAIL_TRIGGER_MEETING_TYPES = [
  'Initial Meeting',
  'Vision Meeting',
  'Standalone Meeting'
];

const DISCOVERY_CALL_MEETING_TYPES = [
  'Probate Discovery Call'
];

const TRUST_ADMIN_MEETING_TYPES = [
  'Trust Admin Meeting'
];

const GENERAL_DISCOVERY_CALL_TYPES = [
  'EP Discovery Call',
  'Deed Discovery Call'
];

const DOC_REVIEW_MEETING_TYPES = [
  'Doc Review Meeting'
];

interface SendEmailRequest {
  to: string;
  firstName: string;
  fullName?: string;
  phone?: string;
  meetingType: string;
  startTime: string; // ISO date string
  meetingLocation?: string;
}

/**
 * Formats the appointment date and time for display
 */
function formatAppointmentDateTime(startTime: string): string {
  if (!startTime) return '[Date and Time]';

  const date = new Date(startTime);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York' // Eastern Time for Florida
  };

  return date.toLocaleString('en-US', options);
}

/**
 * Gets the location text (address or zoom link) based on meeting location
 */
function getLocationText(meetingLocation?: string): string {
  if (!meetingLocation) return '[Meeting Location]';

  const location = MEETING_LOCATIONS[meetingLocation];
  if (location) {
    return location.address;
  }

  // If location not found in mapping, return as-is (might be custom location)
  return meetingLocation;
}

/**
 * Determines which email type to send based on meeting type
 */
function getEmailType(meetingType: string): string {
  if (EMAIL_TRIGGER_MEETING_TYPES.includes(meetingType)) {
    return 'meeting_confirmation';
  }
  if (DISCOVERY_CALL_MEETING_TYPES.includes(meetingType)) {
    return 'probate_discovery_call';
  }
  if (TRUST_ADMIN_MEETING_TYPES.includes(meetingType)) {
    return 'trust_admin_meeting';
  }
  if (GENERAL_DISCOVERY_CALL_TYPES.includes(meetingType)) {
    return 'general_discovery_call';
  }
  if (DOC_REVIEW_MEETING_TYPES.includes(meetingType)) {
    return 'doc_review_meeting';
  }
  return 'generic';
}

/**
 * Generates the HTML email body for meeting confirmation
 */
function generateMeetingConfirmationHTML(data: {
  firstName: string;
  dateTime: string;
  location: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Meeting Confirmation</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hi ${data.firstName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We look forward to seeing you on <strong>${data.dateTime}</strong>, in our <strong>${data.location}</strong>.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Here are the next steps:
              </p>

              <ol style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 15px;">
                  To help us ensure that the meeting is beneficial for you, we have enclosed a "Personal and Financial Information" form. It is required for you to complete this form and return to us prior to your scheduled meeting. By completing the information before we meet, you will allow us to spend the maximum amount of time discussing your personal concerns and providing you additional options. All of the information that you provide is confidential and protected by attorney-client privilege, even if you choose not to go forward with your planning. If you are a couple, we will only need one form for the both of you. If you've already submitted a physical copy, no further action is needed. If you have a printed version filled out, feel free to bring it with you—no need to send it again.
                  <br><br>
                  <a href="${JOTFORM_LINK}" style="display: inline-block; background-color: #e07c5a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold;">Complete Form</a>
                </li>
                <li style="margin-bottom: 15px;">
                  If you're married and planning together, your spouse must attend all meetings with the attorney for things to move forward.
                </li>
                <li style="margin-bottom: 15px;">
                  Please watch the recorded workshop, "How To Protect Your Assets In 3 Easy Steps", which will give you a better idea of different estate planning options, common risks, and address common misconceptions that are often made in regards to estate planning. Click the link below to view the recorded workshop:
                  <br><br>
                  <a href="${WORKSHOP_LINK}" style="display: inline-block; background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold;">Register Here</a>
                </li>
                <li style="margin-bottom: 15px;">
                  During the meeting, the attorney may request to speak with the client privately for a few minutes. This is a normal part of our process and helps ensure their wishes are clearly understood and their plan is fully protected. Click below to download our brochure explaining the process.
                  <br><br>
                  <a href="${BROCHURE_LINK}" style="display: inline-block; background-color: #48bb78; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold;" download>Download Brochure</a>
                </li>
                <li style="margin-bottom: 15px;">
                  Should you need to cancel your appointment, be sure to do so at least 24 hours prior to your scheduled meeting. If you do not show up to your scheduled appointment, your next meeting will be charged at the attorney's hourly rate.
                </li>
              </ol>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, please respond to this email or give us a call/text at <strong>239-317-3116</strong>.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Regards,<br><strong>Safe Harbor Law Firm</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates the HTML email body for Probate Discovery Call confirmation
 */
function generateProbateDiscoveryCallHTML(data: {
  firstName: string;
  dateTime: string;
  phoneNumber: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Discovery Call Confirmation</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hi ${data.firstName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your Probate Discovery Call has been scheduled for <strong>${data.dateTime}</strong>.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We will call you at the number you provided: <strong>${data.phoneNumber}</strong>
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-style: italic;">
                Please allow a brief 5–10 minute delay in case we are finishing another call or assisting another client.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>Before your appointment, please submit the following:</strong>
              </p>

              <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">
                  <strong>Estate Questionnaire</strong> – This helps our paralegal understand your situation and gain a full picture ahead of time.
                  <br>
                  <a href="${ESTATE_QUESTIONNAIRE_LINK}" style="color: #2b6cb0; text-decoration: underline;">Complete Estate Questionnaire</a>
                </li>
                <li style="margin-bottom: 10px;">
                  Decedent's will (if available)
                </li>
                <li style="margin-bottom: 10px;">
                  Decedent's Death certificate (if available)
                </li>
              </ul>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, please respond to this email or give us a call/text at <strong>239-317-3116</strong>.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Regards,<br><strong>Safe Harbor Law Firm</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates the HTML email body for Trust Admin Meeting confirmation
 */
function generateTrustAdminMeetingHTML(data: {
  firstName: string;
  dateTime: string;
  location: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Meeting Confirmation</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hi ${data.firstName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We look forward to seeing you on <strong>${data.dateTime}</strong>, in our <strong>${data.location}</strong>.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>Before your appointment, please submit the following:</strong>
              </p>

              <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">
                  <strong>Trust Admin Questionnaire</strong> – This helps our attorney understand your situation and gain a full picture ahead of time.
                  <br>
                  <a href="${TRUST_ADMIN_QUESTIONNAIRE_LINK}" style="color: #2b6cb0; text-decoration: underline;">Complete Trust Admin Questionnaire</a>
                </li>
                <li style="margin-bottom: 10px;">
                  Decedent's documents (Trust, Will, Death Certificate, and all other pertinent documents) (if available)
                </li>
              </ul>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Should you need to cancel your appointment, be sure to do so at least 24 hours prior to your scheduled meeting. If you do not show up to your scheduled appointment, you will forfeit your complimentary meeting and your next meeting will be charged at the attorney's hourly rate.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, please respond to this email or give us a call/text at <strong>239-317-3116</strong>.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Regards,<br><strong>Safe Harbor Law Firm</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates the HTML email body for General Discovery Call (EP, Deed)
 */
function generateGeneralDiscoveryCallHTML(data: {
  firstName: string;
  dateTime: string;
  phoneNumber: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Discovery Call Confirmation</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hi ${data.firstName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your discovery call has been scheduled for <strong>${data.dateTime}</strong>.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We will call you at the phone number you provided at the time of your scheduled appointment.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-style: italic;">
                Please allow a 5–10 minute delay in case we are finishing another call or assisting another client.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>Phone number we will be calling:</strong> ${data.phoneNumber}
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Please reply to this email if you need to reschedule.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Regards,<br><strong>Safe Harbor Law Firm</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates the HTML email body for Doc Review Meeting confirmation
 */
function generateDocReviewMeetingHTML(data: {
  firstName: string;
  dateTime: string;
  location: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Document Review Meeting Confirmation</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hi ${data.firstName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We look forward to meeting with you on <strong>${data.dateTime}</strong> at <strong>${data.location}</strong>.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>A few helpful reminders:</strong>
              </p>

              <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 15px;">
                  Please share a copy of any documents you'd like the attorney to review during your meeting. This helps us prepare and make the most of your time. You may also bring the documents at the time of the appointment.
                </li>
                <li style="margin-bottom: 15px;">
                  This is a 1-hour consultation where the attorney will briefly review your documents and discuss them with you. If a more detailed or in-depth review is needed after this meeting, it will be billed at the attorney's standard hourly rate.
                </li>
                <li style="margin-bottom: 15px;">
                  Booking this meeting does not establish formal legal representation. Representation begins only after a signed engagement agreement.
                </li>
              </ul>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>Appointment changes:</strong>
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                If you need to cancel or reschedule, please do so at least 24 hours in advance, otherwise you will be forfeiting the meeting, and any future consultation will be charged at the attorney's hourly rate.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, feel free to reply to this email or call/text us at <strong>239-317-3116</strong>. We're happy to help!
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Regards,<br><strong>Safe Harbor Law Firm</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates a generic appointment confirmation email
 */
function generateGenericAppointmentHTML(data: {
  firstName: string;
  dateTime: string;
  meetingType: string;
  location?: string;
}): string {
  const locationText = data.location ? ` at <strong>${data.location}</strong>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Appointment Confirmation</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hi ${data.firstName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your ${data.meetingType} has been scheduled for <strong>${data.dateTime}</strong>${locationText}.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Should you need to cancel or reschedule, please do so at least 24 hours prior to your scheduled appointment.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, please respond to this email or give us a call/text at <strong>239-317-3116</strong>.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Regards,<br><strong>Safe Harbor Law Firm</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // Check for webhook URL
    if (!MAKE_WEBHOOK_URL) {
      console.log('MAKE_APPOINTMENT_EMAIL_WEBHOOK not configured, skipping email');
      return NextResponse.json(
        { success: false, error: "MAKE_APPOINTMENT_EMAIL_WEBHOOK environment variable not set" },
        { status: 500 }
      );
    }

    const body: SendEmailRequest = await request.json();

    const {
      to,
      firstName,
      fullName,
      phone,
      meetingType,
      startTime,
      meetingLocation,
    } = body;

    // Validate required fields
    if (!to || !meetingType || !startTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, meetingType, startTime" },
        { status: 400 }
      );
    }

    const emailType = getEmailType(meetingType);
    const formattedDateTime = formatAppointmentDateTime(startTime);
    const locationText = getLocationText(meetingLocation);
    const displayName = firstName || fullName || 'Valued Client';

    console.log(`=== Sending ${emailType} Appointment Email ===`);
    console.log("To:", to);
    console.log("First Name:", displayName);
    console.log("Meeting Type:", meetingType);
    console.log("Location:", meetingLocation);
    console.log("Time:", startTime);

    let htmlBody: string;
    let subject: string;

    switch (emailType) {
      case 'meeting_confirmation':
        htmlBody = generateMeetingConfirmationHTML({
          firstName: displayName,
          dateTime: formattedDateTime,
          location: locationText,
        });
        subject = 'Your Upcoming Meeting with Safe Harbor Law Firm';
        break;

      case 'probate_discovery_call':
        htmlBody = generateProbateDiscoveryCallHTML({
          firstName: displayName,
          dateTime: formattedDateTime,
          phoneNumber: phone || '[Phone Number]',
        });
        subject = 'Discovery Call Confirmation: Safe Harbor Law Firm';
        break;

      case 'trust_admin_meeting':
        htmlBody = generateTrustAdminMeetingHTML({
          firstName: displayName,
          dateTime: formattedDateTime,
          location: locationText,
        });
        subject = 'Meeting Confirmation: Safe Harbor Law Firm';
        break;

      case 'general_discovery_call':
        htmlBody = generateGeneralDiscoveryCallHTML({
          firstName: displayName,
          dateTime: formattedDateTime,
          phoneNumber: phone || '[Phone Number]',
        });
        subject = 'Discovery Call Confirmation: Safe Harbor Law Firm';
        break;

      case 'doc_review_meeting':
        htmlBody = generateDocReviewMeetingHTML({
          firstName: displayName,
          dateTime: formattedDateTime,
          location: locationText,
        });
        subject = 'Document Review Meeting Confirmation: Safe Harbor Law Firm';
        break;

      default:
        htmlBody = generateGenericAppointmentHTML({
          firstName: displayName,
          dateTime: formattedDateTime,
          meetingType: meetingType,
          location: locationText,
        });
        subject = 'Appointment Confirmation: Safe Harbor Law Firm';
    }

    // Prepare webhook payload (same structure as ghl-automation)
    const payload = {
      to,
      subject,
      htmlBody,
      type: emailType,
    };

    // Send to Make.com webhook
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Make.com webhook error:", errorText);
      return NextResponse.json(
        { success: false, error: `Webhook failed: ${response.status}` },
        { status: 500 }
      );
    }

    console.log(`Appointment email sent successfully (${emailType})`);

    return NextResponse.json({
      success: true,
      message: `Appointment email sent to ${to}`,
      emailType,
    });
  } catch (error) {
    console.error("Error sending appointment email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
