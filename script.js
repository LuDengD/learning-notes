// 笔记记录管理系统
document.addEventListener('DOMContentLoaded', function() {
    let currentNoteId = 'github-deploy';
    
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
        const recordsContainer = document.getElementById('recordsContainer');
        const dynamicRecords = loadRecords(noteId);
        
        // 获取静态记录（已经在 HTML 中的）
        const staticRecords = recordsContainer.querySelectorAll('.record-item');
        
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
            
            // 显示对应笔记的记录
            displayRecords(currentNoteId);
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
    displayRecords(currentNoteId);
});
