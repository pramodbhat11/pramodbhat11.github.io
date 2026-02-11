const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'git_status_log.txt');

exec('git remote -v', { cwd: __dirname }, (error, stdout, stderr) => {
    let output = '';
    if (error) {
        output += `Error: ${error.message}\n`;
    }
    output += `Stdout: ${stdout}\n`;
    output += `Stderr: ${stderr}\n`;

    fs.writeFile(logPath, output, (err) => {
        if (err) console.error("Failed to write log:", err);
    });
});
