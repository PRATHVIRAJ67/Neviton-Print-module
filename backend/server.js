import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfToPrinter from 'pdf-to-printer';
import cors from 'cors';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
const { getPrinters, print } = pdfToPrinter;
const app = express();

app.use(cors());
app.use(express.json());


const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
  limits: { fileSize: 50 * 1024 * 1024 } 
});


app.get('/api/printers', async (req, res) => {
  try {
    const { stdout } = await execPromise('powershell "Get-Printer | Select-Object -ExpandProperty Name"');
    const printers = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((name) => ({ name }));
    res.json(printers);
  } catch (err) {
    console.error('Printer detection failed:', err);
    res.status(500).json({ error: 'Could not detect printers: ' + err.message });
  }
});
 

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filePath: path.resolve(req.file.path) });
});


app.post('/api/print', async (req, res) => {
  const { printer, filePath } = req.body;

  if (!printer || !filePath) {
    return res.status(400).json({ error: 'Printer and file path required' });
  }

  if (process.platform === 'darwin') {
   
    try {
      
      await print(filePath, { printer });
      res.json({ message: 'Printed on macOS using pdf-to-printer' });
    } catch (err) {
     
      try {
        await execPromise(`lp -d "${printer}" "${filePath}"`);
        res.json({ message: 'Printed on macOS using lp command' });
      } catch (lpErr) {
        res.status(500).json({ error: 'macOS printing failed: ' + lpErr.message });
      }
    }
  } else if (process.platform === 'win32' || process.platform === 'linux') {
   
    try {
      await print(filePath, { printer });
      res.json({ message: 'Printed successfully on Windows/Linux' });
    } catch (err) {
      res.status(500).json({ error: 'Printing failed: ' + err.message });
    }
  } else {
    res.status(500).json({ error: `Unsupported platform: ${process.platform}` });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});