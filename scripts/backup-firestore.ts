import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Usage: npx tsx scripts/backup-firestore.ts
async function backup() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: 'spedition-hueber-dev',
    });
  }

  const db = getFirestore();
  console.log('Starting Firestore backup...');

  try {
    const collections = await db.listCollections();
    const backupData: Record<string, any> = {};

    for (const col of collections) {
      console.log(`Exporting collection: ${col.id}`);
      const snapshot = await col.get();
      backupData[col.id] = {};
      snapshot.forEach((doc: any) => {
        backupData[col.id][doc.id] = doc.data();
      });
    }

    const backupPath = path.join(process.cwd(), `backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup completed successfully: ${backupPath}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backup();
