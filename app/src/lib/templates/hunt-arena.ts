// templates/hunt-arena.ts
// Hunt Arena — elimination-style game-show template (Round 1).
// Inspired by the TF1 show "Hunt Arena" hosted by Cyril Féraud.
// All questions are original, in French, in the spirit of the show.

import { Crown } from "lucide-react";
import { QUESTION_TYPES } from "../question-types";

export const huntArenaTemplate = {
  id: "hunt-arena",
  name: "Hunt Arena",
  description:
    "The hunt begins. Make one mistake, and you're eliminated. Only the last hunter leaves the arena victorious",
  icon: Crown,
  color: "bg-gradient-to-br from-[#0a1742] via-[#1b2a8a] to-[#7a1ab4]",
  category: "Game Show",
  isPopular: false,
  isNew: true,

  // Tells the rest of the app to use the elimination flow + the show theme.
  gameMode: "elimination" as const,
  themeId: "hunt-arena",
  coverImage:
    "",

  questions: [
    {
      id: "cpl-q1",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title: "Combien de mois de l'année comptent au moins 28 jours ?",
      description: "Lisez bien la question avant de répondre.",
      points: 100,
      timeLimit: 20,
      gameMode: "elimination",
      imageUrl:
        "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80",
      options: [
        { id: "1", text: "1 (février)", isCorrect: false },
        { id: "2", text: "4", isCorrect: false },
        { id: "3", text: "7", isCorrect: false },
        { id: "4", text: "12", isCorrect: true },
      ],
      explanation:
        "Tous les mois de l'année comptent au moins 28 jours — février n'est que celui qui s'arrête à 28 ou 29.",
    },
    {
      id: "cpl-q2",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title:
        "Dans une course, vous dépassez le 2ᵉ. À quelle place êtes-vous désormais ?",
      points: 100,
      timeLimit: 15,
      gameMode: "elimination",
      options: [
        { id: "1", text: "1ᵉʳ", isCorrect: false },
        { id: "2", text: "2ᵉ", isCorrect: true },
        { id: "3", text: "3ᵉ", isCorrect: false },
        { id: "4", text: "Impossible à dire", isCorrect: false },
      ],
      explanation:
        "Vous prenez la place du 2ᵉ — pas du 1ᵉʳ, qui est toujours devant vous.",
    },
    {
      id: "cpl-q3",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title: "Combien de fois peut-on soustraire 5 de 25 ?",
      points: 150,
      timeLimit: 25,
      gameMode: "elimination",
      options: [
        { id: "1", text: "1 seule fois", isCorrect: true },
        { id: "2", text: "4 fois", isCorrect: false },
        { id: "3", text: "5 fois", isCorrect: false },
        { id: "4", text: "Une infinité de fois", isCorrect: false },
      ],
      explanation:
        "Une seule fois : après la première soustraction, ce n'est plus 25 mais 20.",
    },
    {
      id: "cpl-q4",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title:
        "Avant la découverte du mont Everest, quelle était la plus haute montagne du monde ?",
      points: 150,
      timeLimit: 20,
      gameMode: "elimination",
      imageUrl:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
      options: [
        { id: "1", text: "Le K2", isCorrect: false },
        { id: "2", text: "Le mont Blanc", isCorrect: false },
        { id: "3", text: "Le mont Everest", isCorrect: true },
        { id: "4", text: "Le Kilimandjaro", isCorrect: false },
      ],
      explanation:
        "L'Everest était déjà la plus haute montagne — il fallait juste la découvrir.",
    },
    {
      id: "cpl-q5",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title:
        "Le père de Léa a quatre filles : Avril, Mai, Juin et… ?",
      points: 100,
      timeLimit: 15,
      gameMode: "elimination",
      options: [
        { id: "1", text: "Juillet", isCorrect: false },
        { id: "2", text: "Août", isCorrect: false },
        { id: "3", text: "Léa", isCorrect: true },
        { id: "4", text: "Septembre", isCorrect: false },
      ],
      explanation:
        "La quatrième fille s'appelle Léa — c'est elle dont on parle dans la question.",
    },
    {
      id: "cpl-q6",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title:
        "Combien de fois le chiffre « 9 » apparaît-il entre 1 et 100 (inclus) ?",
      points: 200,
      timeLimit: 35,
      gameMode: "elimination",
      options: [
        { id: "1", text: "10", isCorrect: false },
        { id: "2", text: "11", isCorrect: false },
        { id: "3", text: "19", isCorrect: false },
        { id: "4", text: "20", isCorrect: true },
      ],
      explanation:
        "10 fois en unité (9, 19, 29… 99) + 10 fois en dizaine (90, 91… 99) = 20.",
    },
    {
      id: "cpl-q7",
      type: QUESTION_TYPES.SINGLE_CHOICE,
      title:
        "Vous entrez dans une pièce sombre. Vous avez une bougie, une lampe à huile et une cheminée — mais une seule allumette. Qu'allumez-vous en premier ?",
      points: 100,
      timeLimit: 20,
      gameMode: "elimination",
      options: [
        { id: "1", text: "La bougie", isCorrect: false },
        { id: "2", text: "L'allumette", isCorrect: true },
        { id: "3", text: "La lampe à huile", isCorrect: false },
        { id: "4", text: "La cheminée", isCorrect: false },
      ],
      explanation:
        "Avant tout le reste, il faut bien allumer l'allumette elle-même.",
    },
  ],

  // Optional bonus questions — can be added in Step 3 if you want a longer round.
  extras: [
    {
      id: "cpl-extra-1",
      type: QUESTION_TYPES.TRUE_FALSE,
      title:
        "Un avion s'écrase pile sur la frontière franco-belge. On enterre les survivants côté français.",
      points: 100,
      timeLimit: 15,
      gameMode: "elimination",
      options: [
        { id: "1", text: "Vrai", isCorrect: false },
        { id: "2", text: "Faux", isCorrect: true },
      ],
      explanation: "On n'enterre pas les survivants.",
    },
    {
      id: "cpl-extra-2",
      type: QUESTION_TYPES.TRUE_FALSE,
      title: "Moïse a embarqué deux animaux de chaque espèce dans son arche.",
      points: 100,
      timeLimit: 15,
      gameMode: "elimination",
      options: [
        { id: "1", text: "Vrai", isCorrect: false },
        { id: "2", text: "Faux", isCorrect: true },
      ],
      explanation: "C'était Noé, pas Moïse.",
    },
  ],

  settings: {
    participationMode: "PUBLIC",
    gameMode: "elimination",
    showLeaderboard: true,
    soundEffects: true,
    shuffleQuestions: false,
    allowRetry: false,
    revealCorrectAnswer: true,
    eliminationOnWrong: true,
    showEliminationToasts: true,
    spectatorModeEnabled: true,
    winnerConfetti: true,
    theme: "hunt-arena",
  },

  estimatedSetupTime: "1 minute",
  avgCompletionTime: "8 minutes",
  targetAudience:
    "Friends' game nights, classrooms, fans of game shows.",
};
