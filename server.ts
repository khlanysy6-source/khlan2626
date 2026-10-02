import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// In-memory rate limiting map for API abuse prevention
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 45;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count++;
  return true;
}

// Clean up stale rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Lazy initialization of GoogleGenAI to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Server-side Expert Fallback Engine for rule-based responses when API limit or offline occurs
function generateFallbackAdvisorResponse(text: string, stats?: { budget: number; time: number; quality: number }) {
  const query = (text || "").toLowerCase();

  if (query.includes("مواصفات") || query.includes("رصف") || query.includes("هندسية") || query.includes("سمك") || query.includes("صب") || query.includes("خرسانة")) {
    return `### 🚧 الدليل المعتمد للمواصفات الهندسية لصب الطرق في المرتفعات الجبلية

رصف الطرق الخرسانية في جبال اليمن الشامخة (خصوصاً محافظة إب ذات الطبيعة المطيرة) يتطلب هندسة حاسمة لضمان المتانة:

## 1. التأسيس والفرز السفلي (Subgrade & Base Course):
- **الدمك والحدل الصارم:** يجب دك التربة الطبيعية وإزالة الأتربة الناعمة، وإدخال طبقة من 'البيسكورس' (الحصى المتدرج) بسمك لا يقل عن 15 سم لضمان قاعدة متماسكة تمنع هبوط الطريق المستقبلي.
- **التصريف المائي السفلي:** بناء قنوات فرعية حجرية لتسريب المياه الجوفية من تحت الصبة لمنع ظاهرة 'الانجراف التحتي'.

## 2. مواصفات الصبة الخرسانية الإنشائية:
- **سماكة الصبة المعتمدة:** يجب ألا تقل سماكة الصبة الخرسانية في المنعطفات الشديدة والمنحدرات عن **20 سم**، وفي الطرق المستوية عن **15 سم** لضمان تحمل شاحنات النقل الثقيلة.
- **إجهاد ودرجة المقاومة:** استخدام خرسانة ذات محتوى إسمنت مرتفع (ما لا يقل عن 7 أكياس إسمنت مقاوم للأملاح لكل متر مكعب) لتحقيق مقاومة انضغاطية **C30** (أي 30 ميغاباسكال).
- **مقاومة البري والانزلاق:** تخشين السطح الخارجي للخرسانة يدوياً بواسطة 'المكنسة السلكية' قبل جفافها تماماً، لزيادة تماسك إطارات السيارات ومنع انزلاقها في العقبات الوعرة.

## 3. معالجة وحماية الخرسانة (Concrete Curing):
- **رش الخرسانة بالماء:** يجب الحفاظ على رطوبة الصبة عبر تغطيتها بخيش مبلل ورشها بالماء النقي بانتظام مرتين يومياً (صباحاً ومساءً) لمدة **7 أيام كاملة**. التسرع في فتح الطريق للسيارات قبل اكتمال الـ 7 أيام يتسبب في تكسر فوري للطريق.
- **فواصل التمدد (Expansion Joints):** زرع فواصل تمدد بعرض 2 سم وسمك كامل الصبة كل **4 إلى 5 أمتار طولية** تملأ بمادة مرنة لمنع حدوث تفتت وانفجار في كتل الخرسانة نتيجة التمدد الحراري صيفاً.`;
  }

  if (query.includes("نزاع") || query.includes("تنازل") || query.includes("أرض") || query.includes("مشاكل") || query.includes("قانون")) {
    return `### ⚖️ الدليل التنظيمي لحل النزاعات الأهلية وتوثيق التنازلات القانونية

أكبر تحدٍ يهدد بإيقاف وإفشال المبادرات المجتمعية هو النزاع حول 'حرم الطريق' وتوسيع المسارات الجبلية الضيقة. لتلافي تلف المواد وحماية جهود الأهالي، اتبع هذه الممارسات الصارمة:

## 1. قاعدة التوثيق القانوني المسبق (No Deeds, No Materials):
- **التوقيع قبل التوريد:** يُمنع منعاً باتاً توريد كيس إسمنت واحد أو حديد رصف إلى الموقع قبل استكمال توقيع 'وثائق التنازل القانونية' المعتمدة من المحكمة الابتدائية أو الجهات القضائية المحلية في المحافظة.
- **مضمون وثيقة التنازل:** يجب أن تنص بوضوح لا لبس فيه على تنازل مالك الأرض (أو الورثة شرعاً) عن مساحة التوسعة المطلوبة للطريق العام طوعاً، واعتبارها ملكية عامة للمنفعة المشتركة دون مقابل مادي أو شروط مستقبلية.

## 2. إدارة النزاعات في المجتمع المحلي:
- **المكاشفة والحوار المفتوح:** عقد اجتماع موسع في ساحة القرية يحضره الوجهاء، وأعضاء المجلس التنموي، ولجنة المبادرة. يتم عرض المخطط الهندسي بشفافية وإيضاح المنافع الاقتصادية (مثل وصول الإسعاف وتخفيض تكلفة السلع).
- **اللجوء للتحكيم التوافقي:** تشكيل لجنة تحكيم مستقلة من 3 من كبار عقلاء المنطقة لحل الإشكالات الفردية بسرعة.

## 3. حماية المواد من التلف أثناء النزاعات:
- إذا طرأ نزاع مفاجئ أثناء العمل، قم فوراً بنقل المواد المخزنة ميدانياً إلى مستودع مغلق آمن. الإبقاء على الأسمنت والحديد في الهواء الطلق يعرضهما للتلف التام بفعل الرطوبة والأمطار.`;
  }

  if (stats || query.includes("محاكاة") || query.includes("تقييم") || query.includes("تقرير") || query.includes("أداء")) {
    const s = stats || { budget: 100, time: 100, quality: 100 };
    return `### 📊 التقرير الاستشاري التنفيذي لتقييم أداء المحاكاة

أهلاً بك يا قائد التنمية. قمنا بتحليل أداء قراراتك الميدانية في الورشة التدريبية بناءً على معايير إدارة المشاريع الاحترافية (PMI/PMP):

## 1. تحليل قيود المثلث الذهبي (Project constraints):
- **🪙 القيد المالي (الميزانية - ${s.budget}%):** ${s.budget < 70 ? 'تجاوز مقلق في النفقات الميدانية. نوصي بضبط المصاريف وتكثيف التبرعات.' : 'الميزانية متوازنة وضمن الحدود التنموية المخطط لها.'}
- **⏱️ القيد الزمني (الوقت - ${s.time}%):** ${s.time < 70 ? 'تأخر في جدول التنفيذ يهدد بركود المبادرة وتلف المواد.' : 'كفاءة زمنية متناسبة مع الجدول الميداني.'}
- **💎 قيد الجودة (المواصفات - ${s.quality}%):** ${s.quality < 70 ? 'انخفاض الجودة ينذر بتشقق الخرسانة مع أول موسم أمطار. يجب الالتزام بسماكة 20سم ورش الماء 7 أيام.' : 'جودة مواصفات ممتازة ومطابقة للمعايير الإنشائية.'}

## 2. التوصيات التصحيحية الحسمية:
1. الالتزام الصارم بفواصل التمدد الحراري كل 4-5 أمتار.
2. بناء مستودعات مغلفة ومرفوعة بعوارض خشبية لمنع رطوبة الإسمنت.
3. التوثيق القانوني المسبق للتنازلات قبل البدء بالافتتاح والصب الميداني.`;
  }

  return `### 💡 إرشادات المستشار التنموي والهندسي العام

أهلاً بك يا قائد المبادرة التنموية. لتحقيق أقصى درجات النجاح، يرجى دائماً الالتزام بالمعايير الذهبية الأربعة:
1. **الجودة الهندسية الصارمة:** لا تقبل بصبة خرسانية يقل سمكها عن **20 سم** في المنحدرات الجبلية، واحرص على معالجتها بالماء النقي لمدة **7 أيام متتالية**.
2. **فواصل التمدد:** ضع فاصل تمدد حراري بعرض 2 سم كل **4 إلى 5 أمتار**، واملأ الفراغات بالفلين المضغوط لمنع تفتت الطريق صيفاً.
3. **تصريف السيول:** لا تصب طريقاً دون التأكد من حفر قنوات تصريف حجرية جانبية (جوالف) لمنع تدفق السيول فوق الرصف.
4. **التنازلات القانونية أولاً:** لا تقم بشراء أو توريد كيس إسمنت واحد حتى يستكمل الأهالي توقيع عقود التنازلات المكتوبة والمصدقة شرعاً لحق المرور والمنفعة العامة.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing with strict 1MB limit to protect memory
  app.use(express.json({ limit: "1mb" }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route: exact Excel-master form export (XLSX/PDF)
  app.post("/api/forms/render", async (req, res) => {
    try {
      const { formId, data, sourceSerial, format = "xlsx" } = req.body || {};
      if (!formId || !data || typeof data !== "object") return res.status(400).json({ error: "formId and data are required" });
      if (!['xlsx','pdf'].includes(format)) return res.status(400).json({ error: "format must be xlsx or pdf" });
      const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ibb-form-"));
      const outXlsx = path.join(tmp, "form.xlsx");
      const py = spawn("python3", [path.join(process.cwd(), "scripts", "render_form.py"), outXlsx], { stdio: ["pipe", "pipe", "pipe"] });
      let stderr = ""; py.stderr.on("data", b => stderr += b.toString());
      py.stdin.end(JSON.stringify({ formId, data, sourceSerial, today: new Date().toLocaleDateString('ar-EG') }));
      const code = await new Promise<number>((resolve) => py.on("close", c => resolve(c ?? 1)));
      if (code !== 0) throw new Error(stderr || "تعذر إنشاء نسخة القالب");
      const printXlsx = path.join(tmp, "print.xlsx");
      const single = spawn("python3", [path.join(process.cwd(), "scripts", "single_sheet_workbook.py"), outXlsx, printXlsx, String(({ diagnosis:"استمارة التشخيص", readiness:"استمارة فحص الجاهزية", completion:"استمارة تقرير الانجاز النهائي", transfer:"محضر مناقلة واستلام", notice:"إخطار وإشعار اللجنة المجتمعية ", daily:"التقرير اليومي للممثل والشركاء", weekly:"التقرير التجميعي الاسبوعي للمنس", evaluation:"مصفوفة مستوى الانجاز والتقييم", archive:"مصفوفة الارشيف والوثائق", cement_ledger:"مصفوفة سجل الشطب(اسمنت)", diesel_ledger:"مصفوفة سجل الشطب(ديزل)", decision:"استمارة التشخيص" } as any)[formId] || "استمارة التشخيص")], { stdio: ["ignore", "pipe", "pipe"] });
      let singleErr = ""; single.stderr.on("data", b => singleErr += b.toString());
      const singleCode = await new Promise<number>((resolve) => single.on("close", c => resolve(c ?? 1)));
      if (singleCode !== 0 || !fs.existsSync(printXlsx)) throw new Error(singleErr || "تعذر تجهيز صفحة الطباعة");
      if (format === "xlsx") {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="ibb-form-${String(formId).replace(/[^a-z0-9_-]/gi,'_')}.xlsx"`);
        return res.sendFile(printXlsx, () => fs.promises.rm(tmp, { recursive: true, force: true }).catch(()=>{}));
      }
      const pdfDir = path.join(tmp, "pdf"); await fs.promises.mkdir(pdfDir, { recursive: true });
      const soffice = spawn("libreoffice", ["--headless", "--convert-to", "pdf", "--outdir", pdfDir, printXlsx], { stdio: ["ignore", "pipe", "pipe"] });
      let se = ""; soffice.stderr.on("data", b => se += b.toString());
      const sc = await new Promise<number>((resolve) => soffice.on("close", c => resolve(c ?? 1)));
      const pdf = path.join(pdfDir, "form.pdf");
      if (sc !== 0 || !fs.existsSync(pdf)) throw new Error(se || "تحويل القالب إلى PDF غير متاح في هذه البيئة");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="ibb-form-${String(formId).replace(/[^a-z0-9_-]/gi,'_')}.pdf"`);
      return res.sendFile(pdf, () => fs.promises.rm(tmp, { recursive: true, force: true }).catch(()=>{}));
    } catch (error:any) {
      res.status(501).json({ error: error?.message || "تعذر تجهيز النموذج" });
    }
  });

  // API Route: Advisor Consultant Chat
  app.post("/api/advisor/chat", async (req, res) => {
    // 1. Rate Limiting Check
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: "تجاوزت الحد المسموح من الطلبات. يرجى الانتظار قليلاً.",
        content: "يرجى الانتظار دقيقة قبل إرسال استشارة جديدة.",
        sources: [],
        isFallback: true
      });
    }

    try {
      const { messages, stats } = req.body || {};

      // 2. Strict Input Validation
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages format. Array of messages is required." });
      }

      if (messages.length > 30) {
        return res.status(400).json({ error: "Messages payload exceeds maximum permitted length (30)." });
      }

      for (const m of messages) {
        if (!m || typeof m.content !== "string") {
          return res.status(400).json({ error: "Each message must contain a valid string content." });
        }
        if (m.content.length > 4000) {
          return res.status(400).json({ error: "Single message length exceeds 4000 characters limit." });
        }
      }

      const client = getAiClient();

      // System instruction containing the strict Persona guidelines from AGENTS.md
      let systemInstruction = `أنت تعمل بصفتك مستشار أول في إدارة المشاريع التنموية والمواصفات الهندسية بمحافظة إب.
مهمتك الأساسية هي تقديم المشورة التنموية والهندسية والتحليل الاحترافي بناءً على أفضل الممارسات الدولية والمحلية لإدارة المشاريع (مثل معايير PMI / PMP واللوائح التنموية لتعزيز المشاركة المجتمعية الحرة والمسؤولة).

يجب عليك الالتزام بالقواعد التالية في ردودك:
1. التركيز المستمر على توازن "المثلث الذهبي" لإدارة قيود المشاريع (الميزانية، الوقت، والجودة).
2. شرح الأثر التراكمي وتداعيات اتخاذ خيارات متسرعة أو غير موثقة (مثل تلف المواد بسبب تخزين خاطئ، غياب عقود التنازلات للأراضي، أو حدوث نزاعات أهليّة).
3. تقديم التغذية الراجعة بلغة عربية سليمة، واضحة، مشجعة وواقعية تهدف لنقل المتلقي من مجرد التنفيذ العشوائي إلى التخطيط الممنهج والمواصفات الهندسية الدقيقة (سماكة الصبة، فواصل التمدد الحراري، رش الخرسانة بالماء).
4. لا تكتفِ أبداً بالقول "صحيح" أو "خطأ"؛ بل اشرح "لماذا" بطريقة تعليمية عميقة وحكيمة.
`;

      if (stats && typeof stats === "object") {
        const b = typeof stats.budget === "number" ? Math.min(200, Math.max(0, stats.budget)) : 100;
        const t = typeof stats.time === "number" ? Math.min(200, Math.max(0, stats.time)) : 100;
        const q = typeof stats.quality === "number" ? Math.min(200, Math.max(0, stats.quality)) : 100;

        systemInstruction += `\nلقد قام المستخدم للتو بإنهاء جلسة محاكاة تفاعلية بالقيم التالية:
- الميزانية الحالية: ${b}%
- كفاءة الوقت: ${t}%
- جودة المواصفات: ${q}%

قم بتحليل قراءات العدادات الثلاثة السابقة ببراعة وصياغة ملخص تنفيذي (Executive Report) يبرز:
1. نقاط القوة في إدارة قيود المشروع.
2. مواطن القلق ومصادر المخاطر التراكمية.
3. المقترحات التصحيحية المناسبة لضمان الاستدامة وتجنب تلف المواد أو تكسر الرصف.`;
      }

      // Standardize messages format for Gemini model
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      // Extract text response and search grounding details
      const responseText = response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || "مصدر خارجي",
        uri: chunk.web?.uri || "#"
      }));

      res.json({
        content: responseText,
        sources
      });
    } catch (error: any) {
      console.warn("Gemini Advisor API notice:", error?.message || error);
      
      // Extract last user message to formulate expert rule-based advisor response
      const { messages, stats } = req.body || {};
      const lastMsg = Array.isArray(messages) && messages.length > 0 
        ? messages[messages.length - 1]?.content || "" 
        : "";

      const fallbackContent = generateFallbackAdvisorResponse(lastMsg, stats);

      res.json({
        content: fallbackContent,
        sources: [
          { title: "دليل المبادرات المجتمعية لشق الطرق - وزارة الإدارة المحلية 🇾🇪 (المستشار الآلي الخبير)", uri: "#" },
          { title: "مواصفات الخرسانة للطرق الجبلية - معهد إدارة المشاريع العالمي (PMI)", uri: "#" }
        ],
        isFallback: true
      });
    }
  });

  // Vite integration for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running in full-stack mode on port ${PORT}`);
  });
}

startServer();
