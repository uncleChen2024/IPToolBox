const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// 提供静态文件
app.use(express.static(__dirname));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(port, () => {
  console.log(`专利工具网站服务器运行在 http://localhost:${port}`);
});