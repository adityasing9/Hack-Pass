import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to base64url encode buffers/strings
function base64url(source: Buffer | string): string {
  const buf = Buffer.isBuffer(source) ? source : Buffer.from(source);
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Signs a JWT using RS256 with Google Service Account private key
function signJwt(payload: any, privateKeyPem: string, clientEmail: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    origins: [],
    iat: now,
    exp: now + 3600,
    payload: payload,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(jwtPayload));

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${headerB64}.${payloadB64}`);
  const signature = sign.sign(privateKeyPem);

  const signatureB64 = base64url(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export async function POST(request: NextRequest) {
  try {
    const { ticketId, eventTitle, venue, dateTime, qrCode, attendancePercent, status } = await request.json();

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

    // Check if Google credentials are configured
    if (!issuerId || !clientEmail || !privateKey) {
      // Fallback: If not configured, we return a simulated Wallet Pass preview URL
      // which demonstrates the integration.
      const fallbackUrl = `/student/tickets?demo=wallet&ticket=${ticketId}`;
      return NextResponse.json({
        url: fallbackUrl,
        message: 'Google Wallet API credentials not configured in environment. Displaying local digital pass preview.',
      });
    }

    // Google Wallet Pass Classes & Objects payload
    // Clean private key formatting
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const passPayload = {
      eventTicketClasses: [
        {
          id: `${issuerId}.${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_class`,
          issuerName: 'HackPass College Network',
          eventName: {
            defaultValue: {
              language: 'en-US',
              value: eventTitle,
            },
          },
          venueDetails: {
            name: {
              defaultValue: {
                language: 'en-US',
                value: venue,
              },
            },
          },
          dateTime: {
            start: dateTime,
          },
        },
      ],
      eventTicketObjects: [
        {
          id: `${issuerId}.${ticketId}`,
          classId: `${issuerId}.${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_class`,
          state: 'ACTIVE',
          barcode: {
            type: 'QR_CODE',
            value: qrCode,
            alternateText: qrCode,
          },
          textModulesData: [
            {
              header: 'ATTENDANCE',
              body: `${attendancePercent}%`,
              id: 'attendance_percent',
            },
            {
              header: 'STATUS',
              body: status,
              id: 'entry_status',
            },
          ],
          ticketHolderName: 'College Student',
        },
      ],
    };

    const signedJwt = signJwt(passPayload, formattedPrivateKey, clientEmail);
    const saveUrl = `https://pay.google.com/gp/v/save/${signedJwt}`;

    return NextResponse.json({ url: saveUrl });
  } catch (err: any) {
    console.error('Wallet generation failure:', err);
    return NextResponse.json({ error: err.message || 'Error compiling Google Wallet Pass' }, { status: 500 });
  }
}
