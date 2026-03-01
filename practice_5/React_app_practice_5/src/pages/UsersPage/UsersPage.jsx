import React, { useEffect, useState } from "react";
import "./UsersPage.scss";
import UsersList from "../../components/UsersList";
import UserModal from "../../components/UserModal";
import { api } from "../../api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить пользователя?")) return;
    const idStr = String(id);
    try {
      await api.deleteUser(idStr);
      setUsers((prev) => prev.filter((u) => String(u.id) !== idStr));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления");
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        const { id, ...data } = payload;
        const newUser = await api.createUser(data);
        setUsers((prev) => [...prev, newUser]);
      } else {
        const { id, ...data } = payload;
        const updated = await api.updateUser(id, data);
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения");
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Users API</div>
          <div className="header__right">Практика 5</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Пользователи</h1>
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              + Создать
            </button>
          </div>
          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <UsersList users={users} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      </main>
      <footer className="footer">
        <div className="footer__inner">© {new Date().getFullYear()} Users API</div>
      </footer>
      <UserModal
        key={editingUser?.id ?? "create"}
        open={modalOpen}
        mode={modalMode}
        initialUser={editingUser}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
