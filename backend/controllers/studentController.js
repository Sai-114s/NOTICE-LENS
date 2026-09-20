const studentService = require('../services/studentService');

function getStudents(req, res) {
    const students = studentService.getAllStudents().map(({ id, name, branch, role }) => ({ id, name, branch, role }));
    res.json({ students });
}

function getStudentById(req, res) {
    const student = studentService.getStudentById(req.params.id);
    if (!student) {
        return res.status(404).json({ error: { message: "Student not found", status: 404 } });
    }
    res.json({ student });
}

function updateStudent(req, res) {
    // req.studentData comes from validateStudentPayload middleware
    const studentData = { ...req.studentData, id: req.params.id };
    const student = studentService.createOrUpdateStudent(studentData);
    res.json({ student });
}

module.exports = {
    getStudents,
    getStudentById,
    updateStudent
};
