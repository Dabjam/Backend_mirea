const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

let products = [
  {
    id: nanoid(6),
    name: "Смартфон Samsung Galaxy A54",
    category: "Смартфоны",
    description: 'Смартфон с экраном 6.4", 128 ГБ, 5G.',
    price: 34990,
    stock: 15,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Ноутбук ASUS VivoBook 15",
    category: "Ноутбуки",
    description: '15.6", Intel Core i5, 8 ГБ RAM, SSD 256 ГБ.',
    price: 52990,
    stock: 8,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Наушники Sony WH-1000XM5",
    category: "Аксессуары",
    description: "Беспроводные наушники с шумоподавлением.",
    price: 29990,
    stock: 12,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: 'Планшет iPad 10.9"',
    category: "Планшеты",
    description: 'Планшет Apple с экраном 10.9", 64 ГБ.',
    price: 42990,
    stock: 6,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Умные часы Apple Watch SE",
    category: "Носимые устройства",
    description: "Умные часы с пульсометром и уведомлениями.",
    price: 24990,
    stock: 20,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Клавиатура Logitech MX Keys",
    category: "Периферия",
    description: "Беспроводная клавиатура с подсветкой.",
    price: 8990,
    stock: 25,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Внешний SSD Samsung T7 1 ТБ",
    category: "Накопители",
    description: "Портативный SSD USB 3.2, 1 ТБ.",
    price: 7990,
    stock: 30,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Веб-камера Logitech C920",
    category: "Периферия",
    description: "Full HD веб-камера для стриминга и звонков.",
    price: 5990,
    stock: 18,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Колонка JBL Charge 5",
    category: "Аксессуары",
    description: "Портативная Bluetooth-колонка с павербанком.",
    price: 11990,
    stock: 14,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Роутер TP-Link Archer AX50",
    category: "Сеть",
    description: "Wi-Fi 6 роутер, до 3 Гбит/с.",
    price: 6990,
    stock: 10,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: 'Монитор LG 27" 4K',
    category: "Мониторы",
    description: "Монитор 27 дюймов, 4K UHD, IPS.",
    price: 27990,
    stock: 7,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&h=200&fit=crop",
  },
  {
    id: nanoid(6),
    name: "Мышь Logitech G Pro X",
    category: "Периферия",
    description: "Игровая беспроводная мышь, 25K DPI.",
    price: 8990,
    stock: 22,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=200&h=200&fit=crop",
  },
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        cb(null, origin || true);
      } else {
        cb(null, false);
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      console.log("Body:", req.body);
    }
  });
  next();
});

function findProductOr404(id, res) {
  const sid = String(id || "");
  const product = products.find((p) => String(p.id) === sid);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;
  const newProduct = {
    id: nanoid(6),
    name: String(name || "").trim(),
    category: String(category || "").trim(),
    description: String(description || "").trim(),
    price: Number(price) || 0,
    stock: Math.max(0, Number(stock) || 0),
    rating: rating != null ? Math.min(5, Math.max(0, Number(rating))) : null,
    image: image ? String(image).trim() : null,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

app.patch("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  const { name, category, description, price, stock, rating, image } = req.body;
  if (name !== undefined) product.name = String(name).trim();
  if (category !== undefined) product.category = String(category).trim();
  if (description !== undefined)
    product.description = String(description).trim();
  if (price !== undefined) product.price = Number(price) || 0;
  if (stock !== undefined) product.stock = Math.max(0, Number(stock) || 0);
  if (rating !== undefined)
    product.rating =
      rating == null ? null : Math.min(5, Math.max(0, Number(rating)));
  if (image !== undefined) product.image = image ? String(image).trim() : null;
  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const id = String(req.params.id || "");
  const exists = products.some((p) => String(p.id) === id);
  if (!exists) return res.status(404).json({ error: "Product not found" });
  products = products.filter((p) => String(p.id) !== id);
  res.status(204).send();
});

app.get("/", (req, res) => {
  res.json({
    message: "API сервера ТехноМаркет",
    products: "http://localhost:3000/api/products",
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
