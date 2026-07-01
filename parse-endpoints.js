const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Николай\\.gemini\\antigravity\\brain\\8b1b6922-52f4-4db4-bd7e-05e3d3525ece\\.system_generated\\steps\\11902\\content.md', 'utf8');

const matches = content.match(/\/v1\/[a-zA-Z0-9_\-\/]+/g);
if (matches) {
  const unique = [...new Set(matches)];
  console.log("Endpoints found in Video docs:");
  console.log(unique.join('\n'));
} else {
  console.log("No endpoints found.");
}
