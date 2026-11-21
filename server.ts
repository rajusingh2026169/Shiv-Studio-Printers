import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Ensure public/uploads directory exists
  const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer disk storage configuration
  const storageConfig = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${timestamp}_${safeName}`);
    }
  });

  const upload = multer({
    storage: storageConfig,
    limits: { fileSize: 200 * 1024 * 1024 } // 200 MB max
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static files from public/uploads
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Single file upload endpoint
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: relativeUrl,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });

  // Multiple files upload endpoint
  app.post('/api/upload-multiple', upload.array('files', 30), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const uploaded = files.map(file => ({
      url: `/uploads/${file.filename}`,
      fileName: file.originalname,
      storedFileName: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    }));
    res.json({ files: uploaded });
  });

  // Base64 upload endpoint (for data URL fallback)
  app.post('/api/upload-base64', (req, res) => {
    try {
      const { dataUrl, fileName = 'image.webp' } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'Missing dataUrl' });
      }
      const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }
      const mime = matches[1];
      const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'webp';
      const buffer = Buffer.from(matches[2], 'base64');
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}_${safeName.endsWith('.' + ext) ? safeName : safeName + '.' + ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);

      res.json({
        url: `/uploads/${filename}`,
        fileName: filename,
        size: buffer.length,
        mimetype: mime,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save base64 image' });
    }
  });

  // Direct download endpoint with Content-Disposition
  app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.download(filePath, safeFilename);
  });

  // Vite integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
