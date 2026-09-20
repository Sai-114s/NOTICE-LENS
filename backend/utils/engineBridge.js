const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const PROJECT_ROOT = path.join(__dirname, '../..');

function evaluateEligibility(criteria, student) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn(PYTHON_PATH, [
            '-m', 'eligibility_engine.cli',
            '--criteria', JSON.stringify(criteria),
            '--student', JSON.stringify(student)
        ], {
            cwd: PROJECT_ROOT
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python engine exited with code ${code}: ${errorData}`));
            }
            try {
                const result = JSON.parse(outputData);
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result);
                }
            } catch (err) {
                reject(new Error(`Failed to parse engine output: ${outputData}`));
            }
        });
    });
}

module.exports = { evaluateEligibility };
