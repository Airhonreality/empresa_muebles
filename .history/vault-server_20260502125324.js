import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), 'matter-silo/assets');
const DATABASE_PATH = path.join(process.cwd(), 'matter-silo/materia.json');

// Configuración de almacenamiento de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Asegurar que el directorio y el archivo existen
async function ensureDir() {
    const dir = path.dirname(DATABASE_PATH);
    const uploads = UPLOADS_DIR;
    
    for (const d of [dir, uploads]) {
        try { await fs.access(d); } catch { await fs.mkdir(d, { recursive: true }); }
    }
    
    try {
        await fs.access(DATABASE_PATH);
    } catch {
        await fs.writeFile(DATABASE_PATH, JSON.stringify({ materia: {} }, null, 2));
    }
}

// Sintonizar Materia (LEER)
app.get('/api/vault', async (req, res) => {
    try {
        await ensureDir();
        const data = await fs.readFile(DATABASE_PATH, 'utf-8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Cristalizar Materia (ESCRIBIR)
app.post('/api/vault', async (req, res) => {
    try {
        await ensureDir();
        await fs.writeFile(DATABASE_PATH, JSON.stringify(req.body, null, 2));
        res.json({ status: 'success' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Subir Archivo (UPLOAD)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        await ensureDir();
        const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Servir archivos estáticos
app.use('/uploads', express.static(UPLOADS_DIR));

app.listen(PORT, () => {
    console.log(`🛰️  Silo Local escuchando en http://localhost:${PORT}`);
});
