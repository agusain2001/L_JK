"use client";
import { useRef, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import type { MemoryMedia } from "@/types/memory";
import { quizScore, keepQuizBest } from "@/lib/games/engines";
import { usePlayground } from "./GameProgress";
import GameCompletion from "./GameCompletion";
export default function RelationshipQuiz({
  memories,
}: {
  memories: MemoryMedia[];
}) {
  const { config, finish } = usePlayground();
  const questions = config.quizQuestions;
  const [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [done, setDone] = useState(false);
  const lock = useRef(false);
  const nextLock = useRef(false);
  const q = questions[index];
  const selected = q ? answers[q.id] : undefined;
  function replay() {
    setIndex(0);
    setAnswers({});
    setDone(false);
    lock.current = false;
    nextLock.current = false;
  }
  function next() {
    if (!selected || nextLock.current) return;
    nextLock.current = true;
    if (index === questions.length - 1) {
      const score = quizScore(questions, answers);
      finish("quiz", (p) => ({
        ...p,
        quizResults: keepQuizBest(p.quizResults, score),
      }));
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      lock.current = false;
      setTimeout(() => {
        nextLock.current = false;
      }, 0);
    }
  }
  if (!q)
    return (
      <p className="game-empty">
        Your questions are waiting to be written in the studio. Your story is
        still here to enjoy.
      </p>
    );
  if (done) {
    const score = quizScore(questions, answers);
    return (
      <GameCompletion message={config.messages.quiz} onReplay={replay}>
        <p>
          {score.total
            ? `You remembered ${score.score} of ${score.total} fact-based questions.`
            : "All your answers were personal choices. There is no wrong answer here."}
        </p>
        <p className="handwritten">{config.messages.quizNote}</p>
      </GameCompletion>
    );
  }
  const photo = memories.find((m) => m.id === q.imageId);
  return (
    <div className="quiz-paper">
      <p className="game-kicker">
        Question {index + 1} of {questions.length} ♡
      </p>
      <progress
        value={index + (selected ? 1 : 0)}
        max={questions.length}
        aria-label="Quiz progress"
      />
      {photo && (
        <figure className="quiz-photo">
          <img src={photo.mediaUrl} alt={photo.title} />
          {photo.demo && <figcaption>Sample photograph</figcaption>}
        </figure>
      )}
      <h3>{q.question}</h3>
      <div className="answer-list">
        {q.options.map((o) => (
          <button
            key={`${q.id}-${o.id}`}
            className={`game-answer ${selected === o.id ? "selected" : ""}`}
            disabled={!!selected}
            aria-pressed={selected === o.id}
            onClick={() => {
              if (lock.current) return;
              lock.current = true;
              setAnswers((a) => ({ ...a, [q.id]: o.id }));
            }}
          >
            {o.label}
            {selected === o.id && <Heart size={18} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="answer-feedback" role="status">
        {selected &&
          (q.correctAnswerId
            ? selected === q.correctAnswerId
              ? q.feedback.correct
              : q.feedback.incorrect
            : q.feedback.opinion)}
      </div>
      {selected && (
        <button className="button primary" onClick={next}>
          {index === questions.length - 1
            ? "See my little surprise"
            : "Next question"}
        </button>
      )}
    </div>
  );
}
