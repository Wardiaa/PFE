// src/lib/session.service.ts
// Updated: added RANKING type support in mapQuestionType + getQuestionResponses aggregation.
import { supabase } from "../lib/supabase";
import type {
  Session,
  Participant,
  Question,
  QuestionType,
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

export interface JoinSessionResult {
  session: Session;
  participantId: string;
  participantToken: string;
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
            hide_participant_names,
            statements
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
          statements: q.statements || undefined,
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
  }: JoinSessionParams): Promise<JoinSessionResult | null> {
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

      const { data: context, error: _contextError } = await supabase
        .from("contexts")
        .select("id, title, game_mode, theme")
        .eq("id", session.context_id)
        .maybeSingle();

      if (
        context?.game_mode === "elimination" &&
        session.status !== "WAITING"
      ) {
        throw new Error(
          "You cannot join this elimination session after it has started. Participants must join before the session begins.",
        );
      }

      const { data: questionsRaw, error: _questionsError } = await supabase
        .from("questions")
        .select(
          "id, title, description, type, points, time_limit, options, scale, labels, display_style, image_url, question_order, hide_participant_names, statements",
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
        .select("id, token")
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
          statements: q.statements || undefined,
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
        participantToken: participant.token,
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
        if (error.code === "23505") {
          return true;
        }
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
    token: string,
  ): Promise<boolean> {
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/check-response`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, participantId, questionId, token }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      return data.hasResponded === true;
    } catch (err) {
      console.error("checkExistingResponse error:", err);
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
      const update: Record<string, any> = { is_paused: isPaused };
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
          // ── Scaling answers ──────────────────────────────────────────────
          if (answer.scalingAnswers && typeof answer.scalingAnswers === "object") {
            if (!aggregated.statements) aggregated.statements = {};
            aggregated.total = (aggregated.total || 0) + 1;

            const statementAnswers = answer.scalingAnswers as Record<string, number | null>;

            Object.entries(statementAnswers).forEach(([statementId, value]) => {
              if (value === null) return; // skipped — don't count in distribution

              if (!aggregated.statements[statementId]) {
                aggregated.statements[statementId] = {
                  distribution: {},
                  average: "0",
                  total: 0,
                };
              }

              const stmt = aggregated.statements[statementId];
              stmt.distribution[value] = (stmt.distribution[value] || 0) + 1;
              stmt.total += 1;

              // Recalculate average
              let sum = 0;
              let count = 0;
              Object.entries(stmt.distribution).forEach(([rating, cnt]) => {
                sum += parseInt(rating, 10) * (cnt as number);
                count += cnt as number;
              });
              stmt.average = count > 0 ? (sum / count).toFixed(1) : "0";
            });

            if (!hideParticipantNames && participantName) {
              aggregated.individualResponses = aggregated.individualResponses || [];
              Object.entries(statementAnswers).forEach(([statementId, value]) => {
                aggregated.individualResponses.push({
                  statementId,
                  value,
                  participantName,
                  timestamp: new Date(),
                });
              });
            }

          // ── Ranking answers ──────────────────────────────────────────────
          } else if (answer.rankingOrder && Array.isArray(answer.rankingOrder)) {
            if (!aggregated.items) aggregated.items = {};
            aggregated.total = (aggregated.total || 0) + 1;

            const rankingOrder = answer.rankingOrder as string[];
            const n = rankingOrder.length;

            rankingOrder.forEach((itemId: string, zeroBasedIdx: number) => {
              if (!aggregated.items[itemId]) {
                aggregated.items[itemId] = {
                  bordaScore: 0,
                  rankDistribution: {},
                  total: 0,
                };
              }

              const item = aggregated.items[itemId];
              const oneBasedRank = zeroBasedIdx + 1;
              // Borda count: item ranked 1st gets N points, last gets 1 point
              const bordaPoints = n - zeroBasedIdx;
              item.bordaScore += bordaPoints;
              item.total += 1;
              item.rankDistribution[oneBasedRank] =
                (item.rankDistribution[oneBasedRank] || 0) + 1;
            });

            if (!hideParticipantNames && participantName) {
              aggregated.individualResponses = aggregated.individualResponses || [];
              aggregated.individualResponses.push({
                rankingOrder,
                participantName,
                timestamp: new Date(),
              });
            }

          // ── Choice answers ───────────────────────────────────────────────
          } else if (answer.optionId) {
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

          // ── Rating answers ───────────────────────────────────────────────
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

          // ── Open text answers ────────────────────────────────────────────
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

          // ── Word cloud answers ───────────────────────────────────────────
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
        console.error("[eliminateParticipant] Failed to get participant:", participantError);
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
        winner: null,
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

  static async getEliminationHistory(sessionId: string): Promise<EliminationEvent[]> {
    try {
      const { data, error } = await supabase
        .from("elimination_log")
        .select("*")
        .eq("session_id", sessionId)
        .order("eliminated_at", { ascending: true });

      if (error) {
        console.error("Failed to get elimination history:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
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

  static async determineWinner(sessionId: string): Promise<Participant | null> {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_alive", true)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        score: data.score ?? 0,
        avatar: data.avatar_url ?? undefined,
        isAnonymous: data.is_anonymous,
        joinedAt: new Date(data.joined_at),
        isAlive: true,
      };
    } catch (error) {
      console.error("determineWinner error:", error);
      return null;
    }
  }

  // ── UPDATED: mapQuestionType now includes RANKING ──────────────────────────
  static mapQuestionType(dbType: string): QuestionType {
    const mapping: Record<string, QuestionType> = {
      MULTIPLE_CHOICE: "multiple-choice",
      SINGLE_CHOICE: "multiple-choice",
      TRUE_FALSE: "multiple-choice",
      POLL: "multiple-choice",
      RATING: "rating",
      OPEN_TEXT: "open-text",
      WORD_CLOUD: "word-cloud",
      SCALING: "scaling",
      RANKING: "ranking",
    };
    return mapping[dbType] ?? "multiple-choice";
  }

  static async submitEliminationAnswer(args: {
    sessionId: string;
    participantId: string;
    questionId: string;
    roundNumber: number;
    chosenOptionId: string;
    isCorrect: boolean;
    pointsIfCorrect: number;
  }): Promise<{ correct: boolean; eliminated: EliminationEvent | null }> {
    try {
      const submitOk = await this.submitResponse({
        sessionId: args.sessionId,
        participantId: args.participantId,
        questionId: args.questionId,
        answer: { optionId: args.chosenOptionId },
      });

      if (!submitOk) {
        return { correct: false, eliminated: null };
      }

      if (args.isCorrect) {
        if (args.pointsIfCorrect > 0) {
          await this.incrementScore(args.participantId, args.pointsIfCorrect);
        }
        return { correct: true, eliminated: null };
      }

      const eliminated = await this.eliminateParticipant({
        sessionId: args.sessionId,
        participantId: args.participantId,
        questionId: args.questionId,
        roundNumber: args.roundNumber,
      });

      return { correct: false, eliminated };
    } catch (error) {
      console.error("submitEliminationAnswer error:", error);
      return { correct: false, eliminated: null };
    }
  }
}