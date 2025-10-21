import { useCallback } from "react";
import { useState } from "react";
import { useRef } from "react";

export default function usePrompt() {
  const ref = useRef({
    resolve: null,
    reject: null,
  });

  const [question, setQuestion] = useState(null);

  const prompt = useCallback((question) => {
    setQuestion(question);

    return new Promise((resolve, reject) => {
      ref.current.resolve = resolve;
      ref.current.reject = reject;
    });
  }, []);

  const answer = useCallback((value) => {
    if (ref.current.resolve) {
      ref.current.resolve(value);
      ref.current.resolve = null;
      ref.current.reject = null;
    }
    setQuestion(null);
  }, []);

  const cancel = useCallback(() => {
    if (ref.current.reject) {
      ref.current.reject(new Error("Prompt cancelled"));
      ref.current.resolve = null;
      ref.current.reject = null;
    }
    setQuestion(null);
  }, []);

  const show = question !== null;

  return {
    prompt,
    answer,
    cancel,
    show,
    question,
  };
}
