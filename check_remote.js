const { exec } = require('child_process');
const fs = require('fs');

exec('git remote -v', (error, stdout, stderr) => {
    let output = '';
    if (error) {
        output += `Error: ${error.message}\n`;
    }
    output += `Stdout: ${stdout}\n`;
    output += `Stderr: ${stderr}\n`;

    fs.writeFileSync('git_remote_check.txt', output);
});
