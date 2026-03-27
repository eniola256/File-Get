export const requestReceivedEmail = (studentName, fileTitle) => ({
  subject: "We received your request",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>Request received</h2>
      <p>Hi ${escapeHtml(studentName)},</p>
      <p>Your payment request for <strong>${escapeHtml(fileTitle)}</strong> has been received.</p>
      <p>You can check the status in your dashboard.</p>
    </div>
  `,
});

export const newRequestRepEmail = (repName, studentName, fileTitle) => ({
  subject: "New payment request",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>New request</h2>
      <p>Hi ${escapeHtml(repName)},</p>
      <p><strong>${escapeHtml(studentName)}</strong> submitted a payment request for <strong>${escapeHtml(
    fileTitle,
  )}</strong>.</p>
      <p>Please review it in your rep dashboard.</p>
    </div>
  `,
});

export const duplicateReceiptRepEmail = (repName, studentName, fileTitle) => ({
  subject: "Duplicate receipt detected",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>Duplicate receipt flagged</h2>
      <p>Hi ${escapeHtml(repName)},</p>
      <p>A duplicate receipt submission was detected for <strong>${escapeHtml(
        fileTitle,
      )}</strong>.</p>
      <p>Student: <strong>${escapeHtml(studentName)}</strong>.</p>
    </div>
  `,
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

