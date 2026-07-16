import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const envFilePath = path.join(repoRoot, '.env.vercel.downloaded');
const imagenesPath = path.join(repoRoot, 'storage', 'db', 'imagenes_espacio.json');
const variantesPath = path.join(repoRoot, 'storage', 'db', 'espacio_variantes.json');

const sourceSiteBase = 'https://www.vetadeoro.co';
const sourcePathCandidates = ['', '/', '/uploads/', '/media/', '/images/'];

const manifest = [
  {
    recordId: '3e1e63c1-541d-48ad-bb8f-a615856ee599',
    variantId: '4b9c8c48-f669-4be9-aa1c-0f18f7a791b3',
    sourceFile: 'DSCN3338.JPG',
    altEs: 'Dormitorio moderno con cama flotante e iluminacion ambiental',
    seoName: 'dormitorio_moderno_con_cama_flotante_e_iluminacion_ambiental',
    order: 1,
  },
  {
    recordId: 'e98d7801-253e-4d97-b622-a3e016caeb6b',
    variantId: '4b9c8c48-f669-4be9-aa1c-0f18f7a791b3',
    sourceFile: 'IMG_8292_edited.jpg',
    altEs: 'Detalle del dormitorio con cabecero tapizado y luz calida',
    seoName: 'detalle_del_dormitorio_con_cabecero_tapizado_y_luz_calida',
    order: 2,
  },
  {
    recordId: '1f22d718-51d1-4695-8a6b-1a92c18bbc2d',
    variantId: 'a4e6b00a-ab55-4f3a-96f4-10e968636670',
    sourceFile: 'DSCN3362.JPG',
    altEs: 'Cama camarote de madera con almacenamiento integrado',
    seoName: 'cama_camarote_de_madera_con_almacenamiento_integrado',
    order: 1,
  },
  {
    recordId: 'd20fb651-0103-4773-9740-53dc237c49db',
    variantId: 'a4e6b00a-ab55-4f3a-96f4-10e968636670',
    sourceFile: 'DSCN3431.JPG',
    altEs: 'Cocina de superficies continuas en blanco y madera clara',
    seoName: 'cocina_de_superficies_continuas_en_blanco_y_madera_clara',
    order: 2,
  },
  {
    recordId: '32a3b43e-1e42-4277-abc6-761d0cab9a76',
    variantId: 'a4e6b00a-ab55-4f3a-96f4-10e968636670',
    sourceFile: 'DSCN3438_edited.jpg',
    altEs: 'Detalle de cocina con iluminacion LED bajo gabinetes',
    seoName: 'detalle_de_cocina_con_iluminacion_led_bajo_gabinetes',
    order: 3,
  },
  {
    recordId: '7c27d999-785d-4e3c-9ccd-fdaa355952a3',
    variantId: '11311a1b-b663-4cab-a23c-34b5289e926f',
    sourceFile: 'DSCN3445.JPG',
    altEs: 'Barra de bar con encimera de sinterizado y repisas abiertas',
    seoName: 'barra_de_bar_con_encimera_de_sinterizado_y_repisas_abiertas',
    order: 1,
  },
  {
    recordId: 'dd706ba0-4138-40c2-8396-1a8f0f614020',
    variantId: '11311a1b-b663-4cab-a23c-34b5289e926f',
    sourceFile: 'IMG_20241007_142835427_edited.jpg',
    altEs: 'Vestidor modular con puertas de vidrio templado',
    seoName: 'vestidor_modular_con_puertas_de_vidrio_templado',
    order: 2,
  },
  {
    recordId: '094acdb7-e8fa-46cd-9f16-ca35e871329d',
    variantId: '08f989d0-6bba-496f-b412-0e0e8f48c1c4',
    sourceFile: 'IMG_20241007_143155994.jpg',
    altEs: 'Detalle del vestidor con estructura metalica negra',
    seoName: 'detalle_del_vestidor_con_estructura_metalica_negra',
    order: 1,
  },
  {
    recordId: 'ed48482f-c2e1-4f94-a68a-542a3b15e124',
    variantId: '08f989d0-6bba-496f-b412-0e0e8f48c1c4',
    sourceFile: 'closeth vidrio3.jpg',
    altEs: 'Closet corredizo de vidrio con acabado contemporaneo',
    seoName: 'closet_corredizo_de_vidrio_con_acabado_contemporaneo',
    order: 2,
  },
  {
    recordId: 'f9f01cb5-8d8f-4053-867c-8f04ee257d90',
    variantId: '08f989d0-6bba-496f-b412-0e0e8f48c1c4',
    sourceFile: 'closeth vidrio 4.jpg',
    altEs: 'Closet corredizo de vidrio con vista lateral',
    seoName: 'closet_corredizo_de_vidrio_con_vista_lateral',
    order: 3,
  },
];

function loadDotEnv(contents) {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;

    const value = rawValue.startsWith('"') && rawValue.endsWith('"')
      ? rawValue.slice(1, -1).replace(/\\"/g, '"')
      : rawValue.startsWith("'") && rawValue.endsWith("'")
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[key] = value;
  }
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
}

function extFromFilename(name) {
  const ext = path.extname(name).toLowerCase();
  if (!ext) return '.jpg';
  if (ext === '.jpeg') return '.jpg';
  return ext;
}

function contentTypeFromExt(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.jpg':
    case '.jpeg':
    default:
      return 'image/jpeg';
  }
}

function hashPrefix(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function normalizeBase(value) {
  return String(value || '').replace(/\/$/, '');
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function writeJson(filePath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(filePath, text, 'utf8');
}

function buildCandidateUrls(sourceFile) {
  const encodedFile = encodeURI(sourceFile);
  return sourcePathCandidates.map((prefix) => new URL(`${prefix}${encodedFile.replace(/^\/+/, '')}`, sourceSiteBase).href);
}

async function probeUrl(url, method) {
  const response = await fetch(url, {
    method,
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Codex migration script)',
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    response,
  };
}

async function resolveSourceUrl(sourceFile) {
  const tried = [];
  for (const candidate of buildCandidateUrls(sourceFile)) {
    try {
      const headProbe = await probeUrl(candidate, 'HEAD');
      tried.push({ url: candidate, method: 'HEAD', status: headProbe.status });
      const acceptableHead = headProbe.ok || headProbe.status === 405 || headProbe.status === 403;

      const getProbe = acceptableHead ? await probeUrl(candidate, 'GET') : null;
      if (getProbe) {
        tried.push({ url: candidate, method: 'GET', status: getProbe.status });
        const contentType = getProbe.contentType || headProbe.contentType || '';
        if (getProbe.ok && contentType.startsWith('image/')) {
          const buffer = Buffer.from(await getProbe.response.arrayBuffer());
          return { url: candidate, buffer, contentType, tried };
        }
      }
    } catch (error) {
      tried.push({ url: candidate, method: 'error', status: String(error?.message || error) });
    }
  }

  const summary = tried.map((entry) => `${entry.method} ${entry.url} -> ${entry.status}`).join(' | ');
  throw new Error(`No se pudo resolver la imagen fuente para ${sourceFile}. Intentos: ${summary}`);
}

async function uploadToR2({ buffer, contentType, key, s3 }) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.CF_R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

async function verifyPublicUrl(publicUrl) {
  const headProbe = await probeUrl(publicUrl, 'HEAD');
  if (!headProbe.ok) {
    const getProbe = await probeUrl(publicUrl, 'GET');
    if (!getProbe.ok) {
      throw new Error(`La URL publica no respondio correctamente: ${publicUrl} (HEAD ${headProbe.status}, GET ${getProbe.status})`);
    }
    return { headStatus: headProbe.status, getStatus: getProbe.status };
  }

  const getProbe = await probeUrl(publicUrl, 'GET');
  if (!getProbe.ok) {
    throw new Error(`La URL publica fallo en GET: ${publicUrl} (HEAD ${headProbe.status}, GET ${getProbe.status})`);
  }

  return { headStatus: headProbe.status, getStatus: getProbe.status };
}

function getRequiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Falta la variable requerida ${name}`);
  }
  return value;
}

function buildObjectKey({ seoName, sourceFile, variantId, order }) {
  const variantPrefix = slugify(variantId);
  const fileHash = hashPrefix(`${variantId}:${order}:${sourceFile}:${seoName}`);
  const ext = extFromFilename(sourceFile);
  return `veta_de_oro/${variantPrefix}/${String(order).padStart(2, '0')}_${seoName}_${fileHash}${ext}`;
}

function updateImageRecords(records, updates, publicBase) {
  const byId = new Map(updates.map((item) => [item.recordId, item]));
  const now = new Date().toISOString();
  let changed = 0;

  const nextRecords = records.map((record) => {
    const update = byId.get(record.id);
    if (!update) return record;

    const publicUrl = `${publicBase}/${update.key}`;
    const nextData = {
      ...record.data,
      imagen_url: publicUrl,
      descripcion: update.altEs,
    };

    changed += 1;
    return {
      ...record,
      data: nextData,
      updated_at: now,
    };
  });

  return { nextRecords, changed };
}

function updateVariantRecords(records, updates, publicBase) {
  const byVariantId = new Map();
  for (const update of updates) {
    if (!byVariantId.has(update.variantId)) {
      byVariantId.set(update.variantId, update);
    }
  }

  const now = new Date().toISOString();
  let changed = 0;

  const nextRecords = records.map((record) => {
    const update = byVariantId.get(record.id);
    if (!update) return record;

    const publicUrl = `${publicBase}/${update.key}`;
    const nextData = {
      ...record.data,
      imagenes: publicUrl,
    };

    changed += 1;
    return {
      ...record,
      data: nextData,
      updated_at: now,
    };
  });

  return { nextRecords, changed };
}

async function main() {
  if (await fs.access(envFilePath).then(() => true).catch(() => false)) {
    const envContents = await fs.readFile(envFilePath, 'utf8');
    loadDotEnv(envContents);
  }

  const accountId = getRequiredEnv('CF_ACCOUNT_ID');
  const bucket = getRequiredEnv('CF_R2_BUCKET');
  const accessKeyId = getRequiredEnv('CF_R2_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('CF_R2_SECRET_ACCESS_KEY');
  const publicBase = normalizeBase(getRequiredEnv('CF_R2_PUBLIC_URL'));

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const [imagenesRecords, variantesRecords] = await Promise.all([
    readJson(imagenesPath),
    readJson(variantesPath),
  ]);

  const plannedUploads = [];

  for (const item of manifest) {
    const key = buildObjectKey(item);
    const publicUrl = `${publicBase}/${key}`;
    const existingRecord = imagenesRecords.find((record) => record.id === item.recordId);
    const existingVariant = variantesRecords.find((record) => record.id === item.variantId);

    if (!existingRecord) {
      throw new Error(`No existe el record ${item.recordId} en imagenes_espacio.json`);
    }

    if (!existingVariant) {
      throw new Error(`No existe el record ${item.variantId} en espacio_variantes.json`);
    }

    const alreadyTargeted = existingRecord.data?.imagen_url === publicUrl && existingVariant.data?.imagenes === publicUrl;
    if (alreadyTargeted) {
      plannedUploads.push({
        ...item,
        key,
        publicUrl,
        reused: true,
      });
      continue;
    }

    let resolved = null;
    try {
      const probe = await resolveSourceUrl(item.sourceFile);
      resolved = probe;
    } catch (error) {
      throw new Error(`Fallo la descarga de ${item.sourceFile}: ${error?.message || error}`);
    }

    const expectedType = contentTypeFromExt(extFromFilename(item.sourceFile));
    const uploadType = resolved.contentType.startsWith('image/') ? resolved.contentType : expectedType;

    await uploadToR2({
      buffer: resolved.buffer,
      contentType: uploadType,
      key,
      s3,
    });

    await verifyPublicUrl(publicUrl);

    plannedUploads.push({
      ...item,
      key,
      publicUrl,
      sourceUrl: resolved.url,
      reused: false,
    });
  }

  const { nextRecords: nextImagenes, changed: imagenesChanged } = updateImageRecords(imagenesRecords, plannedUploads, publicBase);
  const { nextRecords: nextVariantes, changed: variantesChanged } = updateVariantRecords(variantesRecords, plannedUploads, publicBase);

  await writeJson(imagenesPath, nextImagenes);
  await writeJson(variantesPath, nextVariantes);

  const summary = {
    publicBase,
    bucket,
    uploaded: plannedUploads.length,
    updatedImagenesRecords: imagenesChanged,
    updatedEspacioVariantesRecords: variantesChanged,
    files: [
      path.relative(repoRoot, imagenesPath),
      path.relative(repoRoot, variantesPath),
    ],
    assets: plannedUploads.map((item) => ({
      recordId: item.recordId,
      variantId: item.variantId,
      key: item.key,
      publicUrl: item.publicUrl,
      reused: Boolean(item.reused),
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
