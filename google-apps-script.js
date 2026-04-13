/**
 * GOOGLE APPS SCRIPT - Integrasi Google Drive untuk SIAP
 * 
 * CARA PENGGUNAAN:
 * 1. Buka https://script.google.com
 * 2. Buat Project baru
 * 3. Paste seluruh kode ini
 * 4. Klik Deploy > New Deployment
 * 5. Pilih tipe: Web App
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Klik Deploy
 * 9. Salin URL deployment
 * 10. Tempel URL di aplikasi SIAP bagian Google Drive
 */

// Ganti dengan ID folder Google Drive tujuan (dari URL folder)
// Contoh: https://drive.google.com/drive/folders/AKfycbzoLcMzowzhDV5zTASQhgBEMz_9vMhJFFiYzNZAKxRikbmaEmvHng9YXpAbf5LWSWd1
// ID = AKfycbzoLcMzowzhDV5zTASQhgBEMz_9vMhJFFiYzNZAKxRikbmaEmvHng9YXpAbf5LWSWd1
const FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

/**
 * Menangani request POST dari aplikasi SIAP
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    const filename = data.filename || 'Laporan_Absensi.csv';
    const content = data.content || '';
    const mimeType = data.mimeType || 'text/csv';
    
    // Simpan ke Google Drive
    let folder;
    if (FOLDER_ID && FOLDER_ID !== 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE') {
      folder = DriveApp.getFolderById(FOLDER_ID);
    } else {
      // Buat folder SIAP jika belum ada
      const rootFolders = DriveApp.getFoldersByName('SIAP - Absensi Pegawai');
      if (rootFolders.hasNext()) {
        folder = rootFolders.next();
      } else {
        folder = DriveApp.createFolder('SIAP - Absensi Pegawai');
      }
    }
    
    // Cek apakah file sudah ada, jika ya hapus dulu
    const existingFiles = folder.getFilesByName(filename);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }
    
    // Buat file baru
    const blob = Utilities.newBlob(content, mimeType, filename);
    const file = folder.createFile(blob);
    
    // Buat file bisa diakses via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const response = {
      success: true,
      message: 'File berhasil disimpan ke Google Drive',
      filename: filename,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Menangani request GET (test endpoint)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'SIAP Google Drive Integration aktif',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
