require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();

// FIX VULN-7: JWT secret loaded from environment variable, not hardcoded
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Database setup ──────────────────────────────────────────
const db = new sqlite3.Database('./university.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT,
    bio TEXT,
    phone TEXT,
    website TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course TEXT,
    grade TEXT,
    score INTEGER,
    semester TEXT,
    FOREIGN KEY(student_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    filename TEXT,
    original_name TEXT,
    course TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    recipient_id INTEGER,
    subject TEXT,
    body TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(recipient_id) REFERENCES users(id)
  )`);

  // FIX VULN-8: Passwords hashed with bcrypt before seeding
  const SALT_ROUNDS = 10;
  const seedUsers = [
    ['student1@uni.edu', 'password123', 'Alice Johnson',      'student',  'Third-year Computer Science student passionate about algorithms.', '555-0101', 'https://alice.example.com'],
    ['student2@uni.edu', 'password123', 'Bob Smith',          'student',  'Engineering student interested in embedded systems.',             '555-0102', ''],
    ['lecturer@uni.edu', 'password123', 'Dr. Carol Williams', 'lecturer', 'Professor of Computer Science, 15 years experience.',            '555-0103', 'https://cwilliams.uni.edu'],
  ];

  seedUsers.forEach(([email, password, name, role, bio, phone, website]) => {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    db.run(
      `INSERT OR IGNORE INTO users (email, password, name, role, bio, phone, website) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hash, name, role, bio, phone, website]
    );
  });

  // Seed grades
  const grades = [
    [1, 'CS101 - Intro to Programming',     'A',  92, 'Fall 2024'],
    [1, 'CS202 - Data Structures',          'B+', 88, 'Fall 2024'],
    [1, 'MATH101 - Calculus I',             'A-', 90, 'Fall 2024'],
    [1, 'CS301 - Algorithms',               'B',  84, 'Spring 2025'],
    [2, 'ENG101 - Engineering Fundamentals','B+', 87, 'Fall 2024'],
    [2, 'MATH201 - Linear Algebra',         'A',  94, 'Fall 2024'],
    [2, 'ENG210 - Circuit Analysis',        'B-', 80, 'Spring 2025'],
  ];

  grades.forEach(([sid, course, grade, score, semester]) => {
    db.run(
      `INSERT OR IGNORE INTO grades (student_id, course, grade, score, semester) VALUES (?, ?, ?, ?, ?)`,
      [sid, course, grade, score, semester]
    );
  });
});

// ── HTML escape helper (prevents stored XSS) ───────────────
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Middleware: verify JWT ──────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── File upload with type validation ───────────────────────
// FIX VULN-3: Only allow safe file types by MIME type and extension
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'text/plain',
  'image/jpeg',
  'image/png',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.zip', '.txt', '.jpg', '.jpeg', '.png']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, ZIP, TXT, JPG, PNG'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════════

// FIX VULN-1: Rate limiting on login — max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// POST /api/login
app.post('/api/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  // FIX VULN-6: Parameterised query — no SQL injection possible
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });

    // FIX VULN-2: Single generic error for both unknown email and wrong password
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // FIX VULN-8: bcrypt constant-time comparison
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });
});

// ══════════════════════════════════════════════════════════════
// GRADES
// ══════════════════════════════════════════════════════════════

app.get('/api/grades', authMiddleware, (req, res) => {
  if (req.user.role === 'lecturer') {
    db.all(
      `SELECT g.*, u.name as student_name, u.email as student_email
       FROM grades g JOIN users u ON g.student_id = u.id`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Internal server error' });
        res.json(rows);
      }
    );
  } else {
    db.all(
      `SELECT * FROM grades WHERE student_id = ?`,
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Internal server error' });
        res.json(rows);
      }
    );
  }
});

// ══════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ══════════════════════════════════════════════════════════════

// POST /api/assignments
app.post('/api/assignments', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    // FIX VULN-3: Return clean error if file type is rejected
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { course } = req.body;
  db.run(
    `INSERT INTO assignments (student_id, filename, original_name, course) VALUES (?, ?, ?, ?)`,
    [req.user.id, req.file.filename, req.file.originalname, course],
    function (err) {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.json({
        id: this.lastID,
        filename: req.file.filename,
        original_name: req.file.originalname,
        course,
      });
    }
  );
});

// GET /api/assignments
app.get('/api/assignments', authMiddleware, (req, res) => {
  const query =
    req.user.role === 'lecturer'
      ? `SELECT a.*, u.name as student_name FROM assignments a JOIN users u ON a.student_id = u.id ORDER BY a.submitted_at DESC`
      : `SELECT * FROM assignments WHERE student_id = ? ORDER BY submitted_at DESC`;

  const params = req.user.role === 'lecturer' ? [] : [req.user.id];

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.json(rows);
  });
});

// ══════════════════════════════════════════════════════════════
// MESSAGES
// ══════════════════════════════════════════════════════════════

app.get('/api/messages', authMiddleware, (req, res) => {
  db.all(
    `SELECT m.*, u.name as sender_name, u.email as sender_email
     FROM messages m JOIN users u ON m.sender_id = u.id
     WHERE m.recipient_id = ?
     ORDER BY m.sent_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.json(rows);
    }
  );
});

app.get('/api/users', authMiddleware, (req, res) => {
  db.all(
    `SELECT id, name, email, role FROM users WHERE id != ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.json(rows);
    }
  );
});

// POST /api/messages
// FIX VULN-4: Escape HTML in subject and body before storing
app.post('/api/messages', authMiddleware, (req, res) => {
  const { recipient_id, subject, body } = req.body;

  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(body);

  db.run(
    `INSERT INTO messages (sender_id, recipient_id, subject, body) VALUES (?, ?, ?, ?)`,
    [req.user.id, recipient_id, safeSubject, safeBody],
    function (err) {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.json({ id: this.lastID, message: 'Message sent successfully' });
    }
  );
});

// ══════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════

app.get('/api/profile', authMiddleware, (req, res) => {
  db.get(
    `SELECT id, email, name, role, bio, phone, website FROM users WHERE id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.json(row);
    }
  );
});

// PUT /api/profile
// FIX VULN-5: Escape HTML in all profile fields before storing
app.put('/api/profile', authMiddleware, (req, res) => {
  const { name, bio, phone, website } = req.body;

  const safeName    = escapeHtml(name);
  const safeBio     = escapeHtml(bio);
  const safePhone   = escapeHtml(phone);
  const safeWebsite = escapeHtml(website);

  db.run(
    `UPDATE users SET name = ?, bio = ?, phone = ?, website = ? WHERE id = ?`,
    [safeName, safeBio, safePhone, safeWebsite, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
