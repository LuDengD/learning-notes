// 增强的 Markdown 解析器 - 支持完整语法
function parseMarkdown(markdown) {
    let html = markdown;
    
    // 保护代码块 - 先提取出来避免被其他规则处理
    const codeBlocks = [];
    
    // 1. 先处理四个反引号的代码块（用于展示代码块语法）
    html = html.replace(/````(\w+)?\n([\s\S]*?)````/g, function(match, lang, code) {
        const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
        const langClass = lang ? ` class="language-${lang}"` : '';
        codeBlocks.push(`<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
        return placeholder;
    });
    
    // 2. Mermaid 流程图支持
    html = html.replace(/```mermaid\n([\s\S]*?)```/g, function(match, code) {
        const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
        codeBlocks.push(`<div class="mermaid">${code.trim()}</div>`);
        return placeholder;
    });
    
    // 3. 普通代码块 (```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
        const langClass = lang ? ` class="language-${lang}"` : '';
        codeBlocks.push(`<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
        return placeholder;
    });
    
    // 4. 数学公式 (块级)
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block">$1</div>');
    
    // 5. 数学公式 (行内)
    html = html.replace(/\$([^\$]+)\$/g, '<span class="math-inline">$1</span>');
    
    // 6. 高亮文本
    html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    
    // 7. 行内代码 (`) - 处理两个反引号的情况
    html = html.replace(/``([^`]+)``/g, '<code>$1</code>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 8. 标题 (支持 6 级)
    html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // 9. 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // 10. 斜体 (需要避免与粗体冲突)
    html = html.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>');
    
    // 11. 删除线
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // 12. 上标
    html = html.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');
    
    // 13. 下标
    html = html.replace(/~([^~]+)~/g, '<sub>$1</sub>');
    
    // 14. 脚注引用
    html = html.replace(/\[\^(\d+)\]/g, '<sup><a href="#fn$1" id="ref$1">[$1]</a></sup>');
    
    // 15. 任务列表
    html = html.replace(/^- \[x\] (.+)$/gm, '<li class="task-item"><input type="checkbox" checked disabled> $1</li>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<li class="task-item"><input type="checkbox" disabled> $1</li>');
    
    // 16. 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 4px;">');
    
    // 17. 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 18. 表格
    html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, function(match, header, rows) {
        let tableHtml = '<table><thead><tr>';
        header.split('|').filter(cell => cell.trim()).forEach(cell => {
            tableHtml += `<th>${cell.trim()}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        rows.trim().split('\n').forEach(row => {
            tableHtml += '<tr>';
            row.split('|').filter(cell => cell.trim()).forEach(cell => {
                tableHtml += `<td>${cell.trim()}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        return tableHtml;
    });
    
    // 19. 无序列表
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 20. 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // 21. 引用
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 22. 水平线
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    html = html.replace(/^___$/gm, '<hr>');
    
    // 23. 换行
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // 24. 包裹段落
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }
    
    // 25. 恢复代码块
    codeBlocks.forEach((block, index) => {
        html = html.replace(`___CODEBLOCK_${index}___`, block);
    });
    
    return html;
}

// HTML 转义函数
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
