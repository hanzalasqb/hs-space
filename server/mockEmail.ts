type MockEmail = { to: string; subject: string; resetUrl: string; createdAt: number };

const outbox: MockEmail[] = [];

export function sendMockPasswordResetEmail(to: string, resetUrl: string) {
  const message = { to, subject: "Reset your HS Space password", resetUrl, createdAt: Date.now() };
  outbox.push(message);
  if (outbox.length > 100) outbox.shift();
  return { messageId: `mock-${message.createdAt}-${outbox.length}`, previewUrl: resetUrl };
}

export function getMockEmailOutbox() {
  return [...outbox].reverse();
}
