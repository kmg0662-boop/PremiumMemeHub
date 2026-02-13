const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3042;
// Use relative path to go from Projects/Jjalbang_Project/ to Agents/.agent/memes.md
const MEMES_MD_PATH = path.resolve(__dirname, '../../Agents/.agent/memes.md');
const MEMES_DIR = path.join(__dirname, "memes");

if (!fs.existsSync(MEMES_DIR)) {
    fs.mkdirSync(MEMES_DIR);
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/sync') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { category, description, imgData, fileName } = data;
                
                const base64Data = imgData.split(',')[1];
                const ext = path.extname(fileName) || '.png';
                const newFileName = "meme_" + Date.now() + ext;
                const filePath = path.join(MEMES_DIR, newFileName);
                
                fs.writeFileSync(filePath, base64Data, 'base64');

                const localUrl = "file:///" + filePath.replace(/\\/g, '/');
                const newRow = "| **" + category + "** | " + description + " | " + localUrl + " |\n";

                let content = fs.readFileSync(MEMES_MD_PATH, 'utf8');
                if (!content.endsWith('\n')) content += '\n';
                content += newRow;
                fs.writeFileSync(MEMES_MD_PATH, content, 'utf8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, localUrl: localUrl }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log("SYNC_SERVER_STARTED");
});
