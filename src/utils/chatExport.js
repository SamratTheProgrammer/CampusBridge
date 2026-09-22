import toast from 'react-hot-toast';

const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Export conversation messages as Plain Text (.txt)
 */
export const exportChatAsTxt = (contact, messages, currentUser) => {
  if (!messages || messages.length === 0) {
    toast.error('No messages to export');
    return;
  }

  const contactName = contact?.name || 'Contact';
  const currentUserName = currentUser?.fullName || currentUser?.firstName || 'You';
  const divider = '='.repeat(60);

  let text = `${divider}\n`;
  text += `CAMPUSBRIDGE CHAT TRANSCRIPT\n`;
  text += `With: ${contactName} (${contact?.role || 'Member'})\n`;
  text += `Export Date: ${new Date().toLocaleString()}\n`;
  text += `Total Messages: ${messages.length}\n`;
  text += `${divider}\n\n`;

  messages.forEach((msg, idx) => {
    const isMe = msg.senderClerkId === currentUser?.id;
    const sender = isMe ? `${currentUserName} (You)` : contactName;
    const time = formatTimestamp(msg.createdAt);

    if (msg.isDeleted) {
      text += `[${time}] ${sender}: [This message was deleted]\n\n`;
      return;
    }

    let content = msg.text || '';
    if (msg.type === 'audio' || msg.attachment?.type === 'audio') {
      content += (content ? ' ' : '') + `[Audio Message: ${msg.attachment?.url || 'Voice Note'}]`;
    } else if (msg.attachment) {
      content += (content ? ' ' : '') + `[Attachment: ${msg.attachment.type || 'file'} - ${msg.attachment.name || ''} (${msg.attachment.url})]`;
    }

    if (msg.type === 'share' && msg.share) {
      content += (content ? ' ' : '') + `[Shared ${msg.share.type}: ${msg.share.title || ''} - ${msg.share.description || ''}]`;
    }

    text += `[${time}] ${sender}:\n${content}\n\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Chat_with_${contactName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success('Chat exported as .txt');
};

/**
 * Export conversation messages as Microsoft Word document (.doc)
 */
export const exportChatAsDoc = (contact, messages, currentUser) => {
  if (!messages || messages.length === 0) {
    toast.error('No messages to export');
    return;
  }

  const contactName = contact?.name || 'Contact';
  const currentUserName = currentUser?.fullName || currentUser?.firstName || 'You';

  let html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Chat with ${contactName}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
      .header { border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: bold; color: #7c3aed; margin: 0 0 6px 0; }
      .meta { font-size: 13px; color: #64748b; }
      .message-box { margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; max-width: 80%; }
      .message-me { background-color: #f3e8ff; border-left: 4px solid #7c3aed; margin-left: auto; text-align: right; }
      .message-them { background-color: #f1f5f9; border-left: 4px solid #94a3b8; margin-right: auto; text-align: left; }
      .sender-name { font-weight: bold; font-size: 13px; color: #0f172a; margin-bottom: 4px; }
      .message-time { font-size: 11px; color: #94a3b8; margin-top: 4px; }
      .message-body { font-size: 14px; white-space: pre-wrap; word-break: break-word; color: #1e293b; }
      .attachment { font-size: 12px; color: #6d28d9; margin-top: 6px; font-style: italic; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">CampusBridge Chat Transcript</div>
      <div class="meta"><strong>Conversation with:</strong> ${contactName} (${contact?.role || 'Member'})</div>
      <div class="meta"><strong>Exported on:</strong> ${new Date().toLocaleString()}</div>
      <div class="meta"><strong>Total Messages:</strong> ${messages.length}</div>
    </div>
    <div class="conversation">
  `;

  messages.forEach(msg => {
    const isMe = msg.senderClerkId === currentUser?.id;
    const sender = isMe ? `${currentUserName} (You)` : contactName;
    const time = formatTimestamp(msg.createdAt);
    const boxClass = isMe ? 'message-me' : 'message-them';

    let content = msg.isDeleted ? '<em>🚫 This message was deleted</em>' : (msg.text || '');

    if (msg.type === 'audio' || msg.attachment?.type === 'audio') {
      content += `<div class="attachment">🎵 [Voice Message: ${msg.attachment?.url || 'Audio file'}]</div>`;
    } else if (msg.attachment) {
      content += `<div class="attachment">📎 [Attachment: ${msg.attachment.type || 'file'} - ${msg.attachment.name || ''}]</div>`;
    }

    if (msg.type === 'share' && msg.share) {
      content += `<div class="attachment">🔗 [Shared ${msg.share.type}: ${msg.share.title || ''}]</div>`;
    }

    html += `
      <div class="message-box ${boxClass}">
        <div class="sender-name">${sender}</div>
        <div class="message-body">${content}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
  });

  html += `
    </div>
  </body>
  </html>
  `;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Chat_with_${contactName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success('Chat exported as .doc');
};

/**
 * Export conversation messages as PDF via formatted printable document
 */
export const exportChatAsPdf = (contact, messages, currentUser) => {
  if (!messages || messages.length === 0) {
    toast.error('No messages to export');
    return;
  }

  const contactName = contact?.name || 'Contact';
  const currentUserName = currentUser?.fullName || currentUser?.firstName || 'You';

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    toast.error('Popup blocked. Please allow popups to export as PDF.');
    return;
  }

  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Chat with ${contactName} - CampusBridge</title>
    <style>
      @page { margin: 15mm; size: A4; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        background: #ffffff;
        margin: 0;
        padding: 24px;
        line-height: 1.5;
      }
      .brand-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #8b5cf6;
        padding-bottom: 14px;
        margin-bottom: 24px;
      }
      .brand-title {
        font-size: 22px;
        font-weight: 800;
        color: #7c3aed;
        letter-spacing: -0.5px;
      }
      .brand-subtitle {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }
      .meta-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 18px;
        font-size: 13px;
        margin-bottom: 24px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .meta-item strong { color: #334155; }
      .message-row {
        display: flex;
        flex-direction: column;
        margin-bottom: 16px;
        page-break-inside: avoid;
      }
      .message-me {
        align-items: flex-end;
      }
      .message-them {
        align-items: flex-start;
      }
      .bubble {
        max-width: 75%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 13.5px;
        word-break: break-word;
      }
      .bubble-me {
        background: #ede9fe;
        color: #4c1d95;
        border: 1px solid #ddd6fe;
        border-bottom-right-radius: 4px;
      }
      .bubble-them {
        background: #f1f5f9;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        border-bottom-left-radius: 4px;
      }
      .sender-tag {
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 4px;
        color: #64748b;
      }
      .time-tag {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 4px;
      }
      .attachment-badge {
        font-size: 11px;
        background: rgba(124, 58, 237, 0.1);
        color: #7c3aed;
        padding: 4px 8px;
        border-radius: 6px;
        margin-top: 4px;
        display: inline-block;
      }
      .footer-note {
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
        margin-top: 40px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="no-print" style="margin-bottom: 16px; padding: 10px; background: #ede9fe; border-radius: 8px; text-align: center; font-size: 13px; color: #6d28d9;">
      <strong>Tip:</strong> In the print dialog, select <em>Destination: Save as PDF</em> to download your PDF.
    </div>

    <div class="brand-bar">
      <div>
        <div class="brand-title">CampusBridge</div>
        <div class="brand-subtitle">Official Conversation Transcript</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        Exported: ${new Date().toLocaleDateString()}<br>
        Time: ${new Date().toLocaleTimeString()}
      </div>
    </div>

    <div class="meta-box">
      <div class="meta-item"><strong>Participant:</strong> ${contactName}</div>
      <div class="meta-item"><strong>Role:</strong> ${contact?.role || 'Member'}</div>
      <div class="meta-item"><strong>Exported by:</strong> ${currentUserName}</div>
      <div class="meta-item"><strong>Message Count:</strong> ${messages.length}</div>
    </div>

    <div class="conversation">
  `;

  messages.forEach(msg => {
    const isMe = msg.senderClerkId === currentUser?.id;
    const sender = isMe ? `${currentUserName} (You)` : contactName;
    const time = formatTimestamp(msg.createdAt);

    let content = msg.isDeleted ? '🚫 <em>This message was deleted</em>' : (msg.text || '');

    if (msg.type === 'audio' || msg.attachment?.type === 'audio') {
      content += `<div class="attachment-badge">🎵 Voice Message: ${msg.attachment?.name || 'Audio file'}</div>`;
    } else if (msg.attachment) {
      content += `<div class="attachment-badge">📎 Attachment: ${msg.attachment.type || 'file'} - ${msg.attachment.name || ''}</div>`;
    }

    if (msg.type === 'share' && msg.share) {
      content += `<div class="attachment-badge">🔗 Shared ${msg.share.type}: ${msg.share.title || ''}</div>`;
    }

    html += `
      <div class="message-row ${isMe ? 'message-me' : 'message-them'}">
        <div class="sender-tag">${sender}</div>
        <div class="bubble ${isMe ? 'bubble-me' : 'bubble-them'}">
          ${content}
        </div>
        <div class="time-tag">${time}</div>
      </div>
    `;
  });

  html += `
    </div>
    <div class="footer-note">
      Generated automatically by CampusBridge • Confidential Communication Transcript
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 300);
      };
    </script>
  </body>
  </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  toast.success('Print window opened — select "Save as PDF"');
};
