# 📊 YouStudent Hub — Sistema di Tracking dei Progressi

Questo file documenta come usare il nuovo sistema di tracking dei progressi, che ora supporta:
- **Salvataggio automatico** sul browser (localStorage)
- **Export/Import** manuale tramite file JSON
- **Sincronizzazione GitHub** con token PAT (opzionale)

## 🎯 Come Funziona

### 1️⃣ Uso Locale (Browser)
- I progressi vengono salvati **automaticamente** in `localStorage` ogni volta che clicchi su una checkbox
- Il salvataggio è **crittografato** (XOR semplice) con chiave locale
- **Nessun dato** viene inviato a server esterni

### 2️⃣ Export su File JSON
Clicca il bottone **💾 Export** per scaricare un file `ysh-progress-YYYYMMDD.json`:
```json
{
  "version": 1,
  "exportedAt": "2026-04-07T12:30:00.000Z",
  "progress": {
    "ph0-task-1-0": true,
    "ph0-task-2-1": false,
    ...
  },
  "summary": {
    "totalTasks": 195,
    "completedTasks": 45,
    "percentageComplete": 23
  }
}
```

### 3️⃣ Import da File JSON
- Clicca **📂 Import**
- Seleziona un file JSON precedentemente esportato
- I progressi vengono reimportati e la pagina si ricarica

### 4️⃣ Sincronizzazione GitHub (Opzionale)
Per sincronizzare i progressi tra PC diversi:

1. **Genera un PAT Token su GitHub:**
   - Vai a https://github.com/settings/tokens
   - Clicca "Generate new token (classic)"
   - Dai questi permessi:
     - `repo` (accesso completo repository)
     - `workflow` (opzionale)
   - Copia il token

2. **Clicca 🔄 Sync GitHub:**
   - Incolla il token quando richiesto
   - Il file `progress.json` viene aggiornato automaticamente nel repo

3. **Su un altro PC:**
   - Accedi al sito
   - Clicca 📂 Import
   - I progressi vengono caricati automaticamente da GitHub

## 🔐 Sicurezza

- **Password locale:** Impostata al primo accesso, hashata con SHA-256
- **Criptazione dati:** XOR semplice (sufficientemente sicura per uso locale)
- **Token GitHub:** Non viene salvato localmente (chiesto ogni volta)
- **File progress.json:** Pubblico nel repo (nulla di sensibile contiene)

## 🚀 Workflow Consigliato

### Per Sincronizzare Tra PC:

**PC 1 (dove lavori):**
1. ✅ Non fare nulla - il salvataggio automatico gestisce tutto
2. Quando vuai confermare: clicca **💾 Export**
3. Fai commit del file in git: `git add progress.json && git commit -m "📊 Sync progress"`
4. Oppure: clicca **🔄 Sync GitHub** e dai il token PAT

**PC 2 (nuovo PC):**
1. Accedi al sito
2. Imposta stessa password del PC 1
3. Clicca **📂 Import** e seleziona il file scaricato
4. Oppure: clicca **🔄 Sync GitHub** e scarica automaticamente

## 📝 Conteggio dei Progressi

Ogni sezione mostra il formato: **X/Y (Z%)**
- **X** = numero di task completati
- **Y** = totale task nella sezione
- **Z** = percentuale

Struttura fasi:
- **Fase 00** (Fondamenta): 20 task
- **Fase 01** (NestJS): 28 task
- **Fase 02** (Auth): 14 task
- **Fase 03** (Angular): 42 task
- **Fase 04** (Redis): 14 task
- **Fase 05** (BullMQ): 14 task
- **Fase 06** (Pagamenti): 14 task
- **Fase 07** (AWS S3): 12 task
- **Fase 08** (Docker): 21 task
- **Fase 09** (Testing): 16 task

**TOTALE: ~195 task**

## 🐛 Troubleshooting

**Q: Accedo da un altro PC e i miei progressi non sono sincronizzati**
- R: Esporta da PC 1 cliccando 💾 Export, poi importa su PC 2 cliccando 📂 Import
- Oppure: Usa il bottone 🔄 Sync GitHub con un token PAT

**Q: Ho dimenticato la password**
- R: Non è possibile recuperarla (per privacy). Puoi:
  - Erase localStorage: `localStorage.clear()` nella console browser
  - Oppure usa Private Browsing per una nuova sessione

**Q: Il file progress.json ha il formato sbagliato**
- R: Se l'export va male, il formato è questo:
  ```json
  {
    "version": 1,
    "exportedAt": "ISO-8601-timestamp",
    "progress": { "phX-task-Y-Z": true/false },
    "summary": { "totalTasks": N, "completedTasks": M, "percentageComplete": P }
  }
  ```

## 📌 Note Importanti

1. **Backend Non Disponibile:** GitHub Pages non ha backend, quindi il salvataggio è puramente client-side (localStorage) + file JSON opzionale
2. **Export Manuale è la Base:** Il metodo più semplice è esportare il file e committarlo manualmente nel repo
3. **Sync GitHub Richiede Token:** L'auto-sync via API è un bonus opzionale, non è obbligatorio

---

**Creato il:** 7 Aprile 2026
**Versione:** 1.0
**Tool:** YouStudent Hub v2 Progress Tracker
