// src/lib/session.service.ts
import { supabase } from "../lib/supabase";
import type {
  Session,
  Participant,
  Question,
  QuestionResponses,
} from "../lib/presentation.types";

export interface CreateSessionParams {
  contextId: string;
  hostId: string;
}

export interface JoinSessionParams {
  sessionCode: string;
  participantName: string;
  userId?: string;
  isAnonymous?: boolean;
}

export interface SubmitResponseParams {
  sessionId: string;
  participantId: string;
  questionId: string;
  answer: any;
}

export class SessionService {
  // Create a new session from a context
  static async createSession({
    contextId,
    hostId,
  }: CreateSessionParams): Promise<Session | null> {
    try {
      const { data: context, error: contextError } = await supabase
        .from("contexts")
        .select(
          `
          id,
          title,
          questions (
            id,
            title,
            description,
            type,
            points,
            time_limit,
            options,
            scale,
            labels,
            display_style,
            image_url,
            question_order,
            hide_participant_names
          )
        `,
        )
        .eq("id", contextId)
        .maybeSingle();

      if (contextError) {
        console.error("Context fetch error:", contextError);
        throw new Error(`Context not found: ${contextError.message}`);
      }

      if (!context) {
        throw new Error(`Context with ID ${contextId} not found`);
      }

      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          context_id: contextId,
          host_id: hostId,
          status: "WAITING",
          current_question_index: -1,
          settings: {},
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error("No session data returned");
      }

      const questionsArray = context.questions || [];
      const questions: Question[] = questionsArray
        .sort((a: any, b: any) => a.question_order - b.question_order)
        .map((q: any, index: number) => ({
          id: q.id,
          number: index + 1,
          type: this.mapQuestionType(q.type),
          text: q.title,
          description: q.description || undefined,
          timeLimit: q.time_limit,
          options: q.options,
          scale: q.scale,
          labels: q.labels,
          points: q.points,
          image: q.image_url || undefined,
          displayStyle: q.display_style,
          hideParticipantNames: q.hide_participant_names ?? false,
        }));

      return {
        id: session.id,
        code: session.code,
        participantCount: session.participant_count,
        startTime: new Date(session.created_at),
        presentation: {
          id: context.id,
          title: context.title,
          questions,
        },
        status: session.status as "WAITING" | "ACTIVE" | "PAUSED" | "ENDED",
        currentQuestionIndex: session.current_question_index,
      };
    } catch (error) {
      console.error("Create session error:", error);
      return null;
    }
  }

  // Join an existing session
  static async joinSession({
    sessionCode,
    participantName,
    userId,
    isAnonymous = false,
  }: JoinSessionParams): Promise<{
    session: Session;
    participantId: string;
  } | null> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("code", sessionCode.toUpperCase())
        .maybeSingle();

      console.log("Session found:", { session, sessionError });

      if (sessionError) {
        console.error("Session fetch error:", sessionError);
        throw new Error(`Database error: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error(
          `No session found with code "${sessionCode}". Please check the code and try again.`,
        );
      }

      if (session.status === "ENDED") {
        throw new Error("This session has already ended.");
      }

      const { data: context, error: contextError } = await supabase
        .from("contexts")
        .select(
          `
          id,
          title,
          questions (
            id,
            title,
            description,
            type,
            points,
            time_limit,
            options,
            scale,
            labels,
            display_style,
            image_url,
            question_order,
            hide_participant_names
          )
        `,
        )
        .eq("id", session.context_id)
        .maybeSingle();

      console.log("Context with questions:", { context, contextError });

      if (contextError) {
        console.error("Context fetch error:", contextError);
      }

      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          session_id: session.id,
          user_id: userId || null,
          name: participantName,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (participantError || !participant) {
        console.error("Failed to join session:", participantError);
        throw new Error("Failed to join session");
      }

      const questionsArray = context?.questions || [];
      console.log("Questions array length:", questionsArray.length);

      const questions: Question[] = questionsArray
        .sort((a: any, b: any) => a.question_order - b.question_order)
        .map((q: any, index: number) => ({
          id: q.id,
          number: index + 1,
          type: this.mapQuestionType(q.type),
          text: q.title,
          description: q.description || undefined,
          timeLimit: q.time_limit,
          options: q.options,
          scale: q.scale,
          labels: q.labels,
          points: q.points,
          image: q.image_url || undefined,
          displayStyle: q.display_style,
          hideParticipantNames: q.hide_participant_names ?? false,
        }));

      console.log("Formatted questions:", questions);

      return {
        session: {
          id: session.id,
          code: session.code,
          participantCount: session.participant_count,
          startTime: new Date(session.created_at),
          presentation: {
            id: session.context_id,
            title: context?.title || "Untitled Session",
            questions,
          },
          status: session.status as "WAITING" | "ACTIVE" | "PAUSED" | "ENDED",
          currentQuestionIndex: session.current_question_index,
          currentQuestionId: session.current_question_id,
          currentQuestionStartedAt: session.current_question_started_at
            ? new Date(session.current_question_started_at)
            : undefined,
        },
        participantId: participant.id,
      };
    } catch (error) {
      console.error("Join session error:", error);
      throw error;
    }
  }

  // Submit a response
  static async submitResponse({
    sessionId,
    participantId,
    questionId,
    answer,
  }: SubmitResponseParams): Promise<boolean> {
    try {
      const { error } = await supabase.from("responses").insert({
        session_id: sessionId,
        participant_id: participantId,
        question_id: questionId,
        answer: answer,
        submitted_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to submit response:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Submit response error:", error);
      return false;
    }
  }

  // Update session status
  static async updateSessionStatus(
    sessionId: string,
    status: "WAITING" | "ACTIVE" | "PAUSED" | "ENDED",
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status })
        .eq("id", sessionId);

      if (error) {
        console.error("Failed to update session status:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Update status error:", error);
      return false;
    }
  }

  // Move to next/previous question
  static async setCurrentQuestion(
    sessionId: string,
    questionIndex: number,
    questionId?: string,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({
          current_question_index: questionIndex,
          current_question_id: questionId,
          current_question_started_at: new Date().toISOString(),
          // Reset pause timer fields when changing question
          is_paused: false,
          timer_paused_remaining: null,
          timer_resumed_at: null,
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Failed to update current question:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Set current question error:", error);
      return false;
    }
  }

  /**
   * Toggle pause state.
   *
   * When PAUSING: we snapshot the remaining time into `timer_paused_remaining`
   * so the audience can read the exact frozen value.
   *
   * When RESUMING: we record `timer_resumed_at` = now. The audience computes:
   *   remaining = timer_paused_remaining - (now - timer_resumed_at)
   *
   * This means both host and audience always derive their remaining time from
   * server-authoritative DB values — no local drift possible.
   */
  static async togglePause(
    sessionId: string,
    isPaused: boolean,
    remainingAtPause?: number,
  ): Promise<boolean> {
    try {
      const update: Record<string, any> = {
        is_paused: isPaused,
      };

      if (isPaused) {
        // Pausing — snapshot the remaining seconds
        update.timer_paused_remaining = remainingAtPause ?? null;
        update.timer_resumed_at = null;
      } else {
        // Resuming — record the moment of resume so audience can compute elapsed
        update.timer_resumed_at = new Date().toISOString();
        // Keep timer_paused_remaining so audience knows what to count from
      }

      const { error } = await supabase
        .from("sessions")
        .update(update)
        .eq("id", sessionId);

      if (error) {
        console.error("Failed to toggle pause:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Toggle pause error:", error);
      return false;
    }
  }

  // Get session participants
  static async getParticipants(sessionId: string): Promise<Participant[]> {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", sessionId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Failed to get participants:", error);
        return [];
      }

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        avatar: p.avatar_url,
        isAnonymous: p.is_anonymous,
        joinedAt: new Date(p.joined_at),
      }));
    } catch (error) {
      console.error("Get participants error:", error);
      return [];
    }
  }

  // Get question responses
  static async getQuestionResponses(
    sessionId: string,
    questionId: string,
    hideParticipantNames: boolean = false,
  ): Promise<QuestionResponses> {
    try {
      const query = supabase
        .from("responses")
        .select(
          `
          answer,
          participants!inner(name)
        `,
        )
        .eq("session_id", sessionId)
        .eq("question_id", questionId);

      const { data, error } = await query;

      if (error) {
        console.error("Failed to get responses:", error);
        return {};
      }

      const aggregated: any = {};

      (data || []).forEach((response: any) => {
        const answer = response.answer;
        const participantName = response.participants?.name;

        if (typeof answer === "object") {
          if (answer.optionId) {
            aggregated[answer.optionId] =
              (aggregated[answer.optionId] || 0) + 1;

            // Add individual response
            aggregated.individualResponses =
              aggregated.individualResponses || [];
            aggregated.individualResponses.push({
              optionId: answer.optionId,
              participantName: hideParticipantNames
                ? undefined
                : participantName,
              timestamp: new Date(),
            });
          } else if (answer.rating !== undefined) {
            const rating = answer.rating;
            aggregated[rating] = (aggregated[rating] || 0) + 1;
            aggregated.total = (aggregated.total || 0) + 1;

            // Add individual rating
            aggregated.individualRatings = aggregated.individualRatings || [];
            aggregated.individualRatings.push({
              rating: answer.rating,
              participantName: hideParticipantNames
                ? undefined
                : participantName,
              timestamp: new Date(),
            });

            let sum = 0;
            let count = 0;
            Object.entries(aggregated).forEach(([key, val]) => {
              if (
                key !== "total" &&
                key !== "average" &&
                key !== "individualRatings"
              ) {
                const numKey = parseInt(key);
                if (!isNaN(numKey)) {
                  sum += numKey * (val as number);
                  count += val as number;
                }
              }
            });
            if (count > 0) {
              aggregated.average = (sum / count).toFixed(1);
            }
          } else if (answer.text) {
            aggregated.count = (aggregated.count || 0) + 1;
            aggregated.recent = aggregated.recent || [];
            aggregated.recent.unshift({
              text: answer.text,
              timestamp: new Date(),
              participantName: hideParticipantNames
                ? undefined
                : participantName,
            });
            aggregated.recent = aggregated.recent.slice(0, 10);
          } else if (answer.words && Array.isArray(answer.words)) {
            aggregated.words = aggregated.words || {};
            answer.words.forEach((word: string) => {
              const lowerWord = word.toLowerCase();
              aggregated.words[lowerWord] =
                (aggregated.words[lowerWord] || 0) + 1;
            });
            aggregated.uniqueWords = Object.keys(aggregated.words).length;
            aggregated.words = Object.entries(aggregated.words)
              .map(([text, count]) => ({ text, count: count as number }))
              .sort((a, b) => b.count - a.count);

            // Add individual word submissions
            aggregated.individualWords = aggregated.individualWords || [];
            aggregated.individualWords.push({
              words: answer.words,
              participantName: hideParticipantNames
                ? undefined
                : participantName,
              timestamp: new Date(),
            });
          }
        }
      });

      return aggregated;
    } catch (error) {
      console.error("Get responses error:", error);
      return {};
    }
  }

  private static mapQuestionType(dbType: string): Question["type"] {
    const mapping: Record<string, Question["type"]> = {
      MULTIPLE_CHOICE: "multiple-choice",
      SINGLE_CHOICE: "multiple-choice",
      TRUE_FALSE: "multiple-choice",
      POLL: "multiple-choice",
      RATING: "rating",
      OPEN_TEXT: "open-text",
      WORD_CLOUD: "word-cloud",
    };
    return mapping[dbType] || "multiple-choice";
  }
}