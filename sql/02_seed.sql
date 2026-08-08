-- ============================================================
-- BURGER HOUSE — Seed real content
-- Run AFTER 01_schema.sql, once.
-- ============================================================

update settings set
  hero_title = 'BURGER HOUSE',
  hero_tagline = 'Stacked. Grilled. Devoured.',
  about_heading = 'Our Story',
  about_body = 'Burger House started on the streets of Moratuwa with one grill, one flame, and a stubborn refusal to serve anything average. Today we still cook every Kottu, every Dolphin, and every Submarine to order — loud flavours, honest prices, zero shortcuts.',
  phone = '+94772299827',
  whatsapp_shop = '+94772299827',
  address_line = 'S. Thomas'' College, Moratuwa, Sri Lanka',
  maps_link = 'https://maps.app.goo.gl/9Tcuv3pcDEZcJBXq6',
  maps_lat = 6.8374503,
  maps_lng = 79.8660067,
  instagram_link = 'https://www.instagram.com/popular/burger-house-moratuwa/?hl=en',
  tiktok_link = 'https://www.tiktok.com/@burgerhouse.official?is_from_webapp=1&sender_device=pc',
  ubereats_store_link = 'https://www.ubereats.com/lk/store/burger-house-moratuwa/HcEXXYHXUrWlLFVVtBAYCA?diningMode=DELIVERY',
  hours = '{"Monday":"8AM–1AM","Tuesday":"8AM–1AM","Wednesday":"8AM–1AM","Thursday":"8AM–1AM","Friday":"8AM–1AM","Saturday":"8AM–1AM","Sunday":"8AM–1AM"}'
where id = 1;

-- BRANCHES
insert into branches (name, address, maps_link, lat, lng, sort_order) values
  ('Moratuwa', 'S. Thomas'' College, Moratuwa, Sri Lanka', 'https://maps.app.goo.gl/9Tcuv3pcDEZcJBXq6', 6.8374503, 79.8660067, 1),
  ('Nugegoda', 'Nugegoda, Sri Lanka', 'https://maps.app.goo.gl/8G6CwjZWmkhorLic7', 6.8747701, 79.8915679, 2);

-- CATEGORIES
insert into categories (name, note, sort_order) values
  ('Fried Rice', 'Basmati rice with chopsuey & chilli paste', 1),
  ('Kottu', null, 2),
  ('Cheese Kottu', null, 3),
  ('Dolphin', null, 4),
  ('Cheese Dolphin', null, 5),
  ('Submarine 12"', null, 6),
  ('Shawarma', null, 7),
  ('Club Sandwich', null, 8),
  ('Pasta', 'Served with cheese', 9);

-- FRIED RICE
insert into menu_items (category_id, name, description, price_normal, price_full, sort_order)
select id, 'Crispy Chicken Rice', null, 1420, 2120, 1 from categories where name='Fried Rice'
union all select id, 'Beef Rice', null, 1640, 2340, 2 from categories where name='Fried Rice'
union all select id, 'Seafood Rice', 'Prawns, cuttlefish & fish', 1690, 2390, 3 from categories where name='Fried Rice'
union all select id, 'Mixed Rice', 'Chicken, prawns, hotdog & bullseye egg', 1740, 2440, 4 from categories where name='Fried Rice'
union all select id, 'Nasi Goreng', 'Chicken, prawns, hotdog & bullseye egg', 1690, 2390, 5 from categories where name='Fried Rice'
union all select id, 'Mongolian Rice', 'Chicken, prawns & hotdog', 1790, 2690, 6 from categories where name='Fried Rice'
union all select id, 'Burger House Special Rice', 'Chicken, fish, prawns, cuttlefish, hotdog & bullseye egg', 1940, 2940, 7 from categories where name='Fried Rice';

-- KOTTU
insert into menu_items (category_id, name, description, price_normal, price_full, sort_order)
select id, 'Chicken Kottu', null, 1420, 2120, 1 from categories where name='Kottu'
union all select id, 'Beef Kottu', null, 1640, 2340, 2 from categories where name='Kottu'
union all select id, 'Seafood Kottu', 'Prawns, cuttlefish & fish', 1690, 2390, 3 from categories where name='Kottu'
union all select id, 'Mixed Kottu', 'Chicken, fish, prawns & hotdog', 1740, 2440, 4 from categories where name='Kottu'
union all select id, 'Burger House Special Kottu', 'Chicken, fish, prawns, cuttlefish & hotdog', 1940, 2940, 5 from categories where name='Kottu';

-- CHEESE KOTTU
insert into menu_items (category_id, name, description, price_normal, price_full, tag, sort_order)
select id, 'Chicken Cheese Kottu', null, 1820, 2720, 'CHEESY', 1 from categories where name='Cheese Kottu'
union all select id, 'Beef Kottu Cheese', null, 2040, 2940, 'CHEESY', 2 from categories where name='Cheese Kottu'
union all select id, 'Seafood Cheese Kottu', 'Prawns, cuttlefish & fish', 2090, 2990, 'CHEESY', 3 from categories where name='Cheese Kottu'
union all select id, 'Mixed Cheese Kottu', 'Chicken, fish, prawns & hotdog', 2140, 3040, 'CHEESY', 4 from categories where name='Cheese Kottu'
union all select id, 'Burger House Special Cheese Kottu', 'Chicken, fish, prawns, cuttlefish & hotdog', 2340, 3540, 'CHEESY', 5 from categories where name='Cheese Kottu';

-- DOLPHIN
insert into menu_items (category_id, name, description, price_normal, price_full, sort_order)
select id, 'Chicken Dolphin', null, 1420, 2120, 1 from categories where name='Dolphin'
union all select id, 'Beef Dolphin', null, 1640, 2340, 2 from categories where name='Dolphin'
union all select id, 'Seafood Dolphin', 'Prawns, cuttlefish & fish', 1690, 2390, 3 from categories where name='Dolphin'
union all select id, 'Mixed Dolphin', 'Chicken, fish, prawns & hotdog', 1740, 2440, 4 from categories where name='Dolphin'
union all select id, 'Burger House Special Dolphin', 'Chicken, fish, prawns, cuttlefish & hotdog', 1940, 2940, 5 from categories where name='Dolphin';

-- CHEESE DOLPHIN
insert into menu_items (category_id, name, description, price_normal, price_full, tag, sort_order)
select id, 'Chicken Cheese Dolphin', null, 1820, 2720, 'CHEESY', 1 from categories where name='Cheese Dolphin'
union all select id, 'Beef Dolphin Cheese', null, 2040, 2940, 'CHEESY', 2 from categories where name='Cheese Dolphin'
union all select id, 'Seafood Cheese Dolphin', 'Prawns, cuttlefish & fish', 2090, 2990, 'CHEESY', 3 from categories where name='Cheese Dolphin'
union all select id, 'Mixed Cheese Dolphin', 'Chicken, fish, prawns & hotdog', 2140, 3040, 'CHEESY', 4 from categories where name='Cheese Dolphin'
union all select id, 'Burger House Special Cheese Dolphin', 'Chicken, fish, prawns, cuttlefish & hotdog', 2340, 3540, 'CHEESY', 5 from categories where name='Cheese Dolphin';

-- SUBMARINE 12" (single price -> stored in price_normal, price_full left null)
insert into menu_items (category_id, name, price_normal, sort_order)
select id, 'Hotdog Submarine', 950, 1 from categories where name='Submarine 12"'
union all select id, 'Chicken Submarine', 1150, 2 from categories where name='Submarine 12"'
union all select id, 'Spicy Chicken Submarine', 1200, 3 from categories where name='Submarine 12"'
union all select id, 'Crispy Chicken Submarine', 1250, 4 from categories where name='Submarine 12"'
union all select id, 'Beef Submarine', 1400, 5 from categories where name='Submarine 12"';

-- SHAWARMA (price on request in the printed menu — staff can fill in via dashboard)
insert into menu_items (category_id, name, price_note, sort_order)
select id, 'Hotdog Shawarma', 'Ask staff', 1 from categories where name='Shawarma'
union all select id, 'Chicken Shawarma', 'Ask staff', 2 from categories where name='Shawarma'
union all select id, 'Spicy Chicken Shawarma', 'Ask staff', 3 from categories where name='Shawarma'
union all select id, 'Crispy Chicken Shawarma', 'Ask staff', 4 from categories where name='Shawarma'
union all select id, 'Beef Shawarma', 'Ask staff', 5 from categories where name='Shawarma';

-- CLUB SANDWICH (price on request)
insert into menu_items (category_id, name, price_note, sort_order)
select id, 'Egg Club Sandwich', 'Ask staff', 1 from categories where name='Club Sandwich'
union all select id, 'Chicken Club Sandwich', 'Ask staff', 2 from categories where name='Club Sandwich'
union all select id, 'Spicy Chicken Club Sandwich', 'Ask staff', 3 from categories where name='Club Sandwich'
union all select id, 'Beef Club Sandwich', 'Ask staff', 4 from categories where name='Club Sandwich';

-- PASTA
insert into menu_items (category_id, name, price_normal, price_full, sort_order)
select id, 'Veggie Pasta', 540, 640, 1 from categories where name='Pasta'
union all select id, 'Egg Pasta', 600, 700, 2 from categories where name='Pasta'
union all select id, 'Sausage Pasta', 670, 770, 3 from categories where name='Pasta'
union all select id, 'Hotdog Pasta', 710, 810, 4 from categories where name='Pasta'
union all select id, 'Chicken Pasta', 780, 880, 5 from categories where name='Pasta'
union all select id, 'Crispy Chicken Pasta', 840, 940, 6 from categories where name='Pasta'
union all select id, 'Beef Pasta', 810, 910, 7 from categories where name='Pasta';

-- ADD-ONS
insert into addons (name, price, sort_order) values
  ('Cheese', 90, 1),
  ('Egg', 90, 2),
  ('Sausage', 50, 3),
  ('Chicken', 90, 4),
  ('Fried Chicken', 120, 5),
  ('Crispy Chicken', 180, 6),
  ('Drumstick', 100, 7),
  ('Nugget', 35, 8),
  ('Fish Finger', 100, 9),
  ('Hotdog', 100, 10),
  ('Mini Kiev / Cheese Ball', 180, 11),
  ('Kochi Bite / Spicy Cheese Ball', 100, 12),
  ('Beef', 250, 13),
  ('Extra Mayonnaise Cup (Medium)', 80, 14),
  ('Extra Mayonnaise Cup (Large)', 120, 15),
  ('Meal Upgrade — Add Option 1 (Fries, 2 Nuggets, Mini Kiev, Drumstick, Fish Finger, Pepsi 300ml)', 790, 16),
  ('Meal Upgrade — Add Option 2 (Fries, Pepsi 300ml)', 400, 17),
  ('Extra Chicken Portion', 500, 18),
  ('Extra Beef Portion', 650, 19),
  ('Extra Hotdog Portion', 200, 20),
  ('Extra Prawns Portion', 400, 21),
  ('Extra Cuttlefish Portion', 400, 22),
  ('Extra Fish Portion', 400, 23);

-- BANNERS (test placeholders — replace image_url + text from the dashboard once real photos are ready)
insert into banners (title, subtitle, tag_label, image_url, sort_order) values
  ('Fresh Off The Grill', 'Every order cooked from scratch, no shortcuts', 'HOT DROP', 'assets/banners/grill.png', 1),
  ('Moratuwa''s Kottu King', 'The dish that put us on the map', 'SIGNATURE', 'assets/banners/kottu.png', 2),
  ('Open Till 1AM', 'Late night cravings, always covered', 'SETTLED', 'assets/banners/late.png', 3);

-- TEST MENU ITEM (demonstrates dashboard editing — safe to edit or delete from the dashboard)
insert into menu_items (category_id, name, description, tag, price_normal, sort_order)
select id, 'Chef''s Special (Test Item)', 'This is a sample dish — edit or delete it from the dashboard once your real special is ready.', 'NEW', 1500, 99
from categories where name = 'Fried Rice';
