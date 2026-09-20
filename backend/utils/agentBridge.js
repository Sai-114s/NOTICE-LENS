const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const PROJECT_ROOT = path.join(__dirname, '../..');
const MAX_AGENT_OUTPUT = 256 * 1024;

function extractNotice({ rawText, filePath }) {
    return new Promise((resolve, reject) => {
        const mode = process.env.STRANDS_MODE || (process.env.DEMO_MODE === 'true' ? 'DEMO' : 'STRANDS');
        const sourceArgs = filePath ? ['--file', filePath] : ['--text', rawText];
        const pythonProcess = spawn(PYTHON_PATH, [
            '-m', 'agent.cli', ...sourceArgs, '--mode', mode
        ], { cwd: PROJECT_ROOT });

        let output = '';
        let errorOutput = '';
        pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });
        pythonProcess.stdout.on('data', () => {
            if (output.length > MAX_AGENT_OUTPUT) pythonProcess.kill();
        });
        pythonProcess.on('error', (error) => {
            if (filePath) fs.rm(filePath, { force: true }, () => {});
            reject(error);
        });
        pythonProcess.on('close', (code) => {
            if (filePath) fs.rm(filePath, { force: true }, () => {});
            if (code !== 0) {
                return reject(new Error(`Local notice agent exited with code ${code}`));
            }
            try {
                const result = JSON.parse(output);
                if (!result.notice || !result.extraction_source) {
                    return reject(new Error('Local notice agent returned an incomplete result'));
                }
                resolve(result);
            } catch (error) {
                reject(new Error('Local notice agent returned malformed output'));
            }
        });
    });
}

module.exports = { extractNotice };
