# ERB Deploy Checklist (EC2)

## قبل الـ Deploy — AWS

- [ ] EC2 Instance في حالة **Running**
- [ ] Elastic IP **56.228.41.132** مربوط بالـ Instance الصح
- [ ] Security Group — Inbound:
  - **22** (SSH) أو **3389** (RDP)
  - **80** (Nginx / HTTP)
  - **443** (HTTPS — اختياري)

## Linux (Ubuntu) — موصى به مع Nginx

```bash
# 1. ارفع ERB-deploy.zip وفكّه
sudo mkdir -p /opt/ERB
sudo unzip ERB-deploy.zip -d /opt/ERB

# 2. عدّل البيئة
sudo nano /opt/ERB/erb/.env   # JWT_KEY + DATABASE_URL

# 3. Deploy كامل
sudo bash /opt/ERB/scripts/deploy-ec2-linux.sh
```

### PM2 (يتنفّذ تلقائياً داخل السكript)

```bash
npm install -g pm2
pm2 start /opt/ERB/scripts/ecosystem.config.cjs   # erb-api + erb-web
pm2 save
pm2 startup   # ثم نفّذ الأمر اللي PM2 يطبعه
pm2 save
```

### Nginx

- Config: `scripts/nginx-erb.conf`
- `/` → Frontend `:3000`
- `/api/v1/` → Backend `:5000`
- `/api/auth/` → Frontend (login cookies)
- `/health` → Backend health

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**الرابط:** http://56.228.41.132/ar/login

## Windows

```powershell
cd C:\ERB
powershell -ExecutionPolicy Bypass -File .\deploy-ec2-windows.ps1
```

**الرابط:** http://56.228.41.132:3000/ar/login

## بعد الـ Deploy — تحقق

```bash
pm2 status          # erb-api + erb-web online
pm2 logs --lines 50
curl http://localhost/health
curl http://localhost/ar/login
```

## أوامر مفيدة

```bash
pm2 restart all
pm2 stop all
pm2 delete all
sudo systemctl status nginx
sudo systemctl reload nginx
```
