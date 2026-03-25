"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  idleText: string;
  loadingText: string;
}

export function SubmitButton({ idleText, loadingText }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`form-submit-btn ${pending ? "loading" : ""}`}
    >
      {pending ? (
        <>
          <span className="spinner-small" />
          {loadingText}
        </>
      ) : (
        idleText
      )}
    </button>
  );
}
