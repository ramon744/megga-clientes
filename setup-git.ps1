# Script de Configuração Git para Automação Mega Painel
# Execute este script no PowerShell: .\setup-git.ps1

Write-Host "🚀 Configurando Git para Automação Mega Painel" -ForegroundColor Green
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "server.js")) {
    Write-Host "❌ Erro: Execute este script no diretório do projeto!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar em: C:\Users\Ramon\automaçao mega paine" -ForegroundColor Yellow
    exit 1
}

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não está instalado. Instale em: https://git-scm.com" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Configurando Git..." -ForegroundColor Cyan

# Inicializar Git se não estiver inicializado
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Repositório Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Repositório Git já existe" -ForegroundColor Green
}

# Solicitar informações do usuário
Write-Host ""
Write-Host "Por favor, informe:" -ForegroundColor Yellow
$userName = Read-Host "Seu nome (para commits)"
$userEmail = Read-Host "Seu email (para commits)"

# Configurar Git
git config user.name "$userName"
git config user.email "$userEmail"

Write-Host ""
Write-Host "✅ Git configurado com:" -ForegroundColor Green
Write-Host "   Nome: $userName" -ForegroundColor Cyan
Write-Host "   Email: $userEmail" -ForegroundColor Cyan

# Adicionar arquivos
Write-Host ""
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Cyan
git add .

# Verificar se há mudanças para commitar
$status = git status --short
if ($status) {
    $commitMessage = Read-Host "Mensagem do commit (Enter para padrão)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Primeiro commit: Automação Mega Painel"
    }
    git commit -m "$commitMessage"
    Write-Host "✅ Commit criado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Crie um repositório no GitHub (github.com)" -ForegroundColor White
Write-Host "2. Execute estes comandos:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/SEU_USUARIO/automacao-mega-paine.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Consulte o arquivo SETUP_GITHUB.md para instruções detalhadas!" -ForegroundColor Yellow

