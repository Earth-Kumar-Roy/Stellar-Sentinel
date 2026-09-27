const SENDER_NAME = "Stellar Sentinel Treasury Protocol";

function doPost(e) {
  try {
    var requestData = null;

    if (e && e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (err) {
        requestData = null;
      }
    }

    if (!requestData && e && e.parameter && e.parameter.data) {
      try {
        requestData = JSON.parse(e.parameter.data);
      } catch (err) {
        requestData = null;
      }
    }

    if (!requestData && e && e.parameter) {
      requestData = e.parameter;
    }

    if (!requestData) {
      return ContentService.createTextOutput("NO_PAYLOAD").setMimeType(ContentService.MimeType.TEXT);
    }

    var action = requestData.action;

    switch (action) {
      case "SEND_OTP":
      case "SEND_ORG_OTP":
        handleSendOtp(requestData);
        break;

      case "VERIFY_OTP":
      case "VERIFY_ORG_OTP":
        handleVerifyOtp(requestData);
        break;

      case "INTENT_CREATED_NOTIFY":
      case "TX_CREATED_NOTIFY":
        handleIntentCreated(requestData);
        break;

      case "COSIGNER_MANDATE_NOTIFY":
        handleCosignerMandated(requestData);
        break;

      case "INVOICE_SETTLED_NOTIFY":
      case "FUNDS_RELEASED_NOTIFY":
        handleFundsReleasedWithInvoice(requestData);
        break;

      case "ANOMALY_REFUNDED_NOTIFY":
        handleAnomalyRefunded(requestData);
        break;

      default:
        break;
    }

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}

// -----------------------------------------------------------------------------
// 1. Onboarding OTP
// -----------------------------------------------------------------------------
function handleSendOtp(data) {
  const email = (data.email || "").toString().trim().toLowerCase();
  const fullName = data.fullName || data.memberName || "Corporate Administrator";
  const orgName = data.orgName || "Enterprise Vault";

  if (!email || email.indexOf("@") === -1) return;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const userProperties = PropertiesService.getUserProperties();
  const otpPayload = {
    otp: otp,
    expiresAt: new Date().getTime() + 10 * 60 * 1000
  };
  userProperties.setProperty("OTP_" + email, JSON.stringify(otpPayload));

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #07090E; border: 1px solid #1E2433; border-radius: 8px; color: #FFFFFF;">
      <div style="background-color: #0D1017; padding: 20px; border-radius: 6px; text-align: center; border-bottom: 2px solid #FFD700;">
        <h2 style="color: #FFD700; margin: 0; font-size: 20px; letter-spacing: 1.5px; font-family: monospace;">STELLAR SENTINEL PROTOCOL</h2>
        <p style="color: #8A94A6; margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Treasury Identity & Organization Binding Relay</p>
      </div>
      <div style="padding: 24px 8px;">
        <p style="font-size: 15px; color: #FFFFFF; margin: 0 0 12px 0;">Hello <strong>${fullName}</strong>,</p>
        <p style="font-size: 13px; color: #8A94A6; line-height: 1.6; margin: 0 0 20px 0;">
          You are authorizing corporate onboarding for entity <strong>${orgName}</strong> on the Stellar Testnet. Use the single-use authorization passcode below:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FFD700; background-color: #121620; padding: 14px 28px; border: 1px dashed #FFD700; border-radius: 6px; display: inline-block; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748B; margin: 0;">This passcode expires in 10 minutes. Do not share this key with unauthorized parties.</p>
      </div>
      <div style="border-top: 1px solid #1E2433; padding-top: 14px; font-size: 11px; color: #64748B; text-align: center; font-family: monospace;">
        Stellar Sentinel Autonomous Multi-Sig Treasury Defense
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: `[Sentinel] Authorization Code: ${otp}`,
    name: SENDER_NAME,
    htmlBody: htmlBody
  });
}

function handleVerifyOtp(data) {
  const email = (data.email || "").toString().trim().toLowerCase();
  const enteredOtp = (data.otp || "").toString().trim();

  if (!email || !enteredOtp) return;

  const userProperties = PropertiesService.getUserProperties();
  const storedValue = userProperties.getProperty("OTP_" + email);

  if (!storedValue) return;

  const otpPayload = JSON.parse(storedValue);
  const currentTime = new Date().getTime();

  if (currentTime <= otpPayload.expiresAt && otpPayload.otp === enteredOtp) {
    userProperties.deleteProperty("OTP_" + email);
  }
}

// -----------------------------------------------------------------------------
// 2. Intent Created (Dispatched to Disbursing Treasurer)
// -----------------------------------------------------------------------------
function handleIntentCreated(data) {
  const email = data.treasurer_email || data.sender_email || data.email;
  const recipients = collectValidEmails([email]);

  if (recipients.length === 0) return;

  const intentId = data.intent_id || "PENDING";
  const amount = data.total_amount || data.amount || "0.00";
  const asset = data.asset_symbol || "XLM";
  const recipient = data.recipient || data.to_wallet || "Unknown";
  const delay = data.delay_minutes ? (data.delay_minutes + " Minutes") : "Configured Window";
  const note = data.note || data.purpose || "Operational Disbursement";
  const mlScore = (data.ml_score !== undefined && data.ml_score !== null && !isNaN(data.ml_score))
    ? Number(data.ml_score).toFixed(1)
    : "Clean";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #07090E; border: 1px solid #1E2433; border-radius: 8px; color: #FFFFFF;">
      <div style="background-color: #0D1017; padding: 20px; border-radius: 6px; border-bottom: 2px solid #FFD700;">
        <h2 style="color: #FFD700; margin: 0; font-size: 18px; letter-spacing: 1px; font-family: monospace;">PAYMENT INTENT REGISTERED</h2>
        <p style="color: #8A94A6; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase;">Observation Escrow Initialized</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 14px; color: #FFFFFF; margin: 0 0 16px 0;">
          Payment Intent <strong>#${intentId}</strong> has been committed to Soroban smart contract escrow and entered the observation window.
        </p>
        <div style="background-color: #0D1017; border: 1px solid #1E2433; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: monospace;">
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Intent Reference:</td>
              <td style="padding: 10px 0; color: #FFD700; font-weight: bold; text-align: right;">#${intentId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Amount Locked:</td>
              <td style="padding: 10px 0; color: #10B981; font-weight: bold; text-align: right;">${amount} ${asset}</td>
            </tr>
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Recipient Endpoint:</td>
              <td style="padding: 10px 0; color: #FFFFFF; text-align: right; word-break: break-all;">${recipient}</td>
            </tr>
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Observation Timelock:</td>
              <td style="padding: 10px 0; color: #FFFFFF; text-align: right;">${delay}</td>
            </tr>
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">ML Telemetry Score:</td>
              <td style="padding: 10px 0; color: #FFD700; font-weight: bold; text-align: right;">${mlScore} / 100</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #8A94A6;">Transaction Memo:</td>
              <td style="padding: 10px 0; color: #CBD5E1; font-style: italic; text-align: right;">"${note}"</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 12px; color: #8A94A6; line-height: 1.5; margin: 0;">
          The autonomous keeper bot will monitor this window. Settlement will execute automatically upon maturation unless challenged or co-signer approvals remain pending.
        </p>
      </div>
      <div style="border-top: 1px solid #1E2433; padding-top: 14px; font-size: 11px; color: #64748B; text-align: center; font-family: monospace;">
        Stellar Sentinel Protocol • Cryptographically Bound to Soroban State
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: `[Sentinel Alert] Intent #${intentId} Registered: ${amount} ${asset}`,
    name: SENDER_NAME,
    htmlBody: htmlBody
  });
}

// -----------------------------------------------------------------------------
// 3. Co-Signer Mandate
// -----------------------------------------------------------------------------
function handleCosignerMandated(data) {
  const recipients = collectValidEmails([
    data.cosigner_1_email,
    data.cosigner_2_email
  ]);

  if (recipients.length === 0) return;

  const intentId = data.intent_id || "PENDING";
  const amount = data.total_amount || data.amount || "0.00";
  const asset = data.asset_symbol || "XLM";
  const orgName = data.org_name || "Enterprise Treasury";
  const mlScore = (data.ml_score !== undefined && data.ml_score !== null && !isNaN(data.ml_score))
    ? Number(data.ml_score).toFixed(1)
    : "High";
  const mandateReason = data.reason || "Autonomous ML anomaly detection or high-exposure volume threshold";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #07090E; border: 1px solid #EF4444; border-radius: 8px; color: #FFFFFF;">
      <div style="background-color: #1A0F12; padding: 20px; border-radius: 6px; border-bottom: 2px solid #EF4444;">
        <h2 style="color: #EF4444; margin: 0; font-size: 18px; letter-spacing: 1px; font-family: monospace;">ACTION REQUIRED: CO-SIGNER MANDATE</h2>
        <p style="color: #FCA5A5; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase;">Multi-Sig Authorization Required</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 14px; color: #FFFFFF; margin: 0 0 16px 0;">
          You have been designated as a mandatory signatory for an outbound disbursement by <strong>${orgName}</strong>.
        </p>
        <div style="background-color: #160D10; border: 1px solid #EF4444; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #FCA5A5; font-weight: bold; text-transform: uppercase; font-family: monospace;">Trigger Reason:</div>
          <div style="font-size: 13px; color: #FFFFFF; margin-top: 4px;">${mandateReason} (Risk Score: ${mlScore}/100)</div>
        </div>
        <div style="background-color: #0D1017; border: 1px solid #1E2433; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: monospace;">
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Intent Reference:</td>
              <td style="padding: 10px 0; color: #FFD700; font-weight: bold; text-align: right;">#${intentId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Disbursement Volume:</td>
              <td style="padding: 10px 0; color: #10B981; font-weight: bold; text-align: right;">${amount} ${asset}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #8A94A6;">Recipient Endpoint:</td>
              <td style="padding: 10px 0; color: #FFFFFF; text-align: right; word-break: break-all;">${data.recipient || "Corporate Address"}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0;">
          Open your <strong>Ongoing Queue</strong> in the Treasury Dashboard to review parameters and submit your cryptographic signature before the observation window matures.
        </p>
      </div>
      <div style="border-top: 1px solid #1E2433; padding-top: 14px; font-size: 11px; color: #64748B; text-align: center; font-family: monospace;">
        Stellar Sentinel Autonomous Multi-Sig Treasury Defense
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: `[Action Required] Co-Signer Mandate: Intent #${intentId}`,
    name: SENDER_NAME,
    htmlBody: htmlBody
  });
}

// -----------------------------------------------------------------------------
// 4. Final Settlement & Tax Invoice (With Attached PDF File)
// -----------------------------------------------------------------------------
function handleFundsReleasedWithInvoice(data) {
  // Collect Disbursing Treasurer, Co-signers, and Destination Entity Email
  const recipients = collectValidEmails([
    data.treasurer_email,
    data.sender_email,
    data.email,
    data.receiver_email,      // Recipient entity email
    data.recipient_email,     // Secondary alias
    data.cosigner_1_email,
    data.cosigner_2_email
  ]);

  if (recipients.length === 0) return;

  const intentId = data.intent_id || "EXECUTED";
  const amount = data.total_amount || data.amount || "0.00";
  const asset = data.asset_symbol || "XLM";
  const txHash = data.tx_hash || "On-Chain Soroban Record";
  const orgName = data.org_name || "Stellar Sentinel Treasury Entity";
  const gstNumber = data.gst_number || "REGISTERED_CORP";
  const recipientAddr = data.recipient || data.to_wallet || "Recipient Address";
  const dateStr = new Date().toUTCString();

  const numericAmount = parseFloat(String(amount)) || 0;
  const normalizedXlm = asset === "USDC" ? numericAmount * 5.0 : asset === "EURC" ? numericAmount * 5.55 : numericAmount;

  // Build the inline corporate HTML email body
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background-color: #07090E; border: 1px solid #1E2433; border-radius: 8px; color: #FFFFFF;">
      <div style="background-color: #0D1017; padding: 24px; border-radius: 6px; border-bottom: 2px solid #10B981;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <h2 style="color: #10B981; margin: 0; font-size: 20px; font-family: monospace; letter-spacing: 1px;">CORPORATE TAX INVOICE</h2>
              <p style="color: #8A94A6; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase;">Official On-Chain Settlement Receipt</p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <span style="background-color: #052E16; color: #10B981; border: 1px solid #10B981; padding: 6px 12px; font-size: 11px; font-weight: bold; border-radius: 4px; font-family: monospace;">
                SETTLED ON-CHAIN
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; font-family: monospace;">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <span style="color: #64748B; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Disbursing Entity:</span>
              <strong style="font-size: 15px; color: #FFFFFF; font-family: sans-serif;">${orgName}</strong><br/>
              <span style="color: #8A94A6;">GSTIN / Tax ID: <strong style="color: #FFFFFF;">${gstNumber}</strong></span><br/>
              <span style="color: #8A94A6;">Protocol: <strong style="color: #FFD700;">Soroban Smart Escrow</strong></span>
            </td>
            <td style="vertical-align: top; text-align: right; width: 50%;">
              <span style="color: #64748B; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Settlement Metadata:</span>
              <span style="color: #FFD700; font-size: 13px; font-weight: bold;">INVOICE REF: #${intentId}</span><br/>
              <span style="color: #8A94A6;">Settled: ${dateStr}</span><br/>
              <span style="color: #8A94A6;">Status: <strong style="color: #10B981;">EXECUTED (FINAL)</strong></span>
            </td>
          </tr>
        </table>

        <div style="background-color: #0D1017; border: 1px solid #1E2433; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-family: monospace; font-size: 11px;">
          <div style="color: #64748B; font-size: 10px; text-transform: uppercase; margin-bottom: 4px;">Destination Settlement Endpoint:</div>
          <div style="color: #FFD700; word-break: break-all;">${recipientAddr}</div>
        </div>

        <div style="border: 1px solid #1E2433; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead style="background-color: #0D1017; color: #8A94A6; font-size: 11px; text-transform: uppercase; font-family: monospace;">
              <tr style="border-bottom: 1px solid #1E2433;">
                <th style="padding: 12px 14px;">Disbursement Item / Reference</th>
                <th style="padding: 12px 14px; text-align: center;">Timelock</th>
                <th style="padding: 12px 14px; text-align: right;">Amount Disbursed</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #07090E;">
                <td style="padding: 14px;">
                  <strong style="color: #FFFFFF; font-size: 13px;">Corporate Settlement #${intentId}</strong>
                  <div style="color: #8A94A6; font-size: 11px; margin-top: 4px;">Memo: "${data.note || "Verified Treasury Disbursement"}"</div>
                </td>
                <td style="padding: 14px; text-align: center; color: #8A94A6; font-family: monospace;">Matured (Cleared)</td>
                <td style="padding: 14px; text-align: right;">
                  <div style="font-size: 16px; font-weight: bold; color: #10B981; font-family: monospace;">${numericAmount.toFixed(2)} ${asset}</div>
                  <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 2px;">≈ ${normalizedXlm.toFixed(1)} XLM EQ</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background-color: #05070A; border: 1px solid #161B26; border-radius: 6px; padding: 14px; font-family: monospace; font-size: 11px; margin-bottom: 16px;">
          <span style="color: #64748B; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Stellar Network Transaction Hash:</span>
          <span style="color: #FFD700; word-break: break-all;">${txHash}</span>
        </div>

        <p style="font-size: 11px; color: #64748B; line-height: 1.5; margin: 0; text-align: center;">
          Attached to this notification is the official PDF Tax Invoice & Settlement Receipt for corporate accounting.
        </p>
      </div>

      <div style="border-top: 1px solid #1E2433; padding-top: 14px; font-size: 11px; color: #64748B; text-align: center; font-family: monospace;">
        Certified by Stellar Sentinel Autonomous Treasury Defense Engine
      </div>
    </div>
  `;

  // Build the printable A4 HTML Document for conversion to an actual PDF Attachment
  const pdfHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: monospace; color: #0f172a; margin: 0; padding: 0; background: #ffffff; font-size: 11px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .header table { width: 100%; }
          .title { font-size: 18px; font-weight: bold; color: #0f172a; }
          .meta-table { width: 100%; margin-bottom: 16px; border-collapse: collapse; }
          .meta-table td { vertical-align: top; padding: 4px 0; }
          .box { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; margin-bottom: 16px; border-radius: 4px; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 8px 10px; }
          .data-table th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; }
          .footer { border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9px; text-align: center; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <table>
            <tr>
              <td>
                <div class="title">CORPORATE TAX INVOICE</div>
                <div style="color: #64748b; font-size: 10px;">Stellar Sentinel Autonomous Treasury Settlement Protocol</div>
              </td>
              <td style="text-align: right;">
                <span style="border: 1px solid #059669; color: #059669; padding: 4px 8px; font-weight: bold; font-size: 10px;">SETTLED ON-CHAIN</span>
              </td>
            </tr>
          </table>
        </div>

        <table class="meta-table">
          <tr>
            <td style="width: 50%;">
              <strong>ISSUING ENTITY:</strong><br/>
              ${orgName}<br/>
              GSTIN / TAX ID: ${gstNumber}<br/>
              PROTOCOL: Soroban Smart Contract Escrow
            </td>
            <td style="width: 50%; text-align: right;">
              <strong>INVOICE REF: #${intentId}</strong><br/>
              DATE: ${dateStr}<br/>
              STATUS: EXECUTED (FINAL)
            </td>
          </tr>
        </table>

        <div class="box">
          <strong>DISBURSING TREASURY WALLET:</strong><br/>
          ${data.sender_wallet || data.from_wallet || "Corporate Vault"}<br/><br/>
          <strong>DESTINATION COUNTERPARTY ENDPOINT:</strong><br/>
          ${recipientAddr}
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Disbursement Item / Purpose</th>
              <th style="text-align: center;">Observation Timelock</th>
              <th style="text-align: right;">Settled Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Payment Intent #${intentId}</strong><br/>
                <span style="color: #64748b; font-size: 10px;">Memo: "${data.note || "Verified Corporate Disbursement"}"</span>
              </td>
              <td style="text-align: center;">Matured & Verified</td>
              <td style="text-align: right; font-weight: bold;">
                ${numericAmount.toFixed(2)} ${asset}<br/>
                <span style="color: #64748b; font-size: 9px;">≈ ${normalizedXlm.toFixed(1)} XLM EQ</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="box" style="font-size: 10px; word-break: break-all;">
          <strong>STELLAR ON-CHAIN TRANSACTION HASH:</strong><br/>
          ${txHash}
        </div>

        <div class="footer">
          Certified by Stellar Sentinel Autonomous Treasury Defense Engine • Cryptographically Bound to Soroban State
        </div>
      </body>
    </html>
  `;

  // Convert HTML directly into an attached PDF Blob
  var attachments = [];
  try {
    var pdfBlob = Utilities.newBlob(pdfHtml, "text/html", "invoice.html")
      .getAs("application/pdf")
      .setName("Invoice_" + intentId + "_Settlement.pdf");
    attachments.push(pdfBlob);
  } catch (pdfErr) {
    Logger.log("PDF generation warning: " + pdfErr.toString());
  }

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: `[INVOICE #${intentId}] Payment Settled: ${numericAmount.toFixed(2)} ${asset}`,
    name: SENDER_NAME,
    htmlBody: htmlBody,
    attachments: attachments
  });
}

// -----------------------------------------------------------------------------
// 5. Intent Cancelled & Auto-Refunded (Dispatched strictly to internal treasury)
// -----------------------------------------------------------------------------
function handleAnomalyRefunded(data) {
  // Only internal treasury and co-signers get refund alerts; recipient is NOT sent an invoice
  const recipients = collectValidEmails([
    data.treasurer_email,
    data.sender_email,
    data.email,
    data.cosigner_1_email,
    data.cosigner_2_email
  ]);

  if (recipients.length === 0) return;

  const intentId = data.intent_id || "REFUND";
  const amount = data.total_amount || data.amount || "0.00";
  const asset = data.asset_symbol || "XLM";
  const reason = data.reason || "Cancelled or rejected by authorized key";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #07090E; border: 1px solid #F59E0B; border-radius: 8px; color: #FFFFFF;">
      <div style="background-color: #171208; padding: 20px; border-radius: 6px; border-bottom: 2px solid #F59E0B;">
        <h2 style="color: #F59E0B; margin: 0; font-size: 18px; letter-spacing: 1px; font-family: monospace;">ESCROW FUNDS AUTO-REFUNDED</h2>
        <p style="color: #FDE68A; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase;">Intent Cancelled & Escrow Restored</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 14px; color: #FFFFFF; margin: 0 0 16px 0;">
          The observation or authorization window for Intent <strong>#${intentId}</strong> was terminated. Escrowed tokens have auto-refunded to your corporate treasury wallet.
        </p>
        <div style="background-color: #120E06; border: 1px solid #F59E0B; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #FDE68A; font-weight: bold; text-transform: uppercase; font-family: monospace;">Refund Reason:</div>
          <div style="font-size: 13px; color: #FFFFFF; margin-top: 4px;">${reason}</div>
        </div>
        <div style="background-color: #0D1017; border: 1px solid #1E2433; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: monospace;">
            <tr style="border-bottom: 1px solid #161B26;">
              <td style="padding: 10px 0; color: #8A94A6;">Intent Reference:</td>
              <td style="padding: 10px 0; color: #FFD700; font-weight: bold; text-align: right;">#${intentId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #8A94A6;">Refund Volume:</td>
              <td style="padding: 10px 0; color: #10B981; font-weight: bold; text-align: right;">+${amount} ${asset}</td>
            </tr>
          </table>
        </div>
      </div>
      <div style="border-top: 1px solid #1E2433; padding-top: 14px; font-size: 11px; color: #64748B; text-align: center; font-family: monospace;">
        Stellar Sentinel Autonomous Multi-Sig Treasury Defense
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: `[Refund Confirmed] Escrow Returned: Intent #${intentId}`,
    name: SENDER_NAME,
    htmlBody: htmlBody
  });
}

function collectValidEmails(arr) {
  const valid = [];
  if (!Array.isArray(arr)) return valid;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item === "string") {
      const clean = item.trim().toLowerCase();
      if (clean && clean !== "none" && emailRegex.test(clean)) {
        if (valid.indexOf(clean) === -1) {
          valid.push(clean);
        }
      }
    }
  }
  return valid;
}