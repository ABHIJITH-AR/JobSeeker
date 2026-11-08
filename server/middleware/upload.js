const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const RESUME_DIR = path.join(UPLOAD_ROOT, 'resumes');
const LOGO_DIR = path.join(UPLOAD_ROOT, 'logos');
const NOTIFICATION_DIR = path.join(UPLOAD_ROOT, 'notifications');
const PROFILE_DIR = path.join(UPLOAD_ROOT, 'profiles');

[UPLOAD_ROOT, RESUME_DIR, LOGO_DIR, NOTIFICATION_DIR, PROFILE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const MAX_RESUME_MB = Number(process.env.MAX_RESUME_MB || 5);
const MAX_LOGO_MB = Number(process.env.MAX_LOGO_MB || 2);
const MAX_GLOBAL_MB = Math.max(MAX_RESUME_MB, MAX_LOGO_MB);

const RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const RESUME_EXT = new Set(['.pdf', '.doc', '.docx']);
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function destinationFor(fieldname) {
  if (fieldname === 'logo') return LOGO_DIR;
  if (fieldname === 'photo') return PROFILE_DIR;
  if (fieldname === 'notificationPdf') return NOTIFICATION_DIR;
  return RESUME_DIR;
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, destinationFor(file.fieldname));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'logo' || file.fieldname === 'photo') {
    if (!IMAGE_MIME.has(file.mimetype) || !IMAGE_EXT.has(ext)) {
      return cb(new Error('Image must be a JPG, PNG, WEBP or GIF file.'));
    }
    return cb(null, true);
  }
  if (file.fieldname === 'notificationPdf') {
    if (file.mimetype !== 'application/pdf' || ext !== '.pdf') {
      return cb(new Error('Official notification must be a PDF file.'));
    }
    return cb(null, true);
  }
  if (!RESUME_MIME.has(file.mimetype) || !RESUME_EXT.has(ext)) {
    return cb(new Error('Resume must be a PDF, DOC or DOCX file.'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_GLOBAL_MB * 1024 * 1024, files: 2 },
});

function cleanupFile(file) {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      // ignore cleanup failures
    }
  }
}

function fileMeta(file) {
  if (!file) return null;
  return {
    filename: file.filename,
    originalName: file.originalname,
    storedName: file.filename,
    path: path.relative(path.join(__dirname, '..'), file.path).split(path.sep).join('/'),
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };
}

module.exports = {
  upload,
  uploadResume: upload.single('resume'),
  uploadLogo: upload.single('logo'),
  uploadPhoto: upload.single('photo'),
  uploadJobFiles: upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'notificationPdf', maxCount: 1 },
  ]),
  cleanupFile,
  fileMeta,
  RESUME_DIR,
  LOGO_DIR,
  NOTIFICATION_DIR,
  PROFILE_DIR,
  MAX_RESUME_MB,
  MAX_LOGO_MB,
};
