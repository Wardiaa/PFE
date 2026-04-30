// src/lib/session.service.ts
import { supabase } from "../lib/supabase";
import type {
  Session,
  Participant,
  Question,
  QuestionResponses,
  EliminationEvent,
  GameState,
  GameMode,
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
          game_mode,
          theme,
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
          gameMode: (context.game_mode ?? "standard") as GameMode,
          themeId: context.theme ?? "default",
        },
        status: session.status as "WAITING" | "ACTIVE" | "PAUSED" | "ENDED",
        currentQuestionIndex: session.current_question_index,
        gameMode: (context.game_mode ?? "standard") as GameMode,
      };
    } catch (error) {
      console.error("Create session error:", error);
      return null;
    }
  }

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
        .select("id, title, game_mode, theme")
        .eq("id", session.context_id)
        .maybeSingle();

      const { data: questionsRaw, error: questionsError } = await supabase
        .from("questions")
        .select(
          "id, title, description, type, points, time_limit, options, scale, labels, display_style, image_url, question_order, hide_participant_names",
        )
        .eq("context_id", session.context_id)
        .order("question_order", { ascending: true });

      const finalContext = {
        id: context?.id ?? session.context_id,
        title: context?.title ?? "Untitled Session",
        game_mode: context?.game_mode ?? "standard",
        theme: context?.theme ?? "default",
        questions: questionsRaw ?? [],
      };

      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          session_id: session.id,
          user_id: userId || null,
          name: participantName,
          is_anonymous: isAnonymous,
          is_alive: true,
          score: 0,
        })
        .select()
        .single();

      if (participantError || !participant) {
        console.error("Failed to join session:", participantError);
        throw new Error("Failed to join session");
      }

      const questions: Question[] = finalContext.questions
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
        session: {
          id: session.id,
          code: session.code,
          participantCount: session.participant_count,
          startTime: new Date(session.created_at),
          presentation: {
            id: session.context_id,
            title: finalContext.title,
            questions,
            gameMode: (finalContext.game_mode ?? "standard") as GameMode,
            themeId: finalContext.theme ?? "default",
          },
          status: session.status as "WAITING" | "ACTIVE" | "PAUSED" | "ENDED",
          currentQuestionIndex: session.current_question_index,
          currentQuestionId: session.current_question_id,
          currentQuestionStartedAt: session.current_question_started_at
            ? new Date(session.current_question_started_at)
            : undefined,
          gameMode: (finalContext.game_mode ?? "standard") as GameMode,
        },
        participantId: participant.id,
      };
    } catch (error) {
      console.error("Join session error:", error);
      throw error;
    }
  }

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

  static async checkExistingResponse(
    sessionId: string,
    participantId: string,
    questionId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("responses")
        .select("id")
        .eq("session_id", sessionId)
        .eq("participant_id", participantId)
        .eq("question_id", questionId)
        .limit(1);

      if (error) {
        console.error("Failed to check existing response:", error);
        return false;
      }

      return data && data.length > 0 ? true : false;
    } catch (error) {
      console.error("Check existing response error:", error);
      return false;
    }
  }

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
        update.timer_paused_remaining = remainingAtPause ?? null;
        update.timer_resumed_at = null;
      } else {
        update.timer_resumed_at = new Date().toISOString();
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
        score: p.score ?? 0,
        avatar: p.avatar_url,
        isAnonymous: p.is_anonymous,
        joinedAt: new Date(p.joined_at),
        isAlive: p.is_alive ?? true,
        eliminatedAtRound: p.eliminated_at_round ?? null,
        eliminatedAtQuestionId: p.eliminated_at_question_id ?? null,
      }));
    } catch (error) {
      console.error("Get participants error:", error);
      return [];
    }
  }

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

  static async eliminateParticipant(args: {
    sessionId: string;
    participantId: string;
    questionId: string;
    roundNumber: number;
  }): Promise<EliminationEvent | null> {
    try {
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select("name, is_alive")
        .eq("id", args.participantId)
        .single();

      if (participantError || !participant) {
        console.error(
          "[eliminateParticipant] Failed to get participant:",
          participantError,
        );
        return null;
      }

      if (participant.is_alive === false) {
        console.log("[eliminateParticipant] Already eliminated");
        return null;
      }

      const { error: updateError } = await supabase
        .from("participants")
        .update({
          is_alive: false,
          eliminated_at_round: args.roundNumber,
          eliminated_at_question_id: args.questionId,
        })
        .eq("id", args.participantId);

      if (updateError) {
        console.error("[eliminateParticipant] Update failed:", updateError);
        return null;
      }

      const { error: logError } = await supabase
        .from("elimination_log")
        .insert({
          session_id: args.sessionId,
          participant_id: args.participantId,
          participant_name: participant.name,
          question_id: args.questionId,
          round_number: args.roundNumber,
          eliminated_at: new Date().toISOString(),
        });

      if (logError) {
        console.error("[eliminateParticipant] Log insert failed:", logError);
      }

      return {
        participantId: args.participantId,
        participantName: participant.name,
        questionId: args.questionId,
        roundNumber: args.roundNumber,
        eliminatedAt: new Date(),
      };
    } catch (error) {
      console.error("[eliminateParticipant] Error:", error);
      return null;
    }
  }

  static async incrementScore(
    participantId: string,
    delta: number,
  ): Promise<number | null> {
    try {
      const { data: row, error: readErr } = await supabase
        .from("participants")
        .select("score")
        .eq("id", participantId)
        .maybeSingle();

      if (readErr || !row) return null;

      const newScore = (row.score ?? 0) + delta;

      const { error: writeErr } = await supabase
        .from("participants")
        .update({ score: newScore })
        .eq("id", participantId);

      if (writeErr) return null;
      return newScore;
    } catch (error) {
      console.error("incrementScore error:", error);
      return null;
    }
  }

  /**
   * Returns the live game state for the session.
   *
   * IMPORTANT: This method NEVER auto-determines a winner anymore.
   * The winner is only revealed when the host explicitly calls
   * `determineWinner(sessionId)` and broadcasts a WINNER_REVEAL event.
   * This avoids the bug where the WinnerCelebration overlay used to
   * pop up as soon as the last question was *displayed* (not answered).
   *
   * Also fixes the previous bug where the questions table was queried
   * with `context_id=eq.undefined` when the session lookup failed,
   * producing a 400 (Bad Request) in the browser console.
   */
  static async getGameState(sessionId: string): Promise<GameState> {
    try {
      const [{ data: participants }, { data: history }, { data: session }] =
        await Promise.all([
          supabase
            .from("participants")
            .select(
              "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id",
            )
            .eq("session_id", sessionId),
          supabase
            .from("elimination_log")
            .select("*")
            .eq("session_id", sessionId)
            .order("eliminated_at", { ascending: true }),
          supabase
            .from("sessions")
            .select("current_question_index, status, context_id")
            .eq("id", sessionId)
            .maybeSingle(),
        ]);

      const allParticipants = (participants || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        score: p.score ?? 0,
        avatar: p.avatar_url ?? undefined,
        isAnonymous: p.is_anonymous,
        joinedAt: new Date(p.joined_at),
        isAlive: p.is_alive === true,
        eliminatedAtRound: p.eliminated_at_round ?? null,
        eliminatedAtQuestionId: p.eliminated_at_question_id ?? null,
      }));

      const alive = allParticipants.filter((p) => p.isAlive === true);
      const eliminated = allParticipants.filter((p) => p.isAlive === false);

      const eliminationHistory: EliminationEvent[] = (history || []).map(
        (row: any) => ({
          participantId: row.participant_id,
          participantName: row.participant_name,
          questionId: row.question_id,
          roundNumber: row.round_number,
          eliminatedAt: new Date(row.eliminated_at),
        }),
      );

      return {
        alive,
        eliminated,
        winner: null, // ← never auto-set; host must explicitly reveal the winner
        totalPlayers: allParticipants.length,
        currentRound: (session?.current_question_index ?? -1) + 1,
        history: eliminationHistory,
      };
    } catch (error) {
      console.error("getGameState error:", error);
      return {
        alive: [],
        eliminated: [],
        winner: null,
        totalPlayers: 0,
        currentRound: 0,
        history: [],
      };
    }
  }

  /**
   * Determines the winner of an elimination session.
   *
   * Rules:
   *   1. The winner must have answered ALL questions correctly
   *      (i.e. they are still alive — wrong answers eliminate the
   *      player and missed answers also eliminate the player).
   *   2. If multiple participants are still alive after the last
   *      question, the tie-breaker is the EARLIEST correct response
   *      submitted on the LAST question.
   *   3. If a tie still remains, fall back to the highest score.
   *   4. If no one is still alive, fall back to the eliminated
   *      participant with the highest score.
   *
   * The host calls this when clicking the "Show Winner" button.
   */
  static async determineWinner(sessionId: string): Promise<Participant | null> {
    try {
      // 1) Load session + the questions belonging to its context.
      const { data: session } = await supabase
        .from("sessions")
        .select("context_id, current_question_index")
        .eq("id", sessionId)
        .maybeSingle();

      // Guard against the session being missing or context_id undefined,
      // which previously caused: GET …/questions?select=id&context_id=eq.undefined → 400
      if (!session?.context_id) {
        console.warn(
          "[determineWinner] session/context_id missing for",
          sessionId,
        );
        return null;
      }

      const { data: questions } = await supabase
        .from("questions")
        .select("id, question_order")
        .eq("context_id", session.context_id)
        .order("question_order", { ascending: true });

      if (!questions || questions.length === 0) return null;
      const lastQuestionId = questions[questions.length - 1].id;

      // 2) Load alive participants — by definition they answered every
      //    question correctly (wrong / missed answers eliminate them).
      const { data: aliveRows } = await supabase
        .from("participants")
        .select(
          "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id",
        )
        .eq("session_id", sessionId)
        .eq("is_alive", true);

      const toParticipant = (p: any): Participant => ({
        id: p.id,
        name: p.name,
        score: p.score ?? 0,
        avatar: p.avatar_url ?? undefined,
        isAnonymous: p.is_anonymous,
        joinedAt: new Date(p.joined_at),
        isAlive: p.is_alive === true,
        eliminatedAtRound: p.eliminated_at_round ?? null,
        eliminatedAtQuestionId: p.eliminated_at_question_id ?? null,
      });

      const alive = (aliveRows || []).map(toParticipant);

      if (alive.length === 1) return alive[0];

      if (alive.length > 1) {
        // 3) Tie-breaker: earliest correct response on the last question.
        const aliveIds = alive.map((p) => p.id);
        const { data: lastResponses } = await supabase
          .from("responses")
          .select("participant_id, submitted_at")
          .eq("session_id", sessionId)
          .eq("question_id", lastQuestionId)
          .eq("is_correct", true)
          .in("participant_id", aliveIds)
          .order("submitted_at", { ascending: true });

        if (lastResponses && lastResponses.length > 0) {
          const earliestId = lastResponses[0].participant_id;
          const winner = alive.find((p) => p.id === earliestId);
          if (winner) return winner;
        }

        // Fallback: highest score, then earliest joined.
        return [...alive].sort((a, b) => {
          if ((b.score ?? 0) !== (a.score ?? 0))
            return (b.score ?? 0) - (a.score ?? 0);
          return a.joinedAt.getTime() - b.joinedAt.getTime();
        })[0];
      }

      // 4) No one alive — fall back to highest-scoring eliminated player.
      const { data: elimRows } = await supabase
        .from("participants")
        .select(
          "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id",
        )
        .eq("session_id", sessionId)
        .eq("is_alive", false)
        .order("score", { ascending: false })
        .limit(1);

      return elimRows?.[0] ? toParticipant(elimRows[0]) : null;
    } catch (error) {
      console.error("determineWinner error:", error);
      return null;
    }
  }

  static async submitEliminationAnswer(args: {
    sessionId: string;
    participantId: string;
    questionId: string;
    roundNumber: number;
    chosenOptionId: string;
    isCorrect: boolean;
    pointsIfCorrect: number;
  }): Promise<{
    correct: boolean;
    eliminated: EliminationEvent | null;
    newScore: number | null;
  }> {
    // Save the response with isCorrect flag
    const { error: responseError } = await supabase.from("responses").insert({
      session_id: args.sessionId,
      participant_id: args.participantId,
      question_id: args.questionId,
      answer: {
        optionId: args.chosenOptionId,
        isCorrect: args.isCorrect,
        pointsEarned: args.isCorrect ? args.pointsIfCorrect : 0,
      },
      is_correct: args.isCorrect,
      points_earned: args.isCorrect ? args.pointsIfCorrect : 0,
      submitted_at: new Date().toISOString(),
    });

    if (responseError) {
      console.error(
        "[submitEliminationAnswer] Response insert failed:",
        responseError,
      );
    }

    if (args.isCorrect) {
      const newScore = await SessionService.incrementScore(
        args.participantId,
        args.pointsIfCorrect,
      );
      return { correct: true, eliminated: null, newScore };
    }

    const eliminated = await SessionService.eliminateParticipant({
      sessionId: args.sessionId,
      participantId: args.participantId,
      questionId: args.questionId,
      roundNumber: args.roundNumber,
    });

    return { correct: false, eliminated, newScore: null };
  }

  static async getEliminationHistory(
    sessionId: string,
  ): Promise<EliminationEvent[]> {
    try {
      const { data, error } = await supabase
        .from("elimination_log")
        .select("*")
        .eq("session_id", sessionId)
        .order("eliminated_at", { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => ({
        participantId: row.participant_id,
        participantName: row.participant_name,
        questionId: row.question_id,
        roundNumber: row.round_number,
        eliminatedAt: new Date(row.eliminated_at),
      }));
    } catch (error) {
      console.error("getEliminationHistory error:", error);
      return [];
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
