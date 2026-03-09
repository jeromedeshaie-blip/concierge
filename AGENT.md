# 🤖 Instructions Agent — NendazTech Concierge

Ce fichier configure le comportement autonome de Claude Code sur ce projet.
**Lis ce fichier en entier avant de commencer chaque étape.**

---

## 👤 Contexte projet

- **App** : NendazTech Concierge — property management pour chalets à Haute-Nendaz, Valais
- **CEO** : Jérôme (débutant en code — toujours expliquer simplement)
- **Stack** : Next.js 14 App Router + TypeScript strict + Tailwind + Shadcn UI + Supabase + Vercel
- **Repo GitHub** : jeromedeshaie-blip/concierge
- **App live** : https://nendaztech-concierge.vercel.app
- **Supabase** : https://supabase.com/dashboard/project/tlxiuzhnoqnflmsvudya
- **Projet local** : ~/Desktop/nendaztech-concierge

---

## ⚙️ Comportement autonome — TOUJOURS appliquer

### ✅ Faire sans demander confirmation
- Créer, modifier, déplacer des fichiers
- Installer des packages npm
- Créer des branches git et faire des commits
- Pusher sur GitHub
- Générer les fichiers SQL de migration
- Créer les composants, pages, actions, routes API
- Corriger les erreurs TypeScript et ESLint
- Mettre à jour les imports manquants

### ⚠️ Signaler clairement mais continuer
- Si un fichier existant va être remplacé → afficher "⚠️ Je remplace X" et continuer
- Si une dépendance est manquante → l'installer automatiquement
- Si une erreur de build est détectée → la corriger avant de continuer

### 🛑 Les seules choses à demander à Jérôme
1. **Exécuter le SQL dans Supabase** → toujours regrouper TOUT le SQL à la fin en un seul bloc
2. **Ajouter des variables d'environnement sur Vercel** → lister clairement nom + valeur
3. **Décisions métier** → si une fonctionnalité peut être faite de plusieurs façons très différentes

---

## 📋 Conventions de code

### TypeScript
- Strict mode activé — pas de `any`, pas de `// @ts-ignore`
- Toujours typer les props des composants avec une interface
- Utiliser les types Supabase générés quand disponibles

### Next.js
- App Router uniquement (pas de Pages Router)
- Server Components par défaut — `'use client'` seulement si nécessaire
- Server Actions pour toutes les mutations (pas de fetch client vers l'API)
- `revalidatePath()` après chaque mutation

### Supabase / Base de données
- **TOUJOURS** utiliser `SECURITY DEFINER` sur les fonctions SQL pour éviter les récursions RLS
- **TOUJOURS** ajouter `SET search_path = public`
- Utiliser `createClient()` côté serveur, jamais côté client pour les mutations
- Pour les opérations admin (sync iCal, cron) : utiliser `SUPABASE_SERVICE_ROLE_KEY`

### UI / Composants
- Shadcn UI pour tous les composants de base (Button, Card, Input, Badge, etc.)
- Tailwind CSS uniquement — pas de CSS custom sauf si vraiment nécessaire
- Toujours en **français** dans l'UI (labels, messages, placeholders)
- Messages d'erreur clairs et en français

### Git
- Branches : `feature/nom-court` (ex: `feature/ical-sync`)
- Commits : `feat: description courte en anglais`
- Un commit propre par étape

---

## 🗂️ Structure des fichiers

```
app/
├── (dashboard)/          ← Pages protégées (auth requise)
│   ├── dashboard/
│   ├── properties/
│   ├── bookings/
│   ├── tasks/
│   └── team/
├── api/                  ← API Routes (webhooks, cron, sync)
├── actions/              ← Server Actions (mutations)
└── auth/                 ← Pages login/logout

components/
├── ui/                   ← Shadcn UI (ne pas modifier)
├── dashboard/            ← Composants dashboard
├── properties/           ← Composants propriétés
├── bookings/             ← Composants réservations
└── tasks/                ← Composants tâches

lib/
└── supabase/
    ├── client.ts         ← Client côté browser
    └── server.ts         ← Client côté serveur

supabase/
└── migrations/           ← Fichiers SQL (nommés YYYYMMDD_description.sql)
```

---

## 🗄️ Base de données — Tables existantes

```sql
profiles      (id, email, full_name, role, avatar_url, created_at)
properties    (id, name, address, status, owner_id, ical_airbnb_url, ical_booking_url, ical_last_sync)
bookings      (id, property_id, guest_name, check_in, check_out, status, source, external_uid, total_price)
tasks         (id, property_id, assigned_to, title, description, status, due_date, priority)
```

Rôles : `admin` | `manager` | `owner` | `team`

---

## 🚀 Workflow standard pour chaque étape

```
1. git checkout -b feature/[nom-etape]
2. Installer les dépendances npm si nécessaire
3. Créer tous les fichiers (SQL, composants, actions, pages, routes)
4. Vérifier que le build passe : npm run build
5. Corriger toutes les erreurs TypeScript/ESLint
6. git add . && git commit -m "feat: [description]"
7. git push origin feature/[nom-etape]
8. Afficher le lien GitHub pour créer la PR
9. Afficher le récapitulatif final :
   - ✅ Fichiers créés/modifiés
   - 🗄️ SQL à exécuter dans Supabase (bloc unique)
   - 🔐 Variables d'environnement à ajouter sur Vercel (si nouvelles)
```

---

## 📝 Format du récapitulatif final (obligatoire)

À la fin de chaque étape, toujours afficher ce récapitulatif :

```
═══════════════════════════════════════
✅ ÉTAPE [N] TERMINÉE — [Nom de l'étape]
═══════════════════════════════════════

📁 FICHIERS CRÉÉS/MODIFIÉS :
  + app/actions/exemple.ts (nouveau)
  ~ app/(dashboard)/page.tsx (modifié)

🗄️ SQL À EXÉCUTER DANS SUPABASE :
  → https://supabase.com/dashboard/project/tlxiuzhnoqnflmsvudya/sql/new
  [bloc SQL complet ici]

🔐 VARIABLES VERCEL (si nouvelles) :
  NOM_VARIABLE = valeur

🔗 CRÉER LA PR :
  → https://github.com/jeromedeshaie-blip/concierge/pull/new/feature/[branche]

✅ CHECKLIST DE VALIDATION :
  [ ] SQL exécuté dans Supabase
  [ ] PR créée et mergée
  [ ] Variables Vercel ajoutées (si nouvelles)
  [ ] Testé sur https://nendaztech-concierge.vercel.app
═══════════════════════════════════════
```

---

## 🗺️ Roadmap complète

| # | Étape | Statut |
|---|-------|--------|
| 1 | Setup Next.js + Supabase + Vercel | ✅ |
| 2 | Auth (login/logout/session) | ✅ |
| 3 | Base de données + RLS | ✅ |
| 4 | CRUD Propriétés | ✅ |
| 5 | CRUD Réservations | ✅ |
| 6 | CRUD Tâches | ✅ |
| 7 | Gestion Équipe | ✅ |
| 8 | Layout + Navigation | ✅ |
| 9 | Dashboard KPIs (structure UI) | ✅ |
| 10 | Design & UI polish | ✅ |
| 11 | Recherche & filtres | ✅ |
| 12 | Dashboard avec vraies stats | ✅ |
| 13 | Synchronisation iCal Airbnb/Booking | ✅ |
| 14 | Multilingue FR/EN/DE (next-intl) | 🔜 |
| 15 | SaaS multi-tenant + Stripe | ⬜ |
