const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
// 雲端平台都會隨機分配 Port，所以一定要加 process.env.PORT
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// 讓 Express 提供 public 資料夾下的靜態網頁
app.use(express.static(path.join(__dirname, 'public')));

// 啟動 HTTP 伺服器
const server = app.listen(port, () => {
    console.log(`✅ 伺服器已啟動：http://localhost:${port}`);
});

// 啟動 WebSocket 伺服器並依附在 HTTP 伺服器上
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('🎮 Unity 用戶端已連線 (WebSocket)');
    ws.on('close', () => console.log('❌ Unity 用戶端已斷線'));
});

// 接收來自網頁按鈕的 POST Request
app.post('/api/trigger', (req, res) => {
    const { status } = req.body; // 預期收到 'correct' 或 'incorrect'
    console.log(`👉 收到手動觸發指令：${status}`);

    // 將指令廣播給所有連線中的 WebSocket 客戶端 (即 Unity)
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // 確保連線是開啟的
            client.send(JSON.stringify({ eventName: 'ManualOverride', result: status === 'correct' }));
        }
    });

    res.json({ success: true, message: `已傳送 ${status} 給 Unity` });
});