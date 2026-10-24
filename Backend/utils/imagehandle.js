import fs from 'fs/promises';


async function removeUploadedFile (file) {
  if (file) await fs.unlink(file.path).catch(() => {});
};

async function removeFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Could not delete file:", filePath, err.code);
    }
  }
}

export {
    removeUploadedFile,
    removeFile
}

