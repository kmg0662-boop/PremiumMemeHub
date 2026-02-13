// Force clear old problematic storage
localStorage.clear();
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const previewPanel = document.getElementById('preview-panel');
const previewImg = document.getElementById('preview-img');
const previewCategory = document.getElementById('preview-category');
const previewDesc = document.getElementById('preview-desc');
const categoryInput = document.getElementById('category');
const descInput = document.getElementById('description');
const addBtn = document.getElementById('add-btn');

const mdCat = document.getElementById('md-cat');
const mdDesc = document.getElementById('md-desc');
const mdUrl = document.getElementById('md-url');
const copyBtn = document.getElementById('copy-btn');
const memeGrid = document.getElementById('meme-grid');

let currentFile = null;
let savedMemes = JSON.parse(localStorage.getItem('antigravity_memes') || '[]');

// Initialization
renderMemes();

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다!');
        return;
    }
    currentFile = file;
    fileNameDisplay.textContent = `Attached: ${file.name}`;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewPanel.style.display = 'block';
        updateMarkdown();
    };
    reader.readAsDataURL(file);
}

[categoryInput, descInput].forEach(input => {
    input.addEventListener('input', () => {
        updateMarkdown();
    });
});

function updateMarkdown() {
    const category = categoryInput.value || 'Category';
    const description = descInput.value || 'Description';
    const url = currentFile ? `[대장님 업로드 파일: ${currentFile.name}]` : 'URL';

    previewCategory.textContent = category;
    previewDesc.textContent = description;

    mdCat.textContent = category;
    mdDesc.textContent = description;
    mdUrl.textContent = url;
}

addBtn.addEventListener('click', async () => {
    if (!currentFile || !categoryInput.value || !descInput.value) {
        alert('모든 필드(이미지, 카테고리, 설명)를 입력해주세요!');
        return;
    }

    const memeData = {
        category: categoryInput.value,
        description: descInput.value,
        imgData: previewImg.src,
        fileName: currentFile.name
    };

    try {
        addBtn.disabled = true;
        addBtn.textContent = '김비서에게 전송 중... 🚀';

        const response = await fetch('http://localhost:3042/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memeData)
        });

        const result = await response.json();

        if (result.success) {
            const newMeme = {
                id: Date.now(),
                category: memeData.category,
                description: memeData.description,
                localUrl: result.localUrl,
                fileName: memeData.fileName
                // imgData is NOT saved to localStorage anymore to save space
            };

            savedMemes.unshift(newMeme);
            // Limit history to 20 items to be safe
            if (savedMemes.length > 20) savedMemes.pop();
            
            try {
                localStorage.setItem('antigravity_memes', JSON.stringify(savedMemes));
            } catch (e) {
                console.warn('LocalStorage save failed, clearing old history...');
                localStorage.removeItem('antigravity_memes');
            }
            
            renderMemes();
            alert('성공적으로 전송되었습니다! 이제 김비서가 이 짤을 바로 사용할 수 있습니다. 🫡');
            
            // Reset form
            categoryInput.value = '';
            descInput.value = '';
            previewPanel.style.display = 'none';
            currentFile = null;
            fileNameDisplay.textContent = '';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Sync failed:', error);
        alert('전송 실패! 서버가 켜져 있는지 확인해주세요. (김비서에게 "서버 켜줘"라고 말해보세요!)');
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = '김비서에게 직접 전송 ✨';
    }
});

copyBtn.addEventListener('click', () => {
    const text = `| **${categoryInput.value}** | ${descInput.value} | https://... (대장님 파일: ${currentFile.name}) |`;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '복사 완료! ✅';
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });
});

function renderMemes() {
    memeGrid.innerHTML = '';
    savedMemes.forEach(meme => {
        const card = document.createElement('div');
        card.className = 'meme-card glass';
        const displayImg = meme.imgData || 'https://via.placeholder.com/200x120/0f172a/6366f1?text=Synced+to+Siwoo';
        card.innerHTML = `
            <div class="card-imageSmall" style="height: 120px; overflow: hidden;">
                <img src="${displayImg}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="card-info" style="padding: 0.8rem;">
                <span class="card-badge" style="font-size: 0.7rem;">${meme.category}</span>
                <p style="font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meme.description}</p>
            </div>
        `;
        memeGrid.appendChild(card);
    });
}
