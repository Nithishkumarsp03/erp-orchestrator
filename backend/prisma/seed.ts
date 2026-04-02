/**
 * Prisma Seed Script
 * ------------------
 * Populates the database with realistic sample data for development/demo.
 * Run with: npx prisma db seed  OR  npm run prisma:seed
 *
 * Data created:
 *  - 1 admin user
 *  - 3 teachers
 *  - 20 students (with grades, attendance, notes)
 *  - 6 classes
 */

import { PrismaClient, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: hash password
const hash = (pw: string) => bcrypt.hashSync(pw, 12);

// Helper: random element from array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper: date N days ago
const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data in correct order (foreign keys)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ──────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@dashboard.edu',
      passwordHash: hash('Admin@1234'),
      role: 'ADMIN',
    },
  });

  // ── Teachers ───────────────────────────────────────────────────────
  const teacherData = [
    { name: 'Dr. Sarah Chen', email: 'sarah.chen@dashboard.edu', subject: 'Mathematics' },
    { name: 'Mr. James Wright', email: 'james.wright@dashboard.edu', subject: 'Science' },
    { name: 'Ms. Priya Sharma', email: 'priya.sharma@dashboard.edu', subject: 'English' },
  ];

  const teachers = await Promise.all(
    teacherData.map((t) =>
      prisma.user.create({
        data: {
          name: t.name,
          email: t.email,
          passwordHash: hash('Teacher@1234'),
          role: 'TEACHER',
        },
      })
    )
  );

  // ── Classes ────────────────────────────────────────────────────────
  const classData = [
    { name: 'Class 10-A (Mathematics)', teacherIdx: 0, schedule: { days: ['Mon', 'Wed', 'Fri'], time: '09:00' } },
    { name: 'Class 10-B (Science)', teacherIdx: 1, schedule: { days: ['Tue', 'Thu'], time: '10:30' } },
    { name: 'Class 11-A (English)', teacherIdx: 2, schedule: { days: ['Mon', 'Tue', 'Wed'], time: '11:00' } },
    { name: 'Class 11-B (Mathematics)', teacherIdx: 0, schedule: { days: ['Wed', 'Fri'], time: '14:00' } },
    { name: 'Class 12-A (Science)', teacherIdx: 1, schedule: { days: ['Mon', 'Thu'], time: '08:30' } },
    { name: 'Class 12-B (English)', teacherIdx: 2, schedule: { days: ['Tue', 'Fri'], time: '13:00' } },
  ];

  const classes = await Promise.all(
    classData.map((c) =>
      prisma.class.create({
        data: {
          name: c.name,
          teacherId: teachers[c.teacherIdx].id,
          schedule: c.schedule,
        },
      })
    )
  );

  // ── Students ───────────────────────────────────────────────────────
  const studentNames = [
    'Alice Johnson', 'Bob Martinez', 'Carol White', 'David Lee', 'Emma Davis',
    'Frank Wilson', 'Grace Taylor', 'Henry Brown', 'Isabella Moore', 'Jack Anderson',
    'Katherine Jackson', 'Liam Thomas', 'Mia Harris', 'Noah Martin', 'Olivia Garcia',
    'Peter Rodriguez', 'Quinn Lewis', 'Rose Walker', 'Samuel Hall', 'Tina Allen',
  ];

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const statusOptions: AttendanceStatus[] = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'];

  const studentUsers: { user: any; student: any }[] = [];

  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const classAssigned = classes[i % classes.length];
    const admNo = `ADM${String(2024001 + i).padStart(7, '0')}`;

    const user = await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s/g, '.')}@student.edu`,
        passwordHash: hash('Student@1234'),
        role: 'STUDENT',
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNo: admNo,
        classId: classAssigned.id,
        dob: new Date(2006 + (i % 4), i % 12, (i % 28) + 1),
        meta: {
          phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
          address: `${100 + i} Main St, Springfield`,
          guardianName: `Guardian of ${name}`,
          guardianPhone: `+1-555-${String(2000 + i).padStart(4, '0')}`,
        },
      },
    });

    studentUsers.push({ user, student });

    // Grades — each student, each subject, each term
    for (const subject of subjects) {
      for (const term of terms) {
        // Students 0-4 are "high performers", 15-19 are "at-risk"
        const baseScore = i < 5 ? 80 : i >= 15 ? 45 : 65;
        const variance = Math.floor(Math.random() * 20) - 10;
        const score = Math.min(100, Math.max(20, baseScore + variance));

        await prisma.grade.create({
          data: {
            studentId: student.id,
            subject,
            score,
            maxScore: 100,
            term,
          },
        });
      }
    }

    // Attendance — last 60 days
    for (let d = 59; d >= 0; d--) {
      const date = daysAgo(d);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // At-risk students (15-19) have low attendance
      const attendanceWeight = i >= 15 ? 0.6 : 0.9;
      const roll = Math.random();
      const status: AttendanceStatus = roll < attendanceWeight ? 'PRESENT' : pick(statusOptions);

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: classAssigned.id,
          date,
          status,
          recordedBy: classAssigned.teacherId || teachers[0].id,
        },
      });
    }

    // Notes — a couple per student
    if (i % 3 === 0) {
      await prisma.note.create({
        data: {
          studentId: student.id,
          authorId: pick(teachers).id,
          body: `${name} shows great enthusiasm in class discussions. Recommend for advanced track.`,
          visibility: 'TEACHERS_ONLY',
        },
      });
    }

    if (i >= 15) {
      await prisma.note.create({
        data: {
          studentId: student.id,
          authorId: pick(teachers).id,
          body: `Attendance and grades need monitoring. Parent-teacher meeting recommended.`,
          visibility: 'TEACHERS_ONLY',
        },
      });
    }
  }

  // ── Audit logs ─────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATA',
      resource: 'system',
      details: { message: 'Database seeded with sample data', count: studentNames.length },
      ip: '127.0.0.1',
    },
  });

  // ── Notifications ──────────────────────────────────────────────────
  // Create anomaly notifications for at-risk students
  for (const { user, student } of studentUsers.slice(15)) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: '⚠️ Low Attendance Alert',
        message: `Your attendance has fallen below the 75% threshold. Please contact your class teacher.`,
        type: 'ANOMALY',
        read: false,
      },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`   👤 Admin: admin@dashboard.edu / Admin@1234`);
  console.log(`   👩‍🏫 Teachers: sarah.chen@dashboard.edu / Teacher@1234`);
  console.log(`   🎓 Students: alice.johnson@student.edu / Student@1234`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
