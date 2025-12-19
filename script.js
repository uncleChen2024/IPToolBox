// 辅助函数：转义正则特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 全局变量
let parsedReferences = new Map();
let checkParsedReferences = new Map();
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

    // 控制New徽章的显示/隐藏
    const newBadge = document.querySelector('.badge-new');
    if (newBadge) {
        if (pageId === 'check') {
            newBadge.style.display = 'none';
        } else {
            newBadge.style.display = 'block'; // 或者 'inline-block'，取决于之前的CSS，但absolute下block即可
        }
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

// 加载拼音库 (懒加载)
function loadPinyinLibrary() {
    return new Promise((resolve, reject) => {
        if (window.pinyinPro) {
            resolve(window.pinyinPro);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pinyin-pro@3.19.3/dist/index.js';
        script.onload = () => resolve(window.pinyinPro);
        script.onerror = () => reject(new Error('Failed to load pinyin-pro'));
        document.head.appendChild(script);
    });
}

// 设置错误检查页面
function setupCheckPage() {
    const checkInput = document.getElementById('check-input');
    const startCheckBtn = document.getElementById('start-check-btn');
    const checkClearBtn = document.getElementById('check-clear-btn');
    const checkStats = document.getElementById('check-input-stats');
    
    // 预加载拼音库（不阻塞页面显示，但提前加载以备用）
    // 或者完全等到用户点击开始检查时再加载？
    // 为了用户体验，我们可以在用户进入此页面时加载
    loadPinyinLibrary().catch(err => console.warn('预加载拼音库失败:', err));
    
    // Clear button
    if (checkClearBtn && checkInput) {
        checkClearBtn.addEventListener('click', () => {
            checkInput.value = '';
            updateCheckStats();
            document.getElementById('check-results').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-500);">点击"开始检查"生成错误报告</p>
                </div>
            `;
        });
    }

    // Input stats
    if (checkInput) {
        checkInput.addEventListener('input', updateCheckStats);
    }

    function updateCheckStats() {
        if (!checkInput) return;
        const text = checkInput.value;
        const charCount = text.length;
        // 简单统计以数字开头的行数作为权利要求数量
        const claimMatches = text.match(/^\s*\d+[\.、．\s]/gm);
        const claimCount = claimMatches ? claimMatches.length : 0;
        
        if (checkStats) {
            checkStats.textContent = `${charCount} 字符 | ${claimCount} 项权利要求`;
        }
    }

    // Start Check
    if (startCheckBtn) {
        startCheckBtn.addEventListener('click', performCheck);
    }

    // Setup Check Page Reference Panel
    setupCheckPageReferencePanel();
}

function setupCheckPageReferencePanel() {
    const checkReferenceInput = document.getElementById('check-reference-input');
    const checkParseBtn = document.getElementById('check-parse-btn');
    
    if (checkParseBtn) {
        checkParseBtn.addEventListener('click', parseCheckReferences);
    }
    
    if (checkReferenceInput) {
        checkReferenceInput.addEventListener('input', function() {
            const count = document.getElementById('check-reference-count');
            if (count) {
                // 简单的计数显示，解析后会更新为准确数量
                // 这里暂时不解析，只显示大概
            }
        });
    }
}

// 执行检查
function performCheck() {
    const checkInput = document.getElementById('check-input');
    const resultsContainer = document.getElementById('check-results');
    
    if (!checkInput || !resultsContainer) return;
    
    const text = checkInput.value;
    if (!text.trim()) {
        showNotification('请先输入权利要求书内容', 'warning');
        return;
    }

    // 检查是否解析了附图标记
    // 如果勾选了依赖附图标记的检查项（引用基础、标号一致性、错别字），则必须要有已解析的标记
    const isBasisChecked = document.getElementById('check-basis')?.checked;
    const isConsistencyChecked = document.getElementById('check-consistency')?.checked;
    const isTypoChecked = document.getElementById('check-typo')?.checked;
    
    if ((isBasisChecked || isConsistencyChecked || isTypoChecked) && checkParsedReferences.size === 0) {
        const refInput = document.getElementById('check-reference-input');
        if (refInput && refInput.value.trim()) {
            showNotification('检测到附图标记未解析，请先点击“解析标记”按钮', 'error');
        } else {
            showNotification('请先输入并解析附图标记说明，以进行完整的错误检查', 'error');
        }
        return;
    }

    // 清空结果
    resultsContainer.innerHTML = '';
    
    // 解析权利要求
    const claims = parseClaims(text);
    if (claims.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--warning); margin-bottom: 1rem;"></i>
                <p>未能识别出任何权利要求。<br>请确保每项权利要求以数字开头（如 "1." 或 "1、"）。</p>
            </div>
        `;
        return;
    }

    const errors = [];
    
    // 1. 检查引用错误
    if (document.getElementById('check-ref')?.checked) {
        errors.push(...checkReferences(claims));
    }
    
    // 2. 检查多重句号
    if (document.getElementById('check-period')?.checked) {
        errors.push(...checkPeriods(claims));
    }
    
    // 3. 检查标号格式
    if (document.getElementById('check-format')?.checked) {
        errors.push(...checkNumbering(claims));
    }

    // 4. 检查引用基础
    if (document.getElementById('check-basis')?.checked) {
        errors.push(...checkAntecedentBasis(claims));
    }

    // 5. 检查标号一致性 (新增)
    if (document.getElementById('check-consistency')?.checked && checkParsedReferences.size > 0) {
        errors.push(...checkReferenceConsistency(claims));
    }

    // 6. 检查错别字 (新增)
    if (document.getElementById('check-typo')?.checked && checkParsedReferences.size > 0) {
        if (window.pinyinPro) {
            errors.push(...checkTypos(claims));
            displayErrors(errors, resultsContainer, claims.length);
        } else {
            // 如果拼音库还没加载完，尝试加载
            showNotification('正在加载资源进行错字检查...', 'info');
            loadPinyinLibrary().then(() => {
                errors.push(...checkTypos(claims));
                displayErrors(errors, resultsContainer, claims.length);
            }).catch(err => {
                console.error('无法加载拼音库，跳过错字检查', err);
                errors.push({
                    type: 'warning',
                    claimId: '-',
                    title: '资源加载失败',
                    desc: '无法加载拼音库，错别字检查功能不可用。请检查网络连接。'
                });
                displayErrors(errors, resultsContainer, claims.length);
            });
            return; // 异步显示结果
        }
    } else {
        displayErrors(errors, resultsContainer, claims.length);
    }
}

// 检查标号一致性
function checkReferenceConsistency(claims) {
    const errors = [];
    
    claims.forEach(claim => {
        for (const [name, expectedNum] of checkParsedReferences) {
             const escapedName = escapeRegExp(name);
             
             // 1. 检查标号是否正确
             // 匹配结构名称后跟随的数字 (考虑各种可能的括号和空格情况)
             // 排除数字后面紧跟汉字的情况（防止匹配到长词的一部分）
             const regexNum = new RegExp(`${escapedName}\\s*[(（]?\\s*(\\d+)\\s*[)）]?`, 'g');
             
             let match;
             while ((match = regexNum.exec(claim.fullText)) !== null) {
                 const foundNum = match[1];
                 const fullMatch = match[0];

                 if (foundNum !== expectedNum) {
                     errors.push({
                        type: 'error',
                        claimId: claim.id,
                        title: '标号不一致',
                        desc: `结构 "${name}" 的标号应为 "${expectedNum}"，但文中标记为 "${foundNum}"。`
                     });
                 }
             }

             // 2. 检查标号是否使用了括号 (新增规则)
             // 查找名称后面紧跟数字的情况，但数字没有被括号包围
             // 正则含义：名称 + 可能的空格 + (非左括号) + 数字
             // 注意：这里要小心，如果名称本身就以数字结尾（很少见），或者有其他复杂情况。
             // 更稳妥的方法是：找到所有"名称+数字"的组合，检查是否符合"名称(数字)"格式。
             
             // 匹配：名称 + 空白* + (可选左括号) + 正确的数字 + (可选右括号)
             const regexFormat = new RegExp(`${escapedName}\\s*([(（]?)\\s*${expectedNum}\\s*([)）]?)`, 'g');
             
             let formatMatch;
             while ((formatMatch = regexFormat.exec(claim.fullText)) !== null) {
                 const leftParen = formatMatch[1];
                 const rightParen = formatMatch[2];
                 const fullStr = formatMatch[0];

                 // 检查括号是否成对且存在
                 const hasLeft = leftParen === '(' || leftParen === '（';
                 const hasRight = rightParen === ')' || rightParen === '）';

                 if (!hasLeft || !hasRight) {
                     errors.push({
                         type: 'error',
                         claimId: claim.id,
                         title: '标号格式错误',
                         desc: `结构 "${name}" 的标号 "${expectedNum}" 必须使用括号括起来。当前格式："${fullStr}"，正确格式应为："${name}（${expectedNum}）" 或 "${name}(${expectedNum})"。`
                     });
                 }
             }
        }
    });
    
    return errors;
}

// 检查错别字 (基于拼音)
function checkTypos(claims) {
    const errors = [];
    const { pinyin } = window.pinyinPro;

    // 辅助函数：笛卡尔积生成所有组合
    function cartesian(args) {
        if (args.length === 0) return [];
        var r = [], max = args.length - 1;
        function helper(arr, i) {
            for (var j = 0, l = args[i].length; j < l; j++) {
                var a = arr.slice(0);
                a.push(args[i][j]);
                if (i == max)
                    r.push(a);
                else
                    helper(a, i + 1);
            }
        }
        helper([], 0);
        return r;
    }

    // 辅助函数：获取文本的所有拼音组合（处理多音字）
    function getAllPinyins(text) {
        // 限制长度以防性能问题，过长的词一般不会是错别字或者不需要全排列
        if (text.length > 6) {
             return [pinyin(text, { toneType: 'none', separator: '' })];
        }
        
        const chars = text.split('');
        const pinyinsPerChar = chars.map(c => {
            // 获取单字的所有拼音
            // 注意：某些特殊字符可能没有拼音，返回原字符
            const py = pinyin(c, { toneType: 'none', multiple: true, type: 'array' });
            return (py && py.length > 0) ? py : [c];
        });
        
        const combinations = cartesian(pinyinsPerChar);
        return combinations.map(arr => arr.join(''));
    }

    // 预计算附图标记的拼音
    const refPinyins = [];
    for (const [name, num] of checkParsedReferences) {
        if (name.length < 2) continue; // 跳过单字，减少误报
        
        // 获取该名称的所有可能拼音组合
        const pys = getAllPinyins(name);
        
        refPinyins.push({
            name,
            pys: new Set(pys), // 使用 Set 加速查找
            original: name
        });
    }

    // 按长度分组，以便滑动窗口匹配
    const refsByLen = {};
    refPinyins.forEach(ref => {
        if (!refsByLen[ref.name.length]) refsByLen[ref.name.length] = [];
        refsByLen[ref.name.length].push(ref);
    });

    claims.forEach(claim => {
        const text = claim.fullText;
        
        // 遍历存在的长度
        for (const lenStr in refsByLen) {
            const len = parseInt(lenStr);
            const refs = refsByLen[len];
            
            // 滑动窗口
            for (let i = 0; i <= text.length - len; i++) {
                const subStr = text.substr(i, len);
                
                // 跳过包含标点、数字或空白的片段
                if (/[，。、\s\d]/.test(subStr)) continue;

                // 如果完全匹配现有结构，则不是错字
                if (checkParsedReferences.has(subStr)) continue;

                // 计算片段拼音
                // 对于片段，我们只需要取其最常用的拼音即可？
                // 或者也计算所有组合？为了稳妥，计算所有组合，只要有一个能匹配上附图标记的拼音，就可能是错字。
                // 但考虑到性能，片段通常也是短词，计算所有组合应该没问题。
                const subPys = getAllPinyins(subStr);
                
                for (const ref of refs) {
                    // 拼音相同但文字不同
                    // 检查 subPys 中是否有任意一个在 ref.pys 中
                    if (ref.name !== subStr) {
                        const hasCommonPinyin = subPys.some(py => ref.pys.has(py));
                        if (hasCommonPinyin) {
                             // 为了避免过度误报，可以增加额外的过滤条件
                             // 例如：如果拼音完全相同，但字完全不同（如“测试”和“侧室”），虽然可能是错字，但也可能是无关词。
                             // 但在专利语境下，同音词出现在文中通常就是错字。
                             
                             errors.push({
                                type: 'warning',
                                claimId: claim.id,
                                title: '可能的错别字',
                                desc: `文中出现的 "${subStr}" 与附图标记 "${ref.name}" 读音可能相同，可能是错别字。`
                             });
                        }
                    }
                }
            }
        }
    });
    
    // 去重错误（同一个词可能在多处被检测到，或者多个附图标记匹配同一个错字）
    // 这里简单去重：同claimId、同title、同desc
    const uniqueErrors = [];
    const errorSet = new Set();
    errors.forEach(e => {
        const key = `${e.claimId}|${e.desc}`;
        if (!errorSet.has(key)) {
            errorSet.add(key);
            uniqueErrors.push(e);
        }
    });
    
    return uniqueErrors;
}

// 解析权利要求文本
function parseClaims(text) {
    const lines = text.split(/\r\n|\r|\n/);
    const claims = [];
    let currentClaim = null;
    
    const claimStartRegex = /^\s*(\d+)[\.、．\s]\s*(.*)/;
    
    lines.forEach((line, index) => {
        const match = line.match(claimStartRegex);
        if (match) {
            // 保存之前的权利要求
            if (currentClaim) {
                // 解析父引用
                currentClaim.parentIds = extractParentIds(currentClaim.fullText);
                claims.push(currentClaim);
            }
            // 开始新权利要求
            currentClaim = {
                id: parseInt(match[1]),
                content: match[2], // 第一行内容
                fullText: match[2], // 完整内容
                lines: [line],
                lineNum: index + 1,
                parentIds: [] // 将在保存时解析
            };
        } else {
            // 继续之前的权利要求
            if (currentClaim) {
                currentClaim.fullText += (currentClaim.fullText ? '\n' : '') + line.trim();
                currentClaim.lines.push(line);
            }
        }
    });
    
    // 添加最后一个权利要求
    if (currentClaim) {
        currentClaim.parentIds = extractParentIds(currentClaim.fullText);
        claims.push(currentClaim);
    }
    
    return claims;
}

// 提取引用的父权利要求ID
function extractParentIds(text) {
    const parentIds = new Set();
    const refRegex = /(?:根据|如)\s*权利要求\s*([0-9\s、,，\-至\.]+)(?:所述|的)/g;
    let match;
    
    while ((match = refRegex.exec(text)) !== null) {
        const refs = parseRefNumbers(match[1]);
        refs.forEach(id => parentIds.add(id));
    }
    
    return Array.from(parentIds);
}

// 检查引用基础 (缺乏引用基础)
function checkAntecedentBasis(claims) {
    const errors = [];
    const claimMap = new Map(claims.map(c => [c.id, c]));
    
    // 简单的分词排除词（不认为是技术特征的词）
    const stopWords = new Set(['所述', '该', '的', '一种', '特征', '在于', '包含', '包括', '是', '为', '有', '在', '上', '下', '中', '前', '后', '按照', '根据']);

    claims.forEach(claim => {
        // 1. 确定检查范围：排除前序部分（逗号之前的部分）
        // 查找第一个全角逗号的位置
        const firstCommaIndex = claim.fullText.indexOf('，');
        // 如果找到逗号，则正文从逗号后开始；否则（极少见）从头开始
        const bodyStartIndex = firstCommaIndex > -1 ? firstCommaIndex + 1 : 0;

        // 匹配 "所述(的)XX" 或 "该(的)XX"
        // (?:的)? 匹配可选的"的"
        // \s* 匹配可能的空白
        // ([\u4e00-\u9fa5a-zA-Z0-9]+) 捕获特征名称
        const basisRegex = /(?:所述|该)(?:的)?\s*([\u4e00-\u9fa5a-zA-Z0-9]+)/g;
        let match;
        
        while ((match = basisRegex.exec(claim.fullText)) !== null) {
            // 如果匹配项在前序部分，跳过检查
            if (match.index < bodyStartIndex) {
                continue;
            }

            let feature = match[1]; // 提取到的特征，如 "机架"
            
            // 尝试使用已解析的附图标记来优化特征提取
            // 解决 "机架上安装有电机" 被识别为 "机架上安装有电机" 的问题
            if (typeof checkParsedReferences !== 'undefined' && checkParsedReferences.size > 0) {
                // 按长度降序排序，优先匹配长词
                const sortedRefs = Array.from(checkParsedReferences.keys())
                    .sort((a, b) => b.length - a.length);
                    
                for (const refDesc of sortedRefs) {
                    if (feature.startsWith(refDesc)) {
                        feature = refDesc;
                        break;
                    }
                }
            }

            // 如果提取的特征太短或者是停用词，跳过
            if (feature.length < 2 || stopWords.has(feature)) continue;
            
            // 检查基础：
            // 1. 在当前权利要求中，该特征出现的位置之前是否出现过？
            // 注意：这里我们仍然使用全文（包括前序部分）作为基础来源
            const currentTextBefore = claim.fullText.substring(0, match.index);
            if (currentTextBefore.includes(feature)) continue; // 当前句前面出现过，有基础
            
            // 2. 在所有祖先权利要求中是否出现过？
            const ancestors = getAllAncestors(claim, claimMap);
            let foundInAncestors = false;
            
            for (const ancestor of ancestors) {
                if (ancestor.fullText.includes(feature)) {
                    foundInAncestors = true;
                    break;
                }
            }
            
            if (foundInAncestors) continue; // 祖先中出现过，有基础
            
            // 都没有找到，报错
            errors.push({
                type: 'warning',
                claimId: claim.id,
                title: '缺乏引用基础',
                desc: `特征 "${feature}" 使用了"所述"或"该"进行引用，但在当前权利要求之前或其引用的权利要求链中未找到基础。`
            });
        }
    });
    
    return errors;
}

// 获取所有祖先权利要求（递归）
function getAllAncestors(claim, claimMap, visited = new Set()) {
    const ancestors = [];
    if (!claim || !claim.parentIds) return ancestors;
    
    // 防止循环引用导致的死循环
    if (visited.has(claim.id)) return ancestors;
    visited.add(claim.id);
    
    for (const pid of claim.parentIds) {
        const parent = claimMap.get(pid);
        if (parent) {
            ancestors.push(parent);
            // 递归获取父权利要求的祖先
            ancestors.push(...getAllAncestors(parent, claimMap, visited));
        }
    }
    
    return ancestors;
}

// 检查引用错误
function checkReferences(claims) {
    const errors = [];
    const claimIds = new Set(claims.map(c => c.id));
    
    claims.forEach(claim => {
        // 匹配 "根据权利要求X..." 或 "如权利要求X所述..."
        // 支持 "根据权利要求1-3" 或 "根据权利要求1、2"
        const refRegex = /(?:根据|如)\s*权利要求\s*([0-9\s、,，\-至\.]+)(?:所述|的)/g;
        let match;
        
        while ((match = refRegex.exec(claim.fullText)) !== null) {
            const refStr = match[1];
            const refs = parseRefNumbers(refStr);
            
            // 检查重复引用 (在同一个引用语句中)
            const uniqueRefs = new Set(refs);
            if (uniqueRefs.size !== refs.length) {
                 errors.push({
                    type: 'warning',
                    claimId: claim.id,
                    title: '重复引用',
                    desc: `在引用 "${match[0]}" 中存在重复的权利要求编号。`
                });
            }
            
            refs.forEach(refId => {
                // 1. 检查引用是否存在
                if (!claimIds.has(refId)) {
                    errors.push({
                        type: 'error',
                        claimId: claim.id,
                        title: '引用不存在',
                        desc: `引用的权利要求 ${refId} 不存在。`
                    });
                }
                // 2. 检查跨层引用 (引用了自己或后面的权利要求)
                else if (refId >= claim.id) {
                    errors.push({
                        type: 'error',
                        claimId: claim.id,
                        title: '引用错误',
                        desc: `权利要求 ${claim.id} 引用了自身或后续的权利要求 ${refId}。`
                    });
                }
            });
        }
    });
    
    return errors;
}

// 解析引用编号字符串 (处理 "1-3", "1、2")
function parseRefNumbers(str) {
    const refs = [];
    // 替换中文符号
    str = str.replace(/，/g, ',').replace(/、/g, ',').replace(/至/g, '-');
    
    const parts = str.split(',');
    parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) refs.push(i);
            }
        } else {
            const num = parseInt(part);
            if (!isNaN(num)) refs.push(num);
        }
    });
    return refs;
}

// 检查标点符号（多重句号、缺少句号）
function checkPeriods(claims) {
    const errors = [];
    
    claims.forEach(claim => {
        const text = claim.fullText.trim();

        // 1. 检查是否以句号结尾
        if (!text.endsWith('。')) {
            errors.push({
                type: 'error', // 必须以句号结尾，视为错误
                claimId: claim.id,
                title: '缺少句号',
                desc: `权利要求 ${claim.id} 未以句号结尾。每一项权利要求都应以句号结束。`
            });
        }
        
        // 2. 检查多重句号
        // 移除末尾的一个句号（如果有的话）
        const textWithoutLastPeriod = text.replace(/。$/, '');
        // 检查剩余文本中是否还有句号
        if (textWithoutLastPeriod.includes('。')) {
            errors.push({
                type: 'warning',
                claimId: claim.id,
                title: '多重句号',
                desc: `权利要求 ${claim.id} 中间出现了句号，通常一项权利要求只在末尾有一个句号。`
            });
        }
    });
    
    return errors;
}

// 检查标号连续性
function checkNumbering(claims) {
    const errors = [];
    let expectedId = 1;
    
    claims.forEach(claim => {
        if (claim.id !== expectedId) {
            errors.push({
                type: 'error',
                claimId: claim.id,
                title: '标号错误',
                desc: `权利要求标号不连续。期望是 ${expectedId}，实际是 ${claim.id}。`
            });
            // 调整期望值以避免后续连锁报错，假设当前的是对的，或者继续保持期望？
            // 通常跳号后续的可能都是错的，或者只是中间缺了一个。
            // 这里我们调整期望值为当前的+1
            expectedId = claim.id; 
        }
        expectedId++;
    });
    
    return errors;
}

// 显示错误结果
function displayErrors(errors, container, totalClaims) {
    if (errors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success); margin-bottom: 1rem;"></i>
                <h3>检查通过</h3>
                <p>未发现形式或逻辑错误（共检查 ${totalClaims} 项权利要求）。</p>
            </div>
        `;
        return;
    }
    
    // 按权利要求ID排序
    errors.sort((a, b) => a.claimId - b.claimId);
    
    const html = errors.map(error => `
        <div class="error-card ${error.type}">
            <div class="error-header">
                <div class="error-title">
                    <i class="fas ${error.type === 'error' ? 'fa-times-circle' : 'fa-exclamation-triangle'}"></i>
                    ${error.title}
                </div>
                <span class="error-claim-ref">权利要求 ${error.claimId}</span>
            </div>
            <div class="error-desc">${error.desc}</div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div style="margin-bottom: 1rem; color: var(--gray-600);">
            共发现 ${errors.length} 个问题
        </div>
        ${html}
    `;
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

// 核心解析逻辑
function extractReferenceData(text) {
    const result = {
        success: false,
        data: [], // Array of {number, description}
        map: new Map(), // description -> number
        error: null,
        warning: null
    };

    // 检查是否缺少末尾句号
    if (!text.trim().endsWith('。')) {
        result.error = {
            title: '句号缺失',
            msg: `附图标记说明的末尾缺少句号，这可能表示复制不完整。<br>` +
                 `请确保完整复制了所有附图标记，并在末尾添加句号。<br><br>` +
                 `当前文本：<br><code>${text}</code><br><br>` +
                 `建议格式：<br><code>${text}。</code>`
        };
        return result;
    }
    
    // 移除末尾的句号（用于解析）
    const cleanText = text.replace(/。$/, '');
    
    // 解析标记 - 支持多种格式（支持数字和字母组合）
    const patterns = [
        /([a-zA-Z0-9]+)、([^；;]+)/g,  // 标准格式：100、基底层 / t1、基底层
        /([a-zA-Z0-9]+)-([^；;]+)/g,   // 简化格式：100-基底层
        /([a-zA-Z0-9]+)：([^；;]+)/g,   // 冒号格式：100：基底层
        /([a-zA-Z0-9]+)\.([^；;]+)/g   // 点格式：100.基底层
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
        result.error = {
            title: '格式错误',
            msg: '未能识别附图标记格式，请检查输入。<br>正确格式示例：<br>1、固定槽；2、支撑架；3、连接杆'
        };
        return result;
    }
    
    // 检查是否有缺失顿号的标号
    const missingDunhaoPattern = /([a-zA-Z0-9]+)([^\d\w、\-：\.;\s]+)/g;
    const missingDunhaoMatches = [...cleanText.matchAll(missingDunhaoPattern)];
    const missingDunhaoItems = [];
    
    if (missingDunhaoMatches.length > 0) {
        missingDunhaoMatches.forEach(match => {
            missingDunhaoItems.push(`${match[1]}${match[2]}`);
        });
        
        result.error = {
            title: '顿号缺失',
            msg: `检测到以下标号可能缺失顿号：<br><ul>${missingDunhaoItems.map(item => `<li>${item}</li>`).join('')}</ul>` +
                 `正确格式应为：<br><ul>${missingDunhaoItems.map(item => `<li>${item.replace(/^([a-zA-Z0-9]+)(.+)$/, '$1、$2')}</li>`).join('')}</ul>`
        };
        return result;
    }
    
    // 检查是否有缺失分号的标号
    const segments = cleanText.split(/[；;。]/);
    const missingSemicolonItems = [];
    
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i].trim();
        if (!segment) continue;
        
        const missingSemicolonPattern = /([a-zA-Z0-9]+[、\-：\.][^；;。\d\w]+)([a-zA-Z0-9]+[、\-：\.])/g;
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
        result.error = {
            title: '分号缺失',
            msg: `检测到以下标号之间可能缺失分号：<br><ul>${missingSemicolonItems.map(item => `<li>${item.original}</li>`).join('')}</ul>` +
                 `正确格式应为：<br><ul>${missingSemicolonItems.map(item => `<li>${item.fixed}</li>`).join('')}</ul>` +
                 `请在每个标号描述后添加分号，以确保格式正确。`
        };
        return result;
    }
    
    // 存储解析结果并检查重复
    const parsedMarks = matches.map(match => {
        const number = match[1];
        const description = match[2].trim().replace(/[。，；;]$/, ''); // 移除末尾标点
        return { number, description };
    });
    
    const duplicateDescriptions = [];
    const overlappingDescriptions = []; 
    
    // 检查完全相同的描述
    for (let i = 0; i < parsedMarks.length; i++) {
        const { number, description } = parsedMarks[i];
        
        const sameDescriptions = parsedMarks.filter((mark, index) => 
            index !== i && mark.description === description
        );
        
        if (sameDescriptions.length > 0) {
            const allNumbers = [number, ...sameDescriptions.map(mark => mark.number)];
            
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
                if (mark1.description !== mark2.description && 
                    (mark1.description.includes(mark2.description) || 
                     mark2.description.includes(mark1.description))) {
                    
                    const longer = mark1.description.length >= mark2.description.length ? mark1 : mark2;
                    const shorter = mark1.description.length < mark2.description.length ? mark1 : mark2;
                    
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
    
    if (duplicateDescriptions.length > 0) {
        const examples = duplicateDescriptions.map(d => 
            `"${d.description}" 对应编号: ${d.numbers.map(n => `(${n})`).join('、')}`
        );
        
        result.error = {
            title: '重复标记名称',
            msg: `检测到以下标记名称完全相同：<br><ul>${examples.map(ex => `<li>${ex}</li>`).join('')}</ul>` +
                 `请修改标记名称，确保每个标记都有唯一的名称。`
        };
        return result;
    }
    
    if (overlappingDescriptions.length > 0) {
        result.warning = {
            title: '标记名称重叠',
            count: overlappingDescriptions.length,
            msg: `检测到 ${overlappingDescriptions.length} 组标记名称重叠，将按最长匹配原则处理`
        };
    }
    
    parsedMarks.forEach(({ number, description }) => {
        result.map.set(description, number);
        result.data.push({ number, description });
    });
    
    result.success = true;
    return result;
}

// 解析附图标记 (自动标号页面)
function parseReferences() {
    const referenceInput = document.getElementById('reference-input');
    const referenceTagsContainer = document.getElementById('reference-tags');
    const referenceCount = document.getElementById('reference-count');
    const parseBtn = document.getElementById('parse-btn');
    
    handleReferenceParsing(referenceInput, referenceTagsContainer, referenceCount, parseBtn, parsedReferences);
}

// 解析附图标记 (错误检查页面)
function parseCheckReferences() {
    const referenceInput = document.getElementById('check-reference-input');
    const referenceTagsContainer = document.getElementById('check-reference-tags');
    const referenceCount = document.getElementById('check-reference-count');
    const parseBtn = document.getElementById('check-parse-btn');
    
    handleReferenceParsing(referenceInput, referenceTagsContainer, referenceCount, parseBtn, checkParsedReferences);
}

// 通用处理函数
function handleReferenceParsing(input, container, countEl, btn, targetMap) {
    if (!input || !container) return;
    
    const text = input.value.trim();
    if (!text) {
        showNotification('请先输入附图标记说明', 'warning');
        return;
    }
    
    if (btn) btn.classList.add('loading');
    
    try {
        targetMap.clear();
        container.innerHTML = '';
        
        const result = extractReferenceData(text);
        
        if (result.error) {
            showErrorModal(result.error.title, result.error.msg);
            return;
        }
        
        if (result.warning) {
            console.warn(result.warning.title);
            showNotification(result.warning.msg, 'warning');
        }
        
        // 更新 Map
        result.map.forEach((v, k) => targetMap.set(k, v));
        
        // 更新 UI
        result.data.forEach(({ number, description }) => {
            const tag = document.createElement('div');
            tag.className = 'reference-tag';
            tag.innerHTML = `<span>${number}</span><span>${description}</span>`;
            container.appendChild(tag);
        });
        
        if (countEl) {
            countEl.textContent = `${targetMap.size} 个标记`;
        }
        
        showNotification(`成功解析 ${targetMap.size} 个附图标记`, 'success');
        
    } catch (error) {
        console.error('解析附图标记时出错:', error);
        showNotification('解析过程中出现错误', 'error');
    } finally {
        if (btn) btn.classList.remove('loading');
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
            
            // 应用标记 - 使用单次替换策略以避免嵌套替换问题
            // 构建正则：(长词|短词)
            const patternStr = sortedReferences.map(ref => escapeRegExp(ref[0])).join('|');
            
            if (patternStr) {
                const flags = options.caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(patternStr, flags);
                
                processedText = processedText.replace(regex, (match) => {
                    // 查找对应的编号
                    // 如果不区分大小写，需要进行模糊查找
                    let refEntry;
                    if (options.caseSensitive) {
                        refEntry = sortedReferences.find(r => r[0] === match);
                    } else {
                        refEntry = sortedReferences.find(r => r[0].toLowerCase() === match.toLowerCase());
                    }
                    
                    if (!refEntry) return match; // 理论上不会发生
                    
                    const description = match; // 保留原文的大小写
                    const number = refEntry[1];
                    
                    appliedCount++;
                    console.log(`找到匹配: ${description} -> ${number}`);
                    
                    if (docType === 'claims') {
                        // 权利要求书格式：基底层(100)
                        if (options.smartSpacing) {
                            return `${description}(${number})`;
                        } else {
                            return `${description} (${number})`;
                        }
                    } else {
                        // 说明书格式：基底层100
                        if (options.smartSpacing) {
                            return `${description}${number}`;
                        } else {
                            return `${description} ${number}`;
                        }
                    }
                });
            }
            
            /* 旧的迭代替换逻辑（已废弃）
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
            */
            
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
                /([a-zA-Z0-9]+)、([^；;]+)/g,  // 标准格式：100、基底层
                /([a-zA-Z0-9]+)-([^；;]+)/g,   // 简化格式：100-基底层
                /([a-zA-Z0-9]+)：([^；;]+)/g,   // 冒号格式：100：基底层
                /([a-zA-Z0-9]+)\.([^；;]+)/g   // 点格式：100.基底层
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
