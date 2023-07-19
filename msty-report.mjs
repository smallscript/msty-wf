import fs       from 'fs';
import ejs      from 'ejs';
//import yaml   from 'yaml';

function emitReport(files, reportFpn) {
  const template = fs.readFileSync('msty-report.template.ejs', 'utf-8');
  const html = ejs.render(template, { files });
  fs.writeFileSync(reportFpn || 'report.html', html, 'utf-8');
}
export default emitReport;