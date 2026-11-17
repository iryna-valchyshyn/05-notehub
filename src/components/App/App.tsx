
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { fetchNotes } from "../../services/noteService";
import SearchBox from "../SearchBox/SearchBox";
import NoteList from "../NoteList/NoteList";
import Pagination from "../Pagination/Pagination";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";
import css from "./App.module.css";

const PER_PAGE = 12;

export default function App() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, 500);

  const handleSearch = (value: string): void => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const notesQuery = useQuery({
    queryKey: ["notes", page, search],
    queryFn: () => fetchNotes({ page, perPage: PER_PAGE, search }),
    placeholderData: (previousData) => previousData,
  });

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    if (
      notesQuery.data &&
      page > notesQuery.data.totalPages &&
      notesQuery.data.totalPages > 0
    ) {
      setPage(notesQuery.data.totalPages);
    }
  }, [notesQuery.data, page]);

  const notes = notesQuery.data?.notes ?? [];
  const totalPages = notesQuery.data?.totalPages ?? 0;

  return (
    <main className={css.app}>
      <header className={css.toolbar}>
        <div className={css.brand}>NoteHub</div>

        <SearchBox
          value={searchInput}
          onSearch={handleSearch}
        />

        {totalPages > 1 && (
          <Pagination
            pageCount={totalPages}
            currentPage={page}
            onPageChange={setPage}
          />
        )}

        <button
          className={css.createButton}
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          Create note +
        </button>
      </header>

      {notesQuery.isPending && (
        <p className={css.status}>Loading notes...</p>
      )}

      {notesQuery.isError && (
        <p className={css.error}>
          Не вдалося завантажити нотатки.
          Перевірте токен та оновіть сторінку.
        </p>
      )}

      {!notesQuery.isPending &&
        !notesQuery.isError &&
        notes.length === 0 && (
          <p className={css.status}>
            Нотаток не знайдено.
          </p>
        )}

      {notes.length > 0 && (
        <NoteList notes={notes} />
      )}

      {notesQuery.isFetching && !notesQuery.isPending && (
        <p className={css.subStatus}>Оновлення...</p>
      )}

      {notesQuery.data && totalPages > 1 && (
        <Pagination
          pageCount={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <NoteForm onCancel={closeModal} />
        </Modal>
      )}
    </main>
  );
}