
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  type FormikHelpers,
} from "formik";
import * as Yup from "yup";
import { createNote } from "../../services/noteService";
import type { CreateNoteData, NoteTag } from "../../types/note";
import css from "./NoteForm.module.css";

interface NoteFormProps {
  onCancel: () => void;
}

const tags: NoteTag[] = [
  "Todo",
  "Work",
  "Personal",
  "Meeting",
  "Shopping",
];

const validationSchema = Yup.object({
  title: Yup.string()
    .min(3, "Мінімум 3 символи")
    .max(50, "Максимум 50 символів")
    .required("Обов'язкове поле"),
  content: Yup.string().max(500, "Максимум 500 символів"),
  tag: Yup.mixed<NoteTag>()
    .oneOf(tags, "Оберіть тег")
    .required("Обов'язкове поле"),
});

export default function NoteForm({ onCancel }: NoteFormProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notes"],
      });
      onCancel();
    },
  });

  const initialValues: CreateNoteData = {
    title: "",
    content: "",
    tag: "Todo",
  };

  const handleSubmit = async (
    values: CreateNoteData,
    helpers: FormikHelpers<CreateNoteData>,
  ): Promise<void> => {
    try {
      await createMutation.mutateAsync(values);
      helpers.resetForm();
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className={css.form}>
          <h2 className={css.heading}>Create note</h2>

          <div className={css.formGroup}>
            <label htmlFor="title">Title</label>
            <Field
              id="title"
              name="title"
              type="text"
              className={css.input}
            />
            <ErrorMessage
              name="title"
              component="span"
              className={css.error}
            />
          </div>

          <div className={css.formGroup}>
            <label htmlFor="content">Content</label>
            <Field
              as="textarea"
              id="content"
              name="content"
              rows={8}
              className={css.textarea}
            />
            <ErrorMessage
              name="content"
              component="span"
              className={css.error}
            />
          </div>

          <div className={css.formGroup}>
            <label htmlFor="tag">Tag</label>
            <Field
              as="select"
              id="tag"
              name="tag"
              className={css.select}
            >
              {tags.map((tag) => (
                <option value={tag} key={tag}>
                  {tag}
                </option>
              ))}
            </Field>
            <ErrorMessage
              name="tag"
              component="span"
              className={css.error}
            />
          </div>

          {createMutation.isError && (
            <p className={css.error}>
              Не вдалося створити нотатку. Спробуйте ще раз.
            </p>
          )}

          <div className={css.actions}>
            <button
              type="button"
              className={css.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={css.submitButton}
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending
                ? "Creating..."
                : "Create note"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
