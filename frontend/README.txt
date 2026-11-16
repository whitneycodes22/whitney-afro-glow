AFRO GLOW – FRONT END
=====================
Open this folder in VS Code and run index.html with the "Live Server" extension
(right-click index.html > Open with Live Server). Do not double-click the files:
some browsers do not share saved data between files opened that way.

PAGES
  index.html        Home
  menu.html         Menu (search + 7 categories)
  promotions.html   Promo codes
  rewards.html      Loyalty rewards (points, vouchers)
  contact.html      Contact details + message form
  support.html      FAQ + support ticket form
  cart.html         Cart and checkout (promo codes, vouchers)
  login.html        Login for EVERYONE (customer, staff, owner)
  signup.html       Create account (customers)
  account.html      Customer orders, points, vouchers
  staff.html        Staff Portal (Till, Orders, Stock, Dashboard, Inbox, Team)

FOLDERS
  css/style.css     All styling and colours (see :root at the top)
  js/data.js        Product list (124 items)
  js/app.js         Shared code + SHOP settings (phone, email, address, hours, promos, rewards)
  js/pages.js       Customer pages
  js/staff.js       Staff Portal
  images/logo.jpg   Logo

HOW LOGIN SENDS PEOPLE
  Customer account  -> back to the shop
  Staff / owner     -> staff.html (Staff Portal)
  Customers who open staff.html are sent back to the home page.

FIRST-TIME SETUP
  1. Open login.html and click "Set up the owner account first" (only shows until an owner exists).
  2. Log in as owner > Staff Portal > Team > add staff (name, email, password).
  3. Staff log in on the normal Login page.

EDIT YOUR DETAILS: js/app.js, the SHOP block at the top (phone, WhatsApp, email, address, hours).
NOTE: data is saved in the browser (demo). A real shop needs a backend/database for real accounts.
