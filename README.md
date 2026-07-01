# catalog-service (Modules 6, 7, 8: Kitchen, Menu, Meal)

One repo, one Express app, one port (**3001**), one PM2 process. Modules kept
internally separate (own folder, own controller, own routes) but share a
single **repository layer** so kitchen/homemaker-profile merge logic and
meal-fetch logic each live in exactly one place.

## Structure

```
src/
  config/            db.js (kitchen_db), homemakerDb.js (existing homemaker DB, read-only)
  shared/
    models/          Kitchen, HomemakerProfile, Meal, Review, SubscriptionPlan, Offer
    repositories/     kitchenRepository.js  <- ALL kitchen reads go through here
                       mealRepository.js     <- ALL meal reads go through here
    services/        distanceService.js (Google Maps + Haversine fallback), kitchenStatusService.js
    utils/           response.js, validators.js, homemakerMapper.js
    middleware/      errorHandler.js
  modules/
    kitchen/         kitchen.controller.js, kitchen.routes.js   -> Module 6
    menu/            menu.controller.js, menu.routes.js         -> Module 7
    meal/            meal.controller.js, meal.routes.js         -> Module 8
  app.js, server.js
```

**Why a repository layer:** Menu and Meal modules both need to check "does
this kitchen exist / is it visible to customers" - that logic (merging the
new `Kitchen` collection with the existing homemaker profile DB, checking
approval status) lives in `kitchenRepository.js` exactly once. No module
queries `Kitchen` or `HomemakerProfile` models directly.

## Data sources

1. **`kitchen_db` (new, `MONGO_URI`)** - `kitchens` and `meals` collections.
   `kitchens` written by the homemaker website (once they wire up to this
   schema). `meals` written by... TBD, same pattern - not built yet, only
   read here.
2. **Existing homemaker website DB (`HOMEMAKER_MONGO_URI`, read-only)** -
   approval status, cuisine, veg flag, description, FSSAI, onboarding photo.

## API

- `GET /api/v1/homemakers` - Module 6 listing
- `GET /api/v1/homemakers/:id` - Module 6 details (images, rating, reviews,
  schedule, delivery radius, FSSAI, subscription plans, offers, distance, ETA)
- `GET /api/v1/homemakers/:id/menu` - Module 7 (grouped by category, empty
  categories omitted)
- `GET /api/v1/meals/:id` - Module 8 details
- `GET /health`

## Local setup

```bash
npm install
cp .env.example .env
# fill MONGO_URI, HOMEMAKER_MONGO_URI, HOMEMAKER_COLLECTION_NAME, GOOGLE_MAPS_API_KEY
npm run dev
```

Test:
```bash
curl http://localhost:3001/health
curl "http://localhost:3001/api/v1/homemakers?lat=12.97&lng=77.59"
curl "http://localhost:3001/api/v1/homemakers/<id>/menu"
curl "http://localhost:3001/api/v1/meals/<id>"
```

## EC2 Deployment (Ubuntu, no Docker, single instance)

Node/PM2/Nginx assumed already installed (see prior module 6 setup). If not:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo apt install -y nginx
sudo systemctl enable nginx && sudo systemctl start nginx
```

### Deploy
```bash
cd /home/ubuntu
git clone https://github.com/<your-org>/catalog-service.git
cd catalog-service
npm install --production
cp .env.example .env
nano .env   # fill real values, PORT=3001

pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the printed command once
```

### Nginx (single location block covers all 3 modules - they share one port)
```nginx
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    location /catalog/ {
        proxy_pass http://localhost:3001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Redeploy
```bash
cd catalog-service
git pull origin main
npm install --production
pm2 restart catalog-service
```

### Verify end to end
```bash
curl http://<EC2_PUBLIC_IP>/catalog/homemakers?lat=12.97&lng=77.59
pm2 logs catalog-service
```

## Not built yet

- Write side for `kitchens` and `meals` collections - homemaker website's
  responsibility, schema contract is in `kitchen-db-setup/README.md`.
- Reviews (Module 18), Subscriptions (Module 17), Offers/Coupons (Module 12)
  are stub collections here - empty until those modules ship.
