const express = require('express');
const app = express();
const PORT = 3000;

let products = [
    {id: 3, name: "Банан", price: 20},
    {id: 4, name: "Апельсин", price: 21},
    {id: 5, name: "Яблоко", price: 22},
]

app.use(express.json());

app.get('/', (req, res) => {
   res.send("Главная страница")
});

app.get('/products', (req, res) => {
    res.json(products);
})

app.post('/products', (req, res) => {
    
    if(!req.body || !req.body.name) {
        return res.status(400).json({error: "Некорректный JSON или пустые данные"})
    }
    const newProduct = {
        id: products.length > 0 ? products.at(-1).id + 1 : 1,
        name: req.body.name,
        price: req.body.price
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
})


app.get('/products/:id', (req, res) => {
    let product = products.find( x => x.id == req.params.id);
    if (product) {
        res.json(product)
    }
    else {
        res.status(404).json({error: "Продукт не найден"});
    }
    
})

app.patch('/products/:id', (req, res) => {
    let product = products.find( x => x.id == req.params.id);
    const {name, price} = req.body;

    if (!product) {
        return res.status(404).json({error: "Товар не найден"});
    }

    if (name != undefined) product.name = name;
    if (price != undefined) product.price = price;
    
    res.json(product);
})

app.delete('/products/:id', (req, res) => { 
    products = products.filter(x => x.id != req.params.id);
    res.status(200).json({ message: "Товар удален" });
})

app.listen(PORT, () => {
    console.log(`(Сервер запущен: http://localhost:${PORT}`)
})
