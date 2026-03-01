import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [rating, setRating] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (!open) return;
    const p = initialProduct;
    setName(p?.name ?? "");
    setCategory(p?.category ?? "");
    setDescription(p?.description ?? "");
    setPrice(p?.price != null ? String(p.price) : "");
    setStock(p?.stock != null ? String(p.stock) : "");
    setRating(p?.rating != null ? String(p.rating) : "");
    setImage(p?.image ?? "");
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Добавление товара";

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const numPrice = Number(price);
    const numStock = Math.max(0, Number(stock) || 0);
    const numRating = rating === "" ? null : Math.min(5, Math.max(0, Number(rating)));

    if (!trimmedName) {
      alert("Введите название товара");
      return;
    }
    if (!trimmedCategory) {
      alert("Введите категорию");
      return;
    }
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      alert("Введите корректную цену");
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: description.trim(),
      price: numPrice,
      stock: numStock,
      rating: numRating,
      image: image.trim() || null,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal modal--wide" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название товара" />
          </label>
          <label className="label">
            Категория
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Например, Смартфоны" />
          </label>
          <label className="label">
            Описание
            <textarea className="input input--textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание товара" rows={3} />
          </label>
          <div className="formRow">
            <label className="label">
              Цена (₽)
              <input className="input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </label>
            <label className="label">
              На складе
              <input className="input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
            </label>
          </div>
          <label className="label">
            Рейтинг (0–5, необязательно)
            <input className="input" type="number" min="0" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="—" />
          </label>
          <label className="label">
            Ссылка на фото (необязательно)
            <input className="input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
