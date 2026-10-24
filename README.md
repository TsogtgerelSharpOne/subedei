# erxes-smart-quiz
halo I'm Tsogto.

**Автомат шалгалт үүсгэгч ба Сурагчийн үнэлгээний Plugin (Gemma 4 + erxes EdTech)**

Багш нар хичээл бүрийн дараа сурагчдын ойлголтыг шалгах тест зохиох, засах, дүнг нь эцэг эхэд мэдэгдэхэд маш их цаг зарцуулдаг. Бид **Gemma 4**-т суурилсан Автомат Quiz үүсгэгч erxes plugin-ийг бүтээснээр багш лекцийн материалаа (текст, тэмдэглэл, PDF) оруулаад л 1 минутын дотор тест үүсгэж, шалгалт авч, үр дүнг нь сурагчийн erxes профайл дээр автоматаар бүртгэдэг болно.

---

## 🏆 Гол онцлогууд ба Шагналын чиглэлүүд

### 1. 🎓 Best EdTech (erxes Integration)
- **Customer (Contact) Profile холболт**: Сурагч бүр erxes дээр `Customer (Contact)` хэлбэрээр бүртгэлтэй байх ба шалгалт бөглөмөгц авсан оноо, шалгалтын дэлгэрэнгүй үр дүн erxes CRM-ийн `Customer Profile -> Activity Log` руу шууд бичигдэнэ.
- **Эцэг эхэд мэдэгдэх автоматжуулалт**: Сурагч хангалтгүй дүн (passing score-оос доош) авбал erxes Automations ажиллаж, эцэг эх рүү нь мессеж (SMS), имэйл автоматаар илгээх trigger цацна.

### 2. 🧠 Best Use of Gemma 4
- **Structured Quiz Generation**: Багшийн оруулсан агуулгаас 4 сонголттой (Multiple Choice Questions), зөв хариултын заалттай, концепцын тайлбартай (explanation) шалгалтыг JSON бүтцээр Gemma 4 үүсгэнэ.
- **Хувийн зөвлөгөө (Personalized Pedagogical Feedback)**: Сурагч буруу хариулбал Gemma 4 сурагчийн хариултад дүн шинжилгээ хийж, "Яагаад буруу вэ, зөв ойлголт нь юу вэ, лекцийн ямар хэсгийг давтах шаардлагатай вэ?" гэсэн урмын үгтэй сурган хүмүүжүүлэх зөвлөгөөг шууд гаргаж өгнө.

### 3. 🌊 Best Open-Source AI (DigitalOcean)
- **Бүрэн Dockerized & Cloud Ready**: DigitalOcean-ий GPU Droplet эсвэл App Platform дээр 1 командаар асаахад бэлэн `Dockerfile` болон `docker-compose.yml`.
- **REST & GraphQL Dual API**: erxes микросервисийн GraphQL-ээс гадна `/health`, `/api/generate`, `/api/submit` бүхий REST endpoint-уудыг агуулсан.

---

## 📁 Бүтэц (Architecture)

| Хэсэг | Зам | Үүрэг | Порт |
| --- | --- | --- | --- |
| **API** | `api/` | Node.js 22, erxes-api-shared, Mongoose, GraphQL + REST, Gemma 4 Client | 3399 |
| **UI** | `ui/` | React 18 Module Federation remote (Rspack), Tailwind CSS, erxes-ui | 3099 |
| **Config** | `erxes.json` | Plugin-ийн нэр, хувилбар, портын тохиргоо | - |

---

## 🚀 Хөгжүүлэлтийн орчин ажиллуулах (Development)

```bash
# 1. Хамаарлуудыг суулгах
pnpm install

# 2. Орчны хувьсагч бэлдэх
cp .env.example .env

# 3. API асаах (Background/Dev)
pnpm run dev:api

# 4. UI remote асаах
pnpm run dev:ui
```

### Код шалгах ба build хийх:

```bash
pnpm run codegen   # GraphQL schema & client types generate хийх
pnpm run build     # API болон UI-г бүрэн build хийх
pnpm run check     # TypeScript typecheck
pnpm run lint      # oxlint шалгалт
```

---

## 🐳 DigitalOcean Deployment

DigitalOcean GPU Droplet дээр ажиллуулах:

```bash
cd api
docker compose up -d
docker exec -it erxes-gemma4-ollama ollama pull gemma4
curl http://localhost:3399/health
```

---

## 👥 Багийн гишүүдэд

1. Репог clone хийх:
   ```bash
   git clone https://github.com/ariunbold-bo/subedei.git
   cd subedei
   pnpm install
   pnpm build
   ```
2. erxes monorepo-ийн `.env` файлын `ENABLED_PLUGINS`-д `quiz` нэмснээр үндсэн erxes системтэй шууд холбогдоно.
