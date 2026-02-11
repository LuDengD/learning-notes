// 笔记记录管理系统
document.addEventListener('DOMContentLoaded', function() {
    let currentNoteId = 'github-deploy';
    
    // 笔记配置 - 映射笔记ID到文件路径
    const noteConfigs = {
        'github-deploy': {
            type: 'static', // 静态HTML内容
            element: document.getElementById('github-deploy')
        },
        'markdown-syntax': {
            type: 'static',
            element: document.getElementById('markdown-syntax')
        }
    };
    
    // 加载并显示笔记内容
    async function loadNoteContent(noteId) {
        const config = noteConfigs[noteId];
        const contentArea = document.querySelector('.content');
        
        if (!config) return;
        
        // 隐藏所有文章
        document.querySelectorAll('.content > article').forEach(article => {
            article.style.display = 'none';
        });
        
        if (config.type === 'static') {
            // 显示静态HTML内容
            config.element.style.display = 'block';
        } else if (config.type === 'embedded') {
            // 显示内嵌Markdown内容
            const contentDiv = config.element.querySelector('.markdown-content');
            if (contentDiv && !contentDiv.innerHTML) {
                contentDiv.innerHTML = parseMarkdown(config.content);
            }
            config.element.style.display = 'block';
            
            // 重新初始化 Mermaid 图表
            if (typeof mermaid !== 'undefined') {
                mermaid.init(undefined, document.querySelectorAll('.mermaid'));
            }
        } else if (config.type === 'markdown') {
            // 加载外部Markdown文件
            try {
                const response = await fetch(config.file);
                const markdownText = await response.text();
                const htmlContent = parseMarkdown(markdownText);
                
                // 隐藏所有静态文章
                document.querySelectorAll('.content > article').forEach(article => {
                    article.style.display = 'none';
                });
                
                // 创建或更新动态文章容器
                let dynamicArticle = document.getElementById(`dynamic-${noteId}`);
                if (!dynamicArticle) {
                    dynamicArticle = document.createElement('article');
                    dynamicArticle.id = `dynamic-${noteId}`;
                    contentArea.appendChild(dynamicArticle);
                }
                
                dynamicArticle.innerHTML = `
                    <h2>${config.title}</h2>
                    <div class="markdown-content">${htmlContent}</div>
                    <section class="records-section">
                        <h3>📝 我的使用记录</h3>
                        <div id="recordsContainer-${noteId}">
                            <p style="color: #999; font-style: italic;">暂无记录，点击右下角按钮添加第一条记录吧！</p>
                        </div>
                    </section>
                `;
                dynamicArticle.style.display = 'block';
                
                // 重新初始化 Mermaid 图表
                if (typeof mermaid !== 'undefined') {
                    mermaid.init(undefined, document.querySelectorAll('.mermaid'));
                }
            } catch (error) {
                console.error('加载Markdown文件失败:', error);
                alert('加载笔记失败，请检查文件是否存在');
            }
        }
        
        // 显示对应笔记的记录
        displayRecords(noteId);
    }
    
    // 从本地存储加载记录
    function loadRecords(noteId) {
        const records = localStorage.getItem(`records-${noteId}`);
        return records ? JSON.parse(records) : [];
    }
    
    // 保存记录
    function saveRecords(noteId, records) {
        localStorage.setItem(`records-${noteId}`, JSON.stringify(records));
    }
    
    // 显示记录
    function displayRecords(noteId) {
        // 尝试获取当前笔记的记录容器
        let recordsContainer = document.getElementById(`recordsContainer-${noteId}`);
        if (!recordsContainer) {
            recordsContainer = document.getElementById('recordsContainer');
        }
        
        if (!recordsContainer) return;
        
        const dynamicRecords = loadRecords(noteId);
        
        // 获取静态记录（已经在 HTML 中的）
        const staticRecords = recordsContainer.querySelectorAll('.record-item:not(.dynamic-record)');
        
        if (dynamicRecords.length === 0) {
            // 如果没有动态记录，保持静态记录显示
            if (staticRecords.length === 0) {
                recordsContainer.innerHTML = '<p style="color: #999; font-style: italic;">暂无记录，点击右下角按钮添加第一条记录吧！</p>';
            }
            return;
        }
        
        // 将动态记录添加到静态记录之后
        const dynamicHTML = dynamicRecords.map((record, index) => `
            <div class="record-item dynamic-record">
                <div class="record-header">
                    <span class="record-time">${record.time}</span>
                    <button class="delete-record-btn" data-index="${index}">删除</button>
                </div>
                <div class="record-content">${parseMarkdown(record.content)}</div>
            </div>
        `).join('');
        
        // 保留静态记录，添加动态记录
        const staticHTML = Array.from(staticRecords).map(el => el.outerHTML).join('');
        recordsContainer.innerHTML = staticHTML + dynamicHTML;
        
        // 添加删除按钮事件（只针对动态记录）
        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                if (confirm('确定要删除这条记录吗？')) {
                    dynamicRecords.splice(index, 1);
                    saveRecords(noteId, dynamicRecords);
                    displayRecords(noteId);
                }
            });
        });
    }
    
    // 侧边栏导航功能
    const navLinks = document.querySelectorAll('.sidebar a:not(.disabled)');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活动状态
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加当前活动状态
            this.classList.add('active');
            
            // 更新当前笔记ID
            currentNoteId = this.getAttribute('href').substring(1);
            
            // 加载笔记内容
            loadNoteContent(currentNoteId);
        });
    });
    
    // 弹窗控制
    const modal = document.getElementById('noteModal');
    const addRecordBtn = document.getElementById('addRecordBtn');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    const recordForm = document.getElementById('recordForm');
    
    // 打开弹窗
    addRecordBtn.addEventListener('click', function() {
        document.getElementById('recordContent').value = '';
        modal.style.display = 'block';
    });
    
    // 关闭弹窗
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 提交表单
    recordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const content = document.getElementById('recordContent').value.trim();
        
        if (!content) {
            alert('请填写记录内容！');
            return;
        }
        
        // 获取当前时间
        const now = new Date();
        const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // 保存记录
        const records = loadRecords(currentNoteId);
        records.unshift({ time, content }); // 新记录放在最前面
        saveRecords(currentNoteId, records);
        
        // 刷新显示
        displayRecords(currentNoteId);
        
        // 关闭弹窗
        modal.style.display = 'none';
        
        alert('记录添加成功！');
    });
    
    // 初始化显示
    loadNoteContent(currentNoteId);
    
    // 为所有代码块添加复制按钮
    function addCopyButtons() {
        document.querySelectorAll('pre code').forEach((codeBlock) => {
            // 检查是否已经添加过按钮
            if (codeBlock.parentElement.querySelector('.copy-btn')) {
                return;
            }
            
            const button = document.createElement('button');
            button.className = 'copy-btn';
            button.textContent = '复制';
            
            button.addEventListener('click', async () => {
                const code = codeBlock.textContent;
                try {
                    await navigator.clipboard.writeText(code);
                    button.textContent = '已复制！';
                    button.classList.add('copied');
                    
                    setTimeout(() => {
                        button.textContent = '复制';
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('复制失败:', err);
                    button.textContent = '复制失败';
                    setTimeout(() => {
                        button.textContent = '复制';
                    }, 2000);
                }
            });
            
            codeBlock.parentElement.appendChild(button);
        });
    }
    
    // 页面加载时添加复制按钮
    addCopyButtons();
    
    // 当切换笔记时重新添加复制按钮
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(addCopyButtons, 100);
        });
    });
    
    // 一键推送命令更新功能
    const copyCommandBtn = document.getElementById('copyCommand');
    const pasteCommandBtn = document.getElementById('pasteCommand');
    const commitMessageInput = document.getElementById('commitMessage');
    
    if (copyCommandBtn && commitMessageInput) {
        // 复制按钮功能 - 直接复制输入框的内容
        copyCommandBtn.addEventListener('click', async function() {
            // 直接复制输入框中的内容，如果为空则复制默认命令
            let textToCopy = commitMessageInput.value.trim();
            if (!textToCopy) {
                textToCopy = 'git add . ; git commit -m "这里写你的更新内容" ; git push';
            }
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyCommandBtn.textContent = '已复制！';
                copyCommandBtn.classList.add('success');
                setTimeout(() => {
                    copyCommandBtn.textContent = '复制';
                    copyCommandBtn.classList.remove('success');
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            }
        });
        
        // 粘贴按钮功能
        if (pasteCommandBtn) {
            pasteCommandBtn.addEventListener('click', async function() {
                try {
                    const text = await navigator.clipboard.readText();
                    commitMessageInput.value = text;
                    pasteCommandBtn.textContent = '已粘贴！';
                    pasteCommandBtn.classList.add('success');
                    setTimeout(() => {
                        pasteCommandBtn.textContent = '粘贴';
                        pasteCommandBtn.classList.remove('success');
                    }, 2000);
                } catch (err) {
                    console.error('粘贴失败:', err);
                    // 静默失败，不显示提示
                }
            });
        }
    }
});
