# MediStock
## إعداد Supabase (مرة واحدة)
1. Authentication > Providers > Email: فعّل Email، **أوقف Confirm email**، **وأوقف Secure email change**.
2. SQL Editor: الصق محتوى `supabase.sql` وشغّله (ينشئ الجداول + صلاحيات الأدوار على السيرفر + التحديث اللحظي).
3. ارفع المجلد كما هو وافتح index.html. أول مرة تظهر شاشة إنشاء حساب المالك (لا توجد كلمة مرور افتراضية).
## الأدوار (تُفرض من قاعدة البيانات)
- admin: كل شيء + حذف الأرشيف نهائياً + إدارة الأدوار والمستخدمين.
- keeper: إضافة/تعديل/حذف في المخازن والصيانة والنواقص والإذونات (الأرشفة فقط، لا حذف نهائي للإذونات) + إضافة مستخدمين (keeper/viewer).
- viewer: عرض اللوحة والمستخدم والمنتهي والصيانة والنواقص فقط.
## الملفات
js/data.js (محلي + Supabase + Auth) · js/core.js · js/export.js · js/pages.js · js/main.js · supabase.sql
