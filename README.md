# 🚗 MazdaCare Pro Web & Diagnostics API

<div align="center">

![MazdaCare Pro](web-assets/feature-graphic.jpg)

[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Ready-22c55e?style=for-the-badge&logo=github)](https://pages.github.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](https://opensource.org/licenses/MIT)

**الموقع الإلكتروني الرسمي وبوابة الفحص الذكي لتطبيق MazdaCare Pro**  
*Official Web Showcase, Interactive Diagnostic Tools & Node.js REST API for Mazda Vehicles.*

[التوثيق بالعربية](#-دليل-التشغيل-والنشر) • [English Documentation](#-english-overview) • [REST API Documentation](#-rest-api-reference)

---

</div>

## ✨ الميزات الرئيسية | Key Features

1. 🔍 **فاحص رقم الهيكل الذكي (ISO 3779 VIN Decoder)**: تحقق رياضي فوري من صحة رقم الشاصي وتحديد بلد ومصنع التجميع وسنة الصنع.
2. ⚠️ **موسوعة أكواد الأعطال OBD-II (82+ DTCs)**: بحث فوري عن كود العطل باللغتين العربية والإنجليزية مع الأعراض والأسباب وخطوات الإصلاح المعتمدة.
3. 🛢️ **دليل السوائل والمواصفات الرسمية لأسطول مازدا**: استعراض فوري لسيارات CX-90, CX-60, CX-9, CX-5, CX-30, مازدا 6, مازدا 3, و MX-5 Miata مع سعات الزيوت (0W-20, 5W-30) وزيت القير ATF-FZ وسائل FL22.
4. 🚀 **محاكي عداد HUD العاكس للزجاج الأمامي**: محاكاة حية لسرعة القيادة و RPM مع 4 ثيمات نيون وميزة Mirror Mode لعكس الشاشة.
5. 📅 **جداول الصيانة الدورية**: استعراض بنود الصيانة من 10,000 كم حتى 120,000 كم.
6. 📱 **معرض لقطات الشاشة**: استعراض تفاعلي لواجهات التطبيق بدقة عالية.

---

## 🚀 دليل التشغيل والنشر | Deployment Guide

### 1️⃣ الاستضافة على GitHub Pages (مجاناً 100%)
الموقع مصمم للعمل كـ **Static Site** بدون أي خادم خارجي عند رفعه على GitHub Pages:
1. أنشئ مستودعاً جديداً على GitHub باسم (مثلاً: `mazdacare-web`).
2. ارفع محتويات هذا المجلد للمستودع:
   ```bash
   git init
   git add .
   git commit -m "Initial release of MazdaCare Pro Web"
   git branch -M main
   git remote add origin https://github.com/omar-bakhsh/mazdacare-web.git
   git push -u origin main
   ```
3. اذهب إلى إعدادات المستودع **Settings -> Pages**:
   - تحت **Build and deployment -> Source**، اختر **GitHub Actions** (سيتم النشر تلقائياً عبر ملف `.github/workflows/deploy.yml` المجهز لك)، أو اختر **Deploy from a branch** واختر فرع `main` والمجلد `/ (root)`.
4. مبروك! سيصبح موقعك متاحاً على الرابط:  
   `https://omar-bakhsh.github.io/mazdacare-web/`

---

### 2️⃣ التشغيل والاستضافة عبر Node.js Host
يحتوي المشروع على خادم `server.js` إنتاجي فائق السرعة يدعم **Express** ويوفر **REST API**:

#### التشغيل محلياً (Local):
```bash
# بدون تثبيت حزم (Native HTTP):
node server.js

# أو تثبيت الحزم التنافسية:
npm install
npm start
```
سيعمل الموقع والـ API على: `http://localhost:3000`

#### الاستضافة السحابية (Render / Railway / Koyeb / VPS):
- **Render.com**:
  - أنشئ **New Web Service** واربط المستودع الجديد.
  - Build Command: `npm install`
  - Start Command: `node server.js`
- **Railway.app** أو **Docker**: المشروع مجهز بملف `Dockerfile` جاهز للتشغيل بضغطة زر.

---

## 🔌 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | فحص حالة الخادم ومعدل التشغيل (Health Check) |
| `/api/vehicles` | `GET` | قائمة كافة سيارات مازدا ومواصفات السوائل الهندسية |
| `/api/vehicles/:id` | `GET` | مواصفات سيارة محددة (مثل: `cx90`, `cx5`, `mazda6`) |
| `/api/dtc` | `GET` | البحث في أكواد الأعطال (يدعم `?search=P0300&category=ignition`) |
| `/api/dtc/:code` | `GET` | تفاصيل كود عطل محدد مع خطوات الإصلاح |
| `/api/contact` | `POST` | استلام رسائل واستفسارات التواصل |

---

## 📄 License
المشروع مرخص تحت رخصة **MIT**. جميع الحقوق محفوظة © 2026 تطبيق **MazdaCare Pro** - تطوير المهندس **عمر بخش**.
