# Family Events

A private family event sharing platform built with React, Vite, Firebase, and TailwindCSS. Fully installable as a PWA.

## Features
- Email/password authentication (Firebase)
- Persistent login
- Create/view events with title, description, date
- Upload multiple photos/videos per event
- Media gallery grid
- Role-based admin (delete events)
- Responsive, mobile-first UI
- Toast notifications
- PWA installability

## Folder Structure
```
src/
  components/
  pages/
  context/
  services/
  hooks/
  utils/
```

## Setup Instructions
1. **Clone or download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Firebase:**
   - Create a Firebase project (Spark/free plan)
   - Enable Authentication (Email/Password)
   - Enable Firestore and Storage
   - Copy your config to `.env`:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key_here
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
     VITE_FIREBASE_PROJECT_ID=your_project_id_here
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
     VITE_FIREBASE_APP_ID=your_app_id_here
     ```
4. **Set Firestore and Storage rules:**
   - See `firebase.rules.firestore.txt` and `firebase.rules.storage.txt`
5. **Run the app:**
   ```bash
   npm run dev
   ```
6. **Install as PWA:**
   - Open in browser, click "Install" or "Add to Home Screen"

## Notes
- All code is functional, modern, and commented.
- Replace icon files in `public/` with your own for production.
- Admin role is managed via Firestore user document (`role: 'admin'`).
- Compatible with Firebase free Spark plan.
