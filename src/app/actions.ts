import { apiFetch } from "@/src/lib/api-client";
import type { ExtractedInvoiceData } from '@/src/ai/flows/extract-invoice-data-flow';
import type { ExtractCustomerDataOutput } from '@/src/ai/flows/extract-customer-data';

export async function runInvoiceExtraction(input: { imageDataUri: string; }): Promise<{ data: ExtractedInvoiceData; error: null; } | { data: null; error: string; }> {
  try {
    const res = await apiFetch('/api/ai/extract-invoice-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function getDriveFolders(parentFolderId?: string) {
  try {
    const res = await fetch(`/api/drive/folders?parentFolderId=${parentFolderId || ''}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'An unknown error occurred.' };
  }
}

export async function getDriveFiles(folderId: string) {
  try {
    const res = await fetch(`/api/drive/files?folderId=${folderId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'An unknown error occurred.' };
  }
}

export async function createDriveFolder(folderName: string, parentFolderId?: string) {
  try {
    const res = await apiFetch('/api/drive/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName, parentFolderId })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function deleteDriveFolder(folderId: string) {
  try {
    const res = await fetch(`/api/drive/folder/${folderId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function getDriveFolderName(folderId: string) {
  try {
    const res = await fetch(`/api/drive/folder-name/${folderId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function getDriveAudioFiles(folderId: string) {
  try {
    const res = await fetch(`/api/drive/audio-files?folderId=${folderId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'An unknown error occurred.' };
  }
}

export async function runAudioTranscription(fileId: string, dialectPhrases?: string[]) {
  try {
    const res = await apiFetch('/api/ai/transcribe-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, dialectPhrases })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function runSummarization(transcript: string) {
  try {
    const res = await apiFetch('/api/ai/summarize-conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function runCustomerExtraction(transcript: string) {
  try {
    const res = await apiFetch('/api/ai/extract-customer-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function ensureCustomerFolder(customerId: string, customerName: string) {
  try {
    const res = await apiFetch('/api/drive/ensure-customer-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, customerName })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}

export async function uploadFileToDriveAction(folderId: string, fileName: string, fileBufferBase64: string, mimeType: string) {
  try {
    if (typeof window === 'undefined') {
      return { data: { fileId: `mock-drive-id-${Date.now()}` }, error: null };
    }
    const res = await apiFetch('/api/drive/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, fileName, fileBufferBase64, mimeType })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    if (typeof window === 'undefined') {
      return { data: { fileId: `mock-drive-id-${Date.now()}` }, error: null };
    }
    return { data: null, error: e.message || 'An unknown error occurred.' };
  }
}
