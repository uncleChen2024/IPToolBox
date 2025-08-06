// 全局变量
let parsedReferences = new Map();
let currentPage = 'numbering';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupNavigation();
    setupNumberingPage();
    setupCheckPage();
    setupModals();
    setupThemeToggle();
    setupEventListeners();
}

// 设置导航功能
function setupNavigation() {
    const navItems = document.querySelectorAll('.main-nav a');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
            
            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 页脚导航
    const footerLinks = document.querySelectorAll('.footer-links a[data-page]');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
            
            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector(`.main-nav a[data-page="${pageId}"]`).classList.add('active');
        });
    });
}

// 显示页面
function showPage(pageId) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
    }
}

// 设置自动标号页面
function setupNumberingPage() {
    const referenceInput = document.getElementById('reference-input');
    const parseBtn = document.getElementById('parse-btn');
    const inputText = document.getElementById('input-text');
    const processBtn = document.getElementById('process-btn');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearInputBtn = document.getElementById('clear-input-btn');
    
    if (parseBtn) {
        parseBtn.addEventListener('click', parseReferences);
    }
    
    if (processBtn) {
        processBtn.addEventListener('click', processText);
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copyResult);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadResult);
    }
    
    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', () => {
            inputText.value = '';
            updateInputStats();
        });
    }
    
    // 实时统计
    if (inputText) {
        inputText.addEventListener('input', updateInputStats);
    }
    
    if (referenceInput) {
        referenceInput.addEventListener('input', updateReferenceCount);
    }
}

// 设置错误检查页面
function setupCheckPage() {
    // 错误检查功能开发中，暂无需设置
    console.log("错误检查功能开发中");
}

// 设置模态框
function setupModals() {
    // 反馈模态框
    const feedbackLink = document.getElementById('feedback-link');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackForm = document.getElementById('feedback-form');
    
    if (feedbackLink && feedbackModal) {
        feedbackLink.addEventListener('click', function(e) {
            e.preventDefault();
            feedbackModal.classList.add('show');
        });
    }
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // 这里可以添加表单提交逻辑
            showNotification('感谢您的反馈！', 'success');
            feedbackModal.classList.remove('show');
        });
    }
    
    // 打赏模态框
    const donateLink = document.getElementById('donate-link');
    const donateModal = document.getElementById('donate-modal');
    
    if (donateLink && donateModal) {
        donateLink.addEventListener('click', function(e) {
            e.preventDefault();
            donateModal.classList.add('show');
        });
    }
    
    // 关闭按钮
    const closeBtns = document.querySelectorAll('.close-btn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // 点击模态框背景关闭
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

// 设置主题切换
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
        // 检查本地存储中的主题设置
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            // 保存主题设置到本地存储
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// 设置其他事件监听器
function setupEventListeners() {
    // 阻止表单默认提交
    document.addEventListener('submit', function(e) {
        e.preventDefault();
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
}

// 解析附图标记
function parseReferences() {
    const referenceInput = document.getElementById('reference-input');
    const referenceTagsContainer = document.getElementById('reference-tags');
    const referenceCount = document.getElementById('reference-count');
    const parseBtn = document.getElementById('parse-btn');
    
    if (!referenceInput || !referenceTagsContainer) return;
    
    const text = referenceInput.value.trim();
    if (!text) {
        showNotification('请先输入附图标记说明', 'warning');
        return;
    }
    
    // 显示加载状态
    if (parseBtn) {
        parseBtn.classList.add('loading');
    }
    
    try {
        // 清空之前的解析结果
        parsedReferences.clear();
        referenceTagsContainer.innerHTML = '';
        
        // 检查是否缺少末尾句号
        if (!text.trim().endsWith('。')) {
            showErrorModal('句号缺失', 
                `附图标记说明的末尾缺少句号，这可能表示复制不完整。<br>` +
                `请确保完整复制了所有附图标记，并在末尾添加句号。<br><br>` +
                `当前文本：<br><code>${text}</code><br><br>` +
                `建议格式：<br><code>${text}。</code>`
            );
            return;
        }
        
        // 移除末尾的句号（用于解析）
        const cleanText = text.replace(/。$/, '');
        
        // 解析标记 - 支持多种格式
        const patterns = [
            /(\d+)、([^；;]+)/g,  // 标准格式：100、基底层
            /(\d+)-([^；;]+)/g,   // 简化格式：100-基底层
            /(\d+)：([^；;]+)/g,   // 冒号格式：100：基底层
            /(\d+)\.([^；;]+)/g   // 点格式：100.基底层
        ];
        
        let matches = [];
        for (const pattern of patterns) {
            const patternMatches = [...cleanText.matchAll(pattern)];
            if (patternMatches.length > 0) {
                matches = patternMatches;
                break;
            }
        }
        
        if (matches.length === 0) {
            showErrorModal('格式错误', '未能识别附图标记格式，请检查输入。<br>正确格式示例：<br>1、固定槽；2、支撑架；3、连接杆');
            return;
        }
        
        // 检查是否有缺失顿号的标号
        const missingDunhaoPattern = /(\d+)([^\d、\-：\.;\s]+)/g;
        const missingDunhaoMatches = [...cleanText.matchAll(missingDunhaoPattern)];
        const missingDunhaoItems = [];
        
        if (missingDunhaoMatches.length > 0) {
            missingDunhaoMatches.forEach(match => {
                missingDunhaoItems.push(`${match[1]}${match[2]}`);
            });
            
            showErrorModal('顿号缺失', 
                `检测到以下标号可能缺失顿号：<br><ul>${missingDunhaoItems.map(item => `<li>${item}</li>`).join('')}</ul>` +
                `正确格式应为：<br><ul>${missingDunhaoItems.map(item => `<li>${item.replace(/^(\d+)(.+)$/, '$1、$2')}</li>`).join('')}</ul>`
            );
            return;
        }
        
        // 检查是否有缺失分号的标号
        // 将文本按分号或句号分割，然后检查每个部分
        const segments = cleanText.split(/[；;。]/);
        const missingSemicolonItems = [];
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i].trim();
            if (!segment) continue;
            
            // 检查一个段落中是否有多个标号但缺少分隔符
            // 匹配模式：数字+顿号+文字+数字+顿号
            const missingSemicolonPattern = /(\d+[、\-：\.][^；;。\d]+)(\d+[、\-：\.])/g;
            const missingSemicolonMatches = [...segment.matchAll(missingSemicolonPattern)];
            
            if (missingSemicolonMatches.length > 0) {
                missingSemicolonMatches.forEach(match => {
                    missingSemicolonItems.push({
                        original: match[0],
                        fixed: `${match[1]}；${match[2]}`
                    });
                });
            }
        }
        
        if (missingSemicolonItems.length > 0) {
            showErrorModal('分号缺失', 
                `检测到以下标号之间可能缺失分号：<br><ul>${missingSemicolonItems.map(item => `<li>${item.original}</li>`).join('')}</ul>` +
                `正确格式应为：<br><ul>${missingSemicolonItems.map(item => `<li>${item.fixed}</li>`).join('')}</ul>` +
                `请在每个标号描述后添加分号，以确保格式正确。`
            );
            return;
        }
        
        // 存储解析结果并检查重复
        const descriptionMap = new Map(); // 用于检查重复描述
        const numberMap = new Map();      // 用于检查重复编号
        const duplicateDescriptions = [];
        const overlappingDescriptions = []; // 存储重叠或包含关系的描述
        
        // 首先解析所有标记
        const parsedMarks = matches.map(match => {
            const number = match[1];
            const description = match[2].trim().replace(/[。，；;]$/, ''); // 移除末尾标点
            return { number, description };
        });
        
        // 检查完全相同的描述
        for (let i = 0; i < parsedMarks.length; i++) {
            const { number, description } = parsedMarks[i];
            
            // 检查是否有完全相同的描述
            const sameDescriptions = parsedMarks.filter((mark, index) => 
                index !== i && mark.description === description
            );
            
            if (sameDescriptions.length > 0) {
                // 收集所有相同描述的编号
                const allNumbers = [number, ...sameDescriptions.map(mark => mark.number)];
                
                // 检查是否已经添加过这个描述
                if (!duplicateDescriptions.some(d => d.description === description)) {
                    duplicateDescriptions.push({
                        description,
                        numbers: allNumbers
                    });
                }
            }
        }
        
        // 检查名称重叠或包含关系
        for (let i = 0; i < parsedMarks.length; i++) {
            const mark1 = parsedMarks[i];
            
            for (let j = 0; j < parsedMarks.length; j++) {
                if (i !== j) {
                    const mark2 = parsedMarks[j];
                    
                    // 检查是否有包含关系（但不是完全相同）
                    if (mark1.description !== mark2.description && 
                        (mark1.description.includes(mark2.description) || 
                         mark2.description.includes(mark1.description))) {
                        
                        const longer = mark1.description.length >= mark2.description.length ? mark1 : mark2;
                        const shorter = mark1.description.length < mark2.description.length ? mark1 : mark2;
                        
                        // 避免重复添加
                        const key = `${shorter.description}|${longer.description}`;
                        if (!overlappingDescriptions.some(item => item.key === key)) {
                            overlappingDescriptions.push({
                                key,
                                desc1: shorter.description,
                                desc2: longer.description,
                                number1: shorter.number,
                                number2: longer.number
                            });
                        }
                    }
                }
            }
        }
        
        // 如果有完全相同的描述，显示错误
        if (duplicateDescriptions.length > 0) {
            const examples = duplicateDescriptions.map(d => 
                `"${d.description}" 对应编号: ${d.numbers.map(n => `(${n})`).join('、')}`
            );
            
            showErrorModal('重复标记名称', 
                `检测到以下标记名称完全相同：<br><ul>${examples.map(ex => `<li>${ex}</li>`).join('')}</ul>` +
                `请修改标记名称，确保每个标记都有唯一的名称。`
            );
            return;
        }
        
        // 如果有重叠或包含关系的描述，显示错误
        if (overlappingDescriptions.length > 0) {
            const examples = overlappingDescriptions.map(item => 
                `"${item.desc1}"(${item.number1}) 被 "${item.desc2}"(${item.number2}) 包含`
            );
            
            showErrorModal('标记名称重叠', 
                `检测到以下标记名称存在重叠或包含关系：<br><ul>${examples.map(ex => `<li>${ex}</li>`).join('')}</ul>` +
                `这可能导致标号混乱，例如"${overlappingDescriptions[0].desc1}${overlappingDescriptions[0].number1}${overlappingDescriptions[0].desc2.substring(overlappingDescriptions[0].desc1.length)}${overlappingDescriptions[0].number2}"这样的错误情况。<br>` +
                `请修改标记名称使其更加明确区分。`
            );
            return;
        }
        
        // 存储解析结果并创建标签
        parsedMarks.forEach(({ number, description }) => {
            parsedReferences.set(description, number);
            
            // 创建标签显示
            const tag = document.createElement('div');
            tag.className = 'reference-tag';
            tag.innerHTML = `<span>${number}</span><span>${description}</span>`;
            referenceTagsContainer.appendChild(tag);
        });
        
        // 更新统计
        if (referenceCount) {
            referenceCount.textContent = `${parsedReferences.size} 个标记`;
        }
        
        showNotification(`成功解析 ${parsedReferences.size} 个附图标记`, 'success');
        
    } catch (error) {
        console.error('解析附图标记时出错:', error);
        showNotification('解析过程中出现错误', 'error');
    } finally {
        // 隐藏加载状态
        if (parseBtn) {
            parseBtn.classList.remove('loading');
        }
    }
}

// 处理文本
function processText() {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const docTypeInputs = document.querySelectorAll('input[name="doc-type"]');
    const smartSpacing = document.getElementById('smart-spacing');
    const caseSensitive = document.getElementById('case-sensitive');
    const autoCorrect = document.getElementById('auto-correct');
    
    if (!inputText || !outputText) return;
    
    const text = inputText.value.trim();
    if (!text) {
        showNotification('请先输入需要处理的文本', 'warning');
        return;
    }
    
    if (parsedReferences.size === 0) {
        showNotification('请先解析附图标记说明', 'warning');
        return;
    }
    
    // 获取文档类型
    let docType = 'claims';
    for (const input of docTypeInputs) {
        if (input.checked) {
            docType = input.value;
            break;
        }
    }
    
    // 获取处理选项
    const options = {
        smartSpacing: smartSpacing?.checked || false,
        caseSensitive: caseSensitive?.checked || false,
        autoCorrect: autoCorrect?.checked || false
    };
    
    showLoading(true);
    
    setTimeout(() => {
        try {
            let processedText = text;
            let appliedCount = 0;
            
            // 按描述长度排序，避免短词覆盖长词
            const sortedReferences = Array.from(parsedReferences.entries())
                .sort((a, b) => b[0].length - a[0].length);
            
            console.log('开始处理文本，文档类型:', docType);
            console.log('附图标记:', sortedReferences);
            
            // 自动纠错
            if (options.autoCorrect) {
                processedText = autoCorrectText(processedText);
            }
            
            // 应用标记
            sortedReferences.forEach(([description, number]) => {
                // 创建正则表达式，根据是否区分大小写设置选项
                const flags = options.caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(description, flags);
                const matches = processedText.match(regex);
                
                if (matches) {
                    console.log(`找到匹配: ${description} -> ${number}, 匹配次数: ${matches.length}`);
                    
                    if (docType === 'claims') {
                        // 权利要求书格式：基底层(100)
                        if (options.smartSpacing) {
                            processedText = processedText.replace(regex, `${description}(${number})`);
                        } else {
                            processedText = processedText.replace(regex, `${description} (${number})`);
                        }
                    } else {
                        // 说明书格式：基底层100
                        if (options.smartSpacing) {
                            processedText = processedText.replace(regex, `${description}${number}`);
                        } else {
                            processedText = processedText.replace(regex, `${description} ${number}`);
                        }
                    }
                    appliedCount += matches.length;
                } else {
                    console.log(`未找到匹配: ${description}`);
                }
            });
            
            outputText.value = processedText;
            updateOutputStats();
            
            showNotification(`处理完成，应用了 ${appliedCount} 个附图标记`, 'success');
            
        } catch (error) {
            console.error('处理文本时出错:', error);
            showNotification('处理过程中出现错误: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }, 500);
}

// 自动纠错
function autoCorrectText(text) {
    // 修正常见错误
    const corrections = [
        { pattern: /的的/g, replacement: '的' },
        { pattern: /了了/g, replacement: '了' },
        { pattern: /在在/g, replacement: '在' },
        { pattern: /是是/g, replacement: '是' },
        { pattern: /有有/g, replacement: '有' },
        { pattern: /与与/g, replacement: '与' },
        { pattern: /及及/g, replacement: '及' },
        { pattern: /和和/g, replacement: '和' },
        { pattern: /\s+/g, replacement: ' ' } // 合并多余空格
    ];
    
    let correctedText = text;
    corrections.forEach(({ pattern, replacement }) => {
        correctedText = correctedText.replace(pattern, replacement);
    });
    
    return correctedText;
}

// 复制结果
function copyResult() {
    const outputText = document.getElementById('output-text');
    if (!outputText || !outputText.value) {
        showNotification('没有可复制的内容', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(outputText.value).then(() => {
        showNotification('结果已复制到剪贴板', 'success');
    }).catch(() => {
        // 备用复制方法
        outputText.select();
        document.execCommand('copy');
        showNotification('结果已复制到剪贴板', 'success');
    });
}

// 下载结果
function downloadResult() {
    const outputText = document.getElementById('output-text');
    if (!outputText || !outputText.value) {
        showNotification('没有可下载的内容', 'warning');
        return;
    }
    
    const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '专利文档_已标号.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('文件下载已开始', 'success');
}

// 更新输入统计
function updateInputStats() {
    const inputText = document.getElementById('input-text');
    const inputChars = document.getElementById('input-chars');
    const inputWords = document.getElementById('input-words');
    const inputLines = document.getElementById('input-lines');
    
    if (inputText && inputChars) {
        const text = inputText.value;
        inputChars.textContent = `${text.length} 字符`;
        
        if (inputWords) {
            // 中文词计数（粗略估计）
            const wordCount = text.replace(/\s+/g, '').length;
            inputWords.textContent = `${wordCount} 词`;
        }
        
        if (inputLines) {
            const lineCount = text.split('\n').length;
            inputLines.textContent = `${lineCount} 行`;
        }
    }
}

// 更新输出统计
function updateOutputStats() {
    const outputText = document.getElementById('output-text');
    const outputChars = document.getElementById('output-chars');
    const appliedCount = document.getElementById('applied-count');
    
    if (outputText && outputChars) {
        const text = outputText.value;
        outputChars.textContent = `${text.length} 字符`;
        
        // 计算应用的标记数量
        if (appliedCount && parsedReferences.size > 0) {
            let markCount = 0;
            parsedReferences.forEach((number, description) => {
                const regex = new RegExp(`${description}\\(?${number}\\)?`, 'g');
                const matches = text.match(regex);
                if (matches) {
                    markCount += matches.length;
                }
            });
            appliedCount.textContent = `${markCount} 个标记已应用`;
        }
    }
}

// 更新附图标记统计
function updateReferenceCount() {
    const referenceInput = document.getElementById('reference-input');
    const referenceCount = document.getElementById('reference-count');
    
    if (referenceInput && referenceCount) {
        const text = referenceInput.value.trim();
        if (text) {
            // 尝试匹配不同格式的标记
            const patterns = [
                /(\d+)、([^；;]+)/g,  // 标准格式：100、基底层
                /(\d+)-([^；;]+)/g,   // 简化格式：100-基底层
                /(\d+)：([^；;]+)/g,   // 冒号格式：100：基底层
                /(\d+)\.([^；;]+)/g   // 点格式：100.基底层
            ];
            
            let matchCount = 0;
            for (const pattern of patterns) {
                const matches = [...text.matchAll(pattern)];
                if (matches.length > 0) {
                    matchCount = matches.length;
                    break;
                }
            }
            
            referenceCount.textContent = `${matchCount} 个标记`;
        } else {
            referenceCount.textContent = '0 个标记';
        }
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    // 根据通知类型设置不同的显示时间
    let duration = 3000; // 默认3秒
    
    if (type === 'warning') {
        duration = 5000; // 警告显示5秒
    } else if (type === 'error') {
        duration = 6000; // 错误显示6秒
    }
    
    // 清除之前的定时器
    if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
    }
    
    // 设置新的定时器
    notification.timeoutId = setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// 显示错误弹窗
function showErrorModal(title, content) {
    const errorModal = document.getElementById('error-modal');
    const errorTitle = document.getElementById('error-modal-title');
    const errorContent = document.getElementById('error-modal-content');
    const errorBtn = document.getElementById('error-modal-btn');
    
    if (!errorModal || !errorTitle || !errorContent) return;
    
    errorTitle.textContent = title;
    errorContent.innerHTML = content;
    errorModal.classList.add('show');
    
    // 关闭按钮事件
    const closeBtn = errorModal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            errorModal.classList.remove('show');
        };
    }
    
    // 确认按钮事件
    if (errorBtn) {
        errorBtn.onclick = function() {
            errorModal.classList.remove('show');
        };
    }
    
    // 点击背景关闭
    errorModal.onclick = function(e) {
        if (e.target === errorModal) {
            errorModal.classList.remove('show');
        }
    };
    
    // ESC键关闭
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            errorModal.classList.remove('show');
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// 显示/隐藏加载指示器
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}