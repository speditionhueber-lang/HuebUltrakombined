export const createFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<string> => {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    throw new Error(`Failed to create folder (${res.status})`);
  }

  const data = await res.json();
  return data.id;
};

export const findFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<string | null> => {
  const safeFolderName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const query = `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and trashed=false${parentClause}`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to search folder (${res.status})`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const getOrCreateCustomerFolder = async (accessToken: string, customerName: string): Promise<string> => {
  // First, find or create the root app folder
  const rootFolderName = 'Spedition Hueber Dokumente';
  let rootFolderId = await findFolder(accessToken, rootFolderName);
  if (!rootFolderId) {
    rootFolderId = await createFolder(accessToken, rootFolderName);
  }

  // Then, find or create the customer folder inside the root folder
  let customerFolderId = await findFolder(accessToken, customerName, rootFolderId);
  if (!customerFolderId) {
    customerFolderId = await createFolder(accessToken, customerName, rootFolderId);
  }

  return customerFolderId;
};

export const uploadFileToDrive = async (accessToken: string, file: File, folderId: string): Promise<any> => {
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file (${res.status})`);
  }

  return await res.json();
};

export const listFilesInFolder = async (accessToken: string, folderId: string): Promise<any[]> => {
  const query = `'${folderId}' in parents and trashed=false`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, createdTime, webViewLink)&orderBy=createdTime desc`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list files (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to delete file');
  }
};
