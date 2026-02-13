const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3042;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Path to memes.md
const MEMES_MD_PATH = path.join('c:', 'Users', 'kmg06', 'Documents', '1. 안티그래비티', 'Agents', '.agent', 'memes.md');

// Ensure memes directory exists for local storage
const MEMES_DIR = path.join(__dirname, 'memes');
if (!fs.existsSync(MEMES_DIR)) {
    fs.mkdirSync(MEMES_DIR);
}

app.post('/api/sync', (req, res) => {
    try {
        const { category, description, imgData, fileName } = req.body;

        // 1. Save image locally
        const base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
        const ext = path.extname(fileName) || '.png';
        const newFileName = `meme_${Date.now()}${ext}`;
        const filePath = path.join(MEMES_DIR, newFileName);
        
        fs.writeFileSync(filePath, base64Data, 'base64');

        // 2. Prepare Markdown row
        // For the URL, we'll use a local path or a placeholder since it's now internal
        // But to show it in the chat, we need a URL. For now, we'll use a special tag
        // that Kim Bi-seo (the AI) can recognize or just the local absolute path.
        const localUrl = `file:///${filePath.replace(/\\/g, '/')}`;
        const newRow = `| **${category}** | ${description} | ${localUrl} |\n`;

        // 3. Update memes.md
        let content = fs.readFileSync(MEMES_MD_PATH, 'utf8');
        
        // Append to the end of the table
        if (!content.endsWith('\n')) content += '\n';
        content += newRow;

        fs.writeFileSync(MEMES_MD_PATH, content, 'utf8');

        console.log(`[Sync] New meme added: ${description}`);
        res.status(200).json({ success: true, message: 'Meme synced successfully!', localUrl });
    } catch (error) {
        console.error('[Sync Error]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Antigravity Meme Sync Server running on http://localhost:${PORT}`);
});
