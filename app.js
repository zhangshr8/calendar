// 全局变量
let currentUser = null;
let categories = [];
let records = {};
let charts = {};

// DOM元素
const elements = {
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userProfile: document.getElementById('user-profile'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    loginPrompt: document.getElementById('login-prompt'),
    mainContent: document.getElementById('main-content'),
    dateInput: document.getElementById('date-input'),
    categoriesContainer: document.getElementById('categories-container'),
    commentInput: document.getElementById('comment-input'),
    saveBtn: document.getElementById('save-btn'),
    syncBtn: document.getElementById('sync-btn'),
    statsPeriod: document.getElementById('stats-period'),
    customDateRange: document.getElementById('custom-date-range'),
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    recordsList: document.getElementById('records-list'),
    categoryModal: document.getElementById('category-modal'),
    categoryList: document.getElementById('category-list'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    closeCategoryModal: document.getElementById('close-category-modal'),
    saveCategories: document.getElementById('save-categories')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// 初始化应用
function initializeApp() {
    // 设置今天的日期
    elements.dateInput.value = new Date().toISOString().split('T')[0];
    
    // 检查是否已登录
    checkLoginStatus();
    
    // 加载本地数据
    loadLocalData();
    
    // 更新界面
    updateUI();
}

// 设置事件监听器
function setupEventListeners() {
    elements.loginBtn.addEventListener('click', loginWithGitHub);
    elements.logoutBtn.addEventListener('click', logout);
    elements.saveBtn.addEventListener('click', saveRecord);
    elements.syncBtn.addEventListener('click', syncToGitHub);
    elements.dateInput.addEventListener('change', loadDateRecord);
    elements.statsPeriod.addEventListener('change', handleStatsPeriodChange);
    elements.addCategoryBtn.addEventListener('click', showCategoryModal);
    elements.closeCategoryModal.addEventListener('click', hideCategoryModal);
    elements.saveCategories.addEventListener('click', saveCategories);
    
    // 自定义日期范围
    elements.startDate.addEventListener('change', updateCharts);
    elements.endDate.addEventListener('change', updateCharts);
}

// GitHub OAuth登录
function loginWithGitHub() {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CONFIG.clientId}&redirect_uri=${GITHUB_CONFIG.redirectUri}&scope=${GITHUB_CONFIG.scope}`;
    window.location.href = authUrl;
}

// 处理OAuth回调
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // 交换access token
        exchangeCodeForToken(code);
    }
}

// 交换code获取access token
async function exchangeCodeForToken(code) {
    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CONFIG.clientId,
                client_secret: 'cc563e335e3f23ecdd19c7d4eaae65534483c486', // 你的Client Secret
                code: code,
                redirect_uri: GITHUB_CONFIG.redirectUri
            })
        });
        
        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('github_token', data.access_token);
            await getUserInfo(data.access_token);
        }
    } catch (error) {
        console.error('Token exchange failed:', error);
        alert('登录失败，请重试');
    }
}

// 获取用户信息
async function getUserInfo(token) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        const user = await response.json();
        currentUser = user;
        localStorage.setItem('github_user', JSON.stringify(user));
        updateUI();
        loadGitHubData();
    } catch (error) {
        console.error('Failed to get user info:', error);
    }
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('github_token');
    const user = localStorage.getItem('github_user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUI();
        loadGitHubData();
    }
    
    // 处理OAuth回调
    handleOAuthCallback();
}

// 登出
function logout() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    currentUser = null;
    updateUI();
}

// 更新UI
function updateUI() {
    if (currentUser) {
        elements.loginBtn.classList.add('hidden');
        elements.userProfile.classList.remove('hidden');
        elements.userAvatar.src = currentUser.avatar_url;
        elements.userName.textContent = currentUser.login;
        elements.loginPrompt.classList.add('hidden');
        elements.mainContent.classList.remove('hidden');
    } else {
        elements.loginBtn.classList.remove('hidden');
        elements.userProfile.classList.add('hidden');
        elements.loginPrompt.classList.remove('hidden');
        elements.mainContent.classList.add('hidden');
    }
}

// 加载本地数据
function loadLocalData() {
    const localRecords = localStorage.getItem('time_records');
    const localCategories = localStorage.getItem('time_categories');
    
    if (localRecords) {
        records = JSON.parse(localRecords);
    }
    
    if (localCategories) {
        categories = JSON.parse(localCategories);
    } else {
        // 默认分类
        categories = ['看论文', '学习物理知识', '学习COMSOL软件'];
        localStorage.setItem('time_categories', JSON.stringify(categories));
    }
    
    renderCategories();
    loadDateRecord();
    updateCharts();
    updateRecordsList();
}

// 渲染分类输入框
function renderCategories() {
    elements.categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'flex items-center space-x-2';
        categoryDiv.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 w-24">${category}</label>
            <input type="number" 
                   class="category-input flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                   placeholder="小时数" 
                   step="0.5" 
                   min="0"
                   data-category="${category}">
        `;
        elements.categoriesContainer.appendChild(categoryDiv);
    });
}

// 加载指定日期的记录
function loadDateRecord() {
    const selectedDate = elements.dateInput.value;
    const dayRecord = records[selectedDate] || { time: {}, comment: '' };
    
    // 清空所有输入框
    document.querySelectorAll('.category-input').forEach(input => {
        input.value = '';
    });
    
    // 填充时间数据
    Object.keys(dayRecord.time).forEach(category => {
        const input = document.querySelector(`[data-category="${category}"]`);
        if (input) {
            input.value = dayRecord.time[category];
        }
    });
    
    // 填充评论
    elements.commentInput.value = dayRecord.comment || '';
}

// 保存记录
function saveRecord() {
    const selectedDate = elements.dateInput.value;
    const timeData = {};
    
    // 收集时间数据
    document.querySelectorAll('.category-input').forEach(input => {
        const category = input.dataset.category;
        const value = parseFloat(input.value) || 0;
        if (value > 0) {
            timeData[category] = value;
        }
    });
    
    // 保存记录
    if (!records[selectedDate]) {
        records[selectedDate] = { time: {}, comment: '' };
    }
    
    records[selectedDate].time = timeData;
    records[selectedDate].comment = elements.commentInput.value;
    
    // 保存到本地存储
    localStorage.setItem('time_records', JSON.stringify(records));
    
    // 更新图表和记录列表
    updateCharts();
    updateRecordsList();
    
    // 显示成功消息
    showNotification('记录保存成功！', 'success');
}

// 同步到GitHub
async function syncToGitHub() {
    if (!currentUser) {
        alert('请先登录GitHub');
        return;
    }
    
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('请重新登录');
        return;
    }
    
    try {
        // 同步记录数据
        await syncToGitHubFile(token, APP_CONFIG.dataFile, records);
        
        // 同步分类数据
        await syncToGitHubFile(token, APP_CONFIG.categoryFile, categories);
        
        showNotification('同步到GitHub成功！', 'success');
    } catch (error) {
        console.error('Sync failed:', error);
        showNotification('同步失败，请重试', 'error');
    }
}

// 同步文件到GitHub
async function syncToGitHubFile(token, filePath, data) {
    const url = `https://api.github.com/repos/${APP_CONFIG.repo}/contents/${filePath}`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    
    // 检查文件是否存在
    const fileResponse = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    
    let sha = null;
    if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        sha = fileData.sha;
    }
    
    // 创建或更新文件
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update ${filePath}`,
            content: content,
            sha: sha
        })
    });
    
    if (!response.ok) {
        throw new Error(`Failed to sync ${filePath}`);
    }
}

// 从GitHub加载数据
async function loadGitHubData() {
    if (!currentUser) return;
    
    const token = localStorage.getItem('github_token');
    if (!token) return;
    
    try {
        // 加载记录数据
        const recordsData = await loadFromGitHubFile(token, APP_CONFIG.dataFile);
        if (recordsData) {
            records = recordsData;
            localStorage.setItem('time_records', JSON.stringify(records));
        }
        
        // 加载分类数据
        const categoriesData = await loadFromGitHubFile(token, APP_CONFIG.categoryFile);
        if (categoriesData) {
            categories = categoriesData;
            localStorage.setItem('time_categories', JSON.stringify(categories));
        }
        
        // 更新界面
        renderCategories();
        loadDateRecord();
        updateCharts();
        updateRecordsList();
        
        showNotification('从GitHub同步数据成功！', 'success');
    } catch (error) {
        console.error('Failed to load GitHub data:', error);
    }
}

// 从GitHub加载文件
async function loadFromGitHubFile(token, filePath) {
    const url = `https://api.github.com/repos/${APP_CONFIG.repo}/contents/${filePath}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        return JSON.parse(atob(data.content));
    }
    
    return null;
}

// 更新图表
function updateCharts() {
    const period = elements.statsPeriod.value;
    let startDate, endDate;
    
    if (period === 'custom') {
        elements.customDateRange.classList.remove('hidden');
        startDate = new Date(elements.startDate.value);
        endDate = new Date(elements.endDate.value);
    } else {
        elements.customDateRange.classList.add('hidden');
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
    }
    
    if (startDate && endDate) {
        renderTrendChart(startDate, endDate);
        renderPieChart(startDate, endDate);
        updateStatsSummary(startDate, endDate);
    }
}

// 处理统计周期变化
function handleStatsPeriodChange() {
    const period = elements.statsPeriod.value;
    
    if (period === 'custom') {
        elements.customDateRange.classList.remove('hidden');
        // 设置默认日期范围
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        elements.startDate.value = startDate.toISOString().split('T')[0];
        elements.endDate.value = endDate.toISOString().split('T')[0];
    } else {
        elements.customDateRange.classList.add('hidden');
    }
    
    updateCharts();
}

// 渲染趋势图
function renderTrendChart(startDate, endDate) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // 销毁现有图表
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    const dates = [];
    const datasets = [];
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    
    // 生成日期范围
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 为每个分类创建数据集
    categories.forEach((category, index) => {
        const data = dates.map(date => {
            const record = records[date];
            return record && record.time && record.time[category] ? record.time[category] : 0;
        });
        
        datasets.push({
            label: category,
            data: data,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: false,
            tension: 0.1
        });
    });
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '每日时间投入趋势'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '时间（小时）'
                    }
                }
            }
        }
    });
}

// 渲染饼图
function renderPieChart(startDate, endDate) {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    
    // 销毁现有图表
    if (charts.pie) {
        charts.pie.destroy();
    }
    
    const categoryTotals = {};
    
    // 计算每个分类的总时间
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const record = records[dateStr];
        
        if (record && record.time) {
            Object.keys(record.time).forEach(category => {
                categoryTotals[category] = (categoryTotals[category] || 0) + record.time[category];
            });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    
    charts.pie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '分类时间分布'
                }
            }
        }
    });
}

// 更新统计摘要
function updateStatsSummary(startDate, endDate) {
    const summary = document.getElementById('stats-summary');
    let totalHours = 0;
    const categoryTotals = {};
    
    // 计算统计数据
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const record = records[dateStr];
        
        if (record && record.time) {
            Object.keys(record.time).forEach(category => {
                const hours = record.time[category];
                categoryTotals[category] = (categoryTotals[category] || 0) + hours;
                totalHours += hours;
            });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 生成摘要HTML
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const avgHoursPerDay = totalHours / daysDiff;
    
    let summaryHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">${totalHours.toFixed(1)}</div>
                <div class="text-sm text-gray-600">总时间（小时）</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${avgHoursPerDay.toFixed(1)}</div>
                <div class="text-sm text-gray-600">平均每天（小时）</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">${daysDiff}</div>
                <div class="text-sm text-gray-600">统计天数</div>
            </div>
        </div>
    `;
    
    if (Object.keys(categoryTotals).length > 0) {
        summaryHTML += '<div class="mt-4"><h4 class="font-medium mb-2">分类统计：</h4><div class="grid grid-cols-2 md:grid-cols-4 gap-2">';
        
        Object.entries(categoryTotals).forEach(([category, hours]) => {
            const percentage = ((hours / totalHours) * 100).toFixed(1);
            summaryHTML += `
                <div class="bg-gray-50 p-2 rounded">
                    <div class="font-medium">${category}</div>
                    <div class="text-sm text-gray-600">${hours.toFixed(1)}h (${percentage}%)</div>
                </div>
            `;
        });
        
        summaryHTML += '</div></div>';
    }
    
    summary.innerHTML = summaryHTML;
}

// 更新记录列表
function updateRecordsList() {
    const sortedDates = Object.keys(records).sort().reverse();
    
    elements.recordsList.innerHTML = '';
    
    if (sortedDates.length === 0) {
        elements.recordsList.innerHTML = '<p class="text-gray-500 text-center">暂无记录</p>';
        return;
    }
    
    sortedDates.forEach(date => {
        const record = records[date];
        const totalHours = Object.values(record.time || {}).reduce((sum, hours) => sum + hours, 0);
        
        const recordDiv = document.createElement('div');
        recordDiv.className = 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50';
        
        recordDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium">${date}</h3>
                    <p class="text-sm text-gray-600">总计：${totalHours.toFixed(1)} 小时</p>
                    ${record.comment ? `<p class="text-sm text-gray-500 mt-1">${record.comment}</p>` : ''}
                </div>
                <div class="flex space-x-2">
                    <button onclick="editRecord('${date}')" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteRecord('${date}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        elements.recordsList.appendChild(recordDiv);
    });
}

// 编辑记录
function editRecord(date) {
    elements.dateInput.value = date;
    loadDateRecord();
    showNotification(`正在编辑 ${date} 的记录`, 'info');
}

// 删除记录
function deleteRecord(date) {
    if (confirm(`确定要删除 ${date} 的记录吗？`)) {
        delete records[date];
        localStorage.setItem('time_records', JSON.stringify(records));
        updateCharts();
        updateRecordsList();
        showNotification('记录已删除', 'success');
    }
}

// 显示分类管理模态框
function showCategoryModal() {
    renderCategoryList();
    elements.categoryModal.classList.remove('hidden');
    elements.categoryModal.classList.add('flex');
}

// 隐藏分类管理模态框
function hideCategoryModal() {
    elements.categoryModal.classList.add('hidden');
    elements.categoryModal.classList.remove('flex');
}

// 渲染分类列表
function renderCategoryList() {
    elements.categoryList.innerHTML = '';
    
    categories.forEach((category, index) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'flex items-center justify-between p-2 border border-gray-200 rounded';
        categoryItem.innerHTML = `
            <span>${category}</span>
            <button onclick="removeCategory(${index})" class="text-red-600 hover:text-red-800">
                <i class="fas fa-trash"></i>
            </button>
        `;
        elements.categoryList.appendChild(categoryItem);
    });
    
    // 添加新分类输入框
    const addCategoryDiv = document.createElement('div');
    addCategoryDiv.className = 'flex items-center space-x-2 mt-2';
    addCategoryDiv.innerHTML = `
        <input type="text" id="new-category-input" class="flex-1 border border-gray-300 rounded-md px-3 py-2" placeholder="新分类名称">
        <button onclick="addCategory()" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
            <i class="fas fa-plus"></i>
        </button>
    `;
    elements.categoryList.appendChild(addCategoryDiv);
}

// 添加分类
function addCategory() {
    const input = document.getElementById('new-category-input');
    const newCategory = input.value.trim();
    
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        renderCategoryList();
        input.value = '';
    }
}

// 移除分类
function removeCategory(index) {
    if (confirm('确定要删除这个分类吗？')) {
        categories.splice(index, 1);
        renderCategoryList();
    }
}

// 保存分类
function saveCategories() {
    localStorage.setItem('time_categories', JSON.stringify(categories));
    renderCategories();
    loadDateRecord();
    updateCharts();
    hideCategoryModal();
    showNotification('分类已保存', 'success');
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 页面加载时检查OAuth回调
if (window.location.search.includes('code=')) {
    handleOAuthCallback();
}