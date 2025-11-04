# 🚀 Guia: Criar Repositório no GitHub e Deploy no Render

## Passo 1: Inicializar Git Localmente

Abra o PowerShell ou Terminal no diretório do projeto e execute:

```powershell
# Navegar para o diretório do projeto
cd "C:\Users\Ramon\automaçao mega paine"

# Inicializar repositório Git
git init

# Configurar seu nome (substitua pelo seu nome)
git config user.name "Seu Nome"

# Configurar seu email (substitua pelo seu email do GitHub)
git config user.email "seu.email@gmail.com"
```

## Passo 2: Adicionar Arquivos ao Git

```powershell
# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Primeiro commit: Automação Mega Painel"
```

## Passo 3: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name:** `automacao-mega-paine` (ou outro nome)
   - **Description:** "Automação para coleta de clientes do Mega Painel"
   - **Visibilidade:** Público ou Privado (sua escolha)
   - **NÃO marque** "Initialize with README" (já temos arquivos)
5. Clique em **"Create repository"**

## Passo 4: Conectar ao GitHub

Depois de criar o repositório, o GitHub vai mostrar os comandos. Execute estes comandos no PowerShell:

```powershell
# Adicionar o repositório remoto (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/automacao-mega-paine.git

# Ou se preferir usar SSH (você precisa ter SSH configurado):
# git remote add origin git@github.com:SEU_USUARIO/automacao-mega-paine.git

# Enviar código para o GitHub
git branch -M main
git push -u origin main
```

Se pedir login, use seu usuário e senha do GitHub (ou token de acesso pessoal).

## Passo 5: Deploy no Render

1. Acesse [render.com](https://render.com)
2. Faça login ou crie uma conta (pode usar GitHub)
3. Clique em **"New +"** → **"Web Service"**
4. Conecte seu repositório GitHub:
   - Clique em **"Connect GitHub"**
   - Autorize o Render
   - Selecione o repositório `automacao-mega-paine`
5. Configure o serviço:
   - **Name:** `automacao-mega-paine`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free` (Starter)
6. Adicione as variáveis de ambiente:
   - Clique em **"Environment"**
   - Adicione:
     - **Key:** `USER_EMAIL` | **Value:** seu email do Mega Painel
     - **Key:** `USER_PASSWORD` | **Value:** sua senha do Mega Painel
7. Clique em **"Create Web Service"**
8. Aguarde o deploy (pode levar alguns minutos)

## ✅ Pronto!

Seu app estará disponível em: `https://automacao-mega-paine.onrender.com`

Endpoints disponíveis:
- `https://seu-app.onrender.com/clientes`
- `https://seu-app.onrender.com/status`
- `https://seu-app.onrender.com/atualizar`

## 🔧 Troubleshooting

### Erro ao fazer push no GitHub
- Verifique se você está logado: `git config --global user.name`
- Se usar token, crie um em: GitHub → Settings → Developer settings → Personal access tokens

### Erro no Render
- Verifique os logs no dashboard do Render
- Certifique-se de que as variáveis `USER_EMAIL` e `USER_PASSWORD` estão configuradas
- Verifique se o build completou com sucesso

