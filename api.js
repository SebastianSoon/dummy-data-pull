// Express API for Swim School Analytics
// Run: npm install express cors csv-parse

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
app.use(cors());

const DATA_DIR = path.join(__dirname, 'data');
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

function readCsv(file) {
  const content = fs.readFileSync(path.join(DATA_DIR, file));
  return parse(content, { columns: true, skip_empty_lines: true });
}

// --- Data Loaders ---
const loaders = {
  branches: () => readCsv('branches.csv'),
  users: () => readCsv('users.csv'),
  students: () => readCsv('students.csv'),
  levels: () => readCsv('levels.csv'),
  skills: () => readCsv('skills.csv'),
  classTypes: () => readCsv('class_types.csv'),
  swimClasses: () => readCsv('swim_classes.csv'),
  enrollments: () => readCsv('enrollments.csv'),
  swimClassSessions: () => readCsv('swim_class_sessions.csv'),
  attendances: () => readCsv('attendances.csv'),
  assessments: () => readCsv('assessments.csv'),
};

// --- Helper: parse booleans ---
function parseBool(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return false;
}
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Branches ---
app.get('/branches', (req, res) => {
  res.json(loaders.branches());
});
app.get('/branches/:id', (req, res) => {
  const branch = loaders.branches().find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Not found' });
  res.json(branch);
});

// --- Users ---
app.get('/users', (req, res) => {
  let users = loaders.users();
  if (req.query.role) users = users.filter(u => u.role === req.query.role);
  if (req.query.branchId) users = users.filter(u => u.branchId === req.query.branchId);
  res.json(users);
});
app.get('/users/:id', (req, res) => {
  const user = loaders.users().find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// --- Students ---
app.get('/students', (req, res) => {
  let students = loaders.students();
  if (req.query.levelId) students = students.filter(s => s.levelId === req.query.levelId);
  if (req.query.branchId) students = students.filter(s => s.branchId === req.query.branchId);
  if (req.query.status) students = students.filter(s => s.status === req.query.status);
  res.json(students);
});
app.get('/students/:id', (req, res) => {
  const student = loaders.students().find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json(student);
});
app.get('/students/:id/enrollments', (req, res) => {
  const enrollments = loaders.enrollments().filter(e => e.studentId === req.params.id);
  res.json(enrollments);
});
app.get('/students/:id/assessments', (req, res) => {
  const assessments = loaders.assessments().filter(a => a.studentId === req.params.id);
  res.json(assessments);
});
app.get('/students/:id/attendances', (req, res) => {
  const attendances = loaders.attendances().filter(a => a.studentId === req.params.id);
  res.json(attendances);
});

// --- Levels & Skills ---
app.get('/levels', (req, res) => {
  res.json(loaders.levels());
});
app.get('/levels/:id', (req, res) => {
  const level = loaders.levels().find(l => l.id === req.params.id);
  if (!level) return res.status(404).json({ error: 'Not found' });
  res.json(level);
});
app.get('/levels/:id/skills', (req, res) => {
  const skills = loaders.skills().filter(s => s.levelId === req.params.id);
  res.json(skills);
});
app.get('/skills', (req, res) => {
  let skills = loaders.skills();
  if (req.query.levelId) skills = skills.filter(s => s.levelId === req.query.levelId);
  res.json(skills);
});

// --- Class Types ---
app.get('/class-types', (req, res) => {
  res.json(loaders.classTypes());
});
app.get('/class-types/:id', (req, res) => {
  const ct = loaders.classTypes().find(c => c.id === req.params.id);
  if (!ct) return res.status(404).json({ error: 'Not found' });
  res.json(ct);
});

// --- Swim Classes ---
app.get('/swim-classes', (req, res) => {
  let classes = loaders.swimClasses();
  if (req.query.branchId) classes = classes.filter(c => c.branchId === req.query.branchId);
  if (req.query.classTypeId) classes = classes.filter(c => c.classTypeId === req.query.classTypeId);
  if (req.query.levelId) {
    // Find class types for this level
    const cts = loaders.classTypes().filter(ct => JSON.parse(ct.allowedLevels.replace(/'/g,'"')).includes(req.query.levelId)).map(ct => ct.id);
    classes = classes.filter(c => cts.includes(c.classTypeId));
  }
  res.json(classes);
});
app.get('/swim-classes/:id', (req, res) => {
  const swimClass = loaders.swimClasses().find(c => c.id === req.params.id);
  if (!swimClass) return res.status(404).json({ error: 'Not found' });
  res.json(swimClass);
});
app.get('/swim-classes/:id/sessions', (req, res) => {
  const sessions = loaders.swimClassSessions().filter(s => s.swimClassId === req.params.id);
  res.json(sessions);
});

// --- Swim Class Sessions ---
app.get('/swim-class-sessions', (req, res) => {
  let sessions = loaders.swimClassSessions();
  if (req.query.swimClassId) sessions = sessions.filter(s => s.swimClassId === req.query.swimClassId);
  if (req.query.dateFrom) sessions = sessions.filter(s => new Date(s.date) >= new Date(req.query.dateFrom));
  if (req.query.dateTo) sessions = sessions.filter(s => new Date(s.date) <= new Date(req.query.dateTo));
  res.json(sessions);
});
app.get('/swim-class-sessions/:id', (req, res) => {
  const session = loaders.swimClassSessions().find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});
app.get('/swim-class-sessions/:id/attendances', (req, res) => {
  const attendances = loaders.attendances().filter(a => a.swimClassSessionId === req.params.id);
  res.json(attendances);
});

// --- Enrollments ---
app.get('/enrollments', (req, res) => {
  let enrollments = loaders.enrollments();
  if (req.query.studentId) enrollments = enrollments.filter(e => e.studentId === req.query.studentId);
  if (req.query.classId) enrollments = enrollments.filter(e => e.classId === req.query.classId);
  if (req.query.active) enrollments = enrollments.filter(e => !e.endAt && !parseBool(e.isDeleted));
  res.json(enrollments);
});
app.get('/enrollments/:id', (req, res) => {
  const enrollment = loaders.enrollments().find(e => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Not found' });
  res.json(enrollment);
});

// --- Assessments ---
app.get('/assessments', (req, res) => {
  let assessments = loaders.assessments();
  if (req.query.studentId) assessments = assessments.filter(a => a.studentId === req.query.studentId);
  if (req.query.levelId) assessments = assessments.filter(a => a.levelId === req.query.levelId);
  if (req.query.status) assessments = assessments.filter(a => a.status === req.query.status);
  res.json(assessments);
});
app.get('/assessments/:id', (req, res) => {
  const assessment = loaders.assessments().find(a => a.id === req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Not found' });
  res.json(assessment);
});

// --- Attendance ---
app.get('/attendances', (req, res) => {
  let attendances = loaders.attendances();
  if (req.query.studentId) attendances = attendances.filter(a => a.studentId === req.query.studentId);
  if (req.query.swimClassSessionId) attendances = attendances.filter(a => a.swimClassSessionId === req.query.swimClassSessionId);
  if (req.query.confirmed) attendances = attendances.filter(a => parseBool(a.confirmed) === parseBool(req.query.confirmed));
  res.json(attendances);
});
app.get('/attendances/:id', (req, res) => {
  const attendance = loaders.attendances().find(a => a.id === req.params.id);
  if (!attendance) return res.status(404).json({ error: 'Not found' });
  res.json(attendance);
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
