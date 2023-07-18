import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import WebSocket from 'ws';
import ejs from 'ejs';

const fallback = `{"msty_endpoint": "msty.sm.st"}`;
const payload = JSON.parse(process?.env?.PAYLOAD || fallback);
console.log('Payload:', payload);

const url = payload.msty_endpoint;
function bioPipe() {
  let reportData = [];
  const ws = new WebSocket(url);
  ws.on('open', function open() {
    const getFiles = function (dir, files_){
      files_ = files_ || [];
      const files = fs.readdirSync(dir);
      for (const i in files){
        const name = `${dir}/${files[i]}`;
        if (fs.statSync(name).isDirectory()){
          getFiles(name, files_);
        } else {
          files_.push(name);
        }
      }
      return files_;
    }

    const yamlFiles = getFiles('.').filter(fn => path.extname(fn) === '.yaml');

    yamlFiles.forEach(file => {
      const fileContent = fs.readFileSync(file, 'utf8');
      try {
        const data = yaml.parse(fileContent);
        ws.send(JSON.stringify(data));
        reportData.push(`Sent data for file: ${file}`);
      } catch (err) {
        reportData.push(`Failed to parse or send data for file: ${file} due to ${err.message}`);
        throw new Error(`Failed to parse or send data for file: ${file} due to ${err.message}`);
      }
    });

    const template = `
    <html>
      <head>
        <title>YAML processing report</title>
      </head>
      <body>
        <h1>YAML processing report</h1>
        <ul>
          <% reportData.forEach(function(item){ %>
            <li><%- item %></li>
          <% }); %>
        </ul>
      </body>
    </html>
    `;

    const reportHTML = ejs.render(template, { reportData });

    fs.writeFileSync('report.html', reportHTML);
  });
  ws.on('error', function error(err) {
    reportData.push(`WebSocket connection failed due to ${err.message}`);
    throw new Error(`WebSocket connection failed due to ${err.message}`);
  });
}

function searchDirectory(directory) {
  const fileList = [];

  function traverse(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isFile()) {
        const ext = path.extname(file);
        if (ext === '.yml' || ext === '.yaml') {
          fileList.push({
            filename: file,
            path: filePath,
            status: 'awaiting'
          });
        }
      } else if (fileStat.isDirectory() && !fileStat.isSymbolicLink()) {
        traverse(filePath);
      }
    }
  }

  traverse(directory);

  return fileList;
}

function printTable(files) {
  const template = fs.readFileSync('table-template.ejs', 'utf-8');
  const html = ejs.render(template, { files });

  fs.writeFileSync('report.html', html, 'utf-8');
}

const cwd = process.cwd();
console.log(`cwd: ${cwd}`);
const directoryPath = cwd;
const files = searchDirectory(directoryPath);
console.log(files);
printTable(files);