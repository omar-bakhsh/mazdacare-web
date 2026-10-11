# 📖 دليل النشر والاستضافة الشامل | MazdaCare Pro Web

مرحباً بك! هذا الدليل يوضح لك بالخطوات العملية والمباشرة كيفية رفع الموقع إلى مستودع GitHub جديد واستضافته على **GitHub Pages** وربطه مع **Node.js Host**.

---

## 📌 الخطوة 1: إنشاء مستودع جديد على GitHub

1. افتح حسابك على [GitHub](https://github.com/new).
2. في خانة **Repository name**، اكتب اسم المستودع الجديد (على سبيل المثال: `mazdacare-web` أو `MazdaCare-Site`).
3. اجعل المستودع **Public**.
4. **تنبيه مهم:** لا تضع علامة صح على "Add a README file" أو ".gitignore" (لأننا جهزناها لك بالكامل بالفعل داخل المجلد).
5. اضغط على الزر الأخضر **Create repository**.

---

## 📌 الخطوة 2: رفع الموقع للمستودع الجديد عبر الأوامر (Git)

الموقع مجهز بالكامل في المجلد:
`c:\Users\Dell\OneDrive\Desktop\mazda care pro\website`

افتح موجه الأوامر (PowerShell أو Terminal) داخل المجلد ونفذ الأوامر التالية بالترتيب:

```bash
cd "c:\Users\Dell\OneDrive\Desktop\mazda care pro\website"

# 1. تهيئة المستودع
git init

# 2. إضافة جميع الملفات
git add .

# 3. حفظ التغييرات (Commit)
git commit -m "Initial release of MazdaCare Pro Web application"

# 4. تعيين الفرع الرئيسي
git branch -M main

# 5. ربط المستودع الجديد (استبدل الرابط برابط المستودع الذي أنشأته)
git remote add origin https://github.com/omar-bakhsh/mazdacare-web.git

# 6. الرفع إلى GitHub
git push -u origin main
```

*(إذا طلب منك تسجيل الدخول، سجّل دخولك بحساب GitHub الخاص بك).*

---

## 📌 الخطوة 3: تفعيل استضافة الموقع على GitHub Pages (مجاناً)

بمجرد رفع الملفات إلى المستودع الجديد:

### الطريقة المباشرة (خلال 30 ثانية):
1. اذهب إلى صفحة المستودع على GitHub: `https://github.com/omar-bakhsh/mazdacare-web`
2. اضغط على التبويب **Settings** (الإعدادات).
3. من القائمة الجانبية اليسرى، اضغط على **Pages**.
4. تحت قسم **Build and deployment**:
   - في خانة **Source**: اختر **Deploy from a branch**.
   - في خانة **Branch**: اختر فرع **main** والمجلد **/ (root)**.
   - اضغط **Save**.
5. انتظر دقيقة واحدة، ثم حدّث الصفحة وستجد رابط موقعك جاهزاً مثل:
   👉 **`https://omar-bakhsh.github.io/mazdacare-web/`**

> **ملاحظة:** تم تزويد المشروع أيضاً بملف **GitHub Actions** تلقائي في المسار `.github/workflows/deploy.yml`، إذا اخترت في خانة Source خيار `GitHub Actions` فسيتم بناء الموقع وتحديثه تلقائياً عند أي Push!

---

## 📌 الخطوة 4: ربط الموقع واستضافته على Node.js Host

المشروع يحتوي على خادم `server.js` إنتاجي يدعم:
- تقديم صفحات الموقع بسرعة فائقة مع التخزين المؤقت (Caching).
- واجهات برمجة تطبيقات **REST API**:
  - `GET /api/health` (فحص سلامة الخادم)
  - `GET /api/vehicles` (قاعدة بيانات السوائل ومواصفات مازدا)
  - `GET /api/dtc` (محرك البحث في أكواد الأعطال)
  - `POST /api/contact` (استقبال الرسائل واستفسارات الورش)

### الخيار أ: الاستضافة على Render.com (مجاناً)
1. افتح [Render.com](https://render.com) وسجل الدخول باستخدام GitHub.
2. اضغط **New +** ثم اختر **Web Service**.
3. اختر مستودعك الجديد `mazdacare-web`.
4. املأ البيانات التالية:
   - **Name**: `mazdacare-api` (أو أي اسم تفضله)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. اضغط **Create Web Service**.
6. ستحصل على رابط مباشر مجاني للخادم مثل: `https://mazdacare-api.onrender.com`

---

### الخيار ب: الاستضافة على Railway.app
1. افتح [Railway.app](https://railway.app) وسجل الدخول بحساب GitHub.
2. اضغط **New Project** -> **Deploy from GitHub repo**.
3. اختر المستودع `mazdacare-web`.
4. سيتعرف Railway تلقائياً على ملف `Dockerfile` أو `package.json` ويقوم بتشغيله فوراً!

---

### الخيار ج: الاستضافة على لوحة cPanel (Node.js Selector)
إذا كان لديك استضافة مشتركة أو سيرفر cPanel:
1. ارفع ملفات المجلد إلى المسار المطلوب عبر File Manager.
2. ادخل إلى **Setup Node.js App** في cPanel.
3. اضغط **Create Application**:
   - **Node.js version**: اختر 18 أو 20.
   - **Application root**: المجلد الذي رفعت فيه الملفات.
   - **Application startup file**: `server.js`
4. اضغط **Run NPM Install** ثم **Restart**.

---

## 🏁 ملخص الروابط بعد الإطلاق

- 🌐 **رابط الموقع على GitHub Pages**:  
  `https://omar-bakhsh.github.io/mazdacare-web/`
- ⚙️ **رابط الـ API و Node.js Host**:  
  `https://your-node-host.com/api/health`
- 📦 **المستودع الجديد**:  
  `https://github.com/omar-bakhsh/mazdacare-web`
