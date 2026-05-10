# Essence. | Premium E-Commerce Platform

A production-ready, minimalist, and ultra-fast e-commerce platform built with Flask, Vanilla JavaScript, Tailwind CSS, and Supabase. Designed with a focus on modern premium aesthetics, inspired by industry leaders like Apple and linear.

![Essence Preview](https://via.placeholder.com/1200x600/000000/FFFFFF?text=Essence+E-Commerce+Platform)

## ✨ Features

- **Premium UI/UX:** Clean, elegant, minimalist design with dynamic micro-interactions.
- **Dark Mode:** Seamless theme switching with persistent local storage.
- **Product Management:** Dynamic filtering, live search, and multiple sorting options (Price, Popularity, Newest).
- **Cart & Wishlist:** Fully functional interactive cart sidebar and wishlist system, securely saved locally.
- **Quick-View Modal:** Smooth, animated modal for fast product inspection.
- **Responsive Architecture:** Flawless experience across mobile, tablet, and ultra-wide desktops.
- **Skeleton Loaders:** Professional loading states for optimal perceived performance.

## 🛠 Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3, TailwindCSS (CDN)
- **Backend:** Python Flask
- **Database:** Supabase (PostgreSQL)
- **Storage:** localStorage (State Management)
- **Icons:** Lucide Icons

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.9+
- Supabase Account

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/yourusername/essence.git
cd essence/Backend
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Setup
Rename `.env.example` to `.env` in the `Backend/` directory and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

### 4. Database Seeding (Optional)
If starting fresh, run the seed script to populate the Supabase database with dummy products:
```bash
python seed.py
```

### 5. Running the Platform

**Start the Flask Backend:**
```bash
python app.py
```
*The API will run on http://localhost:8080*

**Start the Frontend:**
Open `Frontend/index.html` in your browser, or serve it using Live Server:
```bash
cd ../Frontend
npx serve
```

## 📂 Project Architecture

```
Essence/
├── Backend/
│   ├── app.py           # Core Flask REST API
│   ├── database.py      # Supabase connection & config
│   ├── seed.py          # Database seeder script
│   ├── requirements.txt # Python dependencies
│   └── .env             # Environment variables
├── Frontend/
│   ├── index.html       # Main SPA entry point
│   ├── index.css        # Premium styles & Tailwind overrides
│   └── index.js         # Core application logic & state management
└── README.md
```

## 📦 Deployment

### Backend (Render / Railway)
1. Push your repository to GitHub.
2. Create a new Web Service on Render/Railway.
3. Set Build Command: `pip install -r requirements.txt`
4. Set Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Add `SUPABASE_URL` and `SUPABASE_KEY` to your environment variables.

### Frontend (Vercel / Netlify)
1. Create a new project in Vercel/Netlify.
2. Point the root directory to `/Frontend`.
3. Update the `fetch()` URLs in `index.js` to point to your deployed backend URL.
4. Deploy!

## 📄 License
This project is licensed under the MIT License.
