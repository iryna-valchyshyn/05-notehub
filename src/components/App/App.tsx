import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { createNote, deleteNote, fetchNotes } from "../../services/noteService";
import type { CreateNoteData } from "../../types/note";
import SearchBox from "../SearchBox/SearchBox";
import NoteList from "../NoteList/NoteList";
import Pagination from "../Pagination/Pagination";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";
import css from "./App.module.css";

const PER_PAGE = 12;

export default function App() {
  const queryClient = useQueryClient();
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

  const createMutation = useMutation({
    mutationFn: (data: CreateNoteData) => createNote(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
    if (notesQuery.data && page > notesQuery.data.totalPages && notesQuery.data.totalPages > 0) {
      setPage(notesQuery.data.totalPages);
    }
  }, [notesQuery.data, page]);

  const handleCreate = async (values: CreateNoteData): Promise<void> => {
    await createMutation.mutateAsync(values);
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
  };

  const notes = notesQuery.data?.notes ?? [];
  const totalPages = notesQuery.data?.totalPages ?? 0;

  return (
    <main className={css.app}>
      <header className={css.toolbar}>
        <div className={css.brand}>NoteHub</div>
        <SearchBox value={searchInput} onSearch={handleSearch} />
        {totalPages > 1 && (
          <Pagination pageCount={totalPages} currentPage={page} onPageChange={setPage} />
        )}
        <button className={css.createButton} type="button" onClick={() => setIsModalOpen(true)}>
          Create note +
        </button>
      </header>

      {notesQuery.isPending && <p className={css.status}>Loading notes...</p>}
      {notesQuery.isError && (
        <p className={css.error}>
          Не вдалося завантажити нотатки. Перевірте токен у файлі .env та оновіть сторінку.
        </p>
      )}
      {!notesQuery.isPending && !notesQuery.isError && notes.length === 0 && (
        <p className={css.status}>Нотаток не знайдено.</p>
      )}
      {notes.length > 0 && (
        <NoteList
          notes={notes}
          onDelete={handleDelete}
          deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
        />
      )}
      {notesQuery.isFetching && !notesQuery.isPending && <p className={css.subStatus}>Оновлення...</p>}
      {notesQuery.data && totalPages > 1 && (
        <Pagination pageCount={totalPages} currentPage={page} onPageChange={setPage} />
      )}
      {deleteMutation.isError && <p className={css.error}>Не вдалося видалити нотатку. Спробуйте ще раз.</p>}
      {createMutation.isError && <p className={css.error}>Не вдалося створити нотатку. Спробуйте ще раз.</p>}

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <NoteForm onSubmit={handleCreate} onCancel={closeModal} />
        </Modal>
      )}
    </main>
  );
}
