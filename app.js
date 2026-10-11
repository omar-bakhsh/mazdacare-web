/**
 * MazdaCare Pro - Official Web Application Logic
 * Interactive VIN Decoder, DTC Diagnostics, Fleet Specs, HUD Simulator & i18n
 */

(function () {
  'use strict';

  // --- State ---
  let currentLang = localStorage.getItem('mazdacare_lang') || 'ar';
  let activeDtcCategory = 'all';
  let activeHudTheme = 'cyan';
  let hudInterval = null;
  let isHudMirrored = false;

  // --- ISO 3779 VIN Verification ---
  const VIN_VALUES = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  const YEAR_CODES = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
    'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
    'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027
  };

  function validateVinChecksum(vin) {
    if (!vin || vin.length !== 17) return false;
    const upper = vin.toUpperCase();
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const val = VIN_VALUES[upper[i]];
      if (val === undefined) return false;
      sum += val * VIN_WEIGHTS[i];
    }
    const rem = sum % 11;
    const expected = rem === 10 ? 'X' : rem.toString();
    return upper[8] === expected;
  }

  function decodeVin(rawVin) {
    if (!rawVin) return null;
    const vin = rawVin.trim().toUpperCase().replace(/[\s\-]/g, '');
    if (vin.length !== 17) {
      return {
        validLength: false,
        message_ar: 'يجب أن يتكون رقم الهيكل من 17 خانة تماماً.',
        message_en: 'VIN must be exactly 17 characters.'
      };
    }

    const wmi = vin.substring(0, 3);
    const checksumValid = validateVinChecksum(vin);

    let origin_ar = 'صانع دولي / غير محدد بدقة';
    let origin_en = 'International / Unidentified Manufacturer';
    let isMazda = false;

    if (wmi.startsWith('JM1') || wmi.startsWith('JM3') || wmi.startsWith('JM7') || wmi.startsWith('JMZ')) {
      origin_ar = 'مازدا موتور كوربوريشن - هيروشيما / هوفو (اليابان)';
      origin_en = 'Mazda Motor Corp - Hiroshima / Hofu (Japan)';
      isMazda = true;
    } else if (wmi.startsWith('3MD') || wmi.startsWith('3MZ')) {
      origin_ar = 'مازدا دي مكسيكو - سالامانكا (المكسيك)';
      origin_en = 'Mazda de Mexico - Salamanca (Mexico)';
      isMazda = true;
    } else if (wmi.startsWith('4F4') || wmi.startsWith('1YV')) {
      origin_ar = 'مازدا تويوتا للتصنيع - ألاباما (الولايات المتحدة)';
      origin_en = 'Mazda Toyota Mfg - Alabama / AutoAlliance (USA)';
      isMazda = true;
    } else if (wmi.startsWith('MM8')) {
      origin_ar = 'أوتو ألاينس تايلاند - رايونغ (تايلاند)';
      origin_en = 'AutoAlliance Thailand - Rayong (Thailand)';
      isMazda = true;
    }

    const yearChar = vin[9];
    const modelYear = YEAR_CODES[yearChar] || '2010 - 2027';

    // Model Family rough inference
    let modelLine_ar = 'أسطول سيارات مازدا';
    let modelLine_en = 'Mazda Vehicle Lineup';
    const char4 = vin[3];
    const char5 = vin[4];
    if (vin.includes('KK') || char4 === 'K') {
      modelLine_ar = 'مازدا CX-90 / CX-70 (منصة الدفع الخلفي الكبيرة)';
      modelLine_en = 'Mazda CX-90 / CX-70 (Large Product Platform)';
    } else if (char4 === 'T' || (char4 === 'T' && char5 === 'C')) {
      modelLine_ar = 'مازدا CX-9 (Skyactiv-G 2.5T)';
      modelLine_en = 'Mazda CX-9 (Skyactiv-G 2.5T)';
    } else if (char4 === 'K' || char5 === 'F') {
      modelLine_ar = 'مازدا CX-5 (Skyactiv 2.0L / 2.5L)';
      modelLine_en = 'Mazda CX-5 (Skyactiv 2.0L / 2.5L)';
    } else if (char4 === 'G' || char5 === 'L') {
      modelLine_ar = 'مازدا 6 سيدان فاخرة';
      modelLine_en = 'Mazda 6 Luxury Sedan';
    } else if (char4 === 'B' || char5 === 'P') {
      modelLine_ar = 'مازدا 3 الجيل الرابع';
      modelLine_en = 'Mazda 3 Gen 4';
    } else if (char4 === 'N' && char5 === 'D') {
      modelLine_ar = 'مازدا MX-5 مياتا رودستر';
      modelLine_en = 'Mazda MX-5 Miata Roadster';
    }

    return {
      validLength: true,
      vin: vin,
      wmi: wmi,
      isMazda: isMazda,
      checksumValid: checksumValid,
      origin_ar: origin_ar,
      origin_en: origin_en,
      year: modelYear,
      modelLine_ar: modelLine_ar,
      modelLine_en: modelLine_en,
      plantCode: vin[10],
      serialNumber: vin.substring(11)
    };
  }

  // --- Translations Dictionary ---
  const I18N = {
    ar: {
      siteTitle: 'MazdaCare Pro | تطبيق فحص وصيانة سيارات مازدا الذكي',
      navFeatures: 'المميزات',
      navVin: 'فاحص الشاصي VIN',
      navDtc: 'أكواد الأعطال',
      navFluids: 'دليل السوائل',
      navHud: 'عداد HUD',
      navSchedule: 'جداول الصيانة',
      navScreenshots: 'واجهات التطبيق',
      navDownload: 'تحميل التطبيق',
      heroBadge: 'تطبيق مهندسي وملاك مازدا الأول',
      heroTitle: 'الفحص الذكي والصيانة الاحترافية لسيارات مازدا',
      heroSubtitle: 'فحص أعطال كمبيوتر السيارة OBD2 الحي، متتبع قطع الإشعال Misfire، عداد HUD عاكس الزجاج الأمامي، ودليل السوائل والزيوت المعتمدة لأسطول مازدا كاملاً.',
      btnDownloadApk: 'تحميل APK مباشر',
      btnGithub: 'المشروع على GitHub',
      btnTryTools: 'تجربة الأدوات التفاعلية',
      featureObdTitle: 'فحص OBD-II وبلوتوث BLE مباشر',
      featureObdDesc: 'اتصال فوري مع أجهزة ELM327 BLE لقراءة الحساسات الحية، فحص حرارة المحرك، جهد الدينامو، ومسح لمبة المكينة Check Engine بنقرة واحدة.',
      featureMisfireTitle: 'متتبع قطع الإشعال (Mode 06 Misfire)',
      featureMisfireDesc: 'خوارزمية ذكية لمراقبة كفاءة غرف الاحتراق والسلندرات في الوقت الفعلي لمحركات 4 سلندر و 6 سلندر V6 لكشف الكويلات والبواجي التالفة.',
      featureDtcTitle: 'موسوعة 82+ كود عطل معتمد',
      featureDtcDesc: 'قاعدة بيانات تشخيصية مخصصة لسيارات مازدا تترجم العطل بالعربية والإنجليزية مع توضيح الأعراض الدقيقة، الأسباب الجذرية، وخطوات الإصلاح المعتمدة.',
      featureFluidsTitle: 'دليل السوائل والمواصفات الرسمية',
      featureFluidsDesc: 'لزوجات الزيوت الدقيقة (0W-20, 5W-30, 0W-16)، سعات القير الأصلي ATF-FZ، سائل التبريد FL22، وعزوم شد البواجي ومواصفات الدبل والدفرنس.',
      featureVinTitle: 'فاحص VIN وقارئ الاستمارة OCR',
      featureVinDesc: 'التحقق الرياضي من مطابقة رقم الهيكل لمعيار ISO 3779، واستخراج بلد الصنع ومصنع التجميع وسنة الصنع والمحرك بدقة متناهية.',
      featureHudTitle: 'عداد رقمي HUD عاكس للزجاج الأمامي',
      featureHudDesc: 'وضعية القيادة الليلية مع عداد سرعة نيون ضخم ومؤشر RPM وحرارة المحرك مع خاصية الانعكاس الكامل Mirror Mode لعرض البيانات على الزجاج الأمامي.',
      vinSectionTitle: 'فاحص رقم الهيكل الذكي (ISO 3779 VIN Decoder)',
      vinSectionSub: 'افحص رقم شاصي سيارتك مازدا للتحقق من صحته، سنة الصنع، ومصنع التجميع باليابان أو المكسيك',
      vinPlaceholder: 'أدخل رقم الهيكل المكون من 17 خانة (مثال: JM1GL...)',
      vinCheckBtn: 'فحص وتحليل الشاصي',
      vinSampleLabel: 'أو جرب نماذج جاهزة:',
      dtcSectionTitle: 'موسوعة أكواد الأعطال وخطوات الإصلاح',
      dtcSectionSub: 'ابحث عن أي كود عطل (P0300, P0171, P0700...) لمعرفة سببه وخريطة إصلاحه الهندسية',
      dtcSearchPlaceholder: 'ابحث برقم الكود أو العرض (مثال: P0300، تفتفة، زيت قير، CAN)...',
      fluidsSectionTitle: 'دليل السوائل والزيوت المعتمدة لأسطول مازدا',
      fluidsSectionSub: 'اختر موديل سيارتك لاستعراض لزوجات الزيت وسعات التعبئة وقطع الغيار المعتمدة',
      selectCarLabel: 'اختر طراز مازدا:',
      copySpecsBtn: 'نسخ المواصفات الهندسية',
      shareWhatsAppBtn: 'مشاركة عبر واتساب',
      hudSectionTitle: 'محاكي عداد HUD العاكس للزجاج الأمامي',
      hudSectionSub: 'جرب تقنية الإسقاط الليلي على زجاج السيارة الأمامي مع قراءات السرعة والـ RPM الحية',
      hudMirrorToggle: 'عكس الشاشة للزجاج (Mirror Mode)',
      hudThemeCyan: 'سماوي نيون',
      hudThemeRed: 'أحمر رياضي',
      hudThemeAmber: 'كهرماني ليلي',
      hudThemeGreen: 'أخضر هايبر',
      maintSectionTitle: 'جداول الصيانة الدورية الذكية',
      maintSectionSub: 'قوائم فحص شاملة من 10,000 كم حتى 120,000 كم مطابقة لتوصيات المصنع',
      screenshotsTitle: 'واجهات وشاشات تطبيق MazdaCare Pro',
      screenshotsSub: 'تصميم فائق الأناقة يدعم الوضعين المظلم والفاتح، واللغتين العربية والإنجليزية مع لوحات تحكم متطورة',
      downloadSectionTitle: 'جاهز للانطلاق مع سيارتك مازدا بأعلى كفاءة؟',
      downloadSectionSub: 'احجز مقعدك الآن واحصل على الترخيص الكامل مجاناً مدى الحياة (0 ر.س بدلاً من 99 ر.س)',
      downloadApkCard: 'برنامج اختبار Google Play',
      downloadApkDesc: 'انضم للتجربة المغلقة الرسمية واحصل على ترخيص مجاني دائم',
      cardStore: 'متجر Google Play الرسمي',
      cardStoreDesc: 'صفحة التطبيق الرسمية لتحميل التحديثات المباشرة بعد تأكيد الانضمام',
      contactTitle: 'تواصل مع الدعم الفني والشراكات',
      contactSub: 'للاستفسارات التقنية، طلب المساعدة في التحميل، أو المساهمة في قاعدة البيانات',
      contactName: 'الاسم الكريم',
      contactEmail: 'البريد الإلكتروني',
      contactMsg: 'رسالتك أو ملاحظتك',
      contactSubmit: 'إرسال الرسالة',
      footerRights: 'جميع الحقوق محفوظة © 2026 تطبيق MazdaCare Pro. تطوير م. عمر بخش.',
      footerDisclaimer: 'تنبيه: هذا التطبيق هو أداة هندسية ورفيق صيانة مستقل من تطوير ملاك وعشاق سيارات مازدا، وليس منتجاً رسمياً صادراً عن شركة مازدا موتور كوربوريشن.'
    },
    en: {
      siteTitle: 'MazdaCare Pro | Smart OBD2 Diagnostics & Maintenance Companion for Mazda',
      navFeatures: 'Features',
      navVin: 'VIN Decoder',
      navDtc: 'Fault Codes',
      navFluids: 'Fluids & Specs',
      navHud: 'HUD Display',
      navSchedule: 'Maintenance',
      navScreenshots: 'Screenshots',
      navDownload: 'Download',
      heroBadge: 'Premium App (99 SAR) - 100% Free for First 12 Testers!',
      heroTitle: 'Smart Diagnostics & Engineering Maintenance for Mazda',
      heroSubtitle: 'Live OBD-II BLE diagnostics, real-time Mode 06 misfire tracker, nighttime windshield HUD speedometer, and official fleet fluids specifications.',
      btnDownloadApk: 'Claim Free Copy on Google Play',
      btnStore: 'Google Play Store',
      btnTryTools: 'Try Interactive Tools',
      featureObdTitle: 'Live OBD-II & Bluetooth BLE Scanner',
      featureObdDesc: 'Instant pairing with ELM327 BLE adapters for real-time telemetry, engine coolant, alternator voltage, and one-tap Check Engine clearing.',
      featureMisfireTitle: 'Real-Time Misfire Monitor (Mode 06)',
      featureMisfireDesc: 'Intelligent cylinder combustion health monitor for 4-cylinder and V6 engines to isolate deteriorating ignition coils and spark plugs.',
      featureDtcTitle: '82+ Curated Mazda DTC Encyclopedia',
      featureDtcDesc: 'Granular diagnostic database with bilingual symptoms, root causes, and verified mechanical repair procedures for Powertrain, AT, and CAN Bus.',
      featureFluidsTitle: 'Tailored Fleet Fluids & Specs',
      featureFluidsDesc: 'Exact engine oil viscosity (0W-20, 5W-30, 0W-16), genuine ATF-FZ capacity, FL22 coolant, spark plug torque, and AWD differential lubricants.',
      featureVinTitle: 'Smart VIN Decoder & ISO 3779 OCR',
      featureVinDesc: 'Automated ISO 3779 checksum calculation, assembly plant decoding (Japan, Mexico, USA), and model year identification.',
      featureHudTitle: 'Night Windshield Heads-Up Display (HUD)',
      featureHudDesc: 'High-contrast neon projection mode with oversized digital speedometer, RPM bar, and horizontal mirror flip for windshield reflections.',
      vinSectionTitle: 'ISO 3779 VIN Decoder & Validator',
      vinSectionSub: 'Verify your Mazda chassis number, assembly plant in Japan or Mexico, and model year',
      vinPlaceholder: 'Enter 17-character VIN (e.g., JM1GL...)',
      vinCheckBtn: 'Decode & Validate VIN',
      vinSampleLabel: 'Or test sample VINs:',
      dtcSectionTitle: 'OBD-II Fault Codes & Repair Guide',
      dtcSectionSub: 'Search any diagnostic code (P0300, P0171, P0700...) for verified symptoms and step-by-step fixes',
      dtcSearchPlaceholder: 'Search code or symptom (e.g. P0300, misfire, ATF, CAN)...',
      fluidsSectionTitle: 'Official Fluids & Engineering Specifications',
      fluidsSectionSub: 'Select your Mazda vehicle to explore viscosities, fill capacities, and OEM part numbers',
      selectCarLabel: 'Select Mazda Model:',
      copySpecsBtn: 'Copy Specs to Clipboard',
      shareWhatsAppBtn: 'Share on WhatsApp',
      hudSectionTitle: 'Interactive Windshield HUD Simulator',
      hudSectionSub: 'Experience the nighttime heads-up projection with live speed counter and RPM telemetry',
      hudMirrorToggle: 'Windshield Mirror Mode',
      hudThemeCyan: 'Neon Cyan',
      hudThemeRed: 'Sport Red',
      hudThemeAmber: 'Night Amber',
      hudThemeGreen: 'Hyper Green',
      maintSectionTitle: 'Smart Maintenance Milestone Schedules',
      maintSectionSub: 'Factory-tailored inspection checklists from 10,000 km to 120,000 km',
      screenshotsTitle: 'MazdaCare Pro App Showcase',
      screenshotsSub: 'Engineered with sleek dark/light themes, dynamic bilingual support, and high-performance telemetry',
      downloadSectionTitle: 'Elevate Your Mazda Ownership Experience',
      downloadSectionSub: 'Claim your limited free lifetime access on Google Play (0 SAR instead of 99 SAR)',
      downloadApkCard: 'Google Play Closed Test Program',
      downloadApkDesc: 'Opt-in immediately to get full lifetime access free of charge',
      cardStore: 'Google Play Store',
      cardStoreDesc: 'Official Google Play store listing for direct installation after opt-in',
      contactTitle: 'Developer & Workshop Inquiries',
      contactSub: 'For technical feedback, workshop collaborations, or database contributions',
      contactName: 'Your Name',
      contactEmail: 'Email Address',
      contactMsg: 'Message or Notes',
      contactSubmit: 'Send Message',
      footerRights: 'All Rights Reserved © 2026 MazdaCare Pro. Designed & Engineered by Omar Bakhsh.',
      footerDisclaimer: 'Disclaimer: MazdaCare Pro is an independent engineering tool and companion developed by Mazda owners and enthusiasts. Not affiliated with or endorsed by Mazda Motor Corporation.'
    }
  };

  // --- UI Update on Language Switch ---
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mazdacare_lang', lang);
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const t = I18N[lang];
    document.title = t.siteTitle;

    // Update text elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    // Update placeholders with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) {
        el.setAttribute('placeholder', t[key]);
      }
    });

    // Update Lang Switcher button text
    const langBtn = document.getElementById('lang-switch-btn');
    if (langBtn) {
      const globeSvg = `<svg class="svg-icon svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
      langBtn.innerHTML = lang === 'ar' ? `${globeSvg} English` : `${globeSvg} العربية`;
    }

    // Refresh dynamic widgets
    renderFluidsSelector();
    renderDtcCards();
    renderMaintenanceSchedule();
  }

  // --- VIN Tool Setup ---
  function initVinTool() {
    const vinInput = document.getElementById('vin-input');
    const vinBtn = document.getElementById('vin-btn');
    const vinResult = document.getElementById('vin-result');
    const vinSamplesContainer = document.getElementById('vin-samples');

    if (!vinInput || !vinBtn || !vinResult) return;

    // Render sample buttons
    if (vinSamplesContainer && typeof SAMPLE_VINS !== 'undefined') {
      vinSamplesContainer.innerHTML = '';
      SAMPLE_VINS.forEach(sample => {
        const btn = document.createElement('button');
        btn.className = 'sample-vin-btn';
        btn.textContent = currentLang === 'ar' ? sample.label_ar : sample.label_en;
        btn.onclick = () => {
          vinInput.value = sample.vin;
          performVinDecode(sample.vin);
        };
        vinSamplesContainer.appendChild(btn);
      });
    }

    function performVinDecode(vinString) {
      const decoded = decodeVin(vinString);
      if (!decoded) return;

      if (!decoded.validLength) {
        vinResult.innerHTML = `
          <div class="result-box error">
            <span class="icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
            <p>${currentLang === 'ar' ? decoded.message_ar : decoded.message_en}</p>
          </div>
        `;
        vinResult.style.display = 'block';
        return;
      }

      const checksumBadge = decoded.checksumValid
        ? `<span class="badge success"><svg class="svg-icon svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${currentLang === 'ar' ? 'مطابق لمعيار ISO 3779 (رقم تحقق سليم)' : 'ISO 3779 Verified Checksum'}</span>`
        : `<span class="badge warning"><svg class="svg-icon svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${currentLang === 'ar' ? 'رقم تحقق غير قياسي أو تم تعديله' : 'Non-standard checksum'}</span>`;

      const origin = currentLang === 'ar' ? decoded.origin_ar : decoded.origin_en;
      const model = currentLang === 'ar' ? decoded.modelLine_ar : decoded.modelLine_en;

      vinResult.innerHTML = `
        <div class="result-box valid animate-fade-in">
          <div class="result-header">
            <h4>${currentLang === 'ar' ? 'تقرير فحص رقم الهيكل VIN' : 'Chassis VIN Inspection Report'}</h4>
            ${checksumBadge}
          </div>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">${currentLang === 'ar' ? 'رقم الشاصي:' : 'VIN Number:'}</span>
              <span class="val font-mono">${decoded.vin}</span>
            </div>
            <div class="result-item">
              <span class="label">${currentLang === 'ar' ? 'بلد ومصنع الصنع:' : 'Assembly Plant:'}</span>
              <span class="val">${origin}</span>
            </div>
            <div class="result-item">
              <span class="label">${currentLang === 'ar' ? 'فئة الطراز المتوقعة:' : 'Model Family:'}</span>
              <span class="val">${model}</span>
            </div>
            <div class="result-item">
              <span class="label">${currentLang === 'ar' ? 'سنة الموديل:' : 'Model Year:'}</span>
              <span class="val">${decoded.year}</span>
            </div>
            <div class="result-item">
              <span class="label">${currentLang === 'ar' ? 'بادئة الصانع WMI:' : 'Manufacturer WMI:'}</span>
              <span class="val font-mono">${decoded.wmi}</span>
            </div>
            <div class="result-item">
              <span class="label">${currentLang === 'ar' ? 'الرقم التسلسلي للإنتاج:' : 'Serial Sequence:'}</span>
              <span class="val font-mono">${decoded.serialNumber}</span>
            </div>
          </div>
        </div>
      `;
      vinResult.style.display = 'block';
    }

    vinBtn.onclick = () => {
      performVinDecode(vinInput.value);
    };

    vinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performVinDecode(vinInput.value);
      }
    });
  }

  // --- DTC Fault Code Search Setup ---
  function renderDtcCards() {
    const container = document.getElementById('dtc-results');
    const searchInput = document.getElementById('dtc-search');
    if (!container || typeof DTC_DATABASE === 'undefined') return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = DTC_DATABASE.filter(item => {
      const matchCat = activeDtcCategory === 'all' || item.category === activeDtcCategory;
      const matchQuery = !query ||
        item.code.toLowerCase().includes(query) ||
        item.title_ar.toLowerCase().includes(query) ||
        item.title_en.toLowerCase().includes(query) ||
        item.symptoms_ar.some(s => s.toLowerCase().includes(query)) ||
        item.symptoms_en.some(s => s.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="dtc-empty">
          <p>${currentLang === 'ar' ? 'لا توجد أكواد مطابقة لبحثك في هذا القسم.' : 'No fault codes matched your criteria.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => {
      const title = currentLang === 'ar' ? item.title_ar : item.title_en;
      const severity = currentLang === 'ar' ? item.severity_ar : item.severity_en;
      const symptoms = currentLang === 'ar' ? item.symptoms_ar : item.symptoms_en;
      const causes = currentLang === 'ar' ? item.causes_ar : item.causes_en;
      const fixes = currentLang === 'ar' ? item.fixes_ar : item.fixes_en;

      const severityClass = item.severity === 'critical' ? 'danger' : (item.severity === 'high' ? 'warning' : 'info');

      return `
        <div class="dtc-card animate-fade-in">
          <div class="dtc-card-header">
            <div class="dtc-code-wrap">
              <span class="dtc-code">${item.code}</span>
              <span class="dtc-severity ${severityClass}">${severity}</span>
            </div>
            <h4 class="dtc-title">${title}</h4>
          </div>
          <div class="dtc-card-body">
            <div class="dtc-sub-block">
              <h5>
                <svg class="svg-icon svg-icon-sm" style="color: #ef4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ${currentLang === 'ar' ? 'الأعراض المرافقة:' : 'Symptoms:'}
              </h5>
              <ul>${symptoms.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div class="dtc-sub-block">
              <h5>
                <svg class="svg-icon svg-icon-sm" style="color: #d97706;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                ${currentLang === 'ar' ? 'الأسباب المحتملة:' : 'Possible Causes:'}
              </h5>
              <ul>${causes.map(c => `<li>${c}</li>`).join('')}</ul>
            </div>
            <div class="dtc-sub-block fixes">
              <h5>
                <svg class="svg-icon svg-icon-sm" style="color: #16a34a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                ${currentLang === 'ar' ? 'خطوات الإصلاح المعتمدة:' : 'Recommended Technical Fixes:'}
              </h5>
              <ul>${fixes.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function initDtcTool() {
    const searchInput = document.getElementById('dtc-search');
    const categoryBtns = document.querySelectorAll('.dtc-cat-btn');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderDtcCards();
      });
    }

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeDtcCategory = btn.getAttribute('data-cat');
        renderDtcCards();
      });
    });

    renderDtcCards();
  }

  // --- Fluids & Fleet Specs Explorer ---
  function renderFluidsSelector() {
    const select = document.getElementById('vehicle-select');
    const display = document.getElementById('vehicle-specs-display');
    if (!select || !display || typeof VEHICLES_DATABASE === 'undefined') return;

    if (select.children.length === 0) {
      select.innerHTML = VEHICLES_DATABASE.map(v => {
        const name = currentLang === 'ar' ? v.name_ar : v.name_en;
        return `<option value="${v.id}">${name}</option>`;
      }).join('');

      select.onchange = () => {
        renderCurrentVehicleSpecs(select.value);
      };
    }

    renderCurrentVehicleSpecs(select.value || VEHICLES_DATABASE[0].id);
  }

  function renderCurrentVehicleSpecs(id) {
    const display = document.getElementById('vehicle-specs-display');
    if (!display || typeof VEHICLES_DATABASE === 'undefined') return;

    const car = VEHICLES_DATABASE.find(v => v.id === id) || VEHICLES_DATABASE[0];
    const name = currentLang === 'ar' ? car.name_ar : car.name_en;
    const s = car.specs;

    const oilCap = currentLang === 'ar' ? s.oilCapacity : s.oilCapacity_en;
    const transCap = currentLang === 'ar' ? s.transCapacity : s.transCapacity_en;
    const coolantCap = currentLang === 'ar' ? s.coolantCapacity : s.coolantCapacity_en;
    const coolantName = currentLang === 'ar' ? s.coolant : s.coolant_en;
    const sparkName = currentLang === 'ar' ? s.sparkPlugs : s.sparkPlugs_en;
    const sparkGap = currentLang === 'ar' ? s.sparkGap : s.sparkGap_en;
    const diff = currentLang === 'ar' ? s.differential : s.differential_en;
    const battery = currentLang === 'ar' ? s.battery : s.battery_en;
    const fuel = currentLang === 'ar' ? s.fuel : s.fuel_en;

    display.innerHTML = `
      <div class="specs-card animate-fade-in">
        <div class="specs-hero">
          <img src="${car.image}" alt="${name}" class="car-photo" onerror="this.src='web-assets/feature-graphic.jpg'" />
          <div class="specs-title-box">
            <h3>${name}</h3>
            <span class="engine-badge">${car.engine}</span>
            <span class="years-badge">${car.years}</span>
          </div>
        </div>
        <div class="specs-table-grid">
          <div class="spec-cell">
            <span class="spec-icon" style="color: #16a34a;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'لزوجة زيت المحرك' : 'Engine Oil Viscosity'}</strong>
              <p class="highlight">${s.oilGrade}</p>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #0284c7;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><path d="M18 8h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'سعة تعبئة الزيت' : 'Oil Sump Capacity'}</strong>
              <p>${oilCap}</p>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #7c3aed;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'رقم فلتر الزيت OEM' : 'OEM Oil Filter Part'}</strong>
              <p class="font-mono">${s.oilFilter}</p>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #c41230;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'سائل ناقل الحركة (القير)' : 'Transmission Fluid (ATF)'}</strong>
              <p class="highlight">${s.transmission}</p>
              <small>${transCap}</small>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #0284c7;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'سائل تبريد المحرك' : 'Engine Coolant'}</strong>
              <p class="highlight">${coolantName}</p>
              <small>${coolantCap}</small>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #d97706;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'شمعات الإشعال (البواجي)' : 'Spark Plugs & Torque'}</strong>
              <p>${sparkName}</p>
              <small>${sparkGap}</small>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #475569;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14v-5l-2-4H7L5 12v5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'زيوت الدبل والدفرنس (AWD)' : 'Transfer Case & Diff'}</strong>
              <p>${diff}</p>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #16a34a;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'البطارية ونظام i-STOP' : 'Battery & i-STOP System'}</strong>
              <p>${battery}</p>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #dc2626;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'سائل الفرامل وضغط الإطارات' : 'Brake Fluid & Tire PSI'}</strong>
              <p>${s.brakeFluid} | ${s.tirePressure}</p>
            </div>
          </div>
          <div class="spec-cell">
            <span class="spec-icon" style="color: #0284c7;">
              <svg class="svg-icon svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h12V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v18z"/><path d="M15 10h2a2 2 0 0 1 2 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.41L18 4"/><line x1="3" y1="11" x2="15" y2="11"/></svg>
            </span>
            <div>
              <strong>${currentLang === 'ar' ? 'نوع البنزين وسعة التانكي' : 'Fuel Grade & Fuel Tank'}</strong>
              <p>${fuel}</p>
            </div>
          </div>
        </div>
        <div class="specs-actions">
          <button id="copy-specs-btn" class="btn btn-secondary">
            <svg class="svg-icon svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            ${currentLang === 'ar' ? 'نسخ المواصفات' : 'Copy Specs'}
          </button>
          <a id="share-whatsapp-btn" class="btn btn-whatsapp" target="_blank" rel="noopener">
            <svg class="svg-icon svg-icon-sm" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.78 14.33c-.24.68-1.39 1.3-1.92 1.38-.49.08-1.12.11-3.23-.76-2.69-1.12-4.42-3.86-4.55-4.04-.14-.19-1.1-1.46-1.1-2.79 0-1.32.69-1.97.94-2.24.25-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.61.56.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.77 1.27 1.65 2.05 1.13 1 2.08 1.31 2.38 1.46.29.15.47.13.64-.07.18-.2.76-.89.96-1.19.2-.3.4-.25.68-.15.27.1 1.74.82 2.04.97.3.15.5.23.57.36.07.12.07.72-.17 1.4z"/></svg>
            ${currentLang === 'ar' ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
          </a>
        </div>
      </div>
    `;

    // Setup Copy & Share actions
    const copyBtn = document.getElementById('copy-specs-btn');
    const shareBtn = document.getElementById('share-whatsapp-btn');

    const formattedSpecs = `[MazdaCare Pro] ${name} (${car.years})\n- Engine: ${car.engine}\n- Engine Oil: ${s.oilGrade} (${oilCap})\n- Oil Filter: ${s.oilFilter}\n- Transmission: ${s.transmission}\n- Coolant: ${coolantName}\n- Spark Plugs: ${sparkName}\n- Battery: ${battery}\n\nSpecs verified via MazdaCare Pro Companion`;

    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(formattedSpecs).then(() => {
          showToast(currentLang === 'ar' ? 'تم نسخ مواصفات السيارة بنجاح!' : 'Specs copied to clipboard!');
        });
      };
    }

    if (shareBtn) {
      shareBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedSpecs)}`;
    }
  }

  // --- Interactive HUD Simulator ---
  function initHudSimulator() {
    const speedEl = document.getElementById('hud-speed-val');
    const rpmEl = document.getElementById('hud-rpm-val');
    const coolantEl = document.getElementById('hud-coolant-val');
    const hudContainer = document.getElementById('hud-screen');
    const mirrorBtn = document.getElementById('hud-mirror-btn');
    const themeBtns = document.querySelectorAll('.hud-theme-btn');

    if (!speedEl || !hudContainer) return;

    let baseSpeed = 118;
    let baseRpm = 2350;

    if (hudInterval) clearInterval(hudInterval);

    hudInterval = setInterval(() => {
      // Subtle realistic oscillation
      const speedJitter = Math.floor(Math.random() * 5) - 2;
      const rpmJitter = Math.floor(Math.random() * 80) - 40;

      const currentSpeed = Math.max(110, Math.min(130, baseSpeed + speedJitter));
      const currentRpm = Math.max(2200, Math.min(2600, baseRpm + rpmJitter));

      speedEl.textContent = currentSpeed;
      if (rpmEl) rpmEl.textContent = currentRpm;
      if (coolantEl) coolantEl.textContent = '88°C';
    }, 900);

    // Mirror Toggle
    if (mirrorBtn) {
      mirrorBtn.onclick = () => {
        isHudMirrored = !isHudMirrored;
        if (isHudMirrored) {
          hudContainer.classList.add('mirrored');
          mirrorBtn.classList.add('active');
        } else {
          hudContainer.classList.remove('mirrored');
          mirrorBtn.classList.remove('active');
        }
      };
    }

    // Themes
    themeBtns.forEach(btn => {
      btn.onclick = () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.getAttribute('data-theme');
        activeHudTheme = theme;
        hudContainer.setAttribute('data-theme', theme);
      };
    });
  }

  // --- Maintenance Schedule Tab ---
  function renderMaintenanceSchedule() {
    const tabsContainer = document.getElementById('maint-tabs');
    const bodyContainer = document.getElementById('maint-body');
    if (!tabsContainer || !bodyContainer || typeof MAINTENANCE_INTERVALS === 'undefined') return;

    tabsContainer.innerHTML = MAINTENANCE_INTERVALS.map((item, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      const kmTitle = currentLang === 'ar' ? item.km : item.km_en;
      return `<button class="maint-tab-btn ${activeClass}" data-idx="${idx}">${kmTitle}</button>`;
    }).join('');

    function showMaintIdx(idx) {
      const item = MAINTENANCE_INTERVALS[idx];
      const badge = currentLang === 'ar' ? item.badge_ar : item.badge_en;
      const items = currentLang === 'ar' ? item.items_ar : item.items_en;

      bodyContainer.innerHTML = `
        <div class="maint-content animate-fade-in">
          <div class="maint-header">
            <h4>${currentLang === 'ar' ? item.km : item.km_en}</h4>
            <span class="maint-badge ${item.type}">${badge}</span>
          </div>
          <ul class="maint-checklist">
            ${items.map(it => `
              <li>
                <span class="check-icon">
                  <svg class="svg-icon svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>${it}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    showMaintIdx(0);

    const buttons = tabsContainer.querySelectorAll('.maint-tab-btn');
    buttons.forEach(btn => {
      btn.onclick = () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showMaintIdx(parseInt(btn.getAttribute('data-idx'), 10));
      };
    });
  }

  // --- Lightbox / Screenshot Modal ---
  function initScreenshotGallery() {
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-thumb');

    if (!modal || !modalImg) return;

    galleryItems.forEach(item => {
      item.onclick = () => {
        const src = item.getAttribute('data-src') || item.src;
        modalImg.src = src;
        modal.style.display = 'flex';
      };
    });

    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    };
  }

  // --- Contact Form ---
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-msg').value.trim();

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = currentLang === 'ar' ? 'جارٍ الإرسال...' : 'Sending...';

      // Check if running on Node.js host with /api/contact available
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        if (res.ok) {
          showToast(currentLang === 'ar' ? 'شكراً لك! تم استلام رسالتك بنجاح.' : 'Thank you! Message received.');
          form.reset();
        } else {
          throw new Error('Fallback to direct mailto');
        }
      } catch (err) {
        // Fallback for static GitHub Pages: Opens direct WhatsApp or mailto
        window.open(`mailto:weeb.dd@gmail.com?subject=MazdaCare Inquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}`);
        showToast(currentLang === 'ar' ? 'جاري فتح تطبيق البريد لإرسال رسالتك.' : 'Opening mail app...');
        form.reset();
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    };
  }

  // --- Toast Notification ---
  function showToast(msg) {
    let toast = document.getElementById('web-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'web-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'show';
    setTimeout(() => {
      toast.className = '';
    }, 3200);
  }

  // --- Mobile Hamburger Menu ---
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const menu = document.getElementById('nav-links');
    if (!toggle || !menu) return;

    toggle.onclick = () => {
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
    };

    menu.querySelectorAll('a').forEach(a => {
      a.onclick = () => {
        menu.classList.remove('open');
        toggle.classList.remove('open');
      };
    });
  }

  // --- Animations & Pro UX Library Initializer ---
  function initAnimations() {
    // 1. Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
      AOS.init({
        once: true,
        duration: 800,
        offset: 50,
        easing: 'ease-out-cubic'
      });
    }

    // 2. Confetti Particle Trigger Function
    function triggerCelebration() {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.65 },
          colors: ['#00e5ff', '#c41230', '#34c759', '#ffb800', '#ffffff']
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#00e5ff', '#34c759']
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#c41230', '#ffb800']
          });
        }, 250);
      }
    }

    // Attach celebration to all testing/claim buttons
    const celebrationTargets = document.querySelectorAll(
      '#hero-tester-btn, .btn-google-play, #mobile-sticky-btn, .featured-download-card .btn'
    );
    celebrationTargets.forEach(el => {
      el.addEventListener('click', () => {
        triggerCelebration();
      });
    });
  }

  // --- Mobile Sticky Bottom Bar Controller ---
  function initMobileStickyBar() {
    const bar = document.getElementById('mobile-sticky-bar');
    const dismissBtn = document.getElementById('sticky-dismiss-btn');
    if (!bar) return;

    let isDismissed = sessionStorage.getItem('mazdacare_sticky_dismissed') === 'true';
    if (isDismissed) {
      bar.style.display = 'none';
      return;
    }

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300 && !isDismissed) {
        bar.classList.add('visible');
      } else {
        bar.classList.remove('visible');
      }
    }, { passive: true });

    if (dismissBtn) {
      dismissBtn.onclick = (e) => {
        e.stopPropagation();
        bar.classList.remove('visible');
        isDismissed = true;
        sessionStorage.setItem('mazdacare_sticky_dismissed', 'true');
      };
    }
  }

  // --- Initialize Everything On DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);

    const langBtn = document.getElementById('lang-switch-btn');
    if (langBtn) {
      langBtn.onclick = () => {
        const nextLang = currentLang === 'ar' ? 'en' : 'ar';
        applyLanguage(nextLang);
      };
    }

    initVinTool();
    initDtcTool();
    initFluidsSelector();
    initHudSimulator();
    renderMaintenanceSchedule();
    initScreenshotGallery();
    initContactForm();
    initMobileMenu();
    initAnimations();
    initMobileStickyBar();
  });

  function initFluidsSelector() {
    renderFluidsSelector();
  }

})();
