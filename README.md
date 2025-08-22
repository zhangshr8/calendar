# 每日时间记录器 - Web版

这是一个基于GitHub的数据同步时间记录器，支持多设备数据同步。

## 功能特性

- 📅 每日时间记录和分类管理
- 📊 数据可视化（趋势图、饼图）
- 💾 本地存储 + GitHub同步
- 🔐 GitHub OAuth登录
- 📱 响应式设计，支持移动端
- 🎨 现代化UI界面

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **样式**: Tailwind CSS
- **图表**: Chart.js
- **图标**: Font Awesome
- **数据存储**: localStorage + GitHub API
- **部署**: GitHub Pages

## 快速开始

### 1. 配置GitHub OAuth应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: 每日时间记录器
   - **Homepage URL**: `https://zhangshr8.github.io/calendar`
   - **Authorization callback URL**: `https://zhangshr8.github.io/calendar`
4. 创建后获取 **Client ID** 和 **Client Secret**

### 2. 配置应用

编辑 `web/index.html` 文件，替换以下配置：

```javascript
const GITHUB_CONFIG = {
    clientId: 'YOUR_CLIENT_ID', // 替换为你的Client ID
    redirectUri: 'https://zhangshr8.github.io/calendar',
    scope: 'repo'
};
```

编辑 `web/app.js` 文件，替换以下配置：

```javascript
// 在 exchangeCodeForToken 函数中
client_secret: 'YOUR_CLIENT_SECRET', // 替换为你的Client Secret
```

### 3. 部署到GitHub Pages

1. 将 `web` 文件夹中的文件推送到你的GitHub仓库
2. 在仓库设置中启用GitHub Pages：
   - 进入仓库 Settings
   - 找到 Pages 部分
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main" 或 "master"
   - 文件夹选择 "/ (root)"
   - 点击 Save

3. 访问 `https://zhangshr8.github.io/calendar` 即可使用

## 使用说明

### 登录
- 点击 "GitHub登录" 按钮
- 授权应用访问你的GitHub仓库
- 登录成功后自动同步数据

### 记录时间
1. 选择日期
2. 在各分类输入框中输入时间（小时）
3. 可选：添加当天评论
4. 点击 "保存记录"

### 数据同步
- 本地自动保存到浏览器localStorage
- 点击 "同步到GitHub" 将数据备份到GitHub仓库
- 登录时自动从GitHub同步最新数据

### 查看统计
- 选择统计周期（过去一周/一月/自定义）
- 查看趋势图和饼图
- 查看详细统计数据

### 管理分类
- 点击 "添加分类" 按钮
- 可以添加、删除分类
- 分类会自动同步到GitHub

## 数据结构

### 记录数据格式
```json
{
  "2024-01-01": {
    "time": {
      "看论文": 2.5,
      "学习物理知识": 1.5
    },
    "comment": "今天学习了量子力学的基础知识"
  }
}
```

### 分类数据格式
```json
["看论文", "学习物理知识", "学习COMSOL软件"]
```

## 注意事项

1. **数据安全**: 所有数据都存储在你的GitHub仓库中，完全由你控制
2. **API限制**: GitHub API有调用限制，个人使用完全够用
3. **离线使用**: 未登录时可正常使用，数据保存在本地
4. **移动端**: 支持手机浏览器访问，建议添加到主屏幕

## 开发计划

- [ ] 添加导出功能（CSV、PDF）
- [ ] 支持多用户
- [ ] 添加提醒功能
- [ ] 优化移动端体验
- [ ] 添加数据加密

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！