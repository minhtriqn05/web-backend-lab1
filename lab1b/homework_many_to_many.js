// homework_many_to_many.js - Lab 1b Homework 2
// Mongoose schema design for course registration (Many-to-Many: Student <-> Course)
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'course_registration_db';

// ---------------------------------------------------------------
// Schemas: each side keeps an array of references to the other side
// ---------------------------------------------------------------
const studentSchema = new Schema({
  studentCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
}, { timestamps: true });

const courseSchema = new Schema({
  courseCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  maxStudents: { type: Number, required: true, min: 1 },
  availableSlots: { type: Number, required: true, min: 0 },
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

// ---------------------------------------------------------------
// Question 1: enrollCourse(studentId, courseId)
// ---------------------------------------------------------------
async function enrollCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  const course = await Course.findById(courseId);
  if (!student || !course) {
    console.log('Enroll failed: student or course not found.');
    return false;
  }

  // Check 1: is the student already enrolled?
  if (student.courses.some((id) => id.equals(courseId))) {
    console.log(`Enroll failed: ${student.fullName} is already enrolled in ${course.courseCode}.`);
    return false;
  }
  // Check 2: does the course still have availableSlots > 0?
  if (course.availableSlots <= 0) {
    console.log(`Enroll failed: ${course.courseCode} is full (0/${course.maxStudents} slots left).`);
    return false;
  }

  // Update the course atomically: the filter repeats both conditions, so two
  // requests at the same time can never push availableSlots below 0.
  const courseUpdate = await Course.updateOne(
    { _id: courseId, availableSlots: { $gt: 0 }, students: { $ne: studentId } },
    { $addToSet: { students: studentId }, $inc: { availableSlots: -1 } }
  );
  if (courseUpdate.modifiedCount === 0) {
    console.log(`Enroll failed: ${course.courseCode} was just filled by another request.`);
    return false;
  }

  // Add the course to the student's side as well (both sides stay in sync)
  await Student.updateOne({ _id: studentId }, { $addToSet: { courses: courseId } });

  const updated = await Course.findById(courseId);
  console.log(`Enrolled: ${student.fullName} -> ${course.courseCode} ` +
              `(availableSlots: ${course.availableSlots} -> ${updated.availableSlots})`);
  return true;
}

// ---------------------------------------------------------------
// Question 2: dropCourse(studentId, courseId)
// ---------------------------------------------------------------
async function dropCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  const course = await Course.findById(courseId);
  if (!student || !course) {
    console.log('Drop failed: student or course not found.');
    return false;
  }
  if (!student.courses.some((id) => id.equals(courseId))) {
    console.log(`Drop failed: ${student.fullName} is not enrolled in ${course.courseCode}.`);
    return false;
  }

  // Remove the reference from both sides and give 1 slot back to the course
  await Student.updateOne({ _id: studentId }, { $pull: { courses: courseId } });
  await Course.updateOne(
    { _id: courseId, students: studentId },
    { $pull: { students: studentId }, $inc: { availableSlots: 1 } }
  );

  const updated = await Course.findById(courseId);
  console.log(`Dropped: ${student.fullName} <- ${course.courseCode} ` +
              `(availableSlots: ${course.availableSlots} -> ${updated.availableSlots})`);
  return true;
}

// ---------------------------------------------------------------
// Helper: print both sides using populate()
// ---------------------------------------------------------------
async function showState(title) {
  console.log(`\n--- ${title} ---`);
  const courses = await Course.find().populate('students', 'fullName').lean();
  console.table(courses.map((c) => ({
    course: c.courseCode,
    title: c.title,
    slots: `${c.availableSlots}/${c.maxStudents}`,
    students: c.students.map((s) => s.fullName).join(', ') || '(none)'
  })));
  const students = await Student.find().populate('courses', 'courseCode').lean();
  console.table(students.map((s) => ({
    student: s.fullName,
    courses: s.courses.map((c) => c.courseCode).join(', ') || '(none)'
  })));
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log(`-> Connected to MongoDB, database: ${DB_NAME}`);

    // Reset & seed sample data
    await Student.deleteMany({});
    await Course.deleteMany({});
    const [tri, mai, nam] = await Student.create([
      { studentCode: '23560042', fullName: 'Nguyen Minh Tri' },
      { studentCode: '23560001', fullName: 'Tran Thi Mai' },
      { studentCode: '23560002', fullName: 'Le Van Nam' }
    ]);
    const [web, db] = await Course.create([
      { courseCode: 'CSBU109', title: 'Web Backend & Database', maxStudents: 2, availableSlots: 2 },
      { courseCode: 'CSBU108', title: 'Operating Systems', maxStudents: 3, availableSlots: 3 }
    ]);
    await showState('INITIAL STATE');

    console.log('\n=== Question 1: enrollCourse() ===');
    await enrollCourse(tri._id, web._id);   // OK (2 -> 1)
    await enrollCourse(tri._id, web._id);   // already enrolled
    await enrollCourse(mai._id, web._id);   // OK (1 -> 0)
    await enrollCourse(nam._id, web._id);   // course is full
    await enrollCourse(tri._id, db._id);    // OK (3 -> 2)
    await showState('AFTER ENROLLING');

    console.log('\n=== Question 2: dropCourse() ===');
    await dropCourse(tri._id, web._id);     // OK (0 -> 1)
    await dropCourse(nam._id, db._id);      // not enrolled
    await enrollCourse(nam._id, web._id);   // the freed slot can now be used (1 -> 0)
    await showState('FINAL STATE');
  } catch (error) {
    console.error('Mongoose error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n-> Mongoose connection closed.');
  }
}

main();
