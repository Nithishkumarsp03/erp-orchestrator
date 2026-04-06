import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listStudents,
  createStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentsByPrompt,
} from '../controllers/students.controller';
import { generateStudentReport } from '../controllers/report.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management endpoints
 */

router.use(authenticate);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get list of students
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response with list of students
 */
router.get('/', listStudents);

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentCreate'
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post('/', authorize('ADMIN', 'TEACHER'), createStudent);

/**
 * @swagger
 * /api/students/prompt:
 *   post:
 *     summary: Get students by AI prompt
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Prompt text to filter students
 *     responses:
 *       200:
 *         description: List of matching students
 */
router.post('/prompt', authorize('ADMIN'), getStudentsByPrompt);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student data
 */
router.get('/:id', getStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentUpdate'
 *     responses:
 *       200:
 *         description: Student updated
 */
router.put('/:id', authorize('ADMIN', 'TEACHER'), updateStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deletion success message
 */
router.delete('/:id', authorize('ADMIN'), deleteStudent);

/**
 * @swagger
 * /api/students/{id}/report:
 *   get:
 *     summary: Generate PDF report for a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF report generated
 */
router.get('/:id/report', generateStudentReport);

export default router;
