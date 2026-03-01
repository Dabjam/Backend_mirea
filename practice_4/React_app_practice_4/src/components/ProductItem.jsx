import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  const { name, category, description, price, stock, rating, image } = product;

  return (
    <div className="productCard">
      <div className="productCard__imageWrap">
        {image ? (
          <img src={image} alt={name} className="productCard__image" />
        ) : (
          <div className="productCard__noImage">Нет фото</div>
        )}
        {rating != null && (
          <span className="productCard__rating">★ {rating}</span>
        )}
      </div>
      <div className="productCard__body">
        <div className="productCard__category">{category}</div>
        <h3 className="productCard__name">{name}</h3>
        <p className="productCard__description">{description}</p>
        <div className="productCard__meta">
          <span className="productCard__price">{price.toLocaleString("ru-RU")} ₽</span>
          <span className="productCard__stock">В наличии: {stock}</span>
        </div>
        <div className="productCard__actions">
          <button type="button" className="btn" onClick={() => onEdit(product)}>
            Редактировать
          </button>
          <button type="button" className="btn btn--danger" onClick={() => onDelete(String(product.id))}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
