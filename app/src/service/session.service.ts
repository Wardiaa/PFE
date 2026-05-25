// src/lib/session.service.ts
// COMPLETE VERSION - includes all methods for elimination, speed questions, skip, grid-2x2, and vote
// OPTIMIZED:
//   • joinSession now returns gameMode, themeId, finalRoundDecisionTimer, and
//     maxSkipsPerParticipant so participants never need extra DB round-trips
//     after joining (saves 2 queries per participant = 200 fewer queries for
//     100 concurrent participants).
//   • joinSession enforces a hard participant cap (maxParticipants from context
//     settings) before inserting, preventing silent oversubscription.
//
// FIX: recordFinalRoundDecision now writes to elimination_log when participant withdraws,
//      so final-round withdrawals appear in elimination history on the host side.

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
  GridPlacement,
  IndividualGridResponse,
  IndividualVoteResponse,
  Grid2x2Responses,
  VoteResponses,
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
  answer: unknown;
}

export interface JoinSessionResult {
  session: Session;
  participantId: string;
  participantToken: string;
  /** Absolute epoch-ms when the current question timer expires. Provided so
   *  late-joining participants can start their wall-clock countdown from the
   *  correct anchor without a separate DB round-trip. */
  currentQuestionEndsAt?: number;
  // ── OPTIMIZED: context metadata bundled into join response ─────────────────
  /** Game mode of the session's context — avoids a post-join context query. */
  gameMode: GameMode;
  /** Theme ID of the session's context — avoids a post-join context query. */
  themeId: string;
  /** Seconds allocated for the final-round continue/withdraw decision screen. */
  finalRoundDecisionTimer: number;
  /** Maximum number of skips each participant is allowed to use. Avoids the
   *  2-query chain (sessions → contexts) that was previously fired per
   *  participant after joining. */
  maxSkipsPerParticipant: number;
}

export class SessionService {
  // ── UNCHANGED: mapQuestionType ──────────────────────────────────────────────
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
      GRID_2X2: "grid-2x2",
      VOTE: "vote",
    };
    return mapping[dbType] ?? "multiple-choice";
  }

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
            statements,
            skip_allowed,
            x_axis,
            y_axis
          )
        `)
        .eq("id", contextId)
        .maybeSingle();

      if (contextError) throw new Error(`Context not found: ${contextError.message}`);
      if (!context) throw new Error(`Context with ID ${contextId} not found`);

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

      if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);
      if (!session) throw new Error("No session data returned");

      const questionsArray = (context.questions ?? []) as any[];
      const questions: Question[] = questionsArray
        .sort((a, b) => a.question_order - b.question_order)
        .map((q, index) => ({
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
          skipAllowed: q.skip_allowed ?? false,
          xAxis: q.x_axis,
          yAxis: q.y_axis,
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

      if (sessionError) throw new Error(`Database error: ${sessionError.message}`);
      if (!session) {
        throw new Error(
          `No session found with code "${sessionCode}". Please check the code and try again.`,
        );
      }
      if (session.status === "ENDED") throw new Error("This session has already ended.");

      // Run context + questions fetch in parallel.
      // OPTIMIZED: context query now also fetches final_round_decision_timer,
      // max_skips_per_participant, and settings so we don't need separate
      // post-join queries for these values on the participant side.
      const [{ data: context }, { data: questionsRaw }] = await Promise.all([
        supabase
          .from("contexts")
          .select("id, title, game_mode, theme, final_round_decision_timer, max_skips_per_participant, settings")
          .eq("id", session.context_id)
          .maybeSingle(),
        supabase
          .from("questions")
          .select(
            "id, title, description, type, points, time_limit, options, scale, labels, display_style, image_url, question_order, hide_participant_names, statements, skip_allowed",
          )
          .eq("context_id", session.context_id)
          .order("question_order", { ascending: true }),
      ]);

      if (context?.game_mode === "elimination" && session.status !== "WAITING") {
        throw new Error(
          "You cannot join this elimination session after it has started. Participants must join before the session begins.",
        );
      }

      // ── OPTIMIZED: Hard participant cap enforcement ─────────────────────────
      // Previously the app relied on a JSONB `settings.maxParticipants` field
      // that was never checked at insert time. Now we count current participants
      // and reject early — before opening a DB insert — if the session is full.
      // This also prevents Realtime connection oversubscription.
      const maxParticipants: number =
        (context?.settings as any)?.maxParticipants ?? 100;

      const { count: currentCount, error: countError } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id);

      if (countError) {
        console.error("Failed to count participants:", countError);
        // Non-fatal: continue without enforcement if the count query fails.
      } else if (currentCount !== null && currentCount >= maxParticipants) {
        throw new Error(
          `This session is full (${maxParticipants} participants maximum). Please contact the host.`,
        );
      }
      // ── End cap enforcement ─────────────────────────────────────────────────

      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          session_id: session.id,
          user_id: userId || null,
          name: participantName,
          is_anonymous: isAnonymous,
          is_alive: true,
          score: 0,
          skips_used: 0,
        })
        .select("id, token")
        .single();

      if (participantError || !participant) {
        console.error("Failed to join session:", participantError);
        throw new Error("Failed to join session");
      }

      const finalContext = {
        id: context?.id ?? session.context_id,
        title: context?.title ?? "Untitled Session",
        game_mode: context?.game_mode ?? "standard",
        theme: context?.theme ?? "default",
        final_round_decision_timer: context?.final_round_decision_timer ?? 20,
        max_skips_per_participant: context?.max_skips_per_participant ?? 1,
        questions: questionsRaw ?? [],
      };

      const questions: Question[] = (finalContext.questions as any[])
        .sort((a, b) => a.question_order - b.question_order)
        .map((q, index) => ({
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
          skipAllowed: q.skip_allowed ?? false,
          xAxis: q.x_axis,
          yAxis: q.y_axis,
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
        // Separate from Session type — late-joining participants use this to
        // anchor their wall-clock countdown to the same epoch as the host.
        currentQuestionEndsAt: session.current_question_ends_at
          ? new Date(session.current_question_ends_at).getTime()
          : undefined,
        // ── OPTIMIZED: bundled context metadata ────────────────────────────
        gameMode: (finalContext.game_mode ?? "standard") as GameMode,
        themeId: finalContext.theme ?? "default",
        finalRoundDecisionTimer: finalContext.final_round_decision_timer,
        maxSkipsPerParticipant: finalContext.max_skips_per_participant,
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
        // 23505 = unique violation — duplicate submission, treat as success.
        if (error.code === "23505") return true;
        console.error("Failed to submit response:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Submit response error:", error);
      return false;
    }
  }

  /**
   * NEW: Submit a skip for a question (elimination mode only)
   * Uses atomic increment to prevent race conditions and ensures
   * participant hasn't already responded.
   */
  static async submitSkip({
    sessionId,
    participantId,
    questionId,
    participantToken,
    maxSkipsPerParticipant = 1,
  }: {
    sessionId: string;
    participantId: string;
    questionId: string;
    participantToken: string;
    maxSkipsPerParticipant?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify the participant exists and is alive
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select("is_alive, skips_used, session_id")
        .eq("id", participantId)
        .single();

      if (participantError || !participant) {
        return { success: false, error: "Participant not found" };
      }

      if (!participant.is_alive) {
        return { success: false, error: "You have already been eliminated" };
      }

      if (participant.skips_used >= maxSkipsPerParticipant) {
        return { success: false, error: "No skips remaining" };
      }

      // Verify the question allows skipping
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .select("skip_allowed")
        .eq("id", questionId)
        .single();

      if (questionError || !question?.skip_allowed) {
        return { success: false, error: "This question does not allow skipping" };
      }

      // Check if already responded
      const { data: existingResponse, error: responseCheckError } = await supabase
        .from("responses")
        .select("id")
        .eq("session_id", sessionId)
        .eq("participant_id", participantId)
        .eq("question_id", questionId)
        .maybeSingle();

      if (existingResponse) {
        return { success: false, error: "You have already responded to this question" };
      }

      // Atomically increment skips using RPC (prevents race conditions)
      const { data: incrementSuccess, error: rpcError } = await supabase.rpc(
        "increment_participant_skips",
        {
        p_participant_id: participantId,
        p_max_skips: maxSkipsPerParticipant,
        }
      );

      if (rpcError || !incrementSuccess) {
        console.error("Skip increment failed:", rpcError);
        return { success: false, error: "Failed to record skip" };
      }

      // Insert skip response
      const { error: insertError } = await supabase.from("responses").insert({
        session_id: sessionId,
        participant_id: participantId,
        question_id: questionId,
        answer: { skipped: true, timestamp: new Date().toISOString() },
        is_skip: true,
        submitted_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Failed to insert skip response:", insertError);
        return { success: false, error: "Failed to record response" };
      }

      return { success: true };
    } catch (error) {
      console.error("submitSkip error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get max skips per participant for a session
   * Reads from the context via session context_id
   */
  static async getMaxSkipsForSession(sessionId: string): Promise<number> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("context_id")
        .eq("id", sessionId)
        .single();
      
      if (sessionError || !session) {
        console.error("Failed to get session:", sessionError);
        return 1;
      }
      
      const { data: context, error: contextError } = await supabase
        .from("contexts")
        .select("max_skips_per_participant")
        .eq("id", session.context_id)
        .single();
      
      if (contextError || !context) {
        console.error("Failed to get context:", contextError);
        return 1;
      }
      
      return context.max_skips_per_participant ?? 1;
    } catch (error) {
      console.error("getMaxSkipsForSession error:", error);
      return 1;
    }
  }

  /**
   * Get current skips used by a participant
   */
  static async getParticipantSkipsUsed(participantId: string): Promise<number> {
    try {
      const { data: participant, error } = await supabase
        .from("participants")
        .select("skips_used")
        .eq("id", participantId)
        .single();
      
      if (error || !participant) {
        return 0;
      }
      
      return participant.skips_used ?? 0;
    } catch (error) {
      console.error("getParticipantSkipsUsed error:", error);
      return 0;
    }
  }

  // RESTORED: Edge Function call with proper token validation
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

  /**
   * UPDATED: now also writes `current_question_ends_at` so every client can
   * compute remaining time from an authoritative server timestamp instead of
   * running an independent local countdown.
   *
   * @param timeLimit  Question time limit in seconds (null = no timer).
   */
  static async setCurrentQuestion(
    sessionId: string,
    questionIndex: number,
    questionId?: string,
    timeLimit?: number | null,
  ): Promise<{ startedAt: string; endsAt: number | null }> {
    const startedAt = new Date().toISOString();
    const endsAtMs: number | null =
      timeLimit != null && timeLimit > 0
        ? Date.now() + timeLimit * 1000
        : null;

    const endsAtIso = endsAtMs ? new Date(endsAtMs).toISOString() : null;

    const { error } = await supabase
      .from("sessions")
      .update({
        current_question_index: questionIndex,
        current_question_id: questionId,
        current_question_started_at: startedAt,
        current_question_ends_at: endsAtIso,
        is_paused: false,
        timer_paused_remaining: null,
        timer_resumed_at: null,
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Failed to update current question:", error);
    }

    return { startedAt, endsAt: endsAtMs };
  }

  static async togglePause(
    sessionId: string,
    isPaused: boolean,
    remainingAtPause?: number,
  ): Promise<boolean> {
    try {
      const update: Record<string, unknown> = { is_paused: isPaused };

      if (isPaused) {
        update.timer_paused_remaining = remainingAtPause ?? null;
        update.timer_resumed_at = null;
        // Clear ends_at while paused so late-joiners know to use paused_remaining.
        update.current_question_ends_at = null;
      } else {
        const resumedAt = new Date().toISOString();
        update.timer_resumed_at = resumedAt;
        // Recompute ends_at from remaining seconds so late-joiners can sync.
        if (remainingAtPause != null && remainingAtPause > 0) {
          const newEndsAtMs = Date.now() + remainingAtPause * 1000;
          update.current_question_ends_at = new Date(newEndsAtMs).toISOString();
        }
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
        skipsUsed: p.skips_used ?? 0,
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
      const { data, error } = await supabase
        .from("responses")
        .select("answer, participants!inner(name)")
        .eq("session_id", sessionId)
        .eq("question_id", questionId);

      if (error) {
        console.error("Failed to get responses:", error);
        return {};
      }

      const aggregated: any = {};

      (data || []).forEach((response: any) => {
        const answer = response.answer;
        const participantName = response.participants?.name;

        if (typeof answer !== "object" || answer === null) return;

        // Skip responses are handled differently
        if (answer.skipped === true) {
          aggregated.skippedCount = (aggregated.skippedCount || 0) + 1;
          if (!hideParticipantNames && participantName) {
            aggregated.skippedParticipants = aggregated.skippedParticipants || [];
            aggregated.skippedParticipants.push(participantName);
          }
          return;
        }

        // GRID 2x2
        if (answer.placements && typeof answer.placements === "object") {
          aggregated.totalResponses = (aggregated.totalResponses || 0) + 1;
          aggregated.individualResponses = aggregated.individualResponses || [];
          
          aggregated.individualResponses.push({
            placements: answer.placements,
            participantName: hideParticipantNames ? undefined : participantName,
            timestamp: new Date(),
          });

          Object.entries(answer.placements).forEach(([itemId, placement]) => {
            if (!aggregated.itemPlacements) aggregated.itemPlacements = {};
            if (!aggregated.itemPlacements[itemId]) {
              aggregated.itemPlacements[itemId] = { placements: [], centroid: { x: 50, y: 50 } };
            }
            aggregated.itemPlacements[itemId].placements.push(placement);
            const placementsList = aggregated.itemPlacements[itemId].placements;
            const avgX = placementsList.reduce((sum: number, p: GridPlacement) => sum + p.x, 0) / placementsList.length;
            const avgY = placementsList.reduce((sum: number, p: GridPlacement) => sum + p.y, 0) / placementsList.length;
            aggregated.itemPlacements[itemId].centroid = { x: avgX, y: avgY };
          });
          return;
        }

        // VOTE
        if (answer.optionId && answer.isCorrect === undefined) {
          aggregated[answer.optionId] = (aggregated[answer.optionId] || 0) + 1;
          aggregated.total = (aggregated.total || 0) + 1;
          aggregated.individualResponses = aggregated.individualResponses || [];
          aggregated.individualResponses.push({
            optionId: answer.optionId,
            participantName: hideParticipantNames ? undefined : participantName,
            timestamp: new Date(),
          });
          return;
        }

        // SCALING
        if (answer.scalingAnswers && typeof answer.scalingAnswers === "object") {
          if (!aggregated.statements) aggregated.statements = {};
          aggregated.total = (aggregated.total || 0) + 1;

          const statementAnswers = answer.scalingAnswers as Record<string, number | null>;

          Object.entries(statementAnswers).forEach(([statementId, value]) => {
            if (value === null) return;

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
              aggregated.items[itemId] = { bordaScore: 0, rankDistribution: {}, total: 0 };
            }

            const item = aggregated.items[itemId];
            const oneBasedRank = zeroBasedIdx + 1;
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

        // ── Choice answers ─────────────────────────────────────────────
        } else if (answer.optionId) {
          aggregated[answer.optionId] = (aggregated[answer.optionId] || 0) + 1;
          aggregated.individualResponses = aggregated.individualResponses || [];
          aggregated.individualResponses.push({
            optionId: answer.optionId,
            participantName: hideParticipantNames ? undefined : participantName,
            timestamp: new Date(),
          });

        // ── Rating answers ─────────────────────────────────────────────
        } else if (answer.rating !== undefined) {
          const rating = answer.rating;
          aggregated[rating] = (aggregated[rating] || 0) + 1;
          aggregated.total = (aggregated.total || 0) + 1;

          aggregated.individualRatings = aggregated.individualRatings || [];
          aggregated.individualRatings.push({
            rating: answer.rating,
            participantName: hideParticipantNames ? undefined : participantName,
            timestamp: new Date(),
          });

          let sum = 0;
          let count = 0;
          Object.entries(aggregated).forEach(([key, val]) => {
            if (key !== "total" && key !== "average" && key !== "individualRatings") {
              const numKey = parseInt(key);
              if (!isNaN(numKey)) {
                sum += numKey * (val as number);
                count += val as number;
              }
            }
          });
          if (count > 0) aggregated.average = (sum / count).toFixed(1);

        // ── Open text answers ──────────────────────────────────────────
        } else if (answer.text) {
          aggregated.count = (aggregated.count || 0) + 1;
          aggregated.recent = aggregated.recent || [];
          aggregated.recent.unshift({
            text: answer.text,
            timestamp: new Date(),
            participantName: hideParticipantNames ? undefined : participantName,
          });
          aggregated.recent = aggregated.recent.slice(0, 10);

        // ── Word cloud answers ─────────────────────────────────────────
        } else if (answer.words && Array.isArray(answer.words)) {
          aggregated.wordMap = aggregated.wordMap || {};
          answer.words.forEach((word: string) => {
            const lowerWord = word.toLowerCase();
            aggregated.wordMap[lowerWord] = (aggregated.wordMap[lowerWord] || 0) + 1;
          });
          aggregated.uniqueWords = Object.keys(aggregated.wordMap).length;
          aggregated.words = Object.entries(aggregated.wordMap)
            .map(([text, count]) => ({ text, count: count as number }))
            .sort((a, b) => b.count - a.count);

          aggregated.individualWords = aggregated.individualWords || [];
          aggregated.individualWords.push({
            words: answer.words,
            participantName: hideParticipantNames ? undefined : participantName,
            timestamp: new Date(),
          });
        }
      });

      // Clean up internal helper key before returning.
      delete aggregated.wordMap;

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

      // Already eliminated — idempotent guard.
      if (participant.is_alive === false) return null;

      const [{ error: updateError }, { error: logError }] = await Promise.all([
        supabase
          .from("participants")
          .update({
            is_alive: false,
            eliminated_at_round: args.roundNumber,
            eliminated_at_question_id: args.questionId,
          })
          .eq("id", args.participantId),
        supabase.from("elimination_log").insert({
          session_id: args.sessionId,
          participant_id: args.participantId,
          participant_name: participant.name,
          question_id: args.questionId,
          round_number: args.roundNumber,
          eliminated_at: new Date().toISOString(),
        }),
      ]);

      if (updateError) {
        console.error("[eliminateParticipant] Update failed:", updateError);
        return null;
      }
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

  /**
   * OPTIMIZED: Use a single DB arithmetic update instead of read-then-write.
   * This eliminates the race condition where two concurrent score updates could
   * both read the same old value and produce an incorrect result.
   */
  static async incrementScore(
    participantId: string,
    delta: number,
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc("increment_participant_score", {
        p_participant_id: participantId,
        p_delta: delta,
      });

      if (error) {
        // Fallback: read-modify-write (less safe but works without the RPC).
        console.warn("increment_participant_score RPC not available, using fallback:", error.message);
        const { data: row, error: readErr } = await supabase
          .from("participants")
          .select("score")
          .eq("id", participantId)
          .maybeSingle();

        if (readErr || !row) return false;

        const { error: writeErr } = await supabase
          .from("participants")
          .update({ score: (row.score ?? 0) + delta })
          .eq("id", participantId);

        return !writeErr;
      }
      return true;
    } catch (error) {
      console.error("incrementScore error:", error);
      return false;
    }
  }

  /**
   * OPTIMIZED: Tries the existing get_game_state RPC first (1 DB round-trip),
   * then falls back to three parallel queries.
   *
   * The RPC response shape (verified against the installed function):
   *   {
   *     alive:        camelCase Participant[]   — pre-filtered is_alive = true
   *     eliminated:   camelCase Participant[]   — pre-filtered is_alive = false
   *     totalPlayers: number
   *     currentRound: number                   — MAX(round_number) from elimination_log
   *     history:      camelCase EliminationEvent[]
   *   }
   *
   * NOTE: The RPC does not include skipsUsed in participant rows.
   * It defaults to 0 here; the real value is tracked via getParticipantSkipsUsed.
   */
  static async getGameState(sessionId: string): Promise<GameState> {
    // ── Maps a camelCase participant row from the RPC response ────────────
    const mapRpcParticipant = (p: any) => ({
      id: p.id,
      name: p.name,
      score: p.score ?? 0,
      // RPC returns 'avatar' (alias for avatar_url)
      avatar: p.avatar ?? undefined,
      isAnonymous: p.isAnonymous ?? false,
      joinedAt: new Date(p.joinedAt),
      isAlive: p.isAlive === true,
      eliminatedAtRound: p.eliminatedAtRound ?? null,
      eliminatedAtQuestionId: p.eliminatedAtQuestionId ?? null,
      // skipsUsed is not included in the RPC projection; default to 0.
      skipsUsed: 0,
    });

    // ── Maps a camelCase history row from the RPC response ───────────────
    const mapRpcHistory = (e: any): EliminationEvent => ({
      participantId: e.participantId,
      participantName: e.participantName,
      questionId: e.questionId,
      roundNumber: e.roundNumber,
      eliminatedAt: new Date(e.eliminatedAt),
    });

    // ── Maps a snake_case participant row from the fallback DB queries ────
    const mapDbParticipant = (p: any) => ({
      id: p.id,
      name: p.name,
      score: p.score ?? 0,
      avatar: p.avatar_url ?? undefined,
      isAnonymous: p.is_anonymous,
      joinedAt: new Date(p.joined_at),
      isAlive: p.is_alive === true,
      eliminatedAtRound: p.eliminated_at_round ?? null,
      eliminatedAtQuestionId: p.eliminated_at_question_id ?? null,
      skipsUsed: p.skips_used ?? 0,
    });

    const mapDbHistory = (row: any): EliminationEvent => ({
      participantId: row.participant_id,
      participantName: row.participant_name,
      questionId: row.question_id,
      roundNumber: row.round_number,
      eliminatedAt: new Date(row.eliminated_at),
    });

    try {
      // ── Fast path: single RPC call ────────────────────────────────────
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_game_state", { p_session_id: sessionId });

      if (!rpcError && rpcData) {
        // The RPC already pre-splits alive/eliminated and returns camelCase,
        // so we can map directly without filtering.
        return {
          alive:       (rpcData.alive       ?? []).map(mapRpcParticipant),
          eliminated:  (rpcData.eliminated  ?? []).map(mapRpcParticipant),
          winner:      null,
          totalPlayers: rpcData.totalPlayers ?? 0,
          currentRound: rpcData.currentRound ?? 0,
          history:     (rpcData.history     ?? []).map(mapRpcHistory),
        };
      }

      if (rpcError) {
        console.warn("[getGameState] RPC error, using fallback:", rpcError.message);
      }
    } catch {
      // Unexpected RPC error — fall through to query path.
    }

    // ── Fallback path: three parallel queries (used when RPC unavailable) ─
    try {
      const [{ data: participants }, { data: history }, { data: session }] =
        await Promise.all([
          supabase
            .from("participants")
            .select(
              "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id, skips_used",
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

      const allParticipants = (participants ?? []).map(mapDbParticipant);
      return {
        alive:       allParticipants.filter((p) => p.isAlive),
        eliminated:  allParticipants.filter((p) => !p.isAlive),
        winner:      null,
        totalPlayers: allParticipants.length,
        currentRound: (session?.current_question_index ?? -1) + 1,
        history:     (history ?? []).map(mapDbHistory),
      };
    } catch (error) {
      console.error("getGameState error:", error);
      return { alive: [], eliminated: [], winner: null, totalPlayers: 0, currentRound: 0, history: [] };
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
      const { data: session } = await supabase
        .from("sessions")
        .select("context_id, current_question_index")
        .eq("id", sessionId)
        .maybeSingle();

      if (!session?.context_id) {
        console.warn("[determineWinner] session/context_id missing for", sessionId);
        return null;
      }

      const { data: questions } = await supabase
        .from("questions")
        .select("id, question_order")
        .eq("context_id", session.context_id)
        .order("question_order", { ascending: true });

      if (!questions || questions.length === 0) return null;
      const lastQuestionId = questions[questions.length - 1].id;

      const { data: aliveRows } = await supabase
        .from("participants")
        .select(
          "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id, skips_used",
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
        skipsUsed: p.skips_used ?? 0,
      });

      const alive = (aliveRows || []).map(toParticipant);

      if (alive.length === 1) return alive[0];

      if (alive.length > 1) {
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

        return [...alive].sort((a, b) => {
          if ((b.score ?? 0) !== (a.score ?? 0))
            return (b.score ?? 0) - (a.score ?? 0);
          return a.joinedAt.getTime() - b.joinedAt.getTime();
        })[0];
      }

      const { data: elimRows } = await supabase
        .from("participants")
        .select(
          "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id, skips_used",
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
  }): Promise<{ correct: boolean; eliminated: EliminationEvent | null; newScore: number | null }> {
    try {
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

      if (responseError && responseError.code !== "23505") {
        console.error("[submitEliminationAnswer] Response insert failed:", responseError);
      }

      if (responseError?.code === "23505") {
        return { correct: args.isCorrect, eliminated: null, newScore: null };
      }

      if (args.isCorrect) {
        const newScore = await SessionService.incrementScore(
          args.participantId,
          args.pointsIfCorrect,
        );
        return { correct: true, eliminated: null, newScore: newScore ? args.pointsIfCorrect : null };
      }

      const eliminated = await SessionService.eliminateParticipant({
        sessionId: args.sessionId,
        participantId: args.participantId,
        questionId: args.questionId,
        roundNumber: args.roundNumber,
      });

      return { correct: false, eliminated, newScore: null };
    } catch (error) {
      console.error("submitEliminationAnswer error:", error);
      return { correct: false, eliminated: null, newScore: null };
    }
  }

  /**
   * Process speed question results
   * ONLY correct answers can advance. The RPC get_speed_question_results
   * filters by is_correct = true, so only participants who answered correctly
   * are considered for advancement. Wrong answers are automatically eliminated.
   * 
   * @param sessionId - The session ID
   * @param questionId - The speed question ID
   * @param roundNumber - Current round number
   * @param maxAdvance - Maximum number of participants who can advance (must have answered correctly)
   * @returns Object containing advancing participant IDs and eliminated count
   */
  static async processSpeedQuestion(
    sessionId: string,
    questionId: string,
    roundNumber: number,
    maxAdvance: number
  ): Promise<{ advancingParticipantIds: string[]; eliminatedCount: number }> {
    try {
      console.log("[processSpeedQuestion] Starting with maxAdvance:", maxAdvance);
      
      // Get the fastest participants who answered CORRECTLY (RPC now filters is_correct = true)
      const { data: correctFastestParticipants, error: speedError } = await supabase
        .rpc("get_speed_question_results", {
          p_session_id: sessionId,
          p_question_id: questionId,
          p_max_advance: maxAdvance,
        });

      if (speedError) {
        console.error("[processSpeedQuestion] RPC error:", speedError);
        return { advancingParticipantIds: [], eliminatedCount: 0 };
      }

      const advancingIds = (correctFastestParticipants || []).map((p: any) => p.participant_id);
      console.log("[processSpeedQuestion] Advancing participants (correct answers only):", advancingIds);

      // Get all participants who answered this question
      const { data: allResponses, error: responsesError } = await supabase
        .from("responses")
        .select("participant_id, is_correct")
        .eq("session_id", sessionId)
        .eq("question_id", questionId)
        .eq("is_skip", false);

      if (responsesError) {
        console.error("[processSpeedQuestion] Failed to get responses:", responsesError);
        return { advancingParticipantIds: advancingIds, eliminatedCount: 0 };
      }

      // Find participants who answered WRONG (they are eliminated regardless of speed)
      const wrongAnswerIds = (allResponses || [])
        .filter(r => !r.is_correct)
        .map(r => r.participant_id);
      
      console.log("[processSpeedQuestion] Wrong answer participants:", wrongAnswerIds);

      // Find participants who answered CORRECT but didn't make the top maxAdvance
      const correctResponseIds = (allResponses || [])
        .filter(r => r.is_correct)
        .map(r => r.participant_id);
      
      const correctNotAdvancingIds = correctResponseIds.filter(
        id => !advancingIds.includes(id)
      );
      
      console.log("[processSpeedQuestion] Correct but not fast enough:", correctNotAdvancingIds);

      // All participants to eliminate = wrong answers + correct but not fast enough
      const allIdsToEliminate = [...new Set([...wrongAnswerIds, ...correctNotAdvancingIds])];
      
      console.log("[processSpeedQuestion] Total to eliminate:", allIdsToEliminate.length);

      // OPTIMIZED: Batch eliminate all non-advancing participants.
      // Old code fired 3 DB calls per participant (SELECT name + UPDATE + INSERT)
      // → 3N calls total. The new approach uses:
      //   1. One batch SELECT to fetch names and alive status for all targets
      //   2. One batch UPDATE to mark all of them is_alive = false
      //   3. One batch INSERT to write all new elimination_log rows
      // → 3 calls total, regardless of how many participants are eliminated.
      if (allIdsToEliminate.length > 0) {
        // 1. Fetch names + alive status for all targets in one query.
        const { data: participantRows } = await supabase
          .from("participants")
          .select("id, name, is_alive")
          .in("id", allIdsToEliminate);

        const participantMap = new Map(
          (participantRows ?? []).map((p: any) => [p.id, p]),
        );

        // 2. Batch-update all non-advancing participants to is_alive = false.
        await supabase
          .from("participants")
          .update({
            is_alive: false,
            eliminated_at_round: roundNumber,
            eliminated_at_question_id: questionId,
          })
          .in("id", allIdsToEliminate);

        // 3. Batch-insert elimination_log rows only for participants who were
        //    still alive (wrong-answer participants were already written to the
        //    log at submit time, so we skip them to avoid duplicate rows).
        const eliminatedAt = new Date().toISOString();
        const logRows = allIdsToEliminate
          .filter((id) => participantMap.get(id)?.is_alive !== false)
          .map((participantId) => ({
            session_id: sessionId,
            participant_id: participantId,
            participant_name: participantMap.get(participantId)?.name ?? "Unknown",
            question_id: questionId,
            round_number: roundNumber,
            eliminated_at: eliminatedAt,
          }));

        if (logRows.length > 0) {
          await supabase.from("elimination_log").insert(logRows);
        }
      }

      const eliminatedCount = allIdsToEliminate.length;

      return { advancingParticipantIds: advancingIds, eliminatedCount };
    } catch (error) {
      console.error("[processSpeedQuestion] Error:", error);
      return { advancingParticipantIds: [], eliminatedCount: 0 };
    }
  }

  /**
  * Get count of alive participants
  */
  static async getAliveCount(sessionId: string): Promise<number> {
    const { count, error } = await supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("is_alive", true);

    if (error) {
      console.error("[getAliveCount] Error:", error);
      return 0;
    }
    return count || 0;
  }

  /**
  * Get eliminated count for a specific round
  */
  static async getEliminatedCountThisRound(sessionId: string, roundNumber: number): Promise<number> {
    const { count, error } = await supabase
      .from("elimination_log")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("round_number", roundNumber);

    if (error) {
      console.error("[getEliminatedCountThisRound] Error:", error);
      return 0;
    }
    return count || 0;
  }

  /**
  * Record participant's final round decision AND write to elimination_log if they withdraw
  * Now writes to elimination_log AND updates participants table when participant withdraws
  *      so final-round withdrawals appear in elimination history AND counts update correctly.
  */
  static async recordFinalRoundDecision(
    participantId: string,
    choseContinue: boolean,
    sessionId?: string,
    questionId?: string,
    roundNumber?: number,
    participantName?: string
  ): Promise<boolean> {
    try {
      // First update the participant's choice
      const { error: updateError } = await supabase
        .from("participants")
        .update({ chose_continue: choseContinue })
        .eq("id", participantId);

      if (updateError) {
        console.error("[recordFinalRoundDecision] Update error:", updateError);
        return false;
      }

      // If the participant chose NOT to continue (withdrew), mark them as eliminated
      // AND write to elimination_log
      if (!choseContinue && sessionId && questionId && roundNumber && participantName) {
        // Mark participant as eliminated in participants table
        const { error: eliminateError } = await supabase
          .from("participants")
          .update({
            is_alive: false,
            eliminated_at_round: roundNumber,
            eliminated_at_question_id: questionId,
          })
          .eq("id", participantId);

        if (eliminateError) {
          console.error("[recordFinalRoundDecision] Failed to mark participant eliminated:", eliminateError);
        }

        // Write to elimination_log
        const { error: logError } = await supabase
          .from("elimination_log")
          .insert({
            session_id: sessionId,
            participant_id: participantId,
            participant_name: participantName,
            question_id: questionId,
            round_number: roundNumber,
            eliminated_at: new Date().toISOString(),
          });

        if (logError) {
          console.error("[recordFinalRoundDecision] Failed to write to elimination_log:", logError);
        } else {
          console.log("[recordFinalRoundDecision] Withdrawal written to elimination_log for:", participantName);
        }
      }

      return true;
    } catch (error) {
      console.error("[recordFinalRoundDecision] Exception:", error);
      return false;
    }
  }

  /**
  * Get participants who chose to continue in final round
  */
  static async getContinuingParticipants(sessionId: string): Promise<Participant[]> {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_alive", true)
        .eq("chose_continue", true);

      if (error) {
        console.error("[getContinuingParticipants] Error:", error);
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
        skipsUsed: p.skips_used ?? 0,
        choseContinue: p.chose_continue ?? null,
      }));
    } catch (error) {
      console.error("[getContinuingParticipants] Exception:", error);
      return [];
    }
  }
}

// ── RPC: Atomic skip increment (prevents race conditions)
// Run in Supabase SQL Editor:
//
//   CREATE OR REPLACE FUNCTION public.increment_participant_skips(
//     p_participant_id uuid,
//     p_max_skips integer
//   ) RETURNS boolean LANGUAGE plpgsql AS $$
//   DECLARE
//     current_skips integer;
//   BEGIN
//     SELECT COALESCE(skips_used, 0) INTO current_skips FROM participants WHERE id = p_participant_id;
//     
//     IF current_skips >= p_max_skips THEN
//       RETURN FALSE;
//     END IF;
//     
//     UPDATE participants SET skips_used = COALESCE(skips_used, 0) + 1 WHERE id = p_participant_id;
//     RETURN TRUE;
//   END;
//   $$;
//
//   GRANT EXECUTE ON FUNCTION public.increment_participant_skips(uuid, integer)
//     TO authenticated, anon;