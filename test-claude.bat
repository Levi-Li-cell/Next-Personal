@echo off
echo Testing Claude Code with GLM-4.7...
set ANTHROPIC_API_KEY=ccaaf7a512aa419b9a836063509967da.pxwq9wd0YavAf6BU
set ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/messages
claude -p "你好，你是什么模型？"
pause