@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d D:\OpenAvatarChat

echo ========================================
echo   OpenAvatarChat - AI导游数字人服务
echo   角色: 使用 lam_samples\current.zip
echo   端口: 8787
echo ========================================
echo.

D:\Miniconda3\envs\avatar\python.exe src\demo.py --config config\lingshan_http.yaml

pause
