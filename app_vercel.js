// =============== 配置区 ===============
const TOPICS = [
  "三角函数与解三角形",
  "解析几何",
  "数列",
  "函数与导数",
  "立体几何",
  "概率与统计",
  "不等式",
  "集合",
  "复数",
  "平面向量",
  "算法",
  "排列组合",
  "新定义"
  // 👉 请在此处补充你所有的知识点（最多36个）
];

const TYPES = ["单选题", "填空题", "解答题"];
const PAGE_SIZE = 20;

// =============== 全局状态 ===============
let allQuestions = [];
let currentTopic = null;
let currentType = null;
let currentPage = 1;

// =============== 工具函数：渲染选项（支持图片） ===============
function renderChoiceText(text) {
  // 匹配 Markdown 图片语法: [alt](images/xxx.jpg)
  const imgRegex = /^\[([^\]]*)\]\(([^)]+)\)$/;
  const match = text.match(imgRegex);
  if (match) {
    const alt = match[1] || '选项图';
    const src = match[2];
    return `<img src="${src}" alt="${alt}" class="choice-image">`;
  }
  // 普通文本直接返回
  return text;
}

// =============== 工具函数：渲染题目内容（支持图片） ===============
function renderContent(text) {
  if (!text) return '';
  
  // 匹配 Markdown 图片语法: ![alt](images/xxx.jpg)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  return text.replace(imgRegex, (match, alt, src) => {
    return `<img src="${src}" alt="${alt || '题目图'}" class="content-image">`;
  });
}

// =============== 初始化 ===============
document.addEventListener('DOMContentLoaded', () => {
  // 显示加载状态
  const questionsEl = document.getElementById('questions');
  questionsEl.innerHTML = '<div class="loading" style="padding:20px;text-align:center;color:#666;">📚 正在加载题目数据...</div>';
  
  // Vercel部署优化：使用相对路径加载data.json
  const dataPath = './data.json';
  
  fetch(dataPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} - 无法加载data.json文件`);
      return res.json();
    })
    .then(data => {
      allQuestions = data;
      renderCategories();
      // 隐藏加载状态
      questionsEl.innerHTML = '';
    })
    .catch(err => {
      console.error('加载数据失败:', err);
      questionsEl.innerHTML = 
        `<div class="error" style="color:red;padding:20px;">❌ 数据加载失败<br>请检查data.json文件是否存在或格式正确</div>`;
    });
});

// =============== 渲染分类侧边栏 ===============
function renderCategories() {
  const container = document.getElementById('categories');
  container.innerHTML = TOPICS.map(topic => `
    <div class="category">
      <h3>${topic}</h3>
      <div class="buttons">
        ${TYPES.map(type => 
          `<button class="btn" onclick="showQuestions('${topic}', '${type}')">${type}</button>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

// =============== 显示题目 ===============
function showQuestions(topic, type) {
  currentTopic = topic;
  currentType = type;
  currentPage = 1;
  updateView();
}

// =============== 更新视图 ===============
function updateView() {
  const filtered = allQuestions.filter(q =>
    q.tags?.includes(currentTopic) && q.type === currentType
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 更新标题
  document.getElementById('current-title').textContent = 
    `${currentTopic} · ${currentType}（共 ${total} 题）`;

  // 渲染题目
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);
  
  const questionsEl = document.getElementById('questions');
  questionsEl.innerHTML = pageData.map(q => `
    <div class="question">
      <h3>${q.year}年 ${q.source} 第${q.no}题</h3>
      <div class="content">${renderContent(q.content || '')}</div>
      ${q.choices ? `
        <div class="choices">
          ${Object.entries(q.choices).map(([key, val]) => 
            `<div class="choice"><strong>${key}.</strong> ${renderChoiceText(val)}</div>`
          ).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  // 渲染分页
  renderPagination(totalPages);

  // 渲染 LaTeX 公式
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(questionsEl, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false}
      ],
      throwOnError: false
    });
  }
}

// =============== 分页 ===============
function renderPagination(totalPages) {
  const paginationEl = document.getElementById('pagination');
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let buttons = '';
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    buttons += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) buttons += `<span style="padding:0 4px;">…</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    buttons += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) buttons += `<span style="padding:0 4px;">…</span>`;
    buttons += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  paginationEl.innerHTML = buttons;
}

// =============== 分页跳转 ===============
function goToPage(page) {
  currentPage = page;
  updateView();
}

// =============== 全局函数（供 HTML 调用）===============
window.showQuestions = showQuestions;
window.goToPage = goToPage;
