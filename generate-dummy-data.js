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
  'su', 'head_coach', 'branch_admin', 'coach', 'part_time'
];
const STUDENTS_PER_LEVEL = 20;
const COACHES_PER_BRANCH = 5;
const SESSIONS_PER_CLASS = 60;
const CLASSES_PER_LEVEL = 7;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// --- HELPERS ---
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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
// Ensure both underperforming coaches are in the same branch (Penang)
const underperformingBranchId = 'b2';
// Add 2 underperforming coaches to Penang first
for (let i = 0; i < 2; i++) {
  users.push({
    id: `u${userId++}`,
    fullName: faker.person.fullName(),
    username: faker.internet.username(),
    contact: faker.phone.number('01#########'),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: 'coach',
    branchId: underperformingBranchId,
    isDeleted: false,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString()
  });
}
// Add remaining coaches per branch
BRANCHES.forEach(branch => {
  let n = COACHES_PER_BRANCH;
  if (branch.id === underperformingBranchId) n -= 2; // already added 2
  for (let i = 0; i < n; i++) {
    users.push({
      id: `u${userId++}`,
      fullName: faker.person.fullName(),
      username: faker.internet.username(),
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
    username: faker.internet.username(),
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

// Add 1 admin per branch
BRANCHES.forEach(branch => {
  users.push({
    id: `u${userId++}`,
    fullName: faker.person.fullName(),
    username: faker.internet.username(),
    contact: faker.phone.number('01#########'),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: 'head_coach',
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
    const sid = `st${studentId}`;
    students.push({
      id: sid,
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
    studentId++;
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

// --- Update students ONHOLD status for Monday classes ---
const mondayClassIds = swimClasses.filter(c => c.day === 'Monday').map(c => c.id);
const mondayStudentIds = enrollments.filter(e => mondayClassIds.includes(e.classId)).map(e => e.studentId);
students.forEach(stu => {
  if (mondayStudentIds.includes(stu.id)) {
if (Math.random() < 0.7) {
  if (Math.random() < 0.5) {
    stu.status = 'ONHOLD';
    stu.onHoldAt = faker.date.recent().toISOString();
  } else {
    stu.status = 'TERMINATED';
    stu.terminatedAt = faker.date.recent().toISOString();
  }
}
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

// --- Simulate slowing Red 2 -> Yellow 1 graduation trend ---
const red2Id = levels.find(l => l.name === 'Red 2').id;
const yellow1Id = levels.find(l => l.name === 'Yellow 1').id;
const gradMonths = [2, 1, 0]; // 2 months ago, 1 month ago, this month
const gradsPerMonth = [8, 5, 2]; // Decreasing number of graduates
let red2ToYellow1Grads = [];
let gradStudentPool = students.filter(s => s.levelId === yellow1Id);
gradMonths.forEach((mIdx, i) => {
  // Pick unique students for each month
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - mIdx, 10);
  const n = Math.min(gradsPerMonth[i], gradStudentPool.length);
  const chosen = faker.helpers.arrayElements(gradStudentPool, n);
  chosen.forEach(stu => {
    // Passed Red 2 assessment at this month
    assessments.push({
      id: `as${assessmentId++}`,
      studentId: stu.id,
      levelId: red2Id,
      date: monthAgo.toISOString(),
      videoUrl: '',
      status: 'Passed',
      remarks: '',
      createdAt: monthAgo.toISOString(),
      updatedAt: monthAgo.toISOString(),
      isDeleted: false
    });
    // Optionally, add a Yellow 1 assessment (Scheduled/Submitted)
    if (Math.random() < 0.5) {
      const yellow1Date = new Date(monthAgo.getTime() + 1000 * 60 * 60 * 24 * 30);
      assessments.push({
        id: `as${assessmentId++}`,
        studentId: stu.id,
        levelId: yellow1Id,
        date: yellow1Date.toISOString(),
        videoUrl: '',
        status: randomFrom(['Scheduled','Submitted']),
        remarks: '',
        createdAt: yellow1Date.toISOString(),
        updatedAt: yellow1Date.toISOString(),
        isDeleted: false
      });
    }
  });
  // Remove chosen from pool to avoid duplicate assignment
  gradStudentPool = gradStudentPool.filter(s => !chosen.includes(s));
  red2ToYellow1Grads = red2ToYellow1Grads.concat(chosen.map(s => s.id));
});

// For all other students, generate normal assessments
students.forEach(student => {
  // Skip if already handled in Red2->Yellow1 trend
  if (red2ToYellow1Grads.includes(student.id)) return;
  // Add passed assessments for all previous levels
  const studentLevelIdx = levelOrder.indexOf(student.levelId);
  let lastDate = new Date(student.dateJoined || student.createdAt || today);
  for (let i = 0; i < studentLevelIdx; i++) {
    // Space out each passed assessment by ~30 days
    lastDate = new Date(lastDate.getTime() + 1000 * 60 * 60 * 24 * 30);
    // Clamp to today if in the future
    if (lastDate > today) lastDate = new Date(today);
    // If this is Red 2 -> Yellow 1, skip (already handled)
    if (levelOrder[i] === red2Id && student.levelId === yellow1Id) continue;
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
// ...existing code...
let skillProgressId = 1;
const studentSkillProgress = [];
// Identify two underperforming coaches (first two in KL) and one good performing coach
const coachUsers = users.filter(u => u.role === 'coach');
const underperformingCoaches = coachUsers.filter(u => u.branchId === underperformingBranchId).slice(0,2);
const goodCoach = coachUsers[coachUsers.length-1];
const underperformingCoachIds = underperformingCoaches.map(c => c.id);
const goodCoachId = goodCoach.id;
const underperformingClassIds = swimClasses.filter(c => underperformingCoachIds.includes(c.userId)).map(c => c.id);
const goodCoachClassIds = swimClasses.filter(c => c.userId === goodCoachId).map(c => c.id);
const underperformingStudentIds = enrollments.filter(e => underperformingClassIds.includes(e.classId)).map(e => e.studentId);
const goodCoachStudentIds = enrollments.filter(e => goodCoachClassIds.includes(e.classId)).map(e => e.studentId);

students.forEach(student => {
  // Find all levels up to and including current
  const studentLevelIdx = levelOrder.indexOf(student.levelId);
  const eligibleLevels = levelOrder.slice(0, studentLevelIdx + 1);
  // If student is taught by underperforming coach, reduce skill progress
  let minSkills = 1, maxSkills = 4;
  if (underperformingStudentIds.includes(student.id)) {
    minSkills = 1; maxSkills = 2; // fewer skills achieved
  }
  // If student is taught by good coach, increase skill progress
  if (goodCoachStudentIds.includes(student.id)) {
    minSkills = 3; maxSkills = 4; // more skills achieved
  }
  eligibleLevels.forEach((levelId, idx) => {
    const levelSkills = skills.filter(s => s.levelId === levelId);
    const nSkills = faker.number.int({min: minSkills, max: Math.min(maxSkills, levelSkills.length)});
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

// --- PACKAGE TYPES ---
let packageTypeId = 1;
const packageTypes = [
  { name: 'Standard', totalClasses: 8, price: 400, validityDays: 60 },
  { name: 'Premium', totalClasses: 12, price: 600, validityDays: 90 },
  { name: 'Trial', totalClasses: 2, price: 80, validityDays: 14 }
].map(pt => ({
  id: `pt${packageTypeId++}`,
  ...pt,
  isActive: true,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString()
}));

// --- PACKAGES ---
let packageId = 1;
const packages = [];
students.forEach(student => {
  // Each student can have 2-5 packages, but only one active (classRemaining > 0)
  let n = faker.number.int({ min: 2, max: 5 });
  let activeAssigned = false;
  // If this student is in a Monday class, all packages inactive
  const mondayInactive = mondayStudentIds.includes(student.id);
  // Penang (underperforming) students: simulate package purchase decline in June 2025
  // KL and Johor: keep May/June 2025 sales steady
  const studentBranch = students.find(s => s.id === student.id)?.branchId;
  if (studentBranch === 'b2') {
    // Penang: Drastic decline from April -> May -> June 2025
    // 60% of packages in April, 30% in May, 10% in June (or less)
    let aprilCount = Math.ceil(n * 0.6);
    let mayCount = Math.floor(n * 0.3);
    let juneCount = n - (aprilCount + mayCount);
    let monthOrder = [];
    for (let i = 0; i < aprilCount; i++) monthOrder.push('april');
    for (let i = 0; i < mayCount; i++) monthOrder.push('may');
    for (let i = 0; i < juneCount; i++) monthOrder.push('june');
    monthOrder = faker.helpers.shuffle(monthOrder);
    for (let i = 0; i < n; i++) {
      const pt = randomFrom(packageTypes);
      const total = pt.totalClasses;
      let classRemaining = 0;
      let createdAt;
      if (!mondayInactive) {
        if (!activeAssigned && (i === n - 1 || Math.random() < 0.5)) {
          classRemaining = faker.number.int({ min: 1, max: total });
          activeAssigned = true;
        }
      }
      if (monthOrder[i] === 'april') {
        createdAt = faker.date.between({from: '2025-04-01', to: '2025-04-30'}).toISOString();
      } else if (monthOrder[i] === 'may') {
        createdAt = faker.date.between({from: '2025-05-01', to: '2025-05-31'}).toISOString();
      } else {
        // Only a tiny fraction in June
        createdAt = faker.date.between({from: '2025-06-01', to: '2025-06-30'}).toISOString();
      }
      const firstClassDate = createdAt;
      const expiredAt = classRemaining === 0 && Math.random() < 0.5 ? faker.date.future().toISOString() : '';
      packages.push({
        id: `pkg${packageId++}`,
        studentId: student.id,
        packageTypeId: pt.id,
        firstClassDate: createdAt,
        expiredAt,
        classRemaining,
        isDeleted: false,
        createdAt: createdAt,
        updatedAt: faker.date.recent().toISOString()
      });
    }
  } else {
    // KL/Johor/others: distribute packages randomly, allow May/June, keep counts roughly equal
    // We'll assign half to May, half to June, rest to other months
    let mayJune = [];
    let otherMonths = [];
    let mayCount = Math.floor(n/2);
    let juneCount = Math.floor(n/2);
    let rest = n - (mayCount + juneCount);
    for (let i = 0; i < mayCount; i++) mayJune.push('may');
    for (let i = 0; i < juneCount; i++) mayJune.push('june');
    for (let i = 0; i < rest; i++) otherMonths.push('other');
    // Shuffle order
    let monthOrder = faker.helpers.shuffle([...mayJune, ...otherMonths]);
    for (let i = 0; i < n; i++) {
      const pt = randomFrom(packageTypes);
      const total = pt.totalClasses;
      let classRemaining = 0;
      let createdAt;
      if (!mondayInactive) {
        if (!activeAssigned && (i === n - 1 || Math.random() < 0.5)) {
          classRemaining = faker.number.int({ min: 1, max: total });
          activeAssigned = true;
        }
      }
      if (monthOrder[i] === 'may') {
        createdAt = faker.date.between({from: '2025-05-01', to: '2025-05-31'}).toISOString();
      } else if (monthOrder[i] === 'june') {
        createdAt = faker.date.between({from: '2025-06-01', to: '2025-06-30'}).toISOString();
      } else {
        // Pick a random month except May/June
        let year = 2025;
        let monthChoices = [1,2,3,4,7,8,9,10,11,12];
        let month = randomFrom(monthChoices);
        let day = faker.number.int({min:1,max:28});
        createdAt = new Date(year, month-1, day).toISOString();
      }
      const firstClassDate = createdAt;
      const expiredAt = classRemaining === 0 && Math.random() < 0.5 ? faker.date.future().toISOString() : '';
      packages.push({
        id: `pkg${packageId++}`,
        studentId: student.id,
        packageTypeId: pt.id,
        firstClassDate: createdAt,
        expiredAt,
        classRemaining,
        isDeleted: false,
        createdAt: createdAt,
        updatedAt: faker.date.recent().toISOString()
      });
    }
  }
});

// --- COACH LEVELS ---
let coachLevelId = 1;
const coachLevels = [
  { name: 'Junior Coach', order: 1 },
  { name: 'Senior Coach', order: 2 },
  { name: 'Head Coach', order: 3 }
].map(cl => ({
  id: `cl${coachLevelId++}`,
  ...cl,
  isDeleted: false
}));

// --- CERTS ---
let certId = 1;
const certs = [
  { name: 'CPR' },
  { name: 'Swim Teacher' },
  { name: 'First Aid' }
].map(cert => ({
  id: `cert${certId++}`,
  ...cert,
  isDeleted: false
}));

// --- USER CERTS ---
let userCertId = 1;
const userCerts = [];
users.forEach(user => {
  // Each user gets 1-2 certs
  const n = faker.number.int({ min: 1, max: 2 });
  const certChoices = faker.helpers.arrayElements(certs, n);
  certChoices.forEach(cert => {
    userCerts.push({
      id: `uc${userCertId++}`,
      userId: user.id,
      certId: cert.id
    });
  });
});

// --- EVALUATIONS ---
let evaluationId = 1;
const evaluations = [];
swimClassSessions.forEach(session => {
  // 10% of sessions have an evaluation
  if (Math.random() < 0.1) {
    const coach = users.find(u => u.id === session.userId);
    const headCoaches = users.filter(u => u.role === 'head_coach' && u.id !== coach.id);
    if (headCoaches.length === 0) return; // skip if no head coach

    const assessor = randomFrom(headCoaches);
    const level = randomFrom(levels);
    const coachLevel = randomFrom(coachLevels);
    let result = Math.random() < 0.85;
    // If underperforming coach, most evaluations fail
    if (underperformingCoachIds.includes(coach.id)) {
      result = Math.random() < 0.2; // 80% fail
    }
    // If good coach, most evaluations pass
    if (coach.id === goodCoachId) {
      result = Math.random() < 0.95; // 95% pass
    }
    // Separate positive and negative evaluation comments
    const positiveComments = [
      'Coach demonstrated excellent communication with students.',
      'Lesson plan was well structured and clear.',
      'Students showed good progress under coach guidance.',
      'Coach provided helpful feedback to students.',
      'Coach adapted well to student needs.',
      'Safety protocols were followed throughout the session.',
      'Coach showed strong leadership skills.',
      'Coach maintained positive energy in class.'
    ];
    const negativeComments = [
      'Coach needs to improve time management during sessions.',
      'Coach struggled to maintain class discipline.',
      'Lesson objectives were not fully met.',
      'Coach should work on engaging quieter students.',
      'Coach was late to the session.',
      'Coach needs to improve technical explanations.',
      'Coach did not complete the planned activities.'
    ];
    const comment = result ? randomFrom(positiveComments) : randomFrom(negativeComments);
    evaluations.push({
      id: `ev${evaluationId++}`,
      coachId: coach.id,
      assessorId: assessor.id,
      day: randomFrom(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']),
      time: `${faker.number.int({min:8,max:20})}:00`,
      levelId: level.id,
      numberOfStudents: faker.number.int({min:2,max:10}),
      comments: comment,
      lessonPlanClear: Math.random() < 0.8,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      swimClassSessionId: session.id,
      coachLevelId: coachLevel.id,
      result
    });
  }
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
  { file: 'package_types.csv', header: Object.keys(packageTypes[0]), data: packageTypes },
  { file: 'packages.csv', header: Object.keys(packages[0]), data: packages },
  { file: 'coach_levels.csv', header: Object.keys(coachLevels[0]), data: coachLevels },
  { file: 'certs.csv', header: Object.keys(certs[0]), data: certs },
  { file: 'user_certs.csv', header: Object.keys(userCerts[0]), data: userCerts },
  { file: 'evaluations.csv', header: Object.keys(evaluations[0]), data: evaluations },
];

// Print names of special coaches
console.log('Underperforming Coaches:');
underperformingCoaches.forEach(c => console.log(`- ${c.fullName} (id: ${c.id})`));
console.log('Good Performing Coach:');
console.log(`- ${goodCoach.fullName} (id: ${goodCoach.id})`);

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