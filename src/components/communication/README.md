# Communication Components

This package provides embedded communication UI components for WhatsApp, SMS, and Email messaging integrated into host workflows.

## Components

### ChannelToggle
Toggle between multiple communication channels (SMS, WhatsApp, Email).

**Usage:**
```tsx
import { ChannelToggle, type Channel } from '@/components/communication';

const channels: Channel[] = [
  { id: 'sms', label: 'SMS', icon: '📱' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'email', label: 'Email', icon: '📧' },
];

<ChannelToggle
  channels={channels}
  selectedChannels={selectedChannels}
  onChange={setSelectedChannels}
/>
```

### RecipientSelector
Select recipients from a list with contact information display.

**Usage:**
```tsx
import { RecipientSelector, type Recipient } from '@/components/communication';

const recipients: Recipient[] = [
  {
    id: 'app-001',
    name: 'Rahul Sharma',
    role: 'applicant',
    contact: {
      sms: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      email: 'rahul.sharma@email.com',
    },
  },
];

<RecipientSelector
  recipients={recipients}
  selectedRecipientId={selectedRecipientId}
  onChange={setSelectedRecipientId}
  showContext={true}
/>
```

### TemplateSelector
Select message templates with editable content and variable insertion.

**Usage:**
```tsx
import { TemplateSelector, type Template } from '@/components/communication';

const templates: Template[] = [
  {
    id: 'interview_invitation',
    name: 'Interview Invitation',
    content: 'Your interview is scheduled on {{date}} at {{time}}.',
    variables: ['date', 'time'],
  },
];

<TemplateSelector
  templates={templates}
  selectedTemplateId={selectedTemplateId}
  message={message}
  onTemplateChange={setSelectedTemplateId}
  onMessageChange={setMessage}
/>
```

### MessagePreview
Preview messages with variable replacement and character limit warnings.

**Usage:**
```tsx
import { MessagePreview } from '@/components/communication';

<MessagePreview
  message={message}
  variables={{ date: 'Dec 30, 2024', time: '10:00 AM' }}
  channel="sms"
  showCharacterCount={true}
/>
```

### SendMessagePanel
Complete communication panel combining all components with scheduling and escalation options.

**Usage:**
```tsx
import { SendMessagePanel, DEFAULT_TEMPLATES, type SendMessageData } from '@/components/communication';

const handleSendMessage = async (data: SendMessageData) => {
  console.log('Sending:', data);
  await sendMessageAPI(data);
};

<SendMessagePanel
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSend={handleSendMessage}
  recipients={recipients}
  templates={DEFAULT_TEMPLATES}
  defaultChannels={['sms', 'email']}
  context={{
    trackingNumber: 'APP-2024-001',
    status: 'Under Review',
    vertical: 'Boys Hostel',
  }}
  showContextWarning={true}
  isLoading={isLoading}
/>
```

## Available Templates

Default templates included in `DEFAULT_TEMPLATES`:

1. **Interview Invitation** - For scheduling interviews
2. **Provisional Approval** - For provisional approval notifications
3. **Final Approval** - For final approval with login credentials
4. **Rejection** - For rejection notifications
5. **Fee Reminder** - For fee payment reminders
6. **Leave Application** - For parent notifications about leave applications

## Variable Syntax

Templates use double-brace syntax for dynamic variables:
```
{{variable_name}}
```

Common variables:
- `{{name}}` - Recipient's full name
- `{{tracking_number}}` - Application tracking number
- `{{date}}` - Event date
- `{{time}}` - Event time
- `{{amount}}` - Currency amount
- `{{fee_name}}` - Fee item name
- `{{student_name}}` - Student's full name
- `{{vertical}}` - Hostel vertical (Boys/Girls/Dharamshala)

## Features

- **Channel Selection**: Toggle between SMS, WhatsApp, and Email
- **Template System**: Pre-built templates with editable content
- **Variable Replacement**: Real-time preview with dynamic variables
- **Character Limits**: SMS 160-character limit warnings
- **Variable Validation**: Warns about unreplaced placeholders
- **Scheduling**: Schedule messages for future delivery
- **Escalation**: Notify supervisors for urgent matters
- **Context Display**: Shows tracking number, status, vertical
- **Audit Logging**: Indicates messages will be logged
- **Contact Info Display**: Shows available contact methods per recipient

## Integration Points

Based on Communication Touchpoints Mapping (`.docs/communication-touchpoints-mapping.md`):

### Application Lifecycle
- Interview Scheduling (Superintendent/Trustee Dashboard)
- Provisional Approval (Superintendent/Trustee Dashboard)
- Final Approval (Trustee Dashboard)
- Rejection (Superintendent/Trustee Dashboard)

### Payment & Fees
- Fee Reminder (Student Fees Page)
- Payment Confirmation (Automatic)
- Overdue Notification (Accounts Dashboard)

### Leave Management
- Leave Application Notification (Automatic based on rules)
- Leave Approval/Rejection (Superintendent Dashboard)
- Emergency Leave (Immediate notification)

### Renewal
- Renewal Reminder (Scheduled)
- Renewal Confirmation (Automatic)

### Exit
- Exit Notification (Student Dashboard)

## Example Integration

See `/communication-demo` page for complete example.

```tsx
// In Superintendent Dashboard Application Detail Modal
import { SendMessagePanel } from '@/components/communication';

<SendMessagePanel
  isOpen={isMessagePanelOpen}
  onClose={() => setIsMessagePanelOpen(false)}
  onSend={handleSendMessage}
  recipients={[{
    id: application.id,
    name: application.applicantName,
    role: 'applicant',
    contact: {
      sms: applicantMobile,
      whatsapp: applicantMobile,
      email: applicantEmail,
    },
  }]}
  context={{
    trackingNumber: application.trackingNumber,
    status: application.status,
    vertical: application.vertical,
  }}
/>
```

## Demo Page

Visit `/communication-demo` to see all components in action with live previews.

## Design System Integration

All components follow the established design system:
- Uses `navy-900` for primary text
- Uses `gold-500` for primary actions
- Uses proper borders and shadows
- Follows accessibility guidelines
- Mobile-responsive design
