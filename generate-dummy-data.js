// Dummy data generator for swim school system
// Run: npm install @faker-js/faker csv-writer
// Then: node generate-dummy-data.js

const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// --- CONFIG ---
const LEVELS = [
  'Baby', 'Kiddie', 'Red 1', 'Red 2', 'Yellow 1', 'Yellow 2', 'Blue 1', 'Blue 2', 'Mini Squad', 'Squad'
];
const BRANCHES = [
  { id: 'b1', name: 'KL' },
  { id: 'b2', name: 'Penang' },
  { id: 'b3', name: 'Johor' }
];
const CLASS_TYPE_NAMES = [
  'Baby Swim', 'Kiddie Swim', 'Red Swim', 'Yellow Swim', 'Blue Swim', 'Mini Squad', 'Squad'
];
const USER_ROLES = [
  'su', 'operations_manager', 'technical_manager', 'branch_admin', 'class_coordinator', 'progress_coordinator', 'coach', 'part_time'
];
const STUDENTS_PER_LEVEL = 20;
const COACHES_PER_BRANCH = 5;
const SESSIONS_PER_CLASS = 52; // Increased from 10 to 30
const CLASSES_PER_LEVEL = 7;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// --- HELPERS ---
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }
function uuid() { return faker.string.uuid(); }

// --- BRANCHES ---
const branches = BRANCHES.map(b => ({ ...b, isDeleted: false }));

// --- LEVELS ---
const levels = LEVELS.map((name, i) => ({
  id: `l${i+1}`,
  name,
  order: i+1,
  isDeleted: false
}));

// --- SKILLS ---
const skills = [];
levels.forEach(level => {
  for (let i = 1; i <= 4; i++) {
    skills.push({
      id: `s${level.id}_${i}`,
      name: `${level.name} Skill ${i}`,
      levelId: level.id,
      isDeleted: false
    });
  }
});

// --- CLASS TYPES ---
const classTypes = [
  { id: 'ct1', name: 'Baby Swim', maxStudents: 2, allowedLevels: ['l1'] },
  { id: 'ct2', name: 'Kiddie Swim', maxStudents: 3, allowedLevels: ['l2'] },
  { id: 'ct3', name: 'Red Swim', maxStudents: 4, allowedLevels: ['l3','l4'] },
  { id: 'ct4', name: 'Yellow Swim', maxStudents: 5, allowedLevels: ['l5','l6'] },
  { id: 'ct5', name: 'Blue Swim', maxStudents: 6, allowedLevels: ['l7','l8'] },
  { id: 'ct6', name: 'Mini Squad', maxStudents: 10, allowedLevels: ['l9'] },
  { id: 'ct7', name: 'Squad', maxStudents: 20, allowedLevels: ['l10'] }
].map((ct,i) => ({
  ...ct,
  isDeleted: false,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  id: `ct${i+1}`
}));

// --- USERS (STAFF) ---
let userId = 1;
const users = [];
BRANCHES.forEach(branch => {
  for (let i = 0; i < COACHES_PER_BRANCH; i++) {
    users.push({
      id: `u${userId++}`,
      fullName: faker.person.fullName(),
      username: faker.internet.userName(),
      contact: faker.phone.number('01#########'),
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: 'coach',
      branchId: branch.id,
      isDeleted: false,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    });
  }
});
// Add 1 admin per branch
BRANCHES.forEach(branch => {
  users.push({
    id: `u${userId++}`,
    fullName: faker.person.fullName(),
    username: faker.internet.userName(),
    contact: faker.phone.number('01#########'),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: 'branch_admin',
    branchId: branch.id,
    isDeleted: false,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString()
  });
});

// --- STUDENTS ---
let studentId = 1;
const students = [];
levels.forEach(level => {
  for (let i = 0; i < STUDENTS_PER_LEVEL; i++) {
    const branch = randomFrom(BRANCHES);
    students.push({
      id: `st${studentId++}`,
      fullName: faker.person.fullName(),
      parentName: faker.person.fullName(),
      dob: faker.date.birthdate({ min: 2012, max: 2021, mode: 'year' }).toISOString().slice(0,10),
      contact: faker.phone.number('01#########'),
      email: faker.internet.email(),
      dateJoined: faker.date.past().toISOString(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      isDeleted: false,
      levelId: level.id,
      status: 'NORMAL',
      convertedAt: '',
      terminatedAt: '',
      onHoldAt: '',
      branchId: branch.id
    });
  }
});

// --- CLASSES ---
let classId = 1;
const swimClasses = [];
levels.forEach((level, i) => {
  const ct = classTypes.find(ct => ct.allowedLevels.includes(level.id));
  for (let j = 0; j < CLASSES_PER_LEVEL; j++) {
    const branch = randomFrom(BRANCHES);
    const coach = randomFrom(users.filter(u => u.role === 'coach' && u.branchId === branch.id));
    swimClasses.push({
      id: `c${classId++}`,
      day: randomFrom(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']),
      time: `${faker.number.int({min:8,max:20})}:00`,
      classTypeId: ct.id,
      branchId: branch.id,
      userId: coach.id,
      isDeleted: false,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    });
  }
});

// --- ENROLLMENTS ---
let enrollmentId = 1;
const enrollments = [];
students.forEach(student => {
  // Normal: 1 active, Mini Squad/Squad: 2-3 active
  const isSquad = ['l9','l10'].includes(student.levelId);
  const nEnroll = isSquad ? faker.number.int({min:2,max:3}) : 1;
  let possibleClasses = swimClasses.filter(c => c.classTypeId === classTypes.find(ct => ct.allowedLevels.includes(student.levelId)).id && c.branchId === student.branchId);
  // If no class for this level/branch, assign to a random class of the correct level
  if (possibleClasses.length === 0) {
    possibleClasses = swimClasses.filter(c => c.classTypeId === classTypes.find(ct => ct.allowedLevels.includes(student.levelId)).id);
  }
  for (let i = 0; i < nEnroll; i++) {
    const swimClass = randomFrom(possibleClasses);
    enrollments.push({
      id: `e${enrollmentId++}`,
      studentId: student.id,
      classId: swimClass.id,
      enrolledAt: faker.date.past().toISOString(),
      endAt: Math.random() < 0.2 ? faker.date.recent().toISOString() : '',
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      isDeleted: Math.random() < 0.1,
    });
  }
});

// --- SESSIONS & ATTENDANCE ---
let sessionId = 1;
let attendanceId = 1;
const swimClassSessions = [];
const attendances = [];
swimClasses.forEach(swimClass => {
  for (let i = 0; i < SESSIONS_PER_CLASS; i++) {
    // Spread sessions over the past 1 year
    const sessionDate = faker.date.between({from: new Date(Date.now() - 365*24*60*60*1000), to: new Date()});
    const coach = users.find(u => u.id === swimClass.userId);
    const enrolledStudents = enrollments.filter(e => e.classId === swimClass.id && !e.isDeleted).map(e => e.studentId);
    const sessionStudents = faker.helpers.arrayElements(enrolledStudents, Math.min(enrolledStudents.length, classTypes.find(ct => ct.id === swimClass.classTypeId).maxStudents));
    const sessionIdStr = `scs${sessionId++}`;
    swimClassSessions.push({
      id: sessionIdStr,
      swimClassId: swimClass.id,
      date: sessionDate.toISOString(),
      userId: coach.id,
      studentIds: JSON.stringify(sessionStudents),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      isDeleted: Math.random() < 0.05
    });
    // Attendance
    sessionStudents.forEach(stuId => {
      attendances.push({
        id: `a${attendanceId++}`,
        studentId: stuId,
        swimClassSessionId: sessionIdStr,
        confirmed: Math.random() < 0.9,
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
        isDeleted: Math.random() < 0.05
      });
    });
  }
});

// --- ASSESSMENTS ---
let assessmentId = 1;
const assessments = [];
const levelOrder = levels.map(l => l.id);
const today = new Date();

students.forEach(student => {
  // Add passed assessments for all previous levels
  const studentLevelIdx = levelOrder.indexOf(student.levelId);
  let lastDate = new Date(student.dateJoined || student.createdAt || today);
  for (let i = 0; i < studentLevelIdx; i++) {
    // Space out each passed assessment by ~30 days
    lastDate = new Date(lastDate.getTime() + 1000 * 60 * 60 * 24 * 30);
    // Clamp to today if in the future
    if (lastDate > today) lastDate = new Date(today);
    assessments.push({
      id: `as${assessmentId++}`,
      studentId: student.id,
      levelId: levelOrder[i],
      date: lastDate.toISOString(),
      videoUrl: '',
      status: 'Passed',
      remarks: '',
      createdAt: lastDate.toISOString(),
      updatedAt: lastDate.toISOString(),
      isDeleted: false
    });
  }
  // Optionally add a random assessment for their current level
  if (Math.random() < 0.7) {
    const assessDate = new Date(lastDate.getTime() + 1000 * 60 * 60 * 24 * 30);
    assessments.push({
      id: `as${assessmentId++}`,
      studentId: student.id,
      levelId: student.levelId,
      date: assessDate.toISOString(),
      videoUrl: '',
      status: randomFrom(['Scheduled','Submitted','Passed','Failed']),
      remarks: '',
      createdAt: assessDate.toISOString(),
      updatedAt: assessDate.toISOString(),
      isDeleted: Math.random() < 0.05
    });
  }
});

// --- STUDENT SKILL PROGRESS ---
let skillProgressId = 1;
const studentSkillProgress = [];
students.forEach(student => {
  // Find all levels up to and including current
  const studentLevelIdx = levelOrder.indexOf(student.levelId);
  const eligibleLevels = levelOrder.slice(0, studentLevelIdx + 1);
  // For each eligible level, randomly select some skills to mark as achieved
  eligibleLevels.forEach((levelId, idx) => {
    const levelSkills = skills.filter(s => s.levelId === levelId);
    // Each student achieves 1-4 skills per level (random)
    const nSkills = faker.number.int({min:1, max:levelSkills.length});
    const achievedSkills = faker.helpers.arrayElements(levelSkills, nSkills);
    // Find the assessment date for this level (if any)
    let assessDate = null;
    for (const a of assessments) {
      if (a.studentId === student.id && a.levelId === levelId && a.status === 'Passed') {
        assessDate = new Date(a.date);
        break;
      }
    }
    achievedSkills.forEach(skill => {
      // Achieved date: after assessment if exists, else after dateJoined
      let achievedAt = assessDate ? new Date(assessDate.getTime() + 1000 * 60 * 60 * 24 * 7) : new Date(new Date(student.dateJoined).getTime() + 1000 * 60 * 60 * 24 * 30 * idx);
      if (achievedAt > today) achievedAt = new Date(today);
      studentSkillProgress.push({
        id: `sp${skillProgressId++}`,
        studentId: student.id,
        skillId: skill.id,
        achievedAt: achievedAt.toISOString(),
        remarks: '',
        createdAt: achievedAt.toISOString(),
        updatedAt: achievedAt.toISOString(),
        isDeleted: false
      });
    });
  });
});

// --- CSV WRITERS ---
const writers = [
  { file: 'branches.csv', header: Object.keys(branches[0]), data: branches },
  { file: 'levels.csv', header: Object.keys(levels[0]), data: levels },
  { file: 'skills.csv', header: Object.keys(skills[0]), data: skills },
  { file: 'class_types.csv', header: Object.keys(classTypes[0]), data: classTypes },
  { file: 'users.csv', header: Object.keys(users[0]), data: users },
  { file: 'students.csv', header: Object.keys(students[0]), data: students },
  { file: 'swim_classes.csv', header: Object.keys(swimClasses[0]), data: swimClasses },
  { file: 'enrollments.csv', header: Object.keys(enrollments[0]), data: enrollments },
  { file: 'swim_class_sessions.csv', header: Object.keys(swimClassSessions[0]), data: swimClassSessions },
  { file: 'attendances.csv', header: Object.keys(attendances[0]), data: attendances },
  { file: 'assessments.csv', header: Object.keys(assessments[0]), data: assessments },
  { file: 'student_skill_progress.csv', header: Object.keys(studentSkillProgress[0]), data: studentSkillProgress },
];

(async () => {
  for (const w of writers) {
    const csvWriter = createCsvWriter({
      path: path.join(DATA_DIR, w.file),
      header: w.header.map(h => ({id: h, title: h}))
    });
    await csvWriter.writeRecords(w.data);
    console.log(`Wrote ${w.data.length} records to ${w.file}`);
  }
})();

// node generate-dummy-data.js