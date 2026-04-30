# Chatbot Setup Script
# This script helps you set up the API keys for the chatbot

Write-Host "🤖 AI Chatbot Setup" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan

# Check if .env exists
$envPath = "c:\Users\swara\OneDrive\Desktop\sw-t8\backend\.env"

if (Test-Path $envPath) {
    Write-Host "✅ Found .env file" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found at: $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Current API Keys Status:" -ForegroundColor Yellow
Write-Host "============================`n"

# Read current .env content
$envContent = Get-Content $envPath -Raw

# Check for Gemini API Key
if ($envContent -match "GEMINI_API_KEY=(.+)") {
    $geminiKey = $matches[1].Trim()
    if ($geminiKey -and $geminiKey -ne "your_gemini_key_here") {
        Write-Host "✅ GEMINI_API_KEY: Configured" -ForegroundColor Green
    } else {
        Write-Host "❌ GEMINI_API_KEY: Not configured" -ForegroundColor Red
        Write-Host "   Get your free key at: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ GEMINI_API_KEY: Missing from .env" -ForegroundColor Red
    Write-Host "   Adding placeholder..." -ForegroundColor Yellow
    Add-Content -Path $envPath -Value "`nGEMINI_API_KEY=your_gemini_key_here"
}

# Check for News API Key
if ($envContent -match "NEWS_API_KEY=(.+)") {
    $newsKey = $matches[1].Trim()
    if ($newsKey -and $newsKey -ne "your_news_key_here") {
        Write-Host "✅ NEWS_API_KEY: Configured" -ForegroundColor Green
    } else {
        Write-Host "❌ NEWS_API_KEY: Not configured" -ForegroundColor Red
        Write-Host "   Get your free key at: https://newsapi.org" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ NEWS_API_KEY: Missing from .env" -ForegroundColor Red
    Write-Host "   Adding placeholder..." -ForegroundColor Yellow
    Add-Content -Path $envPath -Value "`nNEWS_API_KEY=your_news_key_here"
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "=============`n"
Write-Host "1. Get Google Gemini API Key (FREE):" -ForegroundColor White
Write-Host "   → https://aistudio.google.com/app/apikey" -ForegroundColor Gray
Write-Host "   → 60 requests/minute free tier`n" -ForegroundColor Gray

Write-Host "2. Get NewsAPI Key (FREE):" -ForegroundColor White
Write-Host "   → https://newsapi.org" -ForegroundColor Gray
Write-Host "   → 100 requests/day free tier`n" -ForegroundColor Gray

Write-Host "3. Add keys to .env file:" -ForegroundColor White
Write-Host "   → Open: $envPath" -ForegroundColor Gray
Write-Host "   → Replace 'your_gemini_key_here' with your Gemini key" -ForegroundColor Gray
Write-Host "   → Replace 'your_news_key_here' with your News key`n" -ForegroundColor Gray

Write-Host "4. Restart the backend server`n" -ForegroundColor White

Write-Host "✨ Then you're ready to chat with your AI assistant!" -ForegroundColor Green
