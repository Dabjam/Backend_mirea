const express = require("express");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Practice 7 API",
      version: "1.0.0",
      description: "API с базовой аутентификацией и CRUD товаров",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Локальный сервер",
      },
    ],
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Регистрация пользователя",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "first_name", "last_name", "password"],
                  properties: {
                    email: { type: "string", example: "test@example.com" },
                    first_name: { type: "string", example: "Ivan" },
                    last_name: { type: "string", example: "Petrov" },
                    password: { type: "string", example: "qwerty123" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Пользователь создан" },
            400: { description: "Некорректный запрос" },
            409: { description: "Email уже занят" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Вход в систему",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "test@example.com" },
                    password: { type: "string", example: "qwerty123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Успешный вход" },
            400: { description: "Некорректный запрос" },
            401: { description: "Неверные данные" },
            404: { description: "Пользователь не найден" },
          },
        },
      },
      "/api/products": {
        post: {
          tags: ["Products"],
          summary: "Создать товар",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "category", "description", "price"],
                  properties: {
                    title: { type: "string", example: "Phone" },
                    category: { type: "string", example: "Electronics" },
                    description: { type: "string", example: "Smartphone" },
                    price: { type: "number", example: 19999 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Товар создан" },
            400: { description: "Некорректный запрос" },
          },
        },
        get: {
          tags: ["Products"],
          summary: "Получить список товаров",
          responses: {
            200: { description: "Список товаров" },
          },
        },
      },
      "/api/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Получить товар по id",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Товар найден" },
            404: { description: "Товар не найден" },
          },
        },
        put: {
          tags: ["Products"],
          summary: "Обновить товар",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "category", "description", "price"],
                  properties: {
                    title: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" },
                    price: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Товар обновлен" },
            400: { description: "Некорректный запрос" },
            404: { description: "Товар не найден" },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Удалить товар",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            204: { description: "Товар удален" },
            404: { description: "Товар не найден" },
          },
        },
      },
    },
  },
  // swagger-jsdoc expects POSIX-like paths on Windows too.
  apis: [`${__dirname.replace(/\\/g, "/")}/app.js`],
};

const users = [];
const products = [];

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function findProductById(id) {
  return products.find((product) => product.id === id);
}

function parsePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) ? price : NaN;
}

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      console.log("Body:", req.body);
    }
  });
  next();
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               first_name:
 *                 type: string
 *                 example: Ivan
 *               last_name:
 *                 type: string
 *                 example: Petrov
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Некорректный запрос
 *       409:
 *         description: Email уже занят
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({
      error: "email, first_name, last_name and password are required",
    });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "user with this email already exists" });
  }

  const user = {
    id: nanoid(10),
    email,
    first_name,
    last_name,
    password: await hashPassword(password),
  };

  users.push(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешный вход
 *       400:
 *         description: Некорректный запрос
 *       401:
 *         description: Неверные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  const isAuthenticated = await verifyPassword(password, user.password);
  if (!isAuthenticated) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  return res.status(200).json({ login: true, user_id: user.id });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Phone
 *               category:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Smartphone
 *               price:
 *                 type: number
 *                 example: 19999
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Некорректный запрос
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res
      .status(400)
      .json({ error: "title, category, description and price are required" });
  }

  const parsedPrice = parsePrice(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "price must be a non-negative number" });
  }

  const product = {
    id: nanoid(10),
    title,
    category,
    description,
    price: parsedPrice,
  };
  products.push(product);

  return res.status(201).json(product);
});

app.get("/api/products", (req, res) => {
  return res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 *   put:
 *     summary: Обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       400:
 *         description: Некорректный запрос
 *       404:
 *         description: Товар не найден
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  return res.status(200).json(product);
});

app.put("/api/products/:id", (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  const { title, category, description, price } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res
      .status(400)
      .json({ error: "title, category, description and price are required" });
  }

  const parsedPrice = parsePrice(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "price must be a non-negative number" });
  }

  product.title = title;
  product.category = category;
  product.description = description;
  product.price = parsedPrice;

  return res.status(200).json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const productIndex = products.findIndex((product) => product.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "product not found" });
  }

  products.splice(productIndex, 1);
  return res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});
