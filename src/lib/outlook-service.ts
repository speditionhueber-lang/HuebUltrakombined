export interface OutlookSendRequestAttachment {
  fileName: string;
  mimeType: string;
  contentBytes: string; // Base64 clean string
}

export interface OutlookSendRequest {
  sourceMessageId?: string;
  subject: string;
  bodyText: string;
  recipients: Array<{ email: string; name?: string }>;
  ccRecipients?: Array<{ email: string; name?: string }>;
  attachments?: OutlookSendRequestAttachment[];
}

export type OutlookSendResult =
  | {
      success: true;
      delivery: 'graph';
      graphMessageId?: string;
      statusCode: number;
    }
  | {
      success: true;
      delivery: 'simulated';
      statusCode: 200;
      message: string;
    }
  | {
      success: false;
      reason:
        | 'authentication_required'
        | 'rate_limited'
        | 'network_error'
        | 'graph_error';
      statusCode?: number;
      retryAfterSeconds?: number;
      message: string;
    };

export interface OutlookMailTransport {
  sendReply(
    request: OutlookSendRequest,
    options?: { token?: string; fetchFn?: typeof fetch }
  ): Promise<OutlookSendResult>;
}

let customTransportOverride: OutlookMailTransport | null = null;

export function setOutlookMailTransportOverride(transport: OutlookMailTransport | null) {
  customTransportOverride = transport;
}

export interface OutlookSendResponse {
  success: boolean;
  delivery?: 'graph' | 'simulated';
  messageId?: string;
  error?: string;
  reason?: 'authentication_required' | 'rate_limited' | 'network_error' | 'graph_error';
  retryAfter?: number;
}

/**
 * Centralized typed helper to send an email or reply using Microsoft Graph API.
 */
export async function sendOutlookMessage(
  request: OutlookSendRequest,
  options?: {
    token?: string;
    fetchFn?: typeof fetch;
  }
): Promise<OutlookSendResponse> {
  if (customTransportOverride) {
    const overrideRes = await customTransportOverride.sendReply(request, options);
    if ('reason' in overrideRes) {
      return {
        success: false,
        reason: overrideRes.reason,
        error: overrideRes.message,
        retryAfter: overrideRes.retryAfterSeconds,
        ...(overrideRes.statusCode ? { statusCode: overrideRes.statusCode } : {})
      };
    } else {
      return {
        success: true,
        delivery: overrideRes.delivery,
        messageId: overrideRes.delivery === 'graph' ? overrideRes.graphMessageId : 'simulated-id'
      };
    }
  }

  const customFetch = options?.fetchFn || globalThis.fetch;
  let token = options?.token;

  if (!token && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('ms_graph_access_token') || undefined;
  }

  if (!token) {
    return {
      success: false,
      reason: 'authentication_required',
      error: 'Microsoft Graph Authentifizierungsfehler: Kein Access Token vorhanden. Bitte anmelden.'
    };
  }

  try {
    // 1. If attachments are present or sourceMessageId is present:
    if (request.attachments && request.attachments.length > 0) {
      let draftId: string | null = null;

      if (request.sourceMessageId) {
        // Create reply draft
        const createReplyUrl = `https://graph.microsoft.com/v1.0/me/messages/${request.sourceMessageId}/createReply`;
        const replyRes = await customFetch(createReplyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (replyRes.ok) {
          const draftData = await replyRes.json().catch(() => ({}));
          draftId = draftData.id || null;
        }
      }

      if (!draftId) {
        // Create standard message draft
        const createMsgUrl = 'https://graph.microsoft.com/v1.0/me/messages';
        const createRes = await customFetch(createMsgUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: request.subject,
            body: { contentType: 'Text', content: request.bodyText },
            toRecipients: request.recipients.map(r => ({ emailAddress: { address: r.email, name: r.name } })),
            ccRecipients: (request.ccRecipients || []).map(r => ({ emailAddress: { address: r.email, name: r.name } }))
          })
        });

        if (createRes.ok) {
          const msgData = await createRes.json().catch(() => ({}));
          draftId = msgData.id || null;
        } else {
          const errJson = await createRes.json().catch(() => ({}));
          return {
            success: false,
            reason: 'graph_error',
            error: errJson.error?.message || `Fehler beim Erstellen des Entwurfs (${createRes.status})`
          };
        }
      }

      if (!draftId) {
        return {
          success: false,
          reason: 'graph_error',
          error: 'Microsoft Graph konnte den E-Mail-Entwurf nicht erstellen.'
        };
      }

      // Upload each attachment to draft
      for (const att of request.attachments) {
        const attachUrl = `https://graph.microsoft.com/v1.0/me/messages/${draftId}/attachments`;
        const attachRes = await customFetch(attachUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.fileName,
            contentType: att.mimeType || 'application/pdf',
            contentBytes: att.contentBytes
          })
        });

        if (!attachRes.ok) {
          const errJson = await attachRes.json().catch(() => ({}));
          return {
            success: false,
            reason: 'graph_error',
            error: errJson.error?.message || `Fehler beim Hochladen des Anhangs ${att.fileName} (${attachRes.status})`
          };
        }
      }

      // Send draft message
      const sendDraftUrl = `https://graph.microsoft.com/v1.0/me/messages/${draftId}/send`;
      const sendRes = await customFetch(sendDraftUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (sendRes.ok || sendRes.status === 202 || sendRes.status === 200 || sendRes.status === 204) {
        return {
          success: true,
          delivery: 'graph',
          messageId: `graph-sent-with-att-${Date.now()}`
        };
      } else {
        const errJson = await sendRes.json().catch(() => ({}));
        return {
          success: false,
          reason: 'graph_error',
          error: errJson.error?.message || `Fehler beim Versenden der E-Mail (${sendRes.status})`
        };
      }
    }

    // 2. Attempt reply via Graph API message reply endpoint if sourceMessageId present (no attachments)
    if (request.sourceMessageId) {
      const replyUrl = `https://graph.microsoft.com/v1.0/me/messages/${request.sourceMessageId}/reply`;
      const res = await customFetch(replyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: request.bodyText
        })
      });

      if (res.status === 401 || res.status === 403) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('ms_graph_access_token');
          localStorage.removeItem('outlook_logged_in');
        }
        return {
          success: false,
          reason: 'authentication_required',
          error: 'Microsoft Graph Authentifizierungsfehler (401/403). Bitte erneut anmelden.'
        };
      }

      if (res.status === 429) {
        const retryHeader = res.headers?.get?.('Retry-After');
        const retryAfter = retryHeader ? parseInt(retryHeader, 10) : 10;
        return {
          success: false,
          reason: 'rate_limited',
          error: 'Microsoft Graph Rate Limit überschritten (429).',
          retryAfter
        };
      }

      if (res.ok || res.status === 202 || res.status === 200 || res.status === 201) {
        return {
          success: true,
          delivery: 'graph',
          messageId: `graph-reply-${Date.now()}`
        };
      }
    }

    // 2. Fallback to sendMail endpoint if not a reply or if reply endpoint failed
    const sendMailUrl = 'https://graph.microsoft.com/v1.0/me/sendMail';
    const payload = {
      message: {
        subject: request.subject,
        body: {
          contentType: 'Text',
          content: request.bodyText
        },
        toRecipients: request.recipients.map(r => ({
          emailAddress: { address: r.email, name: r.name || undefined }
        })),
        ccRecipients: (request.ccRecipients || []).map(r => ({
          emailAddress: { address: r.email, name: r.name || undefined }
        }))
      },
      saveToSentItems: true
    };

    const res = await customFetch(sendMailUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401 || res.status === 403) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ms_graph_access_token');
        localStorage.removeItem('outlook_logged_in');
      }
      return {
        success: false,
        reason: 'authentication_required',
        error: 'Microsoft Graph Authentifizierungsfehler (401/403). Bitte erneut anmelden.'
      };
    }

    if (res.status === 429) {
      const retryHeader = res.headers?.get?.('Retry-After');
      const retryAfter = retryHeader ? parseInt(retryHeader, 10) : 10;
      return {
        success: false,
        reason: 'rate_limited',
        error: 'Microsoft Graph Rate Limit überschritten (429).',
        retryAfter
      };
    }

    if (res.ok || res.status === 202 || res.status === 200 || res.status === 201) {
      return {
        success: true,
        delivery: 'graph',
        messageId: `graph-sent-${Date.now()}`
      };
    }

    const errJson = await res.json().catch(() => ({}));
    return {
      success: false,
      reason: 'graph_error',
      error: errJson.error?.message || `Versandfehler via Graph API (${res.status})`
    };

  } catch (err: any) {
    return {
      success: false,
      reason: 'network_error',
      error: err.message || 'Netzwerkfehler beim E-Mail-Versand via Microsoft Graph'
    };
  }
}

