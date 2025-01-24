import { memo } from "react";

import RebusIcon from "../assets/images/rebus.png?format=webp&w=80";
import RiddleIcon from "../assets/images/riddle.png?format=webp&w=80";
import useZooDataQueries from "../hooks/useZooDataQueries";
import { useEffect } from "react";
import { useState } from "react";
import { useCallback } from "react";
import useProcessLock from "@/hooks/useProcessLock";
import useZooSubmitQuizMutation from "../hooks/useZooSubmitQuizMutation";
import { cn, delay } from "@/lib/utils";
import useZooClaimQuizMutation from "../hooks/useZooClaimQuizMutation";
import { useMemo } from "react";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import { useQueryClient } from "@tanstack/react-query";

export default memo(function ZooQuiz() {
  const dataQueries = useZooDataQueries();
  const [allData, afterData] = dataQueries.data;

  /** Riddle */
  const riddle = allData.dbData.dbQuests.find((quest) =>
    quest.key.startsWith("riddle_")
  );

  /** Rebus */
  const rebus = allData.dbData.dbQuests.find((quest) =>
    quest.key.startsWith("rebus_")
  );

  /** Process */
  const process = useProcessLock("zoo.quizzes");

  /** Mutations */
  const submitQuizMutation = useZooSubmitQuizMutation();
  const claimQuizMutation = useZooClaimQuizMutation();

  /** All Quizzes */
  const quizzes = useMemo(() => allData.dbData.dbQuizzes, [allData]);

  const queryClient = useQueryClient();

  /** Finished Quizzes */
  const finishedQuizzes = useMemo(
    () =>
      quizzes.filter((item) =>
        afterData.quizzes.find((quiz) => quiz.key === item.key)
      ),
    [quizzes, afterData]
  );

  /** Pending Quizzes */
  const pendingQuizzes = useMemo(
    () =>
      quizzes.filter(
        (item) => !afterData.quizzes.find((quiz) => quiz.key === item.key)
      ),
    [quizzes, afterData]
  );

  /** Current Running Quiz */
  const [currentQuiz, setCurrentQuiz] = useState(null);

  /** Reset */
  const reset = useCallback(() => {
    setCurrentQuiz(null);
  }, [setCurrentQuiz]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Quizzes */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute Process */
    process.execute(async function () {
      for (let [index, quiz] of Object.entries(pendingQuizzes)) {
        if (process.controller.signal.aborted) return;

        /** Reset Mutation */
        submitQuizMutation.reset();
        claimQuizMutation.reset();

        /** Set Current Quiz */
        setCurrentQuiz(quiz);

        try {
          /** Answers */
          const answers = quiz.answers;

          /** Pick Random Answer */
          const result =
            answers[Math.floor(Math.random() * answers.length)].key;

          /** Submit */
          await submitQuizMutation
            .mutateAsync({ key: quiz.key, result })
            .then((result) => {
              /** Update After Data */
              queryClient.setQueryData(["zoo", "after"], (prev) => {
                return {
                  ...prev,
                  quizzes: result.quizzes,
                };
              });
            });

          /** Delay */
          await delay(500);

          /** Claim */
          await claimQuizMutation
            .mutateAsync({ key: quiz.key })
            .then((result) => {
              /** Update All Data */
              queryClient.setQueryData(["zoo", "all"], (prev) => {
                return {
                  ...prev,
                  hero: result.hero,
                };
              });

              /** Update After Data */
              queryClient.setQueryData(["zoo", "after"], (prev) => {
                return {
                  ...prev,
                  quizzes: result.quizzes,
                };
              });
            });
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      /** Stop */
      reset();

      /** Stop */
      return true;
    });
  }, [process, pendingQuizzes, setCurrentQuiz, reset]);

  /** Auto-Complete Quizzes */
  useFarmerAutoProcess("quizzes", true, process);

  return (
    <>
      <div className="flex flex-col py-2">
        <>
          {/* Quizzes Info */}
          <div className="p-4 rounded-lg bg-lime-800">
            <h4 className="font-bold">Total Quizzes: {quizzes.length}</h4>
            <h4 className="font-bold text-green-500">
              Finished Quizzes: {finishedQuizzes.length}
            </h4>
            <h4 className="font-bold text-yellow-500">
              Pending Quizzes: {pendingQuizzes.length}
            </h4>
          </div>

          <div className="flex flex-col gap-2 py-2">
            {/* Start Button */}
            <button
              onClick={() => process.dispatchAndToggle(!process.started)}
              disabled={pendingQuizzes.length === 0}
              className={cn(
                "w-full px-4 py-2 uppercase rounded-full",
                "disabled:opacity-50",
                !process.started ? "bg-yellow-500" : "bg-red-500"
              )}
            >
              {process.started ? "Stop" : "Start"}
            </button>

            {process.started && currentQuiz ? (
              <div className="flex flex-col gap-2 p-4 text-black bg-white rounded-lg">
                <h4 className="font-bold text-green-500">Claiming Quiz</h4>
                <h5 className="font-bold">{currentQuiz.title}</h5>
                <p
                  className={cn(
                    "capitalize",
                    {
                      success: "text-green-500",
                      error: "text-red-500",
                    }[claimQuizMutation.status]
                  )}
                >
                  {claimQuizMutation.status}
                </p>
              </div>
            ) : null}
          </div>
        </>
      </div>

      {/* Answers */}
      <div className="flex flex-col gap-2">
        {/* Rebus */}
        <div className="flex gap-2 p-4 text-white rounded-lg bg-lime-800">
          <img src={RiddleIcon} className="w-10 h-10 shrink-0" />
          <div className="min-w-0 min-h-0 grow">
            <h3 className="font-bold">Riddle</h3>
            <p>
              <q>{riddle.desc}</q> -{" "}
              <span className="font-bold">{riddle.checkData}</span>
            </p>
          </div>
        </div>

        {/* Rebus */}
        <div className="flex gap-2 p-4 text-white rounded-lg bg-lime-800">
          <img src={RebusIcon} className="w-10 h-10 shrink-0" />
          <div className="min-w-0 min-h-0 grow">
            <h3 className="font-bold">Rebus</h3>
            <p>
              <q>{rebus.title}</q> -{" "}
              <span className="font-bold">{rebus.checkData}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
});
