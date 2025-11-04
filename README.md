# Automação Mega Painel

Sistema de automação para coleta de dados de clientes do Mega Painel usando Puppeteer.

## 🚀 Como Colocar no Ar

### Opção 1: Render.com (Recomendado - Grátis)

1. **Criar conta no Render:**
   - Acesse [render.com](https://render.com)
   - Crie uma conta gratuita

2. **Conectar repositório:**
   - Faça upload do código para o GitHub
   - No Render, clique em "New" → "Web Service"
   - Conecte seu repositório GitHub

3. **Configurar:**
   - **Name:** `automacao-mega-paine`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (Starter)

4. **Adicionar variáveis de ambiente:**
   - Na seção "Environment Variables", adicione:
     - `USER_EMAIL` = seu email do Mega Painel
     - `USER_PASSWORD` = sua senha do Mega Painel
     - `PORT` = será definido automaticamente (não precisa)

5. **Deploy:**
   - Clique em "Create Web Service"
   - Aguarde o deploy finalizar
   - Seu app estará disponível em: `https://seu-app.onrender.com`

### Opção 2: Railway.app

1. **Criar conta no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Crie uma conta (pode usar GitHub)

2. **Criar projeto:**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Conecte seu repositório

3. **Configurar variáveis:**
   - Vá em "Variables" e adicione:
     - `USER_EMAIL` = seu email
     - `USER_PASSWORD` = sua senha

4. **Deploy automático:**
   - O Railway detecta automaticamente o `package.json`
   - O deploy acontece automaticamente

### Opção 3: Fly.io

1. **Instalar CLI:**
   ```bash
   npm install -g @fly/cli
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Criar app:**
   ```bash
   fly launch
   ```

4. **Configurar variáveis:**
   ```bash
   fly secrets set USER_EMAIL=seu_email@exemplo.com
   fly secrets set USER_PASSWORD=sua_senha
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

## 📋 Pré-requisitos Locais

Para testar localmente:

```bash
# Instalar dependências
npm install

# Criar arquivo .env com suas credenciais
cp .env.example .env
# Edite o .env e adicione suas credenciais

# Rodar servidor
npm start
```

## 🔗 Endpoints Disponíveis

- `GET /clientes` - Retorna lista de clientes (usa cache se válido)
- `GET /status` - Status do cache e última atualização
- `GET /atualizar` - Força nova coleta de dados
- `GET /clientes-app` - Formato específico para app
- `GET /limpar-cache` - Limpa cache e regenera

## ⚙️ Configurações

- **Atualização automática:** A cada 5 minutos
- **Cache TTL:** 10 minutos
- **Porta:** 3000 (ou definida pela variável `PORT`)

## 📝 Notas Importantes

1. **Puppeteer em produção:** O código já está configurado com flags para rodar em servidores (headless mode)
2. **Variáveis de ambiente:** Nunca commite o arquivo `.env` com suas credenciais
3. **Cache:** Os dados são armazenados localmente no arquivo `cache_clientes.json`

## 🛠️ Troubleshooting

### Erro: "Chrome não encontrado"
- Em produção, o Puppeteer baixa automaticamente o Chrome necessário
- Se persistir, verifique se o plano da hospedagem suporta binários

### Erro: "Timeout"
- Aumente os timeouts no código se necessário
- Verifique sua conexão com o Mega Painel

### App não inicia
- Verifique se as variáveis `USER_EMAIL` e `USER_PASSWORD` estão configuradas
- Verifique os logs da plataforma de hospedagem

