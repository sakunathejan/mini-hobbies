# Mini Hobbies

A modern beginner-friendly full stack eCommerce catalog for Mini Hobbies, a collectible hobby store selling die cast cars, Hot Wheels Sri Lanka finds, scale models, anime figures, RC toys, collectibles, figures, and toys.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Context API, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT admin login with bcrypt password hashing
- Image storage: Supabase Storage for product images
- SEO: dynamic titles, meta descriptions, semantic pages, `robots.txt`, `sitemap.xml`, clean product URLs

## Folder Structure

```txt
mini-hobbies/
  frontend/
    src/
      assets/
      components/
      context/
      hooks/
      layouts/
      pages/
      routes/
      services/
      utils/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    uploads/
    utils/
    server.js
  README.md
```

## Features Included

- Homepage with hero, featured products, categories, new arrivals, and CTA banner
- Product listing with search, category filters, price filters, pagination, stock labels, and loading skeletons
- Product details page with gallery, tags, stock, material, scale, and wishlist/cart actions
- Cart checkout with order saving, WhatsApp order message, and customer order tracking
- Admin orders panel with status updates (Pending → Confirmed → Packed → Completed)
- Wishlist using local storage
- Admin login with protected routes
- Admin dashboard stats
- Admin product table and starter product create form
- Admin category manager
- Supabase multi-image upload endpoint
- MongoDB models for Users, Products, Categories, Orders, Wishlist, and Cart
- REST APIs for auth, products, categories, orders, cart, wishlist, and uploads
- Rate limiting, Helmet security headers, validation, centralized error handling
- Seed data for quick local testing

## Backend Setup

```bash
cd mini-hobbies/backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Update `.env` before running:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/mini_hobbies
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@minihobbies.lk
ADMIN_PASSWORD=ChangeMe123!
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=product-images
WHATSAPP_STORE_PHONE=94771234567
CALLMEBOT_API_KEY=
```

`WHATSAPP_STORE_PHONE` is your Sri Lanka WhatsApp number without `+` (example: `94771234567`). On checkout, customers can open a pre-filled WhatsApp message to this number with full order details.

Optional: set `CALLMEBOT_API_KEY` from [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) to automatically push new orders to your WhatsApp when a customer checks out.

Create a public Supabase Storage bucket named `product-images` or change `SUPABASE_BUCKET` to your bucket name. The backend stores only the image URLs and paths in MongoDB.

## Frontend Setup

```bash
cd mini-hobbies/frontend
npm install
cp .env.example .env
npm run dev
```

Frontend environment:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STORE_URL=http://localhost:5173
VITE_WHATSAPP_STORE_PHONE=94771234567
```

Open `http://localhost:5173`.

## Admin Login

After running the seed script:

- Email: `admin@minihobbies.lk`
- Password: `ChangeMe123!`

Change these values in `.env` before production.

## API Examples

The backend includes request examples in:

```txt
backend/utils/apiExamples.http
```

Common endpoints:

- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/featured`
- `GET /api/products/:slug`
- `POST /api/products`
- `GET /api/categories`
- `POST /api/orders`
- `GET /api/cart`
- `GET /api/wishlist`
- `POST /api/uploads/products`

## Deployment Notes

### Frontend on Vercel

1. Set root directory to `mini-hobbies/frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add `VITE_API_URL` pointing to the Render backend URL.
5. Add `VITE_STORE_URL` pointing to the final Vercel domain.

### Backend on Render

1. Set root directory to `mini-hobbies/backend`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add MongoDB Atlas connection string as `MONGO_URI`.
5. Add Supabase credentials and `JWT_SECRET`.
6. Set `CLIENT_URL` to the Vercel frontend URL.

## Next Good Improvements

- Connect the cart checkout form directly to `POST /api/orders`.
- Add edit-product loading and update behavior to the admin form.
- Add product reviews and recently viewed products.
- Generate a dynamic sitemap from live product slugs during deployment.
- Add image compression before Supabase upload for production.
