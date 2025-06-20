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
app.use(cors({ origin: '*' }));
app.use(express.json());

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

// --- POST endpoints for ID-based queries ---
app.post('/branches/by-id', (req, res) => {
  const { branchId } = req.body;
  const branch = loaders.branches().find(b => b.id === branchId);
  if (!branch) return res.status(404).json({ error: 'Not found' });
  res.json({
    ...branch
  });
});

// --- Users ---
app.get('/users', (req, res) => {
  let users = loaders.users();
  if (req.query.role) users = users.filter(u => u.role === req.query.role);
  if (req.query.branchId) users = users.filter(u => u.branchId === req.query.branchId);
  res.json(users.map(u => {
    const branch = loaders.branches().find(b => b.id === u.branchId);
    return { ...u, branchName: branch ? branch.name : null };
  }));
});

app.post('/users/by-id', (req, res) => {
  const { userId } = req.body;
  const user = loaders.users().find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const branch = loaders.branches().find(b => b.id === user.branchId);
  res.json({
    ...user,
    branchName: branch ? branch.name : null
  });
});

// --- Students ---
app.get('/students', (req, res) => {
  let students = loaders.students();
  if (req.query.levelId) students = students.filter(s => s.levelId === req.query.levelId);
  if (req.query.branchId) students = students.filter(s => s.branchId === req.query.branchId);
  if (req.query.status) students = students.filter(s => s.status === req.query.status);
  res.json(students.map(s => {
    const branch = loaders.branches().find(b => b.id === s.branchId);
    const level = loaders.levels().find(l => l.id === s.levelId);
    return { ...s, branchName: branch ? branch.name : null, levelName: level ? level.name : null };
  }));
});

app.post('/students/by-id', (req, res) => {
  const { studentId } = req.body;
  const student = loaders.students().find(s => s.id === studentId);
  if (!student) return res.status(404).json({ error: 'Not found' });
  const branch = loaders.branches().find(b => b.id === student.branchId);
  const level = loaders.levels().find(l => l.id === student.levelId);
  res.json({
    ...student,
    branchName: branch ? branch.name : null,
    levelName: level ? level.name : null
  });
});
app.post('/students/enrollments-by-student', (req, res) => {
  const { studentId } = req.body;
  const enrollments = loaders.enrollments().filter(e => e.studentId === studentId);
  res.json(enrollments);
});
app.post('/students/assessments-by-student', (req, res) => {
  const { studentId } = req.body;
  const assessments = loaders.assessments().filter(a => a.studentId === studentId);
  res.json(assessments);
});
app.post('/students/attendances-by-student', (req, res) => {
  const { studentId } = req.body;
  const attendances = loaders.attendances().filter(a => a.studentId === studentId);
  res.json(attendances);
});

// --- Levels & Skills ---
app.get('/levels', (req, res) => {
  res.json(loaders.levels());
});

app.post('/levels/by-id', (req, res) => {
  const { levelId } = req.body;
  const level = loaders.levels().find(l => l.id === levelId);
  if (!level) return res.status(404).json({ error: 'Not found' });
  res.json({ ...level });
});
app.post('/levels/skills-by-level', (req, res) => {
  const { levelId } = req.body;
  const skills = loaders.skills().filter(s => s.levelId === levelId);
  res.json(skills);
});
app.get('/skills', (req, res) => {
  let skills = loaders.skills();
  if (req.query.levelId) skills = skills.filter(s => s.levelId === req.query.levelId);
  res.json(skills.map(skill => {
    const level = loaders.levels().find(l => l.id === skill.levelId);
    return { ...skill, levelName: level ? level.name : null };
  }));
});

// --- Class Types ---
app.get('/class-types', (req, res) => {
  res.json(loaders.classTypes());
});

app.post('/class-types/by-id', (req, res) => {
  const { classTypeId } = req.body;
  const ct = loaders.classTypes().find(c => c.id === classTypeId);
  if (!ct) return res.status(404).json({ error: 'Not found' });
  res.json({ ...ct });
});

// --- Swim Classes ---
app.get('/swim-classes', (req, res) => {
  let classes = loaders.swimClasses();
  if (req.query.branchId) classes = classes.filter(c => c.branchId === req.query.branchId);
  if (req.query.classTypeId) classes = classes.filter(c => c.classTypeId === req.query.classTypeId);
  if (req.query.levelId) {
    // Find class types for this level, handling allowedLevels as CSV string
    let cts = [];
    try {
      cts = loaders.classTypes().filter(ct => {
        if (!ct.allowedLevels) return false;
        // allowedLevels can be a single value or comma-separated
        let allowed = ct.allowedLevels.split(',').map(s => s.trim());
        return allowed.includes(req.query.levelId);
      }).map(ct => ct.id);
    } catch (err) {
      return res.status(500).json({ error: 'Error processing allowedLevels in classTypes' });
    }
    classes = classes.filter(c => cts.includes(c.classTypeId));
  }
  res.json(classes.map(c => {
    const classType = loaders.classTypes().find(ct => ct.id === c.classTypeId);
    const branch = loaders.branches().find(b => b.id === c.branchId);
    const user = loaders.users().find(u => u.id === c.userId);
    return {
      ...c,
      classTypeName: classType ? classType.name : null,
      branchName: branch ? branch.name : null,
      userName: user ? user.name : null
    };
  }));
});

app.post('/swim-classes/by-id', (req, res) => {
  const { swimClassId } = req.body;
  const swimClass = loaders.swimClasses().find(c => c.id === swimClassId);
  if (!swimClass) return res.status(404).json({ error: 'Not found' });

  // Lookup names for classTypeId, branchId, userId
  const classType = loaders.classTypes().find(ct => ct.id === swimClass.classTypeId);
  const branch = loaders.branches().find(b => b.id === swimClass.branchId);
  const user = loaders.users().find(u => u.id === swimClass.userId);

  res.json({
    ...swimClass,
    classTypeName: classType ? classType.name : null,
    branchName: branch ? branch.name : null,
    userName: user ? user.name : null
  });
});
app.post('/swim-classes/sessions-by-class', (req, res) => {
  const { swimClassId } = req.body;
  const sessions = loaders.swimClassSessions().filter(s => s.swimClassId === swimClassId);
  res.json(sessions);
});

// --- Swim Class Sessions ---
app.get('/swim-class-sessions', (req, res) => {
  let sessions = loaders.swimClassSessions();
  // Defensive parse for studentIds
  sessions = sessions.map(s => {
    let studentIds = [];
    if (s.studentIds) {
      try {
        studentIds = JSON.parse(s.studentIds.replace(/'/g,'"'));
      } catch (e) {
        studentIds = [];
      }
    }
    return { ...s, studentIds };
  });
  if (req.query.swimClassId) sessions = sessions.filter(s => s.swimClassId === req.query.swimClassId);
  if (req.query.dateFrom) sessions = sessions.filter(s => new Date(s.date) >= new Date(req.query.dateFrom));
  if (req.query.dateTo) sessions = sessions.filter(s => new Date(s.date) <= new Date(req.query.dateTo));
  res.json(sessions.map(s => {
    const swimClass = loaders.swimClasses().find(c => c.id === s.swimClassId);
    return { ...s, swimClassName: swimClass ? swimClass.name : null };
  }));
});

app.post('/swim-class-sessions/by-id', (req, res) => {
  const { swimClassSessionId } = req.body;
  let session = loaders.swimClassSessions().find(s => s.id === swimClassSessionId);
  if (!session) return res.status(404).json({ error: 'Not found' });
  let studentIds = [];
  if (session.studentIds) {
    try {
      studentIds = JSON.parse(session.studentIds.replace(/'/g,'"'));
    } catch (e) {
      studentIds = [];
    }
  }
  // Add swimClassName
  const swimClass = loaders.swimClasses().find(c => c.id === session.swimClassId);
  session = { ...session, studentIds, swimClassName: swimClass ? swimClass.name : null };
  res.json(session);
});
app.post('/swim-class-sessions/attendances-by-session', (req, res) => {
  const { swimClassSessionId } = req.body;
  const attendances = loaders.attendances().filter(a => a.swimClassSessionId === swimClassSessionId);
  res.json(attendances);
});

// --- Enrollments ---
app.get('/enrollments', (req, res) => {
  let enrollments = loaders.enrollments();
  if (req.query.studentId) enrollments = enrollments.filter(e => e.studentId === req.query.studentId);
  if (req.query.classId) enrollments = enrollments.filter(e => e.classId === req.query.classId);
  if (req.query.active) enrollments = enrollments.filter(e => !e.endAt && !parseBool(e.isDeleted));
  res.json(enrollments.map(e => {
    const student = loaders.students().find(s => s.id === e.studentId);
    const swimClass = loaders.swimClasses().find(c => c.id === e.classId);
    return { ...e, studentName: student ? student.name : null, swimClassName: swimClass ? swimClass.name : null };
  }));
});
app.post('/enrollments/by-id', (req, res) => {
  const { enrollmentId } = req.body;
  const enrollment = loaders.enrollments().find(e => e.id === enrollmentId);
  if (!enrollment) return res.status(404).json({ error: 'Not found' });
  const student = loaders.students().find(s => s.id === enrollment.studentId);
  const swimClass = loaders.swimClasses().find(c => c.id === enrollment.classId);
  res.json({
    ...enrollment,
    studentName: student ? student.name : null,
    swimClassName: swimClass ? swimClass.name : null
  });
});

// --- Assessments ---
app.get('/assessments', (req, res) => {
  let assessments = loaders.assessments();
  if (req.query.studentId) assessments = assessments.filter(a => a.studentId === req.query.studentId);
  if (req.query.levelId) assessments = assessments.filter(a => a.levelId === req.query.levelId);
  if (req.query.status) assessments = assessments.filter(a => a.status === req.query.status);
  res.json(assessments.map(a => {
    const student = loaders.students().find(s => s.id === a.studentId);
    const level = loaders.levels().find(l => l.id === a.levelId);
    return { ...a, studentName: student ? student.name : null, levelName: level ? level.name : null };
  }));
});
app.post('/assessments/by-id', (req, res) => {
  const { assessmentId } = req.body;
  const assessment = loaders.assessments().find(a => a.id === assessmentId);
  if (!assessment) return res.status(404).json({ error: 'Not found' });
  const student = loaders.students().find(s => s.id === assessment.studentId);
  const level = loaders.levels().find(l => l.id === assessment.levelId);
  res.json({
    ...assessment,
    studentName: student ? student.name : null,
    levelName: level ? level.name : null
  });
});

// --- Attendance ---
app.get('/attendances', (req, res) => {
  let attendances = loaders.attendances();
  if (req.query.studentId) attendances = attendances.filter(a => a.studentId === req.query.studentId);
  if (req.query.swimClassSessionId) attendances = attendances.filter(a => a.swimClassSessionId === req.query.swimClassSessionId);
  if (req.query.confirmed) attendances = attendances.filter(a => parseBool(a.confirmed) === parseBool(req.query.confirmed));
  res.json(attendances.map(a => {
    const student = loaders.students().find(s => s.id === a.studentId);
    const swimClassSession = loaders.swimClassSessions().find(s => s.id === a.swimClassSessionId);
    return { ...a, studentName: student ? student.name : null, swimClassSessionName: swimClassSession ? swimClassSession.name : null };
  }));
});
app.post('/attendances/by-id', (req, res) => {
  const { attendanceId } = req.body;
  const attendance = loaders.attendances().find(a => a.id === attendanceId);
  if (!attendance) return res.status(404).json({ error: 'Not found' });
  const student = loaders.students().find(s => s.id === attendance.studentId);
  const swimClassSession = loaders.swimClassSessions().find(s => s.id === attendance.swimClassSessionId);
  res.json({
    ...attendance,
    studentName: student ? student.name : null,
    swimClassSessionName: swimClassSession ? swimClassSession.name : null
  });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
