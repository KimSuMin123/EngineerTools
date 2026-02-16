const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// SQLite를 사용하여 별도 설치 없이 로컬 파일로 DB 운영
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// 사용자가 저장한 툴 설정/데이터 모델
const UserToolData = sequelize.define('UserToolData', {
  category: DataTypes.STRING, // SQL, LINUX, TEXT
  title: DataTypes.STRING,
  content: DataTypes.TEXT
});

// 저장 API
app.post('/api/save', async (req, res) => {
  try {
    const data = await UserToolData.create(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 서버 실행
sequelize.sync().then(() => {
  app.listen(3000, () => console.log('Backend: http://localhost:3000'));
});