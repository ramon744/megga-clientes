# Script para conectar ao GitHub e fazer push
# Execute este script no PowerShell dentro do diretório do projeto

Write-Host "🚀 Conectando ao GitHub..." -ForegroundColor Green
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "server.js")) {
    Write-Host "❌ ERRO: Execute este script no diretório do projeto!" -ForegroundColor Red
    Write-Host "   O arquivo server.js deve estar neste diretório" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Navegue até o diretório:" -ForegroundColor Cyan
    Write-Host "   cd 'C:\Users\Ramon\automaçao mega paine'" -ForegroundColor White
    exit 1
}

Write-Host "✅ Diretório correto encontrado!" -ForegroundColor Green
Write-Host ""

# Remover .git se existir no diretório errado (home)
$homeGit = "$env:USERPROFILE\.git"
if (Test-Path $homeGit) {
    Write-Host "⚠️  Removendo .git do diretório home..." -ForegroundColor Yellow
    Remove-Item -Path $homeGit -Recurse -Force -ErrorAction SilentlyContinue
}

# Inicializar Git no diretório do projeto
if (-not (Test-Path ".git")) {
    Write-Host "📦 Inicializando Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Git já está inicializado" -ForegroundColor Green
}

# Configurar Git (se ainda não configurado)
$gitName = git config user.name
$gitEmail = git config user.email

if (-not $gitName) {
    Write-Host ""
    $userName = Read-Host "Digite seu nome (para commits Git)"
    git config user.name "$userName"
}

if (-not $gitEmail) {
    Write-Host ""
    $userEmail = Read-Host "Digite seu email (para commits Git)"
    git config user.email "$userEmail"
}

# Adicionar arquivos
Write-Host ""
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Cyan
git add .

# Verificar mudanças
$status = git status --short
if ($status) {
    Write-Host "✅ Arquivos adicionados" -ForegroundColor Green
    Write-Host ""
    
    # Fazer commit
    $commitMessage = "Primeiro commit: Automação Mega Painel"
    Write-Host "💾 Criando commit..." -ForegroundColor Cyan
    git commit -m "$commitMessage"
    Write-Host "✅ Commit criado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar" -ForegroundColor Yellow
}

# Configurar branch como main
Write-Host ""
Write-Host "🔀 Configurando branch principal..." -ForegroundColor Cyan
git branch -M main
Write-Host "✅ Branch configurada como 'main'" -ForegroundColor Green

# Adicionar repositório remoto
Write-Host ""
Write-Host "🔗 Conectando ao repositório GitHub..." -ForegroundColor Cyan
$remoteUrl = "https://github.com/ramon744/megga-clientes.git"

# Verificar se remote já existe
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "⚠️  Remote 'origin' já existe: $existingRemote" -ForegroundColor Yellow
    $change = Read-Host "Deseja alterar para o novo repositório? (s/n)"
    if ($change -eq "s" -or $change -eq "S") {
        git remote set-url origin $remoteUrl
        Write-Host "✅ Remote atualizado!" -ForegroundColor Green
    }
} else {
    git remote add origin $remoteUrl
    Write-Host "✅ Remote 'origin' adicionado!" -ForegroundColor Green
}

# Fazer push
Write-Host ""
Write-Host "📤 Enviando código para o GitHub..." -ForegroundColor Cyan
Write-Host "   (Você pode precisar fazer login no GitHub)" -ForegroundColor Yellow
Write-Host ""

try {
    git push -u origin main
    Write-Host ""
    Write-Host "🎉 SUCESSO! Código enviado para o GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Repositório: https://github.com/ramon744/megga-clientes" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Próximo passo: Configure o deploy no Render.com" -ForegroundColor Yellow
    Write-Host "   Consulte o arquivo SETUP_GITHUB.md para instruções" -ForegroundColor Yellow
} catch {
    Write-Host ""
    Write-Host "⚠️  Erro ao fazer push. Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   1. Você não está logado no GitHub" -ForegroundColor White
    Write-Host "   2. Você não tem permissão no repositório" -ForegroundColor White
    Write-Host "   3. Precisa usar token de acesso pessoal" -ForegroundColor White
    Write-Host ""
    Write-Host "   Solução:" -ForegroundColor Cyan
    Write-Host "   - Acesse: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   - Crie um token com permissão 'repo'" -ForegroundColor White
    Write-Host "   - Use o token como senha quando solicitado" -ForegroundColor White
}

