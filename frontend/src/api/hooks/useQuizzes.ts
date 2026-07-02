import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { Question, Quiz, QuizAttempt } from '../../types';

/** GET /api/quizzes/{quiz} — includes course/lesson/questions eager-loaded. */
export function useQuiz(quizId: number | string | undefined) {
  return useQuery({
    queryKey: ['quizzes', quizId],
    enabled: quizId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Quiz>(`/api/quizzes/${quizId}`);
      return data;
    },
  });
}

/**
 * Questions come back correct_answer-stripped for students (see backend
 * QuestionResource). Fetched separately from useQuiz for pages that only
 * need the question list without the full quiz payload, but QuizAttempt
 * page uses useQuiz(quizId).questions when present to avoid a second call.
 */
export function useQuizQuestions(quizId: number | string | undefined) {
  return useQuery({
    queryKey: ['quizzes', quizId, 'questions'],
    enabled: quizId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Question> | { data: Question[] }>(
        `/api/quizzes/${quizId}/questions`,
      );
      return data.data;
    },
  });
}

export interface QuizAnswerPayload {
  question_id: number;
  submitted_answer: string | null;
}

export function useSubmitQuizAttempt(quizId: number | string) {
  return useMutation({
    mutationFn: async (answers: QuizAnswerPayload[]) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<QuizAttempt>(`/api/quizzes/${quizId}/attempt`, {
        answers,
      });
      return data;
    },
  });
}
